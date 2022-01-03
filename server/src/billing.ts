import { stripe } from "./index";
import { db } from "./firebase";
import Stripe from "stripe";
import { getOrCreateCustomer } from "./customer";
import { firestore } from "firebase-admin";

/**
 * Attach a payment method to the Stripe customer,
 * subscribe to a Stripe plan, and save the plan to Firestore
 */
export async function createSubscription(
  userId: string,
  planId: string,
  payment_method: string
) {
  const customer = await getOrCreateCustomer(userId);

  await stripe.paymentMethods.attach(payment_method, { customer: customer.id });
  await stripe.customers.update(customer.id, {
    invoice_settings: { default_payment_method: payment_method },
  });

  const subscription = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ plan: planId }],
    expand: ["latest_invoice.payment_intent"],
  });

  // When Stripe creates a Subscription, it also attaches the first Invoice to it,
  // and attempts to pay for that Invoice with the Customer's card

  const invoice = subscription.latest_invoice as Stripe.Invoice;
  const payment_intent = invoice.payment_intent as Stripe.PaymentIntent;

  if (payment_intent.status === "succeeded") {
    await db
      .collection("users")
      .doc(userId)
      .set(
        {
          stripeCustomerId: customer.id,
          activePlans: firestore.FieldValue.arrayUnion(planId),
        },
        { merge: true }
      );
  }

  return subscription;
}

export async function cancelSubscription(
  userId: string,
  subscriptionId: string
) {
  const customer = await getOrCreateCustomer(userId);
  if (customer.metadata.firebaseUID !== userId) {
    // to disallow a user cancelling another user's subscription
    throw Error("Firebase UID does not match Stripe Customer");
  }

  const subscription = await stripe.subscriptions.del(subscriptionId);

  // Alternatively, cancel at the end of the period
  // const subscription = stripe.subscriptions.update(subscriptionId, {
  //   cancel_at_period_end: true,
  // });

  if (subscription.status === "canceled") {
    const planId = subscription.items.data.at(0).price.id;
    await db
      .collection("users")
      .doc(userId)
      .update({
        activePlans: firestore.FieldValue.arrayRemove(planId),
      });
  }
}

export async function listSubscriptions(userId: string) {
  const customer = await getOrCreateCustomer(userId);
  const subscriptions = await stripe.subscriptions.list({
    customer: customer.id,
  });

  return subscriptions;
}

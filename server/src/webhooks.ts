import { stripe } from "./";
import Stripe from "stripe";
import { db } from "./firebase";
import { firestore } from "firebase-admin";

/**
 * Validate the stripe webhook secret, then call the handler for the event type
 */
export const handleStripeWebhook = async (req, res) => {
  const stripeSignature = req.headers["stripe-signature"];
  const event = stripe.webhooks.constructEvent(
    req.body,
    stripeSignature,
    process.env.STRIPE_WEBHOOK_SECRET
  );

  try {
    webhookHandlers[event.type]
      ? await webhookHandlers[event.type](event.data.object)
      : webhookHandlers.default(event.type);
    res.send({ received: true });
  } catch (err: any) {
    console.error(err);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

const webhookHandlers = {
  "payment_intent.succeeded": async (data: Stripe.PaymentIntent) => {},
  "payment_intent.payment_failed": async (data: Stripe.PaymentIntent) => {},
  "customer.subscription.deleted": (data: Stripe.Subscription) => {},
  "customer.subscription.created": onCustomerSubscriptionCreated,
  "invoice.payment_succeeded": (data: Stripe.Invoice) => {},
  "invoice.payment_failed": onInvoicePaymentFailed,
  default: (eventType: string) =>
    console.log(`Received unsupported hook: ${eventType}`),
};

async function onCustomerSubscriptionCreated(data: Stripe.Subscription) {
  const customer = (await stripe.customers.retrieve(
    data.customer as string
  )) as Stripe.Customer;
  const userId = customer.metadata.firebaseUID;
  const userRef = db.collection("users").doc(userId);
  const planId = data.items.data.at(0).price.id;
  await userRef.update({
    activePlans: firestore.FieldValue.arrayUnion(planId),
  });
}

async function onInvoicePaymentFailed(data: Stripe.Invoice) {
  const customer = (await stripe.customers.retrieve(
    data.customer as string
  )) as Stripe.Customer;
  const userSnapshot = await db
    .collection("users")
    .doc(customer.metadata.firebaseUID)
    .get();

  await userSnapshot.ref.update({ status: "PAST_DUE" });
}

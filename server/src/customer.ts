import { Stripe } from "stripe";
import { stripe } from ".";
import { db } from "./firebase";

export async function createSetupIntent(userId: string) {
  const customer = await getOrCreateCustomer(userId);

  return stripe.setupIntents.create({ customer: customer.id });
}

export async function listPaymentMethods(userId: string) {
  const customer = await getOrCreateCustomer(userId);

  return stripe.paymentMethods.list({ customer: customer.id, type: "card" });
}

type StripeCustomerWithMetadata = Stripe.Customer & {
  metadata: { firebaseUID: string };
};
type StripeDeletedCustomerWithMetadata = Stripe.DeletedCustomer & {
  metadata: { firebaseUID: string };
};

export async function getOrCreateCustomer(
  userId: string,
  params?: Stripe.CustomerCreateParams
): Promise<
  Stripe.Response<
    StripeCustomerWithMetadata | StripeDeletedCustomerWithMetadata
  >
> {
  const userSnapshot = await db.collection("users").doc(userId).get();
  const { stripeCustomerId, email } = userSnapshot.data();

  if (!stripeCustomerId) {
    const customer = (await stripe.customers.create({
      email,
      metadata: {
        firebaseUID: userId,
      },
      ...params,
    })) as Stripe.Response<StripeCustomerWithMetadata>;
    await userSnapshot.ref.update({ stripeCustomerId: customer.id });

    return customer;
  }

  return (await stripe.customers.retrieve(stripeCustomerId)) as Stripe.Response<
    StripeCustomerWithMetadata | StripeDeletedCustomerWithMetadata
  >;
}

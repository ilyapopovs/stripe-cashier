import { stripe } from "./";
import Stripe from "stripe";

const webhookHandlers = {
  "payment_intent.succeeded": async (data: Stripe.PaymentIntent) => {
    // Some business logic
  },
  "payment_intent.payment_failed": async (data: Stripe.PaymentIntent) => {
    // Some business logic
  },
  default: (eventType: string) =>
    console.log(`Received unsupported hook: ${eventType}`),
};

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

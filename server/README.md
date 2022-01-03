# stripe-cashier

Demo app for doing checkout with Stripe, built with Node.js &amp; React

## Commands for triggering webhooks locally

In the first terminal tab, listen to &amp; forward webhooks

```
stripe listen --forward-to localhost:3333/hooks
```

In another tab, trigger a mock webhook

```
stripe trigger payment_intent.created
```

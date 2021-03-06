import { config } from "dotenv";
import { Stripe } from "stripe";
import { app } from "./api";

config();

export const stripe = new Stripe(process.env.STRIPE_SECRET, {
  apiVersion: "2020-08-27",
});

const port = process.env.API_PORT || 3333;
app.listen(port, () =>
  console.log(`API available on http://localhost:${port}`)
);

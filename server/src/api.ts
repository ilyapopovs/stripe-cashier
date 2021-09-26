import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { createStripeCheckoutSession } from "./checkout";
import { runAsync } from "./helpers";
import { createPaymentIntent } from "./payments";
import { handleStripeWebhook } from "./webhooks";

export const app = express();

app.use(cors({ origin: true }));
// Include the body buffer, needed for webhooks
// app.use(
//   express.json({
//     verify: (req, res, buffer) => (req["rawBody"] = buffer),
//   })
// );
// Use JSON parser for all non-webhook routes
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.originalUrl === "/hooks") {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.post("/test", (req: Request, res: Response) => {
  const amount = req.body.amount;
  res.status(200).send({ with_tax: amount * 7 });
});

app.post(
  "/checkouts/",
  runAsync(async ({ body }: Request, res: Response) => {
    console.log(body);
    res.send(await createStripeCheckoutSession(body.line_items));
  })
);

app.post(
  "/payments",
  runAsync(async ({ body }: Request, res: Response) => {
    res.send(await createPaymentIntent(body.amount));
  })
);

app.post(
  "/hooks",
  express.raw({ type: "application/json" }),
  runAsync(handleStripeWebhook)
);

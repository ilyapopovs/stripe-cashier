import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { createStripeCheckoutSession } from "./checkout";
import { auth } from "./firebase";
import { runAsync } from "./helpers";
import { createPaymentIntent } from "./payments";
import { handleStripeWebhook } from "./webhooks";
import { createSetupIntent, listPaymentMethods } from "./customer";
import {
  cancelSubscription,
  createSubscription,
  listSubscriptions,
} from "./billing";

export const app = express();

app.use(cors({ origin: true }));
// Include the body buffer, needed for webhooks
app.use(
  express.json({
    verify: (req, res, buffer) => (req["rawBody"] = buffer),
  })
);
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

app.use(decodeJwt);

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

//Save a card on the customer record with a SetupIntent
app.post(
  "/wallet",
  runAsync(async (req: Request, res: Response) => {
    const user = validateUser(req);
    const setupIntent = await createSetupIntent(user.uid);
    res.send(setupIntent);
  })
);

app.get(
  "/wallet",
  runAsync(async (req: Request, res: Response) => {
    const user = validateUser(req);
    const wallet = await listPaymentMethods(user.uid);

    res.send(wallet.data);
  })
);

app.post(
  "/subscriptions/",
  runAsync(async (req: Request, res: Response) => {
    const user = validateUser(req);
    const { plan, payment_method } = req.body;
    const subscription = await createSubscription(
      user.uid,
      plan,
      payment_method
    );
    res.send(subscription);
  })
);

app.get(
  "/subscriptions/",
  runAsync(async (req: Request, res: Response) => {
    const user = validateUser(req);
    const subscriptions = await listSubscriptions(user.uid);
    res.send(subscriptions.data);
  })
);

app.patch(
  "/subscriptions/:id",
  runAsync(async (req: Request, res: Response) => {
    const user = validateUser(req);
    res.send(await cancelSubscription(user.uid, req.params.id));
  })
);

/**
 * Decode JWT used for authorization & mount it on `Request` body
 * Thus, making firebase data available
 */
async function decodeJwt(req: Request, res: Response, next: NextFunction) {
  if (req.headers?.authorization?.startsWith("Bearer ")) {
    const idToken = req.headers.authorization.split("Bearer ")[1];

    try {
      req["currentUser"] = await auth.verifyIdToken(idToken);
    } catch (err) {
      console.log(err);
    }
  }

  next();
}

/**
 * Throw an error if the currentUser does not exist on the request
 */
function validateUser(req: Request) {
  const user = req["currentUser"];
  if (!user) {
    throw new Error(
      "You must be logged in to make this request, e.g. Authroization: Bearer <token>"
    );
  }

  return user;
}

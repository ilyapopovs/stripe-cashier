import cors from "cors";
import express, { Request, Response } from "express";
import { createStripeCheckoutSession } from "./checkout";
import { runAsync } from "./helpers";

export const app = express();

app.use(express.json());
app.use(cors({ origin: true }));

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

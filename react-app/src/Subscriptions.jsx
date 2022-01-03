import React, { useState, useEffect, Suspense } from "react";
import { fetchFromAPI } from "./helpers";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { db } from "./firebase";
import { SignIn, SignOut } from "./Customers";
import { useUser, AuthCheck } from "reactfire";

const MONTHLY_PLAN_ID = "price_1KBLViAltihfoILx7yVgdbAY";
const YEARLY_PLAN_ID = "price_1KBLViAltihfoILxvZPQNLmY";

export default function Subscriptions({ userUid }) {
  return (
    <>
      <Suspense fallback={"loading user"}>
        <UserData userUid={userUid} />
        <SubscribeToPlan />
      </Suspense>
    </>
  );
}

function UserData({ userUid }) {
  const [data, setData] = useState({});
  useEffect(() => {
    const unsubscribe = db
      .collection("users")
      .doc(userUid)
      .onSnapshot((doc) => setData(doc.data()));

    return () => unsubscribe();
  }, []);

  return (
    <pre>
      Stripe Customer ID: {data.stripeCustomerId} <br />
      Subscriptions: {JSON.stringify(data.activePlans || [])}
    </pre>
  );
}

function SubscribeToPlan(props) {
  const stripe = useStripe();
  const elements = useElements();
  const user = useUser();

  const [plan, setPlan] = useState();
  const [subscriptions, setSubscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    getSubscriptions();
  }, [user]);

  async function getSubscriptions() {
    if (user) {
      const subs = await fetchFromAPI("subscriptions", { method: "GET" });
      setSubscriptions(subs);
    }
  }

  async function cancel(id) {
    setIsLoading(true);
    await fetchFromAPI("subscriptions/" + id, { method: "PATCH" });
    alert("Subscription cancelled!");
    await getSubscriptions();
    setIsLoading(false);
  }

  async function handleSubmit(event) {
    setIsLoading(true);
    event.preventDefault();
    const cardElement = elements.getElement(CardElement);
    const { paymentMethod, error } = await stripe.createPaymentMethod({
      type: "card",
      card: cardElement,
    });

    if (error) {
      alert(error.message);
      setIsLoading(false);
      return;
    }

    const subscription = await fetchFromAPI("subscriptions", {
      body: {
        plan,
        payment_method: paymentMethod.id,
      },
    });

    const { latest_invoice } = subscription;

    if (latest_invoice.payment_intent) {
      const { client_secret, status } = latest_invoice.payment_intent;

      if (status === "requires_action") {
        // needs 3D verification
        const { error: confirmationError } = await stripe.confirmCardPayment(
          client_secret
        );
        if (confirmationError) {
          console.error(confirmationError);
          alert("Unable to confirm card!");
          return;
        }
      }

      alert("Subscribed successfully!");
      getSubscriptions();
    }

    setIsLoading(false);
    setPlan(null);
  }

  return (
    <>
      <AuthCheck fallback={<SignIn />}>
        {subscriptions.map((sub) => (
          <div key={sub.id}>
            {sub.id}. Next Payment of {sub.plan.amount} due{" "}
            {new Date(sub.current_period_end * 1000).toUTCString()}
            <button onClick={() => cancel(sub.id)} disabled={isLoading}>
              Cancel
            </button>
          </div>
        ))}
        <hr />
        <div>
          <button onClick={() => setPlan(MONTHLY_PLAN_ID)}>
            Choose Monthly €1/m
          </button>
          <button onClick={() => setPlan(YEARLY_PLAN_ID)}>
            Choose Yearly €10/y
          </button>
          <p>
            Selected Plan: <strong>{plan}</strong>
          </p>
        </div>
        <form onSubmit={handleSubmit} hidden={!plan}>
          <CardElement />
          <button type="submit" disabled={isLoading}>
            Subscribe & Pay
          </button>
        </form>
        <div>
          <SignOut user={user} />
        </div>
      </AuthCheck>
    </>
  );
}

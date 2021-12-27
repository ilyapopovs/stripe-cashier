import React, { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { GoogleAuthProvider, signInWithPopup, signOut } from "@firebase/auth";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useUser } from "reactfire";
import { fetchFromAPI } from "./helpers";
import { SuspenseWithPerf } from "reactfire";
import { AuthCheck } from "reactfire";

export default function Customers() {
  return (
    <SuspenseWithPerf fallback={"loading user"} traceId={"save-card-suspense"}>
      <SaveCard />
    </SuspenseWithPerf>
  );
}

export function SignIn() {
  const signIn = async () => {
    const credential = await signInWithPopup(auth, new GoogleAuthProvider());
    const { uid, email } = credential.user;
    db.collection("users").doc(uid).set({ email }, { merge: true });
  };

  return <button onClick={signIn}>Sign In with Google</button>;
}

export function SignOut(props) {
  return (
    props.user && (
      <button onClick={() => signOut()}>Sign Out User {props.user.uid}</button>
    )
  );
}

function SaveCard(props) {
  const stripe = useStripe();
  const elements = useElements();
  const user = useUser();

  const [setupIntent, setSetupIntent] = useState();
  const [wallet, setWallet] = useState([]);

  async function getWallet() {
    if (user) {
      const paymentMethods = await fetchFromAPI("wallet", { methods: "GET" });
      setWallet(paymentMethods);
    }
  }

  useEffect(() => {
    getWallet();
  }, []);

  async function createSetupIntent(event) {
    const si = await fetchFromAPI("wallet");
    setSetupIntent(si);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const cardElement = elements.getElement(CardElement);

    const { setupIntent: updatedSetupIntent, error } =
      await stripe.confirmCardSetup(setupIntent.client_secret, {
        payment_method: { card: cardElement },
      });

    if (error) {
      alert(error.message);
      console.log(error);
    } else {
      setSetupIntent(updatedSetupIntent);
      await getWallet();
      alert("Success! Card added to your wallet");
    }
  }

  return (
    <>
      <AuthCheck fallback={<SignIn />}>
        <div>
          <button onClick={createSetupIntent}>Attach New Credit Card</button>
        </div>

        <form onSubmit={handleSubmit}>
          <CardElement />
          <button type="submit">Attach</button>
        </form>

        <select>
          {wallet.map((paymentSource) => (
            <CreditCardPreview
              key={paymentSource.id}
              card={paymentSource.card}
            />
          ))}
        </select>

        <div>
          <SignOut user={user} />
        </div>
      </AuthCheck>
    </>
  );
}

function CreditCardPreview(props) {
  const { last4, brand, exp_month, exp_year } = props.card;

  return (
    <option>
      {brand} **** **** **** {last4} {exp_month}/{exp_year}
    </option>
  );
}

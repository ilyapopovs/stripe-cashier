import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

export const stripePromise = loadStripe(
  "pk_test_51JbBsmAltihfoILxiQdOQL5Mtr0Hy8PPyOHqhTWJ7q6mF9WdkBYZa45O4icxUpsmddva1myacU7iA5RXTs7pJK4t00VL6IEGXe"
);

ReactDOM.render(
  <React.StrictMode>
    <Elements stripe={stripePromise}>
      <App />
    </Elements>
  </React.StrictMode>,
  document.getElementById("root")
);

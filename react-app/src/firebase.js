import { initializeApp } from "firebase/app";

import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export const firebaseConfig = {
  apiKey: "AIzaSyCe7k-fwS6iVZMBP32WcywmHtx4v3zQGnw",
  authDomain: "stripe-cashier.firebaseapp.com",
  projectId: "stripe-cashier",
  storageBucket: "stripe-cashier.appspot.com",
  messagingSenderId: "700865903448",
  appId: "1:700865903448:web:505c7bf01811b68208432d",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

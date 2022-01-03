// Initialize Firebase Admin resources
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, applicationDefault } from "firebase-admin/app";

const app = initializeApp({
  credential: applicationDefault(), // pulls service-account-key.json
});

export const db = getFirestore(app);
export const auth = getAuth(app);

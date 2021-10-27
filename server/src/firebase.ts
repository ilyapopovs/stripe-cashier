// Initialize Firebase Admin resources

import serviceAccount from "../serviceAccountKey.js";
import firebaseAdmin from "firebase-admin";

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
});

export const db = firebaseAdmin.firestore();
export const auth = firebaseAdmin.auth();

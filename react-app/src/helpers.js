import { auth } from "./firebase";
const API = "http://localhost:3333";

/**
 * Fetch data from API, use Firebase Auth token (JWT) for authorization
 */
export async function fetchFromAPI(endpointURL, opts, user = null) {
  const { method, body } = { method: "POST", body: null, ...opts };

  user = user ? user : auth.currentUser;
  const token = user && (await user.getIdToken());

  const res = await fetch(`${API}/${endpointURL}`, {
    method,
    ...(body && { body: JSON.stringify(body) }),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
}

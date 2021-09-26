const API = "http://localhost:3333";

export async function fetchFromAPI(endpointURL, opts) {
  const { method, body } = { method: "POST", body: null, ...opts };

  const res = await fetch(`${API}/${endpointURL}`, {
    method,
    ...(body && { body: JSON.stringify(body) }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  return res.json();
}

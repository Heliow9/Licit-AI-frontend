const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

export function getToken() {
  return localStorage.getItem("token") || "";
}
export function setToken(t) {
  localStorage.setItem("token", t);
}
export function clearToken() {
  localStorage.removeItem("token");
}

export async function apiFetch(path, opts = {}) {
  const url = path.startsWith("http") ? path : API_BASE + path;
  const { auth = true, headers = {}, body, ...rest } = opts;

  const h = new Headers(headers);
  if (auth) {
    const tk = getToken();
    if (tk) h.set("Authorization", `Bearer ${tk}`);
  }

  // se body é objeto simples, vira JSON
  let finalBody = body;
  if (body && !(body instanceof FormData) && typeof body === "object") {
    h.set("Content-Type", "application/json");
    finalBody = JSON.stringify(body);
  }

  const res = await fetch(url, { ...rest, headers: h, body: finalBody });

  if (res.status === 401) {
    // útil pro Login.jsx e ProtectedRoute
    const e = new Error("UNAUTHORIZED");
    e.status = 401;
    throw e;
  }

  const ct = res.headers.get("content-type") || "";
  const isJSON = ct.includes("application/json");
  const data = isJSON ? await res.json() : await res.text();

  if (!res.ok) {
    const e = new Error((isJSON && data?.error) || data || "Request error");
    e.status = res.status;
    throw e;
  }

  return data;
}

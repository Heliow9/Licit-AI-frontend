// src/lib/api.js
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";

export function getToken() {
  return localStorage.getItem("token") || "";
}

export function getAuthHeaders(extra = {}) {
  const token = getToken();
  const hdrs = { ...extra };
  if (token) hdrs["Authorization"] = `Bearer ${token}`;
  return hdrs;
}

export function buildUrl(u) {
  return /^https?:\/\//i.test(u) ? u : `${API_BASE}${u}`;
}

export async function apiFetch(path, opts = {}) {
  const url = buildUrl(path);
  const res = await fetch(url, {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

export { API_BASE };

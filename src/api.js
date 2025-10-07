// src/api.js
import axios from "axios";

const isProd = import.meta.env.PROD;
const API_BASE =
  import.meta.env.VITE_API_BASE ??
  import.meta.env.VITE_API_URL ??
  (isProd ? "https://licit-ai-api.onrender.com" : "http://localhost:3001"); // em prod NUNCA força localhost

console.log("[API_BASE]", API_BASE || "(same-origin)");

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
  withCredentials: true,
});

api.interceptors.request.use((cfg) => {
  const tk = localStorage.getItem("token");
  if (tk) cfg.headers.Authorization = `Bearer ${tk}`;
  return cfg;
});

export default api;

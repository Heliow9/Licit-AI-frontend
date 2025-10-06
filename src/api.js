// src/api.js
import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE ??
  import.meta.env.VITE_API_URL ??                // compat com nome antigo
  (import.meta.env.DEV ? "http://localhost:3001" : "");

const api = axios.create({
  baseURL: API_BASE,       // se "", as chamadas ficam relativas ao domínio atual
  timeout: 120000,
  withCredentials: true,
});

api.interceptors.request.use((cfg) => {
  const tk = localStorage.getItem("token");
  if (tk) cfg.headers.Authorization = `Bearer ${tk}`;
  return cfg;
});

export default api;

// src/api/config.js
export const API = import.meta.env.VITE_API_URL;

if (!API) {
  throw new Error("Missing VITE_API_URL");
}
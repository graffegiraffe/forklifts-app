import axios from "axios";

// In dev: Vite proxies /api → backend container.
// In prod (Vercel): VITE_API_BASE_URL points to the Render backend URL.
const baseURL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}`
  : "/api";

const client = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

export default client;

import axios from "axios";

// In local dev (served via the Vite dev proxy) a relative "/api" works. If the deployed
// frontend and backend ever live on different origins, set VITE_API_BASE_URL at build time.
const baseURL = import.meta.env.VITE_API_BASE_URL || "/api";

export const api = axios.create({ baseURL });

const TOKEN_KEY = "kasrevent_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      setToken(null);
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

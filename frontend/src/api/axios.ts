import axios from "axios";

// Base URL for the FastAPI backend. During development this points at
// your local uvicorn server. When you deploy, swap this for an
// environment variable (import.meta.env.VITE_API_URL) instead of
// hardcoding it.
const API_BASE_URL = "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// -----------------------------
// REQUEST INTERCEPTOR
// -----------------------------
// Attaches the JWT (if we have one stored) to every outgoing request,
// so we don't have to manually add the Authorization header in every
// single API call file.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// -----------------------------
// RESPONSE INTERCEPTOR
// -----------------------------
// If the backend ever responds 401 (invalid/expired token), we clear
// the stored token and kick the user back to the login page. This
// covers cases like the token expiring while the user is mid-session.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");

      // Avoid redirect loops if we're already on the login page.
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const API_URL = "http://127.0.0.1:8000/api/";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      const decoded = jwtDecode(token);
      if (decoded.exp * 1000 < Date.now()) {
        // Token expired - handle refresh logic or logout
        // For MVP, simplistic check. Real apps use a refresh flow.
        // We will skip auto-refresh in this interceptor for brevity
        // and rely on 401 response handling or manual check.
        // But let's try to use the stored token anyway or maybe refresh it here?
        // Let's implement full refresh flow in a separate function or if needed.
        // For now, just attach if exists.
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}auth/token/refresh/`, {
            refresh: refreshToken,
          });
          if (response.status === 200) {
            localStorage.setItem("access_token", response.data.access);
            api.defaults.headers.common["Authorization"] =
              `Bearer ${response.data.access}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed - logout
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      } else {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;

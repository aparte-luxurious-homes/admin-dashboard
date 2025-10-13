"use client";

import axios from "axios";
import Cookies from "js-cookie";
import { BASE_API_URL } from "./routes/endpoints";
import { PAGE_ROUTES } from "./routes/page_routes";

const axiosRequest = axios.create({
  baseURL: BASE_API_URL || "https://v1-api-9mba.onrender.com/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // Increased to 30 seconds
  timeoutErrorMessage: 'Request timed out'
});

// 🔹 Attach token from cookies to every request
axiosRequest.interceptors.request.use((config) => {
  const token = Cookies.get("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 🔹 Handle token expiration (401 errors)
axiosRequest.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Only redirect on 401 if we're not already on the login page
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      
      // Don't redirect if already on login page or if this is a login attempt
      if (!currentPath.includes('/auth/login') && !error.config?.url?.includes('/auth/login')) {
        Cookies.remove("token"); // Auto logout
        window.location.href = PAGE_ROUTES.auth.login;
      }
    }
    return Promise.reject(error);
  }
);

export default axiosRequest;

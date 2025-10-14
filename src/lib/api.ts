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
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      const requestUrl: string = error.config?.url || '';

      // Only force logout for auth-critical endpoints
      const isAuthEndpoint =
        requestUrl.includes('/profile') ||
        requestUrl.includes('/auth/me') ||
        requestUrl.includes('/auth/refresh');

      console.log('[Axios Interceptor] 401 error detected:', {
        path: currentPath,
        url: requestUrl,
        isAuthEndpoint,
      });

      // Avoid redirect loop on login route and don't logout for non-auth endpoints
      const onLoginRoute = currentPath.includes('/auth/login') || requestUrl.includes('/auth/login');

      if (isAuthEndpoint && !onLoginRoute) {
        console.log('[Axios Interceptor] Removing token and redirecting due to auth 401');
        Cookies.remove('token');
        window.location.href = PAGE_ROUTES.auth.login;
      } else {
        console.warn('[Axios Interceptor] 401 on non-auth endpoint - not logging out.');
      }
    }
    return Promise.reject(error);
  }
);

export default axiosRequest;

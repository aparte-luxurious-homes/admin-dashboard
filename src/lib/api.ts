"use client";

import axios from "axios";
import Cookies from "js-cookie";
import { BASE_API_URL } from "./routes/endpoints";
import { PAGE_ROUTES } from "./routes/page_routes";

const axiosRequest = axios.create({
  baseURL: BASE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // Increased to 30 seconds
  timeoutErrorMessage: 'Request timed out'
});

// 🔹 Forceful normalization and token attachment
axiosRequest.interceptors.request.use((config) => {
  // 1. Ensure baseURL always has the correct prefix
  if (config.baseURL && !config.baseURL.includes("/api/v")) {
    const base = config.baseURL.replace(/\/+$/, "");
    config.baseURL = base.endsWith("/api") ? `${base}/v1` : `${base}/api/v1`;
  }

  // 2. Ensure baseURL has NO trailing slash for consistent combination
  config.baseURL = config.baseURL?.replace(/\/+$/, "");

  // 3. Ensure url has NO leading slash to prevent Axios's path replacement behavior
  if (config.url?.startsWith("/")) {
    config.url = config.url.substring(1);
  }

  if (process.env.NEXT_PUBLIC_NODE_ENV !== 'production') {
    console.log(`[Axios] Final Request URL: ${config.baseURL}/${config.url}`);
  }

  const token = Cookies.get("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Strip empty query params like role=& is_verified=
  if (typeof config.url === 'string') {
    // Remove occurrences of ?role=& or &role=& (same for is_verified)
    config.url = config.url
      .replace(/([?&])(role|is_verified)=(&|$)/g, (match, sep, key, tail) => {
        // If another param follows, keep the separator; otherwise, drop the key completely
        return tail === '&' ? sep : '';
      })
      // Clean up any trailing ? or &
      .replace(/[?&]$/, '');
  }
  // Also sanitize params object if used
  if (config.params && typeof config.params === 'object') {
    Object.keys(config.params).forEach((k) => {
      const v = (config.params as any)[k];
      if (v === '' || v === undefined || v === null) {
        delete (config.params as any)[k];
      }
    });
  }
  return config;
});

// Flag to prevent multiple simultaneous redirects
let isRedirecting = false;

// 🔹 Handle token expiration (401 errors)
axiosRequest.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      const requestUrl: string = error.config?.url || '';

      console.log('[Axios Interceptor] 401 error detected:', {
        path: currentPath,
        url: requestUrl,
      });

      // Avoid redirect loop on login route and don't logout for non-auth endpoints
      const onLoginRoute = currentPath.includes('/auth/login') || requestUrl.includes('/auth/login');

      if (!onLoginRoute && !isRedirecting) {
        console.log('[Axios Interceptor] Token expired, clearing auth state and redirecting to login');

        // Set flag to prevent multiple redirects
        isRedirecting = true;

        // Clear token cookie
        Cookies.remove('token');

        // Clear Redux state and React Query cache
        try {
          // Dynamically import to avoid circular dependencies
          const { store } = await import('./store');
          const { clearUser } = await import('./slices/authSlice');

          // Clear Redux auth state
          store.dispatch(clearUser());

          console.log('[Axios Interceptor] Redux state cleared');
        } catch (err) {
          console.error('[Axios Interceptor] Error clearing Redux state:', err);
        }

        // Clear React Query cache
        try {
          const { QueryClient } = await import('@tanstack/react-query');
          // Create a new query client instance to clear cache
          const queryClient = new QueryClient();
          queryClient.clear();

          console.log('[Axios Interceptor] React Query cache cleared');
        } catch (err) {
          console.error('[Axios Interceptor] Error clearing React Query cache:', err);
        }

        // Small delay to ensure state is cleared
        await new Promise(resolve => setTimeout(resolve, 100));

        // Redirect to login
        console.log('[Axios Interceptor] Redirecting to login page');
        window.location.href = PAGE_ROUTES.auth.login;
      } else if (onLoginRoute) {
        console.warn('[Axios Interceptor] 401 received while on login route or performing login - ignoring.');
      } else {
        console.warn('[Axios Interceptor] Already redirecting, skipping duplicate redirect');
      }
    }
    return Promise.reject(error);
  }
);

export default axiosRequest;

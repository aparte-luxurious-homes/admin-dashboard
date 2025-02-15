"use client";

import axios from "axios";
import Cookies from "js-cookie";
import { BASE_API_URL } from "./routes/endpoints";

const api = axios.create({
  baseURL: BASE_API_URL || "https://v1-api-9mba.onrender.com/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 5000,
  timeoutErrorMessage: 'Request timed out'
});

// 🔹 Attach token from cookies to every request
api.interceptors.request.use((config) => {
  const token = Cookies.get("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 🔹 Handle token expiration (401 errors)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status !== 401) {
      Cookies.remove("token"); // Auto logout
    }
    return Promise.reject(error);
  }
);

export default api;

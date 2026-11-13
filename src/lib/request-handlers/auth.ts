import { useMutation } from "@tanstack/react-query";
import axiosRequest from "../api";
import { API_ROUTES } from "../routes/endpoints";
import { toast } from "react-hot-toast";

// ==================== Types ====================

export interface RequestPasswordResetRequest {
  email?: string;
  phone?: string;
}

export interface RequestPasswordResetResponse {
  message: string;
  data?: {
    detail?: string;
  };
  detail?: string;
}

export interface ResetPasswordRequest {
  email?: string;
  phone?: string;
  otp: string;
  password: string;
  password_confirmation: string;
}

export interface ResetPasswordResponse {
  message: string;
  data?: any;
}

// ==================== Mutations ====================

/**
 * Request password reset OTP via email or phone
 */
export const useRequestPasswordReset = () => {
  return useMutation({
    mutationFn: async (payload: RequestPasswordResetRequest) => {
      const response = await axiosRequest.post<RequestPasswordResetResponse>(
        API_ROUTES.auth.requestPasswordReset,
        payload
      );
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Reset instructions sent successfully");
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to send reset instructions";
      toast.error(errorMessage);
    },
  });
};

/**
 * Reset password with OTP verification
 */
export const useResetPassword = () => {
  return useMutation({
    mutationFn: async (payload: ResetPasswordRequest) => {
      const response = await axiosRequest.post<ResetPasswordResponse>(
        API_ROUTES.auth.passwordReset,
        payload
      );
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Password reset successfully");
    },
    onError: (error: any) => {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Failed to reset password";
      toast.error(errorMessage);
    },
  });
};
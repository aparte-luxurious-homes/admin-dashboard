"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosRequest from "@/src/lib/api";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import { IStayExtension, IBaseResponse, IAdminPaginatedResponse } from "@/src/lib/types";
import { toast } from "react-hot-toast";

// 🔹 Fetch Extensions for a Booking
export const useBookingExtensions = (bookingId: string | number, params?: { page?: number; size?: number }) => {
  return useQuery({
    queryKey: ["booking-extensions", bookingId, params],
    queryFn: async () => {
      const response = await axiosRequest.get<IBaseResponse<IAdminPaginatedResponse<IStayExtension>>>(
        API_ROUTES.bookings.extensions.base(bookingId),
        { params }
      );
      return response.data.data;
    },
    enabled: !!bookingId,
  });
};

// 🔹 Fetch All Extensions (Admin/Owner)
export const useAllExtensions = (params?: { page?: number; size?: number }) => {
  return useQuery({
    queryKey: ["all-extensions", params],
    queryFn: async () => {
      const response = await axiosRequest.get<IAdminPaginatedResponse<IStayExtension>>(
        API_ROUTES.bookings.extensions.listAll,
        { params }
      );
      return response.data;
    },
  });
};


// 🔹 Fetch Single Extension Details
export const useExtensionDetails = (bookingId: string | number, extensionId: string | number) => {
  return useQuery({
    queryKey: ["extension-details", bookingId, extensionId],
    queryFn: async () => {
      const response = await axiosRequest.get<IBaseResponse<IStayExtension>>(
        API_ROUTES.bookings.extensions.details(bookingId, extensionId)
      );
      return response.data.data;
    },
    enabled: !!bookingId && !!extensionId,
  });
};

// 🔹 Request Stay Extension
export const useRequestExtension = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, data }: { bookingId: string | number; data: { new_end_date: string; payment_method: string; mark_as_paid?: boolean } }) => {
      const response = await axiosRequest.post<IBaseResponse<IStayExtension>>(
        API_ROUTES.bookings.extensions.base(bookingId),
        data
      );
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["booking-extensions", variables.bookingId] });
      toast.success("Stay extension requested successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to request extension");
    },
  });
};

// 🔹 Approve Extension Request
export const useApproveExtension = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, extensionId }: { bookingId: string | number; extensionId: string | number }) => {
      const response = await axiosRequest.post<IBaseResponse<any>>(
        API_ROUTES.bookings.extensions.approve(bookingId, extensionId)
      );
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["booking-extensions", variables.bookingId] });
      queryClient.invalidateQueries({ queryKey: ["extension-details", variables.bookingId, variables.extensionId] });
      toast.success("Extension approved successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to approve extension");
    },
  });
};

// 🔹 Reject Extension Request
export const useRejectExtension = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, extensionId, reason }: { bookingId: string | number; extensionId: string | number; reason: string }) => {
      const response = await axiosRequest.post<IBaseResponse<any>>(
        API_ROUTES.bookings.extensions.reject(bookingId, extensionId),
        { reason }
      );
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["booking-extensions", variables.bookingId] });
      queryClient.invalidateQueries({ queryKey: ["extension-details", variables.bookingId, variables.extensionId] });
      toast.success("Extension rejected successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to reject extension");
    },
  });
};

// 🔹 Cancel Extension Request
export const useCancelExtension = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, extensionId }: { bookingId: string | number; extensionId: string | number }) => {
      const response = await axiosRequest.post<IBaseResponse<any>>(
        API_ROUTES.bookings.extensions.cancel(bookingId, extensionId)
      );
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["booking-extensions", variables.bookingId] });
      queryClient.invalidateQueries({ queryKey: ["extension-details", variables.bookingId, variables.extensionId] });
      toast.success("Extension cancelled successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to cancel extension");
    },
  });
};

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosRequest from "@/src/lib/api";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import { IReview, IReviewSummary, IBaseResponse, IPaginatedResponse } from "@/src/lib/types";
import { toast } from "react-hot-toast";

// 🔹 Fetch Admin Reviews (Search/Filter)
export const useAdminReviews = (params?: { property_id?: string; page?: number; size?: number }) => {
  return useQuery({
    queryKey: ["admin-reviews", params],
    queryFn: async () => {
      const response = await axiosRequest.get<IPaginatedResponse<IReview[]>>(API_ROUTES.admin.reviews.base, { params });
      return response.data;
    },
  });
};

// 🔹 Fetch Review Details
export const useReviewDetails = (reviewId: string | number) => {
  return useQuery({
    queryKey: ["review-details", reviewId],
    queryFn: async () => {
      const response = await axiosRequest.get<IBaseResponse<IReview>>(`${API_ROUTES.reviews.base}/${reviewId}`);
      return response.data;
    },
    enabled: !!reviewId,
  });
};

// 🔹 Fetch Property Reviews (Public)
export const usePropertyReviews = (propertyId: string | number, params?: { page?: number; size?: number }) => {
  return useQuery({
    queryKey: ["property-reviews", propertyId, params],
    queryFn: async () => {
      const response = await axiosRequest.get<IPaginatedResponse<IReview[]>>(API_ROUTES.reviews.propertyReviews(propertyId), { params });
      return response.data;
    },
    enabled: !!propertyId,
  });
};

// 🔹 Fetch Property Rating Summary
export const usePropertyRatingSummary = (propertyId: string | number) => {
  return useQuery({
    queryKey: ["property-rating-summary", propertyId],
    queryFn: async () => {
      const response = await axiosRequest.get<IBaseResponse<IReviewSummary>>(API_ROUTES.reviews.propertySummary(propertyId));
      return response.data.data;
    },
    enabled: !!propertyId,
  });
};

// 🔹 Flag Review (Admin)
export const useFlagReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reviewId: string | number) => {
      const response = await axiosRequest.patch<IBaseResponse<IReview>>(API_ROUTES.admin.reviews.flag(reviewId));
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("Review flagged successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to flag review");
    },
  });
};

// 🔹 Remove Review (Admin)
export const useRemoveReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reviewId: string | number) => {
      const response = await axiosRequest.delete<IBaseResponse<IReview>>(API_ROUTES.admin.reviews.remove(reviewId));
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("Review removed successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to remove review");
    },
  });
};

// 🔹 Submit Review (Guest - for reference, though maybe not used in admin dash)
export const useSubmitReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { booking_id: string; rating: number; comment?: string }) => {
      const response = await axiosRequest.post<IBaseResponse<IReview>>(API_ROUTES.reviews.base, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
        // We could invalidate property reviews if we knew the property_id
        queryClient.invalidateQueries({ queryKey: ["property-reviews"] });
        toast.success("Review submitted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to submit review");
    },
  });
};

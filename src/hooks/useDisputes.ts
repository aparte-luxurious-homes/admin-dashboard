"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosRequest from "@/src/lib/api";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import { IDispute, IBaseResponse, IAdminPaginatedResponse } from "@/src/lib/types";
import { toast } from "react-hot-toast";
import { DisputeStatus, DisputeOutcome } from "@/src/lib/enums";

// 🔹 Fetch Single Dispute Details
export const useDisputeDetails = (id: string) => {
  return useQuery({
    queryKey: ["dispute-details", id],
    queryFn: async () => {
      const response = await axiosRequest.get<IBaseResponse<IDispute>>(API_ROUTES.admin.disputes.details(id));
      return response.data.data;
    },
  });
};

// 🔹 Fetch Admin Disputes (Search/Filter)
export const useAdminDisputes = (params?: { 
  page?: number; 
  size?: number;
  status?: DisputeStatus;
  property_id?: string;
  user_id?: string;
  start_date?: string;
  end_date?: string;
}) => {
  return useQuery({
    queryKey: ["admin-disputes", params],
    queryFn: async () => {
      const response = await axiosRequest.get<IAdminPaginatedResponse<IDispute>>(API_ROUTES.admin.disputes.base, { params });
      return response.data;
    },
  });
};

// 🔹 Update Dispute Status
export const useUpdateDisputeStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, admin_notes }: { id: string; status: DisputeStatus; admin_notes: string }) => {
      const response = await axiosRequest.patch<IBaseResponse<IDispute>>(API_ROUTES.admin.disputes.status(id), { status, admin_notes });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-disputes"] });
      toast.success("Dispute status updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update status");
    },
  });
};

// 🔹 Request Extra Evidence
export const useRequestDisputeEvidence = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await axiosRequest.post<IBaseResponse<IDispute>>(API_ROUTES.admin.disputes.requestEvidence(id), { reason });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-disputes"] });
      toast.success("Evidence request sent successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to request evidence");
    },
  });
};

// 🔹 Resolve Dispute
export const useResolveDispute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, outcome, admin_notes, amount }: { id: string; outcome: DisputeOutcome; admin_notes: string; amount?: number }) => {
      const response = await axiosRequest.post<IBaseResponse<IDispute>>(API_ROUTES.admin.disputes.resolve(id), { outcome, admin_notes, amount });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-disputes"] });
      toast.success("Dispute resolved successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to resolve dispute");
    },
  });
};

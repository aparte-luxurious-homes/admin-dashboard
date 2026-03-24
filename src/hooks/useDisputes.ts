"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosRequest from "@/src/lib/api";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import { IDispute, IDisputeEvidence, IBaseResponse, IPaginatedResponse } from "@/src/lib/types";
import { toast } from "react-hot-toast";
import { DisputeCategory, DisputeStatus, DisputeOutcome } from "@/src/lib/enums";

// 🔹 Fetch Admin Disputes (Search/Filter)
export const useAdminDisputes = (params?: { 
  status?: DisputeStatus; 
  property_id?: string; 
  user_id?: string | number; 
  start_date?: string; 
  end_date?: string; 
  page?: number; 
  size?: number 
}) => {
  return useQuery({
    queryKey: ["admin-disputes", params],
    queryFn: async () => {
      const response = await axiosRequest.get<IPaginatedResponse<IDispute[]>>(API_ROUTES.admin.disputes.base, { params });
      return response.data;
    },
  });
};

// 🔹 Fetch My Disputes
export const useMyDisputes = () => {
  return useQuery({
    queryKey: ["my-disputes"],
    queryFn: async () => {
      const response = await axiosRequest.get<IPaginatedResponse<IDispute[]>>(API_ROUTES.disputes.myDisputes);
      return response.data;
    },
  });
};

// 🔹 Raise Dispute
export const useRaiseDispute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { 
      booking_id: string; 
      category: DisputeCategory; 
      description: string; 
      evidence?: IDisputeEvidence[] 
    }) => {
      const response = await axiosRequest.post<IBaseResponse<IDispute>>(API_ROUTES.disputes.base, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-disputes"] });
      queryClient.invalidateQueries({ queryKey: ["admin-disputes"] });
      toast.success("Dispute raised successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to raise dispute");
    },
  });
};

// 🔹 Upload Evidence
export const useUploadDisputeEvidence = (disputeId: string | number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (evidence: IDisputeEvidence) => {
      const response = await axiosRequest.post<IBaseResponse<any>>(API_ROUTES.disputes.evidence(disputeId), evidence);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-disputes"] });
      queryClient.invalidateQueries({ queryKey: ["admin-disputes"] });
      toast.success("Evidence uploaded successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to upload evidence");
    },
  });
};

// 🔹 Admin Update Status
export const useUpdateDisputeStatus = (disputeId: string | number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { status: DisputeStatus; admin_notes?: string }) => {
      const response = await axiosRequest.patch<IBaseResponse<IDispute>>(API_ROUTES.admin.disputes.status(disputeId), data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-disputes"] });
      toast.success("Dispute status updated");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update status");
    },
  });
};

// 🔹 Admin Request Evidence
export const useRequestDisputeEvidence = (disputeId: string | number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { reason: string }) => {
      const response = await axiosRequest.post<IBaseResponse<any>>(API_ROUTES.admin.disputes.requestEvidence(disputeId), data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-disputes"] });
      toast.success("Evidence requested successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to request evidence");
    },
  });
};

// 🔹 Admin Resolve Dispute
export const useResolveDispute = (disputeId: string | number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { outcome: DisputeOutcome; admin_notes: string }) => {
      const response = await axiosRequest.post<IBaseResponse<IDispute>>(API_ROUTES.admin.disputes.resolve(disputeId), data);
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

// 🔹 Admin Reopen Dispute
export const useReopenDispute = (disputeId: string | number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { reason: string }) => {
      const response = await axiosRequest.post<IBaseResponse<IDispute>>(API_ROUTES.admin.disputes.reopen(disputeId), data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-disputes"] });
      toast.success("Dispute reopened successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to reopen dispute");
    },
  });
};

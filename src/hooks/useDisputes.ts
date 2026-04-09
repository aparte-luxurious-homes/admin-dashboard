"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosRequest from "@/src/lib/api";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import { IDispute, IDisputeEvidence, IBaseResponse, IAdminPaginatedResponse } from "@/src/lib/types";
import { toast } from "react-hot-toast";
import { DisputeStatus, DisputeOutcome } from "@/src/lib/enums";

// 🔹 Fetch Single Dispute Details (Admin)
export const useDisputeDetails = (id: string) => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ["dispute-details", id],
    queryFn: async () => {
      const response = await axiosRequest.get<IBaseResponse<IDispute>>(API_ROUTES.admin.disputes.details(id));
      
      let cachedDispute: Partial<IDispute> | undefined;
      const queries = queryClient.getQueriesData<IAdminPaginatedResponse<IDispute>>({ queryKey: ["admin-disputes"] });
      for (const [_, data] of queries) {
        if (data?.items) {
          const found = data.items.find((d) => d.id === id || d.dispute_id === id);
          if (found) {
            cachedDispute = found;
            break;
          }
        }
      }

      const fetchedData = response.data.data;
      return {
        ...cachedDispute,
        ...fetchedData,
        guest_name: fetchedData.guest_name || cachedDispute?.guest_name,
        guest_email: fetchedData.guest_email || cachedDispute?.guest_email,
        guest_phone: fetchedData.guest_phone || cachedDispute?.guest_phone,
        owner_name: fetchedData.owner_name || cachedDispute?.owner_name,
        owner_email: fetchedData.owner_email || cachedDispute?.owner_email,
        owner_phone: fetchedData.owner_phone || cachedDispute?.owner_phone,
      };
    },
    enabled: !!id,
    initialData: () => {
      const queries = queryClient.getQueriesData<IAdminPaginatedResponse<IDispute>>({ queryKey: ["admin-disputes"] });
      for (const [_, data] of queries) {
        if (data?.items) {
          const found = data.items.find((d) => d.id === id || d.dispute_id === id);
          if (found) return found;
        }
      }
      return undefined;
    }
  });
};

// 🔹 Fetch Single My Dispute Details (Owner)
export const useMyDisputeDetails = (id: string) => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ["my-dispute-details", id],
    queryFn: async () => {
      const response = await axiosRequest.get<IBaseResponse<IDispute>>(API_ROUTES.disputes.details(id));
      
      let cachedDispute: Partial<IDispute> | undefined;
      const queries = queryClient.getQueriesData<IAdminPaginatedResponse<IDispute>>({ queryKey: ["my-disputes"] });
      for (const [_, data] of queries) {
        if (data?.items) {
          const found = data.items.find((d) => d.id === id || d.dispute_id === id);
          if (found) {
            cachedDispute = found;
            break;
          }
        }
      }

      const fetchedData = response.data.data;
      return {
        ...cachedDispute,
        ...fetchedData,
        guest_name: fetchedData.guest_name || cachedDispute?.guest_name,
        guest_email: fetchedData.guest_email || cachedDispute?.guest_email,
        guest_phone: fetchedData.guest_phone || cachedDispute?.guest_phone,
        owner_name: fetchedData.owner_name || cachedDispute?.owner_name,
        owner_email: fetchedData.owner_email || cachedDispute?.owner_email,
        owner_phone: fetchedData.owner_phone || cachedDispute?.owner_phone,
      };
    },
    enabled: !!id,
    initialData: () => {
      const queries = queryClient.getQueriesData<IAdminPaginatedResponse<IDispute>>({ queryKey: ["my-disputes"] });
      for (const [_, data] of queries) {
        if (data?.items) {
          const found = data.items.find((d) => d.id === id || d.dispute_id === id);
          if (found) return found;
        }
      }
      return undefined;
    }
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

// 🔹 Create a Dispute (multipart/form-data)
export const useCreateDispute = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await axiosRequest.post<IDispute>(
        API_ROUTES.disputes.base,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-disputes"] });
      toast.success("Dispute raised successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to raise dispute");
    },
  });
};

// 🔹 Fetch My Disputes (Owner/Guest)
export const useMyDisputes = (params?: { page?: number; size?: number; status?: DisputeStatus }) => {
  return useQuery({
    queryKey: ["my-disputes", params],
    queryFn: async () => {
      const response = await axiosRequest.get<IAdminPaginatedResponse<IDispute>>(
        API_ROUTES.disputes.myDisputes,
        { params }
      );
      return response.data;
    },
  });
};

// 🔹 Upload Dispute Evidence (multipart/form-data)
export const useUploadDisputeEvidence = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const response = await axiosRequest.post<IDisputeEvidence[]>(
        API_ROUTES.disputes.evidence(id),
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["my-dispute-details", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["dispute-details", variables.id] });
      toast.success("Evidence uploaded successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to upload evidence");
    },
  });
};

// 🔹 Delete Dispute Evidence
export const useDeleteDisputeEvidence = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ disputeId, evidenceId }: { disputeId: string; evidenceId: string }) => {
      const response = await axiosRequest.delete<IBaseResponse<null>>(
        API_ROUTES.disputes.deleteEvidence(disputeId, evidenceId)
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["my-dispute-details", variables.disputeId] });
      queryClient.invalidateQueries({ queryKey: ["dispute-details", variables.disputeId] });
      toast.success("Evidence removed successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to remove evidence");
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
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-disputes"] });
      queryClient.invalidateQueries({ queryKey: ["dispute-details", variables.id] });
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
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-disputes"] });
      queryClient.invalidateQueries({ queryKey: ["dispute-details", variables.id] });
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
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-disputes"] });
      queryClient.invalidateQueries({ queryKey: ["dispute-details", variables.id] });
      toast.success("Dispute resolved successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to resolve dispute");
    },
  });
};

"use client";

import { MESSAGES } from '@/src/lib/messages';
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
      const fetchedData = response.data.data;
      
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

      // 🔹 Fallback: Fetch booking details if guest/owner names are missing (common on refresh)
      const bId = fetchedData.booking_id || (fetchedData as any).bookingId;
      if (bId && (!fetchedData.guest_name || !fetchedData.owner_name)) {
        try {
          const bRes = await axiosRequest.get<IBaseResponse<any>>(API_ROUTES.bookings.details(bId));
          const bData = bRes.data?.data;
          
          if (bData) {
            // Guest Mapping
            if (!fetchedData.guest_name) {
              const guest = bData.user || bData.guest || bData.customer;
              const fName = guest?.profile?.firstName || guest?.profile?.first_name || guest?.firstName || guest?.first_name;
              const lName = guest?.profile?.lastName || guest?.profile?.last_name || guest?.lastName || guest?.last_name;
              
              if (fName) {
                fetchedData.guest_name = `${fName} ${lName || ""}`.trim();
              } else if (guest?.email) {
                fetchedData.guest_name = guest.email;
              }
              
              fetchedData.guest_email = fetchedData.guest_email || guest?.email;
              fetchedData.guest_phone = fetchedData.guest_phone || guest?.phone;
            }
            
            // Owner Mapping
            if (!fetchedData.owner_name) {
              const owner = bData.property?.owner || 
                            bData.unit?.property?.owner || 
                            bData.owner || 
                            bData.unit?.owner ||
                            (bData as any).property_owner ||
                            (bData as any).property?.user;
                            
              const fName = owner?.profile?.firstName || owner?.profile?.first_name || owner?.firstName || owner?.first_name;
              const lName = owner?.profile?.lastName || owner?.profile?.last_name || owner?.lastName || owner?.last_name;
              
              if (fName) {
                fetchedData.owner_name = `${fName} ${lName || ""}`.trim();
              } else if (owner?.email) {
                fetchedData.owner_name = owner.email;
              }
              
              fetchedData.owner_email = fetchedData.owner_email || owner?.email;
              fetchedData.owner_phone = fetchedData.owner_phone || owner?.phone;
            }
          }
        } catch (err) {
          console.error("[useDisputes] Failed to fetch fallback booking:", err);
        }
      }

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
      const fetchedData = response.data.data;
      
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

      // 🔹 Fallback: Fetch booking details if guest/owner names are missing (common on refresh)
      const bId = fetchedData.booking_id || (fetchedData as any).bookingId;
      if (bId && (!fetchedData.guest_name || !fetchedData.owner_name)) {
        try {
          const bRes = await axiosRequest.get<IBaseResponse<any>>(API_ROUTES.bookings.details(bId));
          const bData = bRes.data?.data;
          
          if (bData) {
            // Guest Mapping
            if (!fetchedData.guest_name) {
              const guest = bData.user || bData.guest || bData.customer;
              const fName = guest?.profile?.firstName || guest?.profile?.first_name || guest?.firstName || guest?.first_name;
              const lName = guest?.profile?.lastName || guest?.profile?.last_name || guest?.lastName || guest?.last_name;
              
              if (fName) {
                fetchedData.guest_name = `${fName} ${lName || ""}`.trim();
              } else if (guest?.email) {
                fetchedData.guest_name = guest.email;
              }
              
              fetchedData.guest_email = fetchedData.guest_email || guest?.email;
              fetchedData.guest_phone = fetchedData.guest_phone || guest?.phone;
            }
            // Owner Mapping
            if (!fetchedData.owner_name) {
              const owner = bData.property?.owner || 
                            bData.unit?.property?.owner || 
                            bData.owner || 
                            bData.unit?.owner ||
                            (bData as any).property_owner ||
                            (bData as any).property?.user;

              const fName = owner?.profile?.firstName || owner?.profile?.first_name || owner?.firstName || owner?.first_name;
              const lName = owner?.profile?.lastName || owner?.profile?.last_name || owner?.lastName || owner?.last_name;
              
              if (fName) {
                fetchedData.owner_name = `${fName} ${lName || ""}`.trim();
              } else if (owner?.email) {
                fetchedData.owner_name = owner.email;
              }
              
              fetchedData.owner_email = fetchedData.owner_email || owner?.email;
              fetchedData.owner_phone = fetchedData.owner_phone || owner?.phone;
            }
          }
        } catch (err) {
          console.error("[useDisputes] Failed to fetch fallback booking:", err);
        }
      }

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
      toast.success(MESSAGES.MSG_DISPUTE_RAISED_SUCCESSFULLY);
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
      toast.success(MESSAGES.MSG_EVIDENCE_UPLOADED_SUCCESSFULLY);
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
      toast.success(MESSAGES.MSG_EVIDENCE_REMOVED_SUCCESSFULLY);
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
      toast.success(MESSAGES.MSG_DISPUTE_STATUS_UPDATED_SUCCESSFULLY);
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
      toast.success(MESSAGES.MSG_EVIDENCE_REQUEST_SENT_SUCCESSFULLY);
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
      toast.success(MESSAGES.MSG_DISPUTE_RESOLVED_SUCCESSFULLY);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to resolve dispute");
    },
  });
};

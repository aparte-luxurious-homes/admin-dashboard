"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axiosRequest from "@/src/lib/api";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import { IReferralInfo, IAgentReferralStats, IReferralItem, IReferralRelationship, IBaseResponse, IPaginatedResponse } from "@/src/lib/types";
import { toast } from "react-hot-toast";

// 🔹 Fetch My Referral Code & Link (Agent/Owner/Admin)
export const useMyReferralInfo = () => {
    return useQuery({
        queryKey: ["my-referral-info"],
        queryFn: async () => {
            const response = await axiosRequest.get<IBaseResponse<IReferralInfo>>(API_ROUTES.referrals.myCode);
            return response.data.data;
        },
    });
};

// 🔹 Fetch Agent Referral Stats (Agent)
export const useAgentReferralStats = () => {
    return useQuery({
        queryKey: ["agent-referral-stats"],
        queryFn: async () => {
            const response = await axiosRequest.get<IBaseResponse<IAgentReferralStats>>(API_ROUTES.referrals.stats);
            return response.data.data;
        },
    });
};

// 🔹 List My Referrals (Agent)
export const useMyReferrals = (params?: { page?: number; size?: number }) => {
    return useQuery({
        queryKey: ["my-referrals", params],
        queryFn: async () => {
            const response = await axiosRequest.get<IBaseResponse<{ items: IReferralItem[], total: number }>>(API_ROUTES.referrals.list, { params });
            return response.data.data;
        },
    });
};

// 🔹 View All Referral Relationships (Admin)
export const useAdminReferralRelationships = (params?: { page?: number; size?: number }) => {
    return useQuery({
        queryKey: ["admin-referral-relationships", params],
        queryFn: async () => {
            const response = await axiosRequest.get<IBaseResponse<{ items: IReferralRelationship[], total: number }>>(API_ROUTES.admin.referrals.base, { params });
            return response.data.data;
        },
    });
};

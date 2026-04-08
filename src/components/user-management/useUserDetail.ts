"use client";

import { useState, useCallback, useEffect } from "react";
import axiosRequest from "@/src/lib/api";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import { toast } from "react-hot-toast";
import { UserDetail, Wallet, normalizeUser, RoleConfig } from "./user-detail.types";

export function useUserDetail(userId: string | undefined) {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchWalletFallback = useCallback(async (numericId: string | number) => {
    try {
      const res = await axiosRequest.get(`${API_ROUTES.wallet.base}?user_id=${numericId}`);
      const items = res?.data?.data?.items || [];
      const ngnWallet = items.find((w: any) => w.currency === "NGN") || items[0] || null;
      if (ngnWallet) {
        setWallet({
          id: String(ngnWallet.id),
          balance: String(ngnWallet.balance ?? "0"),
          pendingCash: String(ngnWallet.pending_cash ?? ngnWallet.pendingCash ?? "0"),
          currency: String(ngnWallet.currency ?? "NGN"),
        });
      }
    } catch {
      // Non-critical
    }
  }, []);

  const fetchUser = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const response = await axiosRequest.get(
        API_ROUTES.admin.users.userByUuid(String(userId))
      );
      const raw = response?.data?.data;
      const normalized = normalizeUser(raw);
      setUser(normalized);

      // Try to extract wallet from user response first
      const ngnWallet = normalized.wallets.find((w) => w.currency === "NGN") || normalized.wallets[0];
      if (ngnWallet) {
        setWallet(ngnWallet);
      } else if (raw?.id) {
        // Fallback: separate wallet API call
        await fetchWalletFallback(raw.id);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load user", {
        duration: 6000,
        style: { maxWidth: "500px", width: "max-content" },
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, fetchWalletFallback]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const updateUser = useCallback(
    async (formData: any, roleConfig: RoleConfig) => {
      if (!userId) return;
      setIsUpdating(true);
      try {
        await axiosRequest.put(
          API_ROUTES.admin.users.userByUuid(String(userId)),
          {
            email: formData.email,
            phone: formData.phone,
            role: formData.role,
            is_active: formData.is_active,
            isVerified: formData.isVerified,
            profile: {
              first_name: formData.firstName,
              last_name: formData.lastName,
              gender: formData.gender ? formData.gender.toUpperCase() : undefined,
              bio: formData.bio,
            },
          }
        );
        toast.success(roleConfig.successMessage);
        await fetchUser();
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Failed to update user");
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    [userId, fetchUser]
  );

  const refetchWallet = useCallback(() => {
    if (user?.id) fetchWalletFallback(user.id);
  }, [user?.id, fetchWalletFallback]);

  const [isCreatingWallet, setIsCreatingWallet] = useState(false);

  const createWallet = useCallback(async () => {
    if (!userId) return;
    setIsCreatingWallet(true);
    try {
      await axiosRequest.post(API_ROUTES.wallet.base, {
        user_id: userId,
        currency: "NGN",
      });
      toast.success("Wallet created successfully");
      await fetchUser();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create wallet");
    } finally {
      setIsCreatingWallet(false);
    }
  }, [userId, fetchUser]);

  return {
    user,
    wallet,
    isLoading,
    refetch: fetchUser,
    refetchWallet,
    updateUser,
    isUpdating,
    createWallet,
    isCreatingWallet,
  };
}

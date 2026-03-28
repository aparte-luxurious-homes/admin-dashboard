"use client";

import UserEditForm from "@/src/components/user-management/UserEditForm";
import KycStatusEditor from "@/src/components/user-management/KycStatusEditor";
import { EditWalletModal } from "@/src/components/finance-mgt/modals/EditWalletModal";

import BreadCrumb from "@/src/components/breadcrumb";
import Grid from "@mui/material/Grid2";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import { useEffect, useState, useCallback } from "react";
import axiosRequest from "@/src/lib/api";
import { toast } from "react-hot-toast";
import { Icon } from "@iconify/react";
import Button from "@/src/components/button";
import { Skeleton } from "@/components/ui/skeleton";
import Badge from "@/src/components/badge";
import { useParams } from "next/navigation";
import Image from "next/image";

interface UserProfile {
  id: number | string;
  userId: number | string;
  firstName?: string | null;
  first_name?: string | null;
  lastName?: string | null;
  last_name?: string | null;
  gender?: string | null;
  dob?: string | null;
  bio?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  kycStatus?: string;
  kyc_status?: string;
  profileImage?: string | null;
  profile_image?: string | null;
}

interface User {
  id: string | number;
  email: string;
  phone?: string | null;
  firstName?: string | null;
  first_name?: string | null;
  lastName?: string | null;
  last_name?: string | null;
  profileImage?: string | null;
  profile_image?: string | null;
  is_active?: boolean;
  isVerified?: boolean;
  is_verified?: boolean;
  role: string | Record<string, any>;
  profile?: UserProfile;
  createdAt?: string;
  created_at?: string;
}

const AdminInfo = () => {
  const [userInfo, setUserInfo] = useState<User>({} as User);
  const [userLoading, setUserLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [wallet, setWallet] = useState<{ id: string; balance: string | number; pending_cash?: string | number; currency: string } | null>(null);
  const [showEditWallet, setShowEditWallet] = useState(false);
  const params = useParams();
  const id = params?.id;

  const fetchWallet = useCallback(async (userId: string | number) => {
    try {
      const res = await axiosRequest.get(`${API_ROUTES.wallet.base}?user_id=${userId}`);
      const items = res?.data?.data?.items || [];
      setWallet(items.find((w: any) => w.currency === "NGN") || items[0] || null);
    } catch { /* non-critical */ }
  }, []);

  const fetchUserInfo = useCallback(async () => {
    if (!id) return;
    setUserLoading(true);
    try {
      const response = await axiosRequest.get(
        `${API_ROUTES.admin.users.userByUuid(String(id))}`
      );
      const userData = response?.data?.data;
      setUserInfo(userData);
      if (userData?.id) fetchWallet(userData.id);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load user", {
        duration: 6000,
        style: { maxWidth: "500px", width: "max-content" },
      });
    } finally {
      setUserLoading(false);
    }
  }, [id, fetchWallet]);

  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

  const roleLabel = typeof userInfo?.role === "string"
    ? userInfo.role.replace(/_/g, " ")
    : "";

  return (
    <>
      <div className="p-[20px] mr-5 ml-5 mt-5 mb-100 border border-[#D9D9D9] rounded-[15px] bg-white shadow-md min-h-[calc(100vh-150px)]">
        <BreadCrumb
          description=""
          active="Admin info"
          link_one="/user-management/admins"
          link_one_name="All Admins"
        />
        <div className="mt-0">
          <div className="flex justify-between items-center mb-[50px] mt-[10px]">
            <h3 className="font-semibold">Admin Info</h3>
          </div>
          {userLoading ? (
            <Skeleton className="h-[500px] mt-5 w-full rounded-md" />
          ) : (
            <>
              {isEditing ? (
                <div className="bg-white rounded-2xl p-2">
                  <UserEditForm
                    initialData={{
                      firstName: userInfo?.profile?.first_name || userInfo?.profile?.firstName || userInfo?.first_name || userInfo?.firstName || "",
                      lastName: userInfo?.profile?.last_name || userInfo?.profile?.lastName || userInfo?.last_name || userInfo?.lastName || "",
                      email: userInfo?.email || "",
                      phone: userInfo?.phone || "",
                      gender: userInfo?.profile?.gender || "",
                      role: typeof userInfo?.role === "string" ? userInfo.role : "",
                      bio: userInfo?.profile?.bio || "",
                      is_active: userInfo?.is_active ?? userInfo?.is_active ?? true,
                      isVerified: userInfo?.is_verified ?? userInfo?.isVerified ?? false,
                    }}
                    showRoleSelector={true}
                    isSaving={isSaving}
                    onCancel={() => setIsEditing(false)}
                    onSave={async (formData: any) => {
                      setIsSaving(true);
                      try {
                        await axiosRequest.put(
                          `${API_ROUTES.admin.users.userByUuid(String(id))}`,
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
                        toast.success("Admin profile updated successfully");
                        setIsEditing(false);
                        fetchUserInfo();
                      } catch (error: any) {
                        toast.error(error.response?.data?.message || "Failed to update admin");
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                  />
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                      <div className="relative w-[48px] h-[48px] rounded-full overflow-hidden border-2 border-gray-300">
                        {userInfo?.profile?.profile_image || userInfo?.profile?.profileImage ? (
                          <Image
                            src={userInfo?.profile?.profile_image || userInfo?.profile?.profileImage || ""}
                            alt="profile"
                            layout="fill"
                            objectFit="cover"
                            className="rounded-full"
                          />
                        ) : (
                          <Icon
                            icon="gg:profile"
                            width="48"
                            height="48"
                            className="text-gray-500 flex items-center justify-center"
                          />
                        )}
                      </div>
                      {roleLabel && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase bg-primary/10 text-primary border border-primary/20">
                          {roleLabel}
                        </span>
                      )}
                    </div>
                    <Button
                      buttonName={
                        <>
                          <Icon icon="mdi:pencil" className="mr-2" />
                          Edit Profile
                        </>
                      }
                      onClick={() => setIsEditing(true)}
                      variant="primary"
                    />
                  </div>
                  <Grid container spacing={4}>
                    {/* Personal Information Section */}
                    <Grid size={{ xs: 12 }}>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <Icon icon="solar:user-bold-duotone" width="20" />
                        </div>
                        <h4 className="text-lg font-bold text-gray-800">Personal Information</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">First Name</p>
                          <p className="text-sm font-medium text-gray-900">{userInfo?.profile?.first_name || userInfo?.profile?.firstName || "--/--"}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Name</p>
                          <p className="text-sm font-medium text-gray-900">{userInfo?.profile?.last_name || userInfo?.profile?.lastName || "--/--"}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Gender</p>
                          <p className="text-sm font-medium text-gray-900">{userInfo?.profile?.gender || "--/--"}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Bio</p>
                          <p className="text-sm font-medium text-gray-900 line-clamp-2">{userInfo?.profile?.bio || "--/--"}</p>
                        </div>
                      </div>
                    </Grid>

                    {/* Contact & Account Section */}
                    <Grid size={{ xs: 12 }}>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <Icon icon="solar:settings-bold-duotone" width="20" />
                        </div>
                        <h4 className="text-lg font-bold text-gray-800">Account & Contact</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email Address</p>
                          <p className="text-sm font-medium text-gray-900">{userInfo?.email || "--/--"}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone Number</p>
                          <p className="text-sm font-medium text-gray-900">{userInfo?.phone || "--/--"}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Account Active</p>
                          <Badge status={userInfo?.is_active ?? userInfo?.is_active ?? false} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Verified Identity</p>
                          <Badge status={userInfo?.is_verified ?? userInfo?.isVerified ?? false} />
                        </div>
                      </div>
                    </Grid>
                  </Grid>

                  {/* Wallet Section */}
                  {wallet && (
                    <div className="mt-6">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <Icon icon="solar:wallet-bold-duotone" width="20" />
                        </div>
                        <h4 className="text-lg font-bold text-gray-800">Wallet</h4>
                      </div>
                      <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Balance</p>
                            <p className="text-lg font-bold text-primary">
                              {wallet.currency} {Number(wallet.balance).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Cash</p>
                            <p className="text-sm font-medium text-gray-900">
                              {wallet.currency} {Number(wallet.pending_cash ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div className="flex justify-end">
                            <Button
                              buttonName={<><Icon icon="mdi:pencil" className="mr-2" />Edit Wallet</>}
                              onClick={() => setShowEditWallet(true)}
                              variant="primary"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* KYC Status Section */}
                  <KycStatusEditor
                    userId={String(id)}
                    currentStatus={userInfo?.profile?.kyc_status || userInfo?.profile?.kycStatus || "PENDING"}
                    onUpdate={fetchUserInfo}
                  />
                </>
              )}
            </>
          )}
        </div>
      </div>

      {wallet && (
        <EditWalletModal
          isOpen={showEditWallet}
          onClose={() => setShowEditWallet(false)}
          walletId={wallet.id}
          currentBalance={wallet.balance}
          currentPendingCash={wallet.pending_cash}
          currency={wallet.currency}
          userName={
            userInfo?.profile?.first_name || userInfo?.profile?.firstName
              ? `${userInfo?.profile?.first_name || userInfo?.profile?.firstName} ${userInfo?.profile?.last_name || userInfo?.profile?.lastName || ""}`.trim()
              : userInfo?.email
          }
          onSuccess={() => fetchWallet(userInfo.id)}
        />
      )}
    </>
  );
};

export default AdminInfo;

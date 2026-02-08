"use client";

import UserEditForm from "@/src/components/user-management/UserEditForm";

import BreadCrumb from "@/src/components/breadcrumb";
import Grid from "@mui/material/Grid2";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import { useEffect, useState, useCallback } from "react";
import axiosRequest from "@/src/lib/api";
import { toast } from "react-hot-toast";
import { Icon } from "@iconify/react";
import Button from "@/src/components/button";
import InputGroup from "@/src/components/formcomponent/InputGroup";
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
  averageRating?: string | number;
  average_rating?: string | number;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
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
  isActive?: boolean;
  is_active?: boolean;
  isVerified?: boolean;
  is_verified?: boolean;
  role: string | Record<string, any>;
  profile?: UserProfile;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  total_records?: number;
  kyc_status?: string;
  kycStatus?: string;
  lastLogin?: string | null;
  last_login?: string | null;
  verificationToken?: string | null;
  verification_token?: string | null;
}

const GuestInfo = () => {
  const [userInfo, setUserInfo] = useState<User>({} as User);
  const [userLoading, setUserLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const params = useParams();
  const id = params?.id;
  console.log("params", params?.id);

  const fetchAUserInfo = useCallback(async () => {
    if (!id) return; // Ensure id exists before making the request

    setUserLoading(true);
    try {
      const response = await axiosRequest.get(
        `${API_ROUTES.admin.users.userByUuid(String(id))}`
      );
      console.log("response", response);
      setUserInfo(response?.data?.data);
      setUserLoading(false);
    } catch (error: any) {
      console.error("Error fetching user info:", error);
      toast.error(error.response?.data?.message, {
        duration: 6000,
        style: {
          maxWidth: "500px",
          width: "max-content",
        },
      });
    } finally {
      setUserLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAUserInfo();
  }, [fetchAUserInfo]);

  console.log("userInfo", userInfo);

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing
      setIsEditing(false);
      setEditedData({});
    } else {
      // Start editing
      setIsEditing(true);
      setEditedData({
        firstName: userInfo?.profile?.first_name || userInfo?.profile?.firstName || userInfo?.first_name || userInfo?.firstName || "",
        lastName: userInfo?.profile?.last_name || userInfo?.profile?.lastName || userInfo?.last_name || userInfo?.lastName || "",
        email: userInfo?.email || "",
        phone: userInfo?.phone || "",
        state: userInfo?.profile?.state || "",
        address: userInfo?.profile?.address || "",
        gender: userInfo?.profile?.gender || "",
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditedData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await axiosRequest.put(
        `${API_ROUTES.admin.users.userByUuid(String(id))}`,
        {
          email: editedData.email,
          phone: editedData.phone,
          profile: {
            first_name: editedData.firstName,
            last_name: editedData.lastName,
            state: editedData.state,
            address: editedData.address,
            gender: editedData.gender ? editedData.gender.toUpperCase() : undefined,
          },
        }
      );
      toast.success("User updated successfully", {
        duration: 4000,
      });
      setIsEditing(false);
      fetchAUserInfo(); // Refresh data
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error(error.response?.data?.message || "Failed to update user", {
        duration: 6000,
        style: {
          maxWidth: "500px",
          width: "max-content",
        },
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="p-[30px] mt-10 mb-100 border border-[#D9D9D9] rounded-[15px] bg-white shadow-md min-h-[calc(100vh-150px)]">
        <BreadCrumb
          description=""
          active="Guest info"
          link_one="/user-management/guests"
          link_one_name="Guest"
        />
        <div className="mt-0">
          <div className="flex justify-between items-center mb-[50px] mt-[10px]">
            <h3 className="font-semibold">Guest Info</h3>
          </div>
          {userLoading ? (
            <Skeleton className="h-[500px]  mt-5 bw-full rounded-md" />
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
                      role: typeof userInfo?.role === 'string' ? userInfo.role : (userInfo?.role?.value || ""),
                      bio: userInfo?.profile?.bio || "",
                      isActive: userInfo?.is_active ?? userInfo?.isActive ?? true,
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
                            isActive: formData.isActive,
                            isVerified: formData.isVerified,
                            profile: {
                              first_name: formData.firstName,
                              last_name: formData.lastName,
                              gender: formData.gender ? formData.gender.toUpperCase() : undefined,
                              bio: formData.bio,
                            },
                          }
                        );
                        toast.success("Guest profile updated successfully");
                        setIsEditing(false);
                        fetchAUserInfo();
                      } catch (error: any) {
                        toast.error(error.response?.data?.message || "Failed to update guest");
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                  />
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <div className="relative w-[48px] h-[48px] rounded-full overflow-hidden border-2 border-gray-300">
                      {userInfo?.profile?.profile_image || userInfo?.profile?.profileImage || userInfo?.profile_image || userInfo?.profileImage ? (
                        <Image
                          src={userInfo?.profile?.profile_image || userInfo?.profile?.profileImage || userInfo?.profile_image || userInfo?.profileImage || ""}
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
                    <Button
                      buttonName={
                        <>
                          <Icon icon="mdi:pencil" className="mr-2" />
                          Edit Profile
                        </>
                      }
                      onClick={handleEditToggle}
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
                          <p className="text-sm font-medium text-gray-900">{userInfo?.profile?.first_name || userInfo?.profile?.firstName || userInfo?.first_name || userInfo?.firstName || "--/--"}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Name</p>
                          <p className="text-sm font-medium text-gray-900">{userInfo?.profile?.last_name || userInfo?.profile?.lastName || userInfo?.last_name || userInfo?.lastName || "--/--"}</p>
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
                          <Badge status={userInfo?.is_active ?? userInfo?.isActive ?? false} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Verified Identity</p>
                          <Badge status={userInfo?.is_verified ?? userInfo?.isVerified ?? false} />
                        </div>
                      </div>
                    </Grid>
                  </Grid>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default GuestInfo;

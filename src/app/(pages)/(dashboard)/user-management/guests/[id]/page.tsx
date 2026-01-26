"use client";

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
          profile: {
            first_name: editedData.firstName,
            last_name: editedData.lastName,
            state: editedData.state,
            address: editedData.address,
            gender: editedData.gender,
          },
          email: editedData.email,
          phone: editedData.phone,
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
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    buttonName="Cancel"
                    onClick={handleEditToggle}
                    variant="primaryoutline"
                    disabled={isSaving}
                  />
                  <Button
                    buttonName={isSaving ? "Saving..." : "Save Changes"}
                    onClick={handleSave}
                    disabled={isSaving}
                    variant="primary"
                  />
                </>
              ) : (
                <Button
                  buttonName={
                    <>
                      <Icon icon="mdi:pencil" className="mr-2" />
                      Edit
                    </>
                  }
                  onClick={handleEditToggle}
                  variant="primary"
                />
              )}
            </div>
          </div>
          {userLoading ? (
            <Skeleton className="h-[500px]  mt-5 bw-full rounded-md" />
          ) : (
            <>
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
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                  <InputGroup
                    label="First Name"
                    required
                    disabled={!isEditing}
                    value={isEditing ? editedData.firstName : (userInfo?.profile?.first_name || userInfo?.profile?.firstName || userInfo?.first_name || userInfo?.firstName || "--/--")}
                    onChange={(e: any) => handleInputChange("firstName", e.target.value)}
                    inputType="text"
                    inputName="firstName"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                  <InputGroup
                    label="Last Name"
                    required
                    disabled={!isEditing}
                    value={isEditing ? editedData.lastName : (userInfo?.profile?.last_name || userInfo?.profile?.lastName || userInfo?.last_name || userInfo?.lastName || "--/--")}
                    onChange={(e: any) => handleInputChange("lastName", e.target.value)}
                    inputType="text"
                    inputName="lastName"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                  <InputGroup
                    label="Email Address"
                    required
                    disabled={!isEditing}
                    value={isEditing ? editedData.email : (userInfo?.email || "--/--")}
                    onChange={(e: any) => handleInputChange("email", e.target.value)}
                    inputType="email"
                    inputName="email"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                  <InputGroup
                    label="Phone Number"
                    required
                    disabled={!isEditing}
                    value={isEditing ? editedData.phone : (userInfo?.phone || "--/--")}
                    onChange={(e: any) => handleInputChange("phone", e.target.value)}
                    inputType="text"
                    inputName="phoneNumber"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                  <InputGroup
                    label="State"
                    required
                    disabled={!isEditing}
                    value={isEditing ? editedData.state : (userInfo?.profile?.state || "--/--")}
                    onChange={(e: any) => handleInputChange("state", e.target.value)}
                    inputType="text"
                    inputName="state"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                  <InputGroup
                    label="Address"
                    required
                    disabled={!isEditing}
                    value={isEditing ? editedData.address : (userInfo?.profile?.address || "--/--")}
                    onChange={(e: any) => handleInputChange("address", e.target.value)}
                    inputType="text"
                    inputName="address"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                  <InputGroup
                    label="Gender"
                    required
                    disabled={!isEditing}
                    value={isEditing ? editedData.gender : (userInfo?.profile?.gender || "--/--")}
                    onChange={(e: any) => handleInputChange("gender", e.target.value)}
                    inputType="text"
                    inputName="gender"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                      <h4>Active</h4>
                      <Badge status={userInfo?.is_active ?? userInfo?.isActive ?? false} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                      <h4>Verified</h4>
                      <Badge status={userInfo?.is_verified ?? userInfo?.isVerified ?? false} />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default GuestInfo;

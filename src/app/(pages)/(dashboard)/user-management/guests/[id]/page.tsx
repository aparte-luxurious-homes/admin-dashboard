"use client";

import BreadCrumb from "@/src/components/breadcrumb";
import Grid from "@mui/material/Grid2";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import { useEffect, useState, useCallback } from "react";
import axiosRequest from "@/src/lib/api";
import { toast } from "react-hot-toast";
import { Icon } from "@iconify/react";
// import Button from "@/src/components/button";
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
          <h3 className="mb-[50px] mt-[10px] font-semibold">
            Guest Info
          </h3>
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
                    label="Legal Name"
                    required
                    disabled
                    defaultValue={`${userInfo?.profile?.last_name || userInfo?.profile?.lastName || userInfo?.last_name || userInfo?.lastName || "--/--"} ${userInfo?.profile?.first_name || userInfo?.profile?.firstName || userInfo?.first_name || userInfo?.firstName || "--/--"
                      }`}
                    inputType="text"
                    inputName="name"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                  <InputGroup
                    label="Email Address"
                    required
                    disabled
                    defaultValue={userInfo?.email || "--/--"}
                    inputType="email"
                    inputName="email"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                  <InputGroup
                    label="Phone Number"
                    required
                    disabled
                    defaultValue={userInfo?.phone || "--/--"}
                    inputType="text"
                    inputName="phoneNumber"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                  <InputGroup
                    label="State"
                    required
                    disabled
                    defaultValue={userInfo?.profile?.state || "--/--"}
                    inputType="text"
                    inputName="verification"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                  <InputGroup
                    label="Address"
                    required
                    disabled
                    inputType="text"
                    defaultValue={userInfo?.profile?.address || "--/--"}
                    inputName="address"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                  <InputGroup
                    label="Gender"
                    required
                    disabled
                    defaultValue={userInfo?.profile?.gender || "--/--"}
                    inputType="text"
                    inputName="text"
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

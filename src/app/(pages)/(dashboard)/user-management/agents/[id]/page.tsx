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
import { TableSearch } from "@/src/components/table/tableAction";
import Table from "@/src/components/table/table";
import { Skeleton } from "@/components/ui/skeleton";
import { GridColDef } from "@mui/x-data-grid";
import Badge from "@/src/components/badge";
import Link from "next/link";
import { useParams } from "next/navigation";
import Image from "next/image";

interface Agent {
  id: number;
  email: string;
  phone: string | null;
  role: string;
  verificationToken: string | null;
}

interface Owner {
  id: number;
  email: string;
  phone: string;
  role: string;
  verificationToken: string | null;
}

interface Amenities {
  id: number;
  name: string;
}
interface Media {
  id: number;
  media_file: string;
  is_featured: boolean;
}

interface Property {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  description: string;
  isPetAllowed: boolean;
  isVerified: boolean;
  latitude: number | null;
  longitude: number | null;
  propertyType: string;
  assignedAgent: number;
  agent: Agent;
  owner: Owner;
  ownerId: number;
  media: Media[];
  amenities: Amenities[];
  createdAt: string;
}

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

interface AgentTierState {
  agent_id: string;
  current_tier: "BRONZE" | "SILVER" | "GOLD";
  commission_listing_pct: number;
  commission_referral_pct: number;
  points_30d: number;
  streak_count: number;
  consecutive_misses: number;
  grace_period_until: string | null;
  is_inactive: boolean;
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

const TIER_CONFIG = {
  BRONZE: { label: "Bronze", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", icon: "solar:medal-ribbons-star-bold-duotone" },
  SILVER: { label: "Silver", color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200", icon: "solar:medal-ribbons-star-bold-duotone" },
  GOLD: { label: "Gold", color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200", icon: "solar:medal-ribbons-star-bold-duotone" },
} as const;

const AgentInfo = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [searchResult, setSearchResult] = useState<Property[]>([]);
  const [userInfo, setUserInfo] = useState<User>({} as User);
  const [tierState, setTierState] = useState<AgentTierState | null>(null);
  const [tierLoading, setTierLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(false);
  const [searchValue, setSearchValue] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [tierEditData, setTierEditData] = useState({
    current_tier: "BRONZE" as "BRONZE" | "SILVER" | "GOLD",
    commission_listing_pct: 0,
    commission_referral_pct: 0,
    streak_count: 0,
    consecutive_misses: 0,
    is_inactive: false,
  });
  const params = useParams();
  const id = params?.id;
  console.log("params", params?.id);

  const fetchAUserInfo = useCallback(async () => {
    if (!id) return;

    setUserLoading(true);
    try {
      const response = await axiosRequest.get(
        `${API_ROUTES.admin.users.userByUuid(String(id))}`
      );
      console.log("response", response);
      setUserInfo(response?.data?.data);
      setUserLoading(false);
    } catch (error: any) {
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

  const fetchTierState = useCallback(async () => {
    if (!id) return;

    setTierLoading(true);
    try {
      const response = await axiosRequest.get(
        `${API_ROUTES.network.agents.tier(String(id))}`
      );
      const data = response?.data?.data;
      if (data) {
        setTierState(data);
      }
    } catch {
      // Network feature may not be available yet; keep defaults
    } finally {
      setTierLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTierState();
  }, [fetchTierState]);

  const fetchProperties = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    try {
      const response = await axiosRequest.get(
        `${API_ROUTES.propertyManagement.properties.base}`
      );
      console.log("response prop", response);

      const filteredProperties = response?.data?.data?.data.filter(
        (agent: Property) => agent?.assignedAgent === Number(id)
      );

      setProperties(filteredProperties);
      setSearchResult(filteredProperties);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  console.log("properties", properties);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  // --| Filter Property table using name, state and and all
  const handleSearchProperty = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setSearchValue(value);

    const valArray = value.split(" ");
    // --| Filter data by partial match onchange in the search input box
    const result = properties?.filter((data) =>
      valArray?.every(
        (word: string) =>
          data?.name?.toLowerCase().includes(word.toLowerCase()) ||
          data?.propertyType?.toLowerCase().includes(word.toLowerCase()) ||
          data?.propertyType?.toLowerCase().includes(word.toLowerCase()) ||
          data?.agent?.email?.toLowerCase().includes(word.toLowerCase())
      )
    );
    setSearchResult(result);
  };

  const propertyColumns: GridColDef[] = [
    // { field: "id", headerName: "ID", width: 70 },
    { field: "name", headerName: "Property Name", width: 200 },
    {
      field: "location",
      headerName: "Location",
      width: 200,
      renderCell: (params) => {
        const { city, state } = params.row;
        return `${city || "--/--"}, ${state || "--/--"}`;
      },
    },
    { field: "propertyType", headerName: "Type", width: 150 },
    {
      field: "owner",
      headerName: "Owner's Name",
      width: 150,
      renderCell: (params) => `${params.row?.owner?.name || "--/--"}`
    },
    {
      field: "isVerified",
      headerName: "Verification Status",
      width: 150,
      renderCell: (params) => <Badge status={params.value} />,
    },
    {
      field: "meta",
      headerName: "Rating",
      width: 70,
      renderCell: (params) => {
        return params.value?.average_rating ?? "--/--";
      },
    },
    {
      field: "unitsCount",
      headerName: "Units",
      width: 50,
      renderCell: (params) => {
        return params.row.units?.length ?? 0;
      },
    },
    {
      field: "actions",
      headerName: "",
      width: 50,
      sortable: false,
      align: "center",
      renderCell: (params) => (
        <Link href={`/user-management/agents/${params.row.id}`}>
          <Icon icon="mdi:eye" className="cursor-pointer text-[#514A4A] mt-4" />
        </Link>
      ),
    },
  ];

  const handleEditToggle = () => {
    if (isEditing) {
      setIsEditing(false);
      setEditedData({});
    } else {
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
      if (tierState) {
        setTierEditData({
          current_tier: tierState.current_tier,
          commission_listing_pct: parseFloat((tierState.commission_listing_pct * 100).toFixed(1)),
          commission_referral_pct: parseFloat((tierState.commission_referral_pct * 100).toFixed(1)),
          streak_count: tierState.streak_count,
          consecutive_misses: tierState.consecutive_misses,
          is_inactive: tierState.is_inactive,
        });
      }
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
      fetchAUserInfo();
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
          active="Agent info"
          link_one="/user-management/agents"
          link_one_name="All Agents"
        />
        <div className="mt-0">
          <div className="flex justify-between items-center mb-[50px] mt-[10px]">
            <h3 className="font-semibold">Agent Info</h3>
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
                        if (tierState) {
                          await axiosRequest.patch(
                            `${API_ROUTES.network.agents.tier(String(id))}`,
                            {
                              ...tierEditData,
                              commission_listing_pct: parseFloat((tierEditData.commission_listing_pct / 100).toFixed(4)),
                              commission_referral_pct: parseFloat((tierEditData.commission_referral_pct / 100).toFixed(4)),
                            }
                          );
                        }
                        toast.success("Agent profile updated successfully");
                        setIsEditing(false);
                        fetchAUserInfo();
                        fetchTierState();
                      } catch (error: any) {
                        toast.error(error.response?.data?.message || "Failed to update agent");
                      } finally {
                        setIsSaving(false);
                      }
                    }}
                    extraSection={tierState ? (
                      <div className="bg-white rounded-2xl p-4 border border-gray-100">
                        <div className="flex items-center gap-2 mb-6">
                          <div className="h-4 w-1 bg-primary rounded-full"></div>
                          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Network Info</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Current Tier</label>
                            <select
                              value={tierEditData.current_tier}
                              onChange={(e) => setTierEditData((prev) => ({ ...prev, current_tier: e.target.value as "BRONZE" | "SILVER" | "GOLD" }))}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-gray-50/50 transition-all"
                            >
                              <option value="BRONZE">Bronze</option>
                              <option value="SILVER">Silver</option>
                              <option value="GOLD">Gold</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Activity State</label>
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">{tierEditData.is_inactive ? "Inactive" : "Active"}</span>
                              <button
                                type="button"
                                onClick={() => setTierEditData((prev) => ({ ...prev, is_inactive: !prev.is_inactive }))}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${tierEditData.is_inactive ? "bg-red-400" : "bg-primary"}`}
                              >
                                <span className={`${tierEditData.is_inactive ? "translate-x-6" : "translate-x-1"} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                              </button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Listing Commission (%)</label>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={0.1}
                              placeholder="e.g. 19.0"
                              value={tierEditData.commission_listing_pct}
                              onChange={(e) => setTierEditData((prev) => ({ ...prev, commission_listing_pct: parseFloat(parseFloat(e.target.value || "0").toFixed(1)) }))}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-gray-50/50 transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Referral Commission (%)</label>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={0.1}
                              placeholder="e.g. 19.0"
                              value={tierEditData.commission_referral_pct}
                              onChange={(e) => setTierEditData((prev) => ({ ...prev, commission_referral_pct: parseFloat(parseFloat(e.target.value || "0").toFixed(1)) }))}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-gray-50/50 transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Streak Count</label>
                            <input
                              type="number"
                              min={0}
                              value={tierEditData.streak_count}
                              onChange={(e) => setTierEditData((prev) => ({ ...prev, streak_count: parseInt(e.target.value) || 0 }))}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-gray-50/50 transition-all"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Consecutive Misses</label>
                            <input
                              type="number"
                              min={0}
                              value={tierEditData.consecutive_misses}
                              onChange={(e) => setTierEditData((prev) => ({ ...prev, consecutive_misses: parseInt(e.target.value) || 0 }))}
                              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-gray-50/50 transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    ) : undefined}
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

                    {/* Network Info Section */}
                    <Grid size={{ xs: 12 }}>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <Icon icon="solar:chart-bold-duotone" width="20" />
                        </div>
                        <h4 className="text-lg font-bold text-gray-800">Network Info</h4>
                      </div>
                      {tierLoading ? (
                        <Skeleton className="h-[200px] w-full rounded-2xl" />
                      ) : (() => {
                        const tier = tierState?.current_tier ?? "BRONZE";
                        const tierCfg = TIER_CONFIG[tier];
                        const listingPct = tierState?.commission_listing_pct != null
                          ? `${(tierState.commission_listing_pct * 100).toFixed(1)}%`
                          : "--/--";
                        const referralPct = tierState?.commission_referral_pct != null
                          ? `${(tierState.commission_referral_pct * 100).toFixed(1)}%`
                          : "--/--";
                        const gracePeriod = tierState?.grace_period_until
                          ? new Date(tierState.grace_period_until).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                          : null;
                        return (
                          <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Tier</p>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${tierCfg.bg} ${tierCfg.color} ${tierCfg.border}`}>
                                  <Icon icon={tierCfg.icon} width="16" />
                                  {tierCfg.label}
                                </span>
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Activity State</p>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${tierState?.is_inactive ? "bg-red-50 text-red-600 border-red-200" : "bg-green-50 text-green-600 border-green-200"}`}>
                                  <Icon icon={tierState?.is_inactive ? "solar:close-circle-bold-duotone" : "solar:check-circle-bold-duotone"} width="16" />
                                  {tierState?.is_inactive ? "Inactive" : "Active"}
                                </span>
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Points (Last 30 Days)</p>
                                <p className="text-sm font-medium text-gray-900">{(tierState?.points_30d ?? 0).toLocaleString()} pts</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Streak</p>
                                <p className="text-sm font-medium text-gray-900">{tierState?.streak_count ?? 0} period{tierState?.streak_count !== 1 ? "s" : ""}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Listing Commission</p>
                                <p className="text-sm font-medium text-gray-900">{listingPct}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Referral Commission</p>
                                <p className="text-sm font-medium text-gray-900">{referralPct}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Consecutive Misses</p>
                                <p className={`text-sm font-medium ${(tierState?.consecutive_misses ?? 0) > 0 ? "text-red-600" : "text-gray-900"}`}>
                                  {tierState?.consecutive_misses ?? 0}
                                </p>
                              </div>
                              {tier === "BRONZE" && gracePeriod && (
                                <div className="space-y-1">
                                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Grace Period Until</p>
                                  <p className="text-sm font-medium text-amber-700">{gracePeriod}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
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

export default AgentInfo;

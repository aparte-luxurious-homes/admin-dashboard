"use client"

import Table from "../../../components/table/table";
import { useEffect, useCallback } from "react";
import { useAuth } from "@/src/hooks/useAuth";
import { useState } from "react";
import axiosRequest from "@/src/lib/api";
import { TableSearch } from "../../../components/table/tableAction";
import Badge from "../../../components/badge";
import { Icon } from "@iconify/react";
// import allProperty from "../../../dummydata/allProperty.json";
import topAgents from "../../../dummydata/topAgents.json";
import { GridColDef } from "@mui/x-data-grid";
import Grid from "@mui/material/Grid2";
import UsersChart from "@/src/components/userchart/userchart";
import StatsCard from "@/src/components/statcard/statcard";
import LineChart from "@/src/components/linecharts/linecharts";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link";
import { formatDate } from "@/src/lib/utils";
import ItemCount from "@/src/components/item-count/itemcount";

interface Agent {
  id: number;
  email: string;
  phone: string | null;
  role: string;
  verificationToken: string | null;
}

interface OwnerProfile {
  firstName: string;
  lastName: string | null;
  userId: number;
}
interface Owner {
  email: string;
  id: number;
  profile: OwnerProfile;
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
interface Agent {
  id: number;
  name: string;
}

interface TopListing {
  propertyId: number;
  agent: Agent;
  totalVerifiedProperties: number;
}

interface StatsData {
  totalPayments: TotalStats;
  totalRevenue: TotalStats;
  totalProperties: TotalPropertiesStats;
  users: MonthlyUserStats[];
  properties: MonthlyPropertyStats[];
  topListings: TopListing[];
}

interface TotalStats {
  lastMonthAmount: number;
  percentageChange: string;
}

interface TotalPropertiesStats {
  lastMonthTotal: number;
  percentageChange: string;
}

interface MonthlyUserStats {
  month: string;
  totalUsers: number;
}

interface MonthlyPropertyStats {
  month: string;
  totalProperties: number;
  totalVerified: number;
  totalUnverified: number;
}

interface AgentNetworkSummary {
  current_tier: "BRONZE" | "SILVER" | "GOLD";
  commission_listing_pct: number;
  commission_referral_pct: number;
  points_30d: number;
  streak_count: number;
  consecutive_misses: number;
  grace_period_until: string | null;
  is_inactive: boolean;
}

interface AgentZoneSummary {
  id?: string;
  role?: string;
  status?: string;
  override_rate?: number;
  monthly_gbv_threshold?: number;
  employment_mode?: "COMMISSION_ONLY" | "SALARIED_OVERLAY";
  start_date?: string | null;
  end_date?: string | null;
  current_month_gbv?: number;
  threshold_progress_pct?: number;
  projected_payout?: number;
  zone?: {
    name?: string;
    type?: string;
    status?: string;
  };
}

const TIER_CONFIG = {
  BRONZE: { label: "Bronze", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", icon: "solar:medal-ribbons-star-bold-duotone", activeBg: "bg-amber-700", activeColor: "text-white", activeBorder: "border-amber-700" },
  SILVER: { label: "Silver", color: "text-slate-600", bg: "bg-slate-50",  border: "border-slate-200", icon: "solar:medal-ribbons-star-bold-duotone", activeBg: "bg-slate-600", activeColor: "text-white", activeBorder: "border-slate-600" },
  GOLD:   { label: "Gold",   color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200", icon: "solar:medal-ribbons-star-bold-duotone", activeBg: "bg-yellow-500", activeColor: "text-white", activeBorder: "border-yellow-500" },
} as const;

interface NetworkEvent {
  id: string;
  action_type: string;
  base_points: number;
  multiplier_applied: number;
  points_awarded: number;
  adjustment_direction: "ADDITION" | "DEDUCTION";
  status: "PENDING" | "CONFIRMED" | "REVERSED" | "REJECTED";
  created_at: string;
}

interface MentorshipRecord {
  id: string;
  status: string;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string }> = {
  CONFIRMED: { bg: "bg-green-100",  text: "text-green-800"  },
  PENDING:   { bg: "bg-yellow-100", text: "text-yellow-800" },
  REVERSED:  { bg: "bg-orange-100", text: "text-orange-800" },
  REJECTED:  { bg: "bg-red-100",    text: "text-red-800"    },
};

const ACTION_ICONS: Record<string, string> = {
  LISTING_CREATED: "solar:home-add-bold-duotone",
  LISTING_VERIFIED: "solar:verified-check-bold-duotone",
  BOOKING_CHECKED_IN: "solar:calendar-mark-bold-duotone",
  REFERRED_BOOKING_CHECKED_IN: "solar:users-group-rounded-bold-duotone",
  KYC_COMPLETED: "solar:shield-check-bold-duotone",
  PROFILE_COMPLETED: "solar:user-bold-duotone",
};

const Home = () => {
  const [searchResult, setSearchResult] = useState<Property[]>([]);
  // const allAgents = topAgents;
  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState<StatsData>({} as StatsData);
  const [loading, setLoading] = useState(false);
  const [isStatLoading, setIsStatLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [statError, setStatError] = useState<string>("");
  const [searchValue, setSearchValue] = useState<string>("");
  const [range, setRange] = useState<string>("year");
  const { user, isFetching } = useAuth();

  const [networkSummary, setNetworkSummary] = useState<AgentNetworkSummary | null>(null);
  const [networkLoading, setNetworkLoading] = useState(false);
  const [zoneSummary, setZoneSummary]       = useState<AgentZoneSummary | null>(null);
  const [activityHistory, setActivityHistory] = useState<NetworkEvent[]>([]);
  const [mentorshipData, setMentorshipData]   = useState<MentorshipRecord[]>([]);
  const [walletData, setWalletData]           = useState<Record<string, any> | null>(null);
  const [agentDataLoading, setAgentDataLoading] = useState(false);

  const fetchNetworkSummary = useCallback(async () => {
    setNetworkLoading(true);
    try {
      const [meRes, zoneRes] = await Promise.allSettled([
        axiosRequest.get(API_ROUTES.network.me),
        axiosRequest.get(API_ROUTES.network.myZoneAssignments),
      ]);
      if (meRes.status === "fulfilled") setNetworkSummary(meRes.value?.data?.data ?? null);
      if (zoneRes.status === "fulfilled") {
        const body = zoneRes.value?.data?.data;
        const assignments: AgentZoneSummary[] = body?.data ?? (Array.isArray(body) ? body : []);
        const active = assignments.find((a) => a.status === "ACTIVE") ?? assignments[0] ?? null;
        setZoneSummary(active);
      }
    } catch {
      // fail silently
    } finally {
      setNetworkLoading(false);
    }
  }, []);

  const fetchAgentData = useCallback(async () => {
    setAgentDataLoading(true);
    try {
      const [historyRes, mentorshipRes, walletRes] = await Promise.allSettled([
        axiosRequest.get(API_ROUTES.network.history, { params: { size: 10 } }),
        axiosRequest.get(API_ROUTES.network.myMentorship),
        axiosRequest.get(API_ROUTES.wallet.base),
      ]);
      if (historyRes.status === "fulfilled") {
        const body = historyRes.value?.data?.data ?? historyRes.value?.data;
        setActivityHistory(body?.items ?? []);
      }
      if (mentorshipRes.status === "fulfilled") {
        const body = mentorshipRes.value?.data?.data;
        setMentorshipData(body?.data ?? (Array.isArray(body) ? body : []));
      }
      if (walletRes.status === "fulfilled") {
        const d = walletRes.value?.data?.data;
        setWalletData(Array.isArray(d) ? (d[0] ?? null) : d);
      }
    } catch {
      // fail silently
    } finally {
      setAgentDataLoading(false);
    }
  }, []);

  console.log(isFetching ? "Fetching User" : user);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosRequest.get(`${API_ROUTES.propertyManagement.properties.base}`);
      // The backend already filters properties based on the user's role
      const DataByRole = response?.data?.data?.data || [];
      setProperties(DataByRole);
      setSearchResult(DataByRole);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStatistics = useCallback(async () => {
    setIsStatLoading(true);
    try {
      const response = await axiosRequest.get(`${API_ROUTES.statistic.base}`);
      setStats(response?.data?.data);
    } catch (err) {
      if (err instanceof Error) {
        setStatError(err.message);
      } else {
        setStatError("An unknown error occurred");
      }
    } finally {
      setIsStatLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
    fetchStatistics();
    if (user?.role === "AGENT") {
      fetchNetworkSummary();
      fetchAgentData();
    }
  }, [fetchProperties, fetchStatistics, fetchNetworkSummary, fetchAgentData, user?.role]);

  console.log("stats", stats);
  console.log(error)
  console.log(statError)
  console.log("properties", properties);

  const dataByRange = {
    year: stats?.users?.map((item) => ({
      label: item?.month.slice(0, 3),
      thisYear: item?.totalUsers,
      lastYear: 0,
    })),
  };

  const adminColumns: GridColDef[] = [
    // { field: "id", headerName: "ID", width: 70 },
    { field: "name", headerName: "Property Name", width: 180 },
    // { field: "address", headerName: "Address", width: 250 },
    // { field: "city", headerName: "City", width: 120 },
    // { field: "state", headerName: "State", width: 120 },
    // { field: "country", headerName: "Country", width: 120 },
    {
      field: "location",
      headerName: "Location",
      width: 150,
      renderCell: (params) => {
        const { city, state } = params.row;
        return `${city || "--/--"}, ${state || "--/--"}`;
      },
    },
    { field: "propertyType", headerName: "Type", width: 110 },
    {
      field: "isVerified",
      headerName: "Verification Status",
      width: 120,
      renderCell: (params) => <Badge status={params.value} />,
    },
    // { field: "isPetAllowed", headerName: "Pets Allowed", width: 120, type: "boolean" },
    {
      field: "agent",
      headerName: "Agent Name",
      width: 150,
      renderCell: (params) => `${params.row?.agent?.name || "--/--"}`
    },
    {
      field: "owner",
      headerName: "Owner's Name",
      width: 150,
      renderCell: (params) => `${params.row?.owner?.profile?.lastName || ""} ${params.row?.owner?.profile?.firstName}`
    },
    {
      field: "meta",
      headerName: "Rating",
      width: 100,
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
        <Link href={`/property-management/all-properties/${params.row.id}`}>
          <Icon icon="mdi:eye" className="cursor-pointer text-[#514A4A] mt-4" />
        </Link>
      ),
    },
  ];
  const propertyColumns: GridColDef[] = [
    // { field: "id", headerName: "ID", width: 70 },
    { field: "name", headerName: "Property Name", width: 200 },
    // { field: "address", headerName: "Address", width: 250 },
    // { field: "city", headerName: "City", width: 120 },
    // { field: "state", headerName: "State", width: 120 },
    // { field: "country", headerName: "Country", width: 120 },
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
      field: "isVerified",
      headerName: "Verification Status",
      width: 150,
      renderCell: (params) => <Badge status={params.value} />,
    },
    // { field: "isPetAllowed", headerName: "Pets Allowed", width: 120, type: "boolean" },
    {
      field: "agent",
      headerName: "Agent Name",
      width: 180,
      renderCell: (params) => `${params.row?.agent?.name || "--/--"}`
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
        <Link href={`/property-management/all-properties/${params.row.id}`}>
          <Icon icon="mdi:eye" className="cursor-pointer text-[#514A4A] mt-4" />
        </Link>
      ),
    },
  ];
  const anAgentColumns: GridColDef[] = [
    { field: "name", headerName: "Property Name", width: 300 },
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
      renderCell: (params) => `${params.row?.owner?.profile?.lastName || ""} ${params.row?.owner?.profile?.firstName}`
    },
    {
      field: "meta",
      headerName: "Rating",
      width: 90,
      renderCell: (params) => {
        return params.value?.average_rating ?? "--/--";
      },
    },
    {
      field: "unitsCount",
      headerName: "Units",
      width: 90,
      renderCell: (params) => {
        return params.row.units?.length ?? 0;
      },
    },
    {
      field: "isVerified",
      headerName: "Verification Status",
      width: 100,
      renderCell: (params) => {
        return <Badge status={params.value} />;
      },
    },
    {
      field: "actions",
      headerName: "",
      width: 50,
      sortable: false,
      align: "center",
      renderCell: (params) => (
        <Link href={`/property-management/all-properties/${params.row.id}`}>
          <Icon icon="mdi:eye" className="cursor-pointer text-[#514A4A] mt-4" />
        </Link>
      ),
    },
  ];

  const topAgentColumns: GridColDef[] = [
    {
      field: "agent",
      headerName: "Agent Name",
      width: 110,
      renderCell: (params) => params?.row?.agent?.name || "--/--",
    },
    {
      field: "totalVerifiedProperties",
      headerName: "Verified Listing",
      width: 120,
      renderCell: (params) => params?.row?.totalVerifiedProperties || "--/--",
    }
  ];

  const handleSearchProperty = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setSearchValue(value);

    const valArray = value.toLowerCase().split(" ");

    // --| Filter properties based on search input
    const result = properties?.filter((data) => {
      const matchesAnyKeyword = valArray.some((word) => {
        if (word === "verified") {
          return data?.isVerified === true;
        }

        return (
          data?.name?.toLowerCase().includes(word.toLowerCase()) ||
          data?.owner?.profile?.lastName?.toLowerCase().includes(word.toLowerCase()) ||
          data?.owner?.email?.toLowerCase().includes(word.toLowerCase()) ||
          data?.owner?.profile?.firstName?.toLowerCase().includes(word.toLowerCase()) ||
          data?.state?.toLowerCase().includes(word.toLowerCase()) ||
          data?.propertyType?.toLowerCase().includes(word.toLowerCase()) ||
          data?.agent?.email?.toLowerCase().includes(word.toLowerCase())
        );
      });

      return matchesAnyKeyword;
    });

    setSearchResult(result);
  };

  // --| Filter Property table using name, state and and all
  // const handleSearchProperty = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const { value } = e.target;
  //   setSearchValue(value);

  //   const valArray = value.split(" ");
  //   // --| Filter data by partial match onchange in the search input box
  //   const result = properties?.filter((data) => 
  //     valArray?.every((word: string) => 
  //       data?.name?.toLowerCase().includes(word.toLowerCase()) ||
  //       data?.owner?.profile?.lastName?.toLowerCase().includes(word.toLowerCase()) ||
  //       data?.owner?.email?.toLowerCase().includes(word.toLowerCase()) ||
  //       data?.owner?.profile?.firstName?.toLowerCase().includes(word.toLowerCase()) ||
  //       data?.state?.toLowerCase().includes(word.toLowerCase()) ||
  //       data?.propertyType?.toLowerCase().includes(word.toLowerCase()) ||
  //       data?.agent?.email?.toLowerCase().includes(word.toLowerCase())
  //     )
  //   );
  //   setSearchResult(result);
  // };
  const labels = stats?.properties?.map((item) => item?.month.slice(0, 3),) || [];

  const datasets = [
    {
      label: "Verified",
      data: stats?.properties?.map((item) => item?.totalVerified) || [],
      borderColor: "#007080",
    },
    {
      label: "Unverified",
      data: stats?.properties?.map((item) => item?.totalUnverified) || [],
      borderColor: "#D22B2B",
    },
  ];

  return (
    <div className="full py-6">
      <div className="mb-6">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 12, md: 12, lg: user?.role === "OWNER" || user?.role === "ADMIN" || user?.role === "AGENT" ? 9 : 12, }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                <StatsCard
                  title="Total Revenue"
                  amount={`₦${(stats?.totalRevenue?.lastMonthAmount || 0).toLocaleString()}`}
                  percentage={stats?.totalRevenue?.percentageChange || 0}
                  isIncrease={parseFloat(stats?.totalRevenue?.percentageChange) > 0}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                <StatsCard
                  title="Total Payments Processed"
                  amount={`₦${stats?.totalPayments?.lastMonthAmount?.toLocaleString() || "0"}`}
                  percentage={stats?.totalPayments?.percentageChange || 0}
                  isIncrease={parseFloat(stats?.totalPayments?.percentageChange) > 0}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                <StatsCard
                  title="Total Property Listed"
                  amount={`${stats?.totalProperties?.lastMonthTotal?.toLocaleString() || "0"}`}
                  percentage={stats?.totalProperties?.percentageChange || 0}
                  isIncrease={parseFloat(stats?.totalProperties?.percentageChange) > 0}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6 }}>
                <div className={`p-[20px] min-h-[270px] h-full border border-[#D9D9D9] rounded-[15px] bg-white shadow-md ${stats?.properties?.length === 0 && "flex items-center justify-center"}`}>
                  {user?.role === "AGENT" ? (
                    networkLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : networkSummary ? (() => {
                      const tier = networkSummary.current_tier;
                      const tierCfg = TIER_CONFIG[tier];
                      const listingPct = `${(networkSummary.commission_listing_pct * 100).toFixed(1)}%`;
                      const referralPct = `${(networkSummary.commission_referral_pct * 100).toFixed(1)}%`;
                      const points30d = networkSummary.points_30d;
                      const tierTarget = tier === "BRONZE" ? 80 : 200;
                      const nextTierLabel = tier === "BRONZE" ? "Silver" : tier === "SILVER" ? "Gold" : null;
                      const progressPct = Math.min(100, (points30d / tierTarget) * 100);
                      const today = new Date();
                      const daysUntilMonday = today.getDay() === 1 ? 7 : (8 - today.getDay()) % 7;
                      const gracePeriod = networkSummary.grace_period_until
                        ? new Date(networkSummary.grace_period_until).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                        : null;
                      return (
                        <div className="h-full flex flex-col justify-between">
                          <div className="flex items-center justify-between">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border ${tierCfg.bg} ${tierCfg.color} ${tierCfg.border}`}>
                              <Icon icon={tierCfg.icon} width="16" />
                              {tierCfg.label} Agent
                            </span>
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${networkSummary.is_inactive ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                              <Icon icon={networkSummary.is_inactive ? "solar:close-circle-bold-duotone" : "solar:check-circle-bold-duotone"} width="12" />
                              {networkSummary.is_inactive ? "Inactive" : "Active"}
                            </span>
                          </div>
                          <div className="flex gap-3">
                            <div className="flex-1 bg-gray-50 rounded-xl p-2.5 text-center">
                              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Listing Comm.</p>
                              <p className="text-base font-bold text-gray-900">{listingPct}</p>
                            </div>
                            <div className="flex-1 bg-gray-50 rounded-xl p-2.5 text-center">
                              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Referral Comm.</p>
                              <p className="text-base font-bold text-gray-900">{referralPct}</p>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <p className="text-xs text-gray-500 font-medium">{points30d.toLocaleString()} / {tierTarget} pts</p>
                              {nextTierLabel ? (
                                <p className="text-xs font-semibold text-primary">{Math.max(0, tierTarget - points30d)} pts to {nextTierLabel}</p>
                              ) : (
                                <p className="text-xs font-semibold text-yellow-600">Maintaining Gold</p>
                              )}
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                              <div
                                className={`h-2.5 rounded-full transition-all ${tier === "GOLD" ? "bg-yellow-400" : "bg-primary"}`}
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Icon icon="solar:clock-circle-bold-duotone" width="14" className="text-gray-400" />
                              <p className="text-xs text-gray-500">Eval in <span className="font-semibold text-gray-700">{daysUntilMonday} day{daysUntilMonday !== 1 ? "s" : ""}</span></p>
                            </div>
                            <div className="flex items-center gap-2">
                              {tier === "BRONZE" && gracePeriod && (
                                <p className="text-xs text-amber-700 font-medium">Grace: {gracePeriod}</p>
                              )}
                              {(networkSummary.consecutive_misses ?? 0) > 0 && (
                                <p className="text-xs text-red-500 font-semibold">{networkSummary.consecutive_misses} miss{networkSummary.consecutive_misses !== 1 ? "es" : ""}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })() : (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <Icon icon="solar:chart-bold-duotone" width="32" className="text-gray-300 mb-2" />
                        <p className="text-sm text-gray-400">No network data</p>
                      </div>
                    )
                  ) : isStatLoading ? (
                    <Skeleton className="h-[200px] w-full rounded-md" />
                  ) : (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") ? (
                    stats?.properties?.length > 0 ? (
                      <div>
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-1 mb-1">
                          <div className="flex gap-4 items-center">
                            <h4>Users</h4>
                            <div className="flex gap-1 items-center">
                              <div className="flex items-center gap-2">
                                <p className="text-[12px]">This Year</p>
                                <div className="w-3 h-1 bg-[#028090]"></div>
                              </div>
                              <div className="flex items-center gap-2">
                                <p className="text-[12px]">Last Year</p>
                                <div className="w-3 h-1 bg-[#D9D9D9]"></div>
                              </div>
                            </div>
                          </div>
                          <select className="border border-[#D9D9D9] p-1 rounded-[6px] max-[400px]:mb-4" onChange={(e) => setRange(e.target.value)} value={range}>
                            <option value="30days">Last 30 Days</option>
                            <option value="90days">Last 90 Days</option>
                            <option value="year">This Year</option>
                          </select>
                        </div>

                        <UsersChart range={range} data={dataByRange} />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 mt-20">
                        <Icon icon="hugeicons:album-not-found-01" width="40" height="40" className="text-gray-400" />
                        <p className="text-gray-500 text-sm font-medium">No Data Found</p>
                      </div>
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <Icon icon="mdi:lock" width="40" height="40" className="text-gray-300 mb-2" />
                      <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Reserved for Administrators</p>
                    </div>
                  )}
                </div>
              </Grid>
              <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6 }}>
                <div className="p-[20px] min-h-[270px] h-full border border-[#D9D9D9] rounded-[15px] bg-white shadow-md">
                  {user?.role === "AGENT" ? (
                    networkLoading ? (
                      <Skeleton className="h-[200px] w-full rounded-md" />
                    ) : (() => {
                      const tier = networkSummary?.current_tier ?? "BRONZE";
                      const points30d = networkSummary?.points_30d ?? 0;
                      const streakCount = networkSummary?.streak_count ?? 0;
                      const walletCredit = points30d * 10;
                      const zoneRole = zoneSummary?.role;
                      const zoneRoleLabel = zoneRole === "AREA_MANAGER" ? "Area Manager" : zoneRole === "REGIONAL_LEAD" ? "Regional Lead" : null;
                      return (
                        <div className="flex flex-col justify-between h-full gap-3">
                          <div className="flex items-center gap-2">
                            <Icon icon="solar:wallet-bold-duotone" width="20" className="text-primary" />
                            <h4 className="text-sm font-bold text-gray-800">Points & Earnings</h4>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-primary/5 rounded-xl p-3">
                              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Points (30d)</p>
                              <p className="text-2xl font-bold text-primary">{points30d.toLocaleString()}</p>
                              <p className="text-[10px] text-gray-400">pts earned</p>
                            </div>
                            <div className="bg-amber-50 rounded-xl p-3">
                              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Streak</p>
                              <p className="text-2xl font-bold text-amber-600">{streakCount}</p>
                              <p className="text-[10px] text-gray-400">period{streakCount !== 1 ? "s" : ""}</p>
                            </div>
                          </div>
                          {zoneRoleLabel && zoneSummary && (
                            <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Icon icon="solar:map-point-bold-duotone" width="14" className="text-blue-600" />
                                  <p className="text-xs font-semibold text-blue-800">{zoneRoleLabel}</p>
                                  {zoneSummary.zone?.name && <p className="text-[10px] text-blue-500 truncate max-w-[80px]">{zoneSummary.zone.name}</p>}
                                </div>
                                {zoneSummary.status && (
                                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${zoneSummary.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                                    {zoneSummary.status}
                                  </span>
                                )}
                              </div>
                              {typeof zoneSummary.threshold_progress_pct === "number" && (
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <p className="text-[10px] text-blue-600">GBV threshold progress</p>
                                    <p className="text-[10px] font-semibold text-blue-800">{zoneSummary.threshold_progress_pct.toFixed(0)}%</p>
                                  </div>
                                  <div className="w-full bg-blue-100 rounded-full h-1.5">
                                    <div
                                      className={`h-1.5 rounded-full transition-all ${zoneSummary.threshold_progress_pct >= 100 ? "bg-green-500" : "bg-blue-500"}`}
                                      style={{ width: `${Math.min(zoneSummary.threshold_progress_pct, 100)}%` }}
                                    />
                                  </div>
                                </div>
                              )}
                              {typeof zoneSummary.projected_payout === "number" && (
                                <div className="flex items-center justify-between">
                                  <p className="text-[10px] text-blue-600">Projected payout</p>
                                  <p className="text-xs font-semibold text-emerald-700">₦{zoneSummary.projected_payout.toLocaleString()}</p>
                                </div>
                              )}
                            </div>
                          )}
                          {walletData && typeof walletData.balance === "number" && (
                            <div className="flex items-center justify-between px-1">
                              <p className="text-xs text-gray-500">Wallet Balance</p>
                              <p className="text-sm font-bold text-emerald-700">₦{walletData.balance.toLocaleString()}</p>
                            </div>
                          )}
                          <div className="bg-emerald-50 rounded-xl p-3 flex items-center justify-between">
                            <p className="text-xs text-gray-600 font-medium">{points30d.toLocaleString()} pts · ₦{walletCredit.toLocaleString()} credited</p>
                            <p className="text-[10px] text-gray-400">1pt = ₦10</p>
                          </div>
                        </div>
                      );
                    })()
                  ) : isStatLoading ? (
                    <Skeleton className="h-[200px] w-full rounded-md" />
                  ) : stats?.users?.length > 0 ? (
                    <div>
                      <div className="flex justify-between items-center gap-1 mb-1">
                        <h4>Properties</h4>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            <p className="text-[12px]">Verified</p>
                            <div className="w-3 h-1 bg-[#028090]"></div>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-[12px]">Unverified</p>
                            <div className="w-3 h-1 bg-[#FF0000]"></div>
                          </div>
                        </div>
                      </div>
                      <LineChart labels={labels} datasets={datasets} />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 mt-20">
                      <Icon icon="hugeicons:album-not-found-01" width="40" height="40" className="text-gray-400" />
                      <p className="text-gray-500 text-sm font-medium">No Data Found</p>
                    </div>
                  )}
                </div>
              </Grid>
            </Grid>
          </Grid>
          {user?.role === "OWNER" || user?.role === "ADMIN" ? (
            <Grid size={{ xs: 12, sm: 12, md: 12, lg: 3 }} sx={{ display: "flex", flexDirection: "column" }}>
              <div className="flex-1 p-[30px] border border-[#D9D9D9] rounded-[15px] bg-white shadow-md">
                <h3>Top Performing Agents</h3>
                <Table columns={topAgentColumns} rows={stats?.topListings} getRowId={(row) => row.agent?.id} pagination={false} />
              </div>
            </Grid>
          ) : user?.role === "AGENT" ? (
            <Grid size={{ xs: 12, sm: 12, md: 12, lg: 3 }} sx={{ display: "flex", flexDirection: "column" }}>
              <div className="flex-1 p-[24px] border border-[#D9D9D9] rounded-[15px] bg-white shadow-md overflow-y-auto">
                <div className="flex flex-col justify-between h-full">

                {/* Mentorship */}
                <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Icon icon="solar:users-group-two-rounded-bold-duotone" width="16" />
                  </div>
                  <h3 className="font-semibold text-gray-800 text-sm">Mentorship</h3>
                </div>
                {networkLoading ? (
                  <div className="space-y-2 mb-5">
                    {[...Array(2)].map((_, i) => (
                      <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : (() => {
                  const tier = networkSummary?.current_tier ?? "BRONZE";
                  const activeMentees = mentorshipData.filter((m) => m.status === "ACTIVE").length;
                  const pausedMentees = mentorshipData.filter((m) => m.status === "PAUSED").length;
                  const totalMentees = mentorshipData.length;
                  const isEligible = tier === "GOLD" || tier === "SILVER";
                  return (
                    <div className={`rounded-xl p-3 mb-5 border ${tier === "GOLD" ? "bg-yellow-50 border-yellow-100" : tier === "SILVER" ? "bg-slate-50 border-slate-200" : "bg-gray-50 border-gray-100"}`}>
                      {isEligible ? (
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-bold ${tier === "GOLD" ? "text-yellow-800" : "text-slate-700"}`}>
                              {activeMentees} active mentee{activeMentees !== 1 ? "s" : ""}
                            </p>
                            {tier === "GOLD" && (
                              <span className="text-[10px] font-semibold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">0.5% override</span>
                            )}
                          </div>
                          <p className={`text-[10px] ${tier === "GOLD" ? "text-yellow-600" : "text-slate-500"}`}>
                            {tier === "GOLD"
                              ? "Earn 0.5% of each active mentee's booking · paid by platform"
                              : "Reach Gold to earn 0.5% override on mentees' bookings"}
                          </p>
                          {totalMentees > 0 && (
                            <div className={`flex items-center gap-4 pt-2 border-t ${tier === "GOLD" ? "border-yellow-100" : "border-slate-200"}`}>
                              <div className="text-center">
                                <p className={`text-sm font-bold ${tier === "GOLD" ? "text-yellow-700" : "text-slate-600"}`}>{activeMentees}</p>
                                <p className="text-[10px] text-gray-400">Active</p>
                              </div>
                              {pausedMentees > 0 && (
                                <div className="text-center">
                                  <p className="text-sm font-bold text-gray-500">{pausedMentees}</p>
                                  <p className="text-[10px] text-gray-400">Paused</p>
                                </div>
                              )}
                              <div className="text-center">
                                <p className={`text-sm font-bold ${tier === "GOLD" ? "text-yellow-700" : "text-slate-600"}`}>{totalMentees}</p>
                                <p className="text-[10px] text-gray-400">Total</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-center py-2">
                          <Icon icon="solar:lock-bold-duotone" width="24" className="text-gray-300 mb-1.5" />
                          <p className="text-xs text-gray-500 font-medium">Available from Silver tier</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Mentor junior agents · earn overrides at Gold</p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                </div>{/* end Mentorship group */}

                {/* Tier Benefits */}
                <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Icon icon="solar:medal-ribbons-star-bold-duotone" width="16" />
                  </div>
                  <h3 className="font-semibold text-gray-800 text-sm">Tier Benefits</h3>
                </div>
                <div className="space-y-2">
                  {(["BRONZE", "SILVER", "GOLD"] as const).map((t) => {
                    const cfg = TIER_CONFIG[t];
                    const isCurrentTier = t === networkSummary?.current_tier;
                    const commissions = t === "BRONZE" ? "2.0% / 1.5%" : t === "SILVER" ? "2.6% / 1.8%" : "3.0% / 2.0%";
                    const multiplier = t === "BRONZE" ? "1×" : t === "SILVER" ? "1.25×" : "1.5×";
                    return (
                      <div key={t} className={`flex items-center justify-between p-2.5 rounded-xl border ${isCurrentTier ? `${cfg.activeBg} ${cfg.activeBorder}` : "bg-gray-50 border-gray-100"}`}>
                        <div className="flex items-center gap-2">
                          <Icon icon={cfg.icon} width="14" className={isCurrentTier ? cfg.activeColor : "text-gray-400"} />
                          <div>
                            <p className={`text-xs font-semibold ${isCurrentTier ? cfg.activeColor : "text-gray-500"}`}>{cfg.label}</p>
                            <p className={`text-[10px] ${isCurrentTier ? "text-white/75" : "text-gray-400"}`}>{commissions}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isCurrentTier ? "bg-white/20 text-white" : "bg-gray-100 text-gray-400"}`}>
                          {multiplier}
                        </span>
                      </div>
                    );
                  })}
                </div>
                </div>{/* end Tier Benefits group */}
                </div>{/* end justify-between wrapper */}

              </div>
            </Grid>
          ) : null}
        </Grid>
      </div>
      <div className="p-[30px] mb-100 border border-[#D9D9D9] rounded-[15px] bg-white shadow-md">
        {user?.role === "AGENT" ? (
          <>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Icon icon="solar:history-bold-duotone" width="14" />
              </div>
              <h4 className="text-sm font-semibold text-gray-800">Recent Activity</h4>
            </div>
            {agentDataLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : activityHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                      <th className="px-4 py-3 text-left">Action</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Points</th>
                      <th className="px-4 py-3 text-left">Adjustment</th>
                      <th className="px-4 py-3 text-left">Created At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {[...activityHistory]
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .slice(0, 3)
                      .map((event) => {
                        const statusCfg = STATUS_CONFIG[event.status] ?? { bg: "bg-gray-100", text: "text-gray-800" };
                        return (
                          <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {event.action_type.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}>
                                {event.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold">
                              <span className={event.points_awarded >= 0 ? "text-green-600" : "text-red-600"}>
                                {event.points_awarded >= 0 ? "+" : ""}{event.points_awarded}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${event.adjustment_direction === "DEDUCTION" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                                {event.adjustment_direction === "DEDUCTION" ? "Deduction" : "Addition"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {formatDate(event.created_at)}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                  <Icon icon="hugeicons:album-not-found-01" width="24" height="24" className="text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">No recent activity</p>
              </div>
            )}
          </>
        ) : loading ? (
          <Skeleton className="h-[300px] w-full rounded-md" />
        ) : (
          <>
            <div className="flex items-center gap-4">
              <TableSearch
                placeholder="Search here..."
                searchTableFunc={handleSearchProperty}
                value={searchValue}
              />
              <ItemCount count={searchResult?.length} />
            </div>
            {searchResult?.length > 0 ? (
              <Table
                columns={user?.role === "OWNER" ? propertyColumns : adminColumns}
                rows={searchResult}
                getRowId={(row) => row?.id}
                pagination={false}
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2">
                <Icon icon="hugeicons:album-not-found-01" width="40" height="40" className="text-gray-400" />
                <p className="text-gray-500 text-sm font-medium">No Data Found</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Home;

"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import Grid from "@mui/material/Grid2";
import { Skeleton } from "@/src/components/ui/skeleton";

import { useAuth } from "@/src/hooks/useAuth";
import { usePermissions } from "@/src/hooks/usePermissions";
import axiosRequest from "@/src/lib/api";
import { API_ROUTES } from "@/src/lib/routes/endpoints";

import UsersChart from "@/src/components/userchart/userchart";
import LineChart from "@/src/components/linecharts/linecharts";
import GatewayBalancesCard from "@/src/components/finance-mgt/GatewayBalancesCard";
import { GetGatewayBalances } from "@/src/lib/request-handlers/integrationsMgt";

import DashboardKpiRow from "@/src/components/dashboard/DashboardKpiRow";
import AdminQueuesCard from "@/src/components/dashboard/AdminQueuesCard";
import UpcomingCheckInsCard from "@/src/components/dashboard/UpcomingCheckInsCard";
import AgentReferralCard from "@/src/components/dashboard/AgentReferralCard";
import AgentVerificationQueueCard from "@/src/components/dashboard/AgentVerificationQueueCard";
import TopAgentsCard from "@/src/components/dashboard/TopAgentsCard";
import AgentNetworkDashboardCard from "@/src/components/dashboard/AgentNetworkDashboardCard";
import { useNetworkEnabled } from "@/src/lib/request-handlers/platformMgt";

interface Wallet {
    id: string;
    balance: string | number;
    currency: string;
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

interface TopListing {
    propertyId?: string | number | null;
    agent: { id: string | number; name: string };
    totalVerifiedProperties?: number;
    listingsThisWeek?: number | null;
    verifiedThisWeek?: number | null;
    listingsMtd?: number | null;
    isActiveAgent?: boolean | null;
    verificationRatePct?: string | null;
    bookingsThisWeek?: number | null;
    points30d?: number | null;
    weeklyVerifications?: number;
    weeklyListings?: number;
}

interface StatsData {
    totalRevenue: { lastMonthAmount: number; percentageChange: string };
    totalPayments: { lastMonthAmount: number; percentageChange: string };
    totalProperties: { lastMonthTotal: number; percentageChange: string };
    users: MonthlyUserStats[];
    properties: MonthlyPropertyStats[];
    topListings: TopListing[];
}

interface MentorshipRecord {
    id: string;
    mentor_id: string;
    mentee_id: string;
    status: string;
    started_at: string | null;
    mentor?: { first_name?: string; last_name?: string; email?: string; profile?: { first_name?: string; last_name?: string } };
    mentee?: { first_name?: string; last_name?: string; email?: string; profile?: { first_name?: string; last_name?: string } };
    mentor_tier?: string;
    mentee_tier?: string;
}

const MENTORSHIP_STATUS_CONFIG: Record<string, { bg: string; text: string }> = {
    ACTIVE:  { bg: "bg-green-100",  text: "text-green-800"  },
    PENDING: { bg: "bg-yellow-100", text: "text-yellow-800" },
    PAUSED:  { bg: "bg-orange-100", text: "text-orange-800" },
    ENDED:   { bg: "bg-gray-100",   text: "text-gray-600"   },
};

const TIER_COLORS: Record<string, string> = {
    BRONZE: "text-amber-700",
    SILVER: "text-slate-600",
    GOLD:   "text-yellow-600",
};

const DashboardHome = () => {
    const { user } = useAuth();
    const { isAdmin, isAgent, isOwner } = usePermissions();
    const { networkEnabled } = useNetworkEnabled();

    const [stats, setStats] = useState<Partial<StatsData>>({});
    const [isStatLoading, setIsStatLoading] = useState(false);
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [range, setRange] = useState<string>("year");

    const [mentorshipData, setMentorshipData] = useState<MentorshipRecord[]>([]);
    const [mentorshipLoading, setMentorshipLoading] = useState(false);

    const { data: gatewayData, isLoading: gatewayLoading } = GetGatewayBalances();
    const balances = gatewayData?.data?.data || {};

    const fetchStatistics = useCallback(async () => {
        setIsStatLoading(true);
        try {
            const response = await axiosRequest.get(API_ROUTES.statistic.base);
            setStats(response?.data?.data || {});
        } catch {
            setStats({});
        } finally {
            setIsStatLoading(false);
        }
    }, []);

    const fetchWallet = useCallback(async () => {
        if (!isOwner && !isAgent) return;
        try {
            const response = await axiosRequest.get(API_ROUTES.wallet.base);
            const wallets = response?.data?.data?.items || [];
            const ngnWallet = wallets.find((w: Wallet) => w.currency === "NGN") || wallets[0];
            setWallet(ngnWallet || null);
        } catch {
            // best-effort
        }
    }, [isOwner, isAgent]);

    const fetchMentorship = useCallback(async () => {
        // /network/* answers 503 with the feature off; skip rather than toast.
        if (!isAgent || !networkEnabled) return;
        setMentorshipLoading(true);
        try {
            const response = await axiosRequest.get(API_ROUTES.network.myMentorship);
            const body = response?.data?.data ?? response?.data;
            const items = body?.items ?? body?.data ?? (Array.isArray(body) ? body : []);
            setMentorshipData(items);
        } catch {
            // best-effort
        } finally {
            setMentorshipLoading(false);
        }
    }, [isAgent, networkEnabled]);

    useEffect(() => {
        fetchStatistics();
        fetchWallet();
        fetchMentorship();
    }, [fetchStatistics, fetchWallet, fetchMentorship]);

    const usersChartData = {
        year: (stats?.users ?? []).map((item) => ({
            label: item?.month?.slice(0, 3) ?? "",
            thisYear: item?.totalUsers ?? 0,
            lastYear: 0,
        })),
    };

    const propertyChartLabels = stats?.properties?.map((item) => item?.month?.slice(0, 3) ?? "") || [];
    const propertyChartDatasets = [
        {
            label: "Verified",
            data: stats?.properties?.map((item) => item?.totalVerified ?? 0) || [],
            borderColor: "#007080",
        },
        {
            label: "Unverified",
            data: stats?.properties?.map((item) => item?.totalUnverified ?? 0) || [],
            borderColor: "#D22B2B",
        },
    ];

    const showSidebar = isAdmin || isOwner;

    const currentMentorship =
        mentorshipData.find((m) => m.status === "ACTIVE") ??
        mentorshipData.find((m) => m.status === "PENDING") ??
        null;

    return (
        <div className="p-6 space-y-6">
            {/* Greeting */}
            <div className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">
                        Welcome back{user?.profile?.firstName ? `, ${user.profile.firstName}` : ""}
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {isAdmin
                            ? "Platform overview and triage queues."
                            : isOwner
                                ? "Your properties, bookings, and earnings at a glance."
                                : isAgent
                                    ? "Your assigned properties, verifications, and referrals."
                                    : ""}
                    </p>
                </div>
            </div>

            {/* KPI row */}
            <DashboardKpiRow
                isOwner={isOwner}
                isAgent={isAgent}
                wallet={wallet}
                totalRevenue={stats?.totalRevenue}
                totalPayments={stats?.totalPayments}
                totalProperties={stats?.totalProperties}
            />

            <Grid container spacing={2}>
                {/* Main column */}
                <Grid size={{ xs: 12, lg: showSidebar ? 9 : 12 }}>
                    <div className="space-y-4">

                        {/* ADMIN: queues → gateway → charts */}
                        {isAdmin && (
                            <>
                                <AdminQueuesCard />
                                <GatewayBalancesCard
                                    paystack={balances.paystack || { isAvailable: false, error: "No data" }}
                                    monnify={balances.monnify || { isAvailable: false, error: "No data" }}
                                    isLoading={gatewayLoading}
                                />
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <div className="p-5 h-[270px] border border-gray-200 rounded-2xl bg-white shadow-sm">
                                            {isStatLoading ? (
                                                <Skeleton className="h-[200px] w-full rounded-md" />
                                            ) : stats?.users?.length ? (
                                                <div>
                                                    <div className="flex justify-between items-center gap-1 mb-1">
                                                        <h4 className="text-sm font-semibold text-gray-800">Users</h4>
                                                        <select
                                                            className="border border-gray-200 px-2 py-1 rounded-md text-xs"
                                                            onChange={(e) => setRange(e.target.value)}
                                                            value={range}
                                                        >
                                                            <option value="30days">Last 30 Days</option>
                                                            <option value="90days">Last 90 Days</option>
                                                            <option value="year">This Year</option>
                                                        </select>
                                                    </div>
                                                    <UsersChart range={range} data={usersChartData} />
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                                                    <Icon icon="hugeicons:album-not-found-01" width={32} height={32} />
                                                    <p className="text-xs font-medium">No user data yet</p>
                                                </div>
                                            )}
                                        </div>
                                    </Grid>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <div className="p-5 h-[270px] border border-gray-200 rounded-2xl bg-white shadow-sm">
                                            {isStatLoading ? (
                                                <Skeleton className="h-[200px] w-full rounded-md" />
                                            ) : stats?.properties?.length ? (
                                                <div>
                                                    <div className="flex justify-between items-center gap-1 mb-1">
                                                        <h4 className="text-sm font-semibold text-gray-800">Properties</h4>
                                                        <div className="flex items-center gap-3 text-[11px] text-gray-500">
                                                            <span className="flex items-center gap-1">
                                                                <span className="w-3 h-1 bg-[#028090] inline-block" />
                                                                Verified
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <span className="w-3 h-1 bg-[#FF0000] inline-block" />
                                                                Unverified
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <LineChart labels={propertyChartLabels} datasets={propertyChartDatasets} />
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
                                                    <Icon icon="hugeicons:album-not-found-01" width={32} height={32} />
                                                    <p className="text-xs font-medium">No property data yet</p>
                                                </div>
                                            )}
                                        </div>
                                    </Grid>
                                </Grid>
                            </>
                        )}

                        {/* OWNER: upcoming check-ins */}
                        {isOwner && (
                            <UpcomingCheckInsCard />
                        )}

                        {/* AGENT: network card → referral + verification + mentorship → upcoming */}
                        {isAgent && (
                            <Grid container spacing={2}>
                                {networkEnabled && (
                                    <Grid size={{ xs: 12 }}>
                                        <AgentNetworkDashboardCard />
                                    </Grid>
                                )}
                                <Grid size={{ xs: 12, md: networkEnabled ? 4 : 6 }}>
                                    <AgentReferralCard />
                                </Grid>
                                <Grid size={{ xs: 12, md: networkEnabled ? 4 : 6 }}>
                                    <AgentVerificationQueueCard />
                                </Grid>
                                {networkEnabled && (
                                    <Grid size={{ xs: 12, md: 4 }}>
                                        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5 h-full">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                    <Icon icon="solar:users-group-rounded-bold-duotone" width="16" />
                                                </div>
                                                <h3 className="font-semibold text-gray-800 text-sm">Current Mentorship</h3>
                                            </div>
                                            {mentorshipLoading ? (
                                                <div className="h-16 bg-gray-100 rounded-xl animate-pulse" />
                                            ) : currentMentorship ? (() => {
                                                const isMentor = currentMentorship.mentor_id === String(user?.id);
                                                const partner = isMentor ? currentMentorship.mentee : currentMentorship.mentor;
                                                const partnerTier = isMentor ? currentMentorship.mentee_tier : currentMentorship.mentor_tier;
                                                const roleLabel = isMentor ? "Your Mentee" : "Your Mentor";
                                                const partnerName =
                                                    [partner?.first_name || partner?.profile?.first_name, partner?.last_name || partner?.profile?.last_name]
                                                        .filter(Boolean).join(" ") || partner?.email || "—";
                                                const sc = MENTORSHIP_STATUS_CONFIG[currentMentorship.status] ?? MENTORSHIP_STATUS_CONFIG.ENDED;
                                                return (
                                                    <div className="bg-gray-50 rounded-xl p-3 space-y-2.5">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{roleLabel}</p>
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${sc.bg} ${sc.text}`}>
                                                                {currentMentorship.status}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                                <Icon icon="gg:profile" width="16" className="text-primary" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-semibold text-gray-900 truncate">{partnerName}</p>
                                                                {partner?.email && <p className="text-[10px] text-gray-400 truncate">{partner.email}</p>}
                                                                {partnerTier && (
                                                                    <p className={`text-[10px] font-semibold ${TIER_COLORS[partnerTier] ?? "text-gray-500"}`}>
                                                                        {partnerTier.charAt(0) + partnerTier.slice(1).toLowerCase()}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {currentMentorship.started_at && (
                                                            <p className="text-[10px] text-gray-400">
                                                                Since {new Date(currentMentorship.started_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                                            </p>
                                                        )}
                                                    </div>
                                                );
                                            })() : (
                                                <div className="flex flex-col items-center justify-center py-5 text-center">
                                                    <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center mb-2">
                                                        <Icon icon="solar:users-group-rounded-bold-duotone" width="20" className="text-primary/40" />
                                                    </div>
                                                    <p className="text-xs text-gray-400">No active mentorship</p>
                                                </div>
                                            )}
                                        </div>
                                    </Grid>
                                )}
                                <Grid size={{ xs: 12 }}>
                                    <UpcomingCheckInsCard />
                                </Grid>
                            </Grid>
                        )}
                    </div>
                </Grid>

                {/* Sidebar — admin (weekly metrics) and owner only */}
                {showSidebar && (
                    <Grid size={{ xs: 12, lg: 3 }}>
                        <TopAgentsCard
                            isLoading={isStatLoading}
                            topListings={stats?.topListings}
                            showWeeklyMetrics={isAdmin}
                            showPoints={networkEnabled}
                        />
                    </Grid>
                )}
            </Grid>
        </div>
    );
};

export default DashboardHome;

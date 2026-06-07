"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import Grid from "@mui/material/Grid2";
import { Skeleton } from "@/components/ui/skeleton";

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
    propertyId: string | number | null;
    agent: { id: string | number; name: string };
    totalVerifiedProperties: number;
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

const DashboardHome = () => {
    const { user } = useAuth();
    const { isAdmin, isAgent, isOwner } = usePermissions();

    const [stats, setStats] = useState<Partial<StatsData>>({});
    const [isStatLoading, setIsStatLoading] = useState(false);
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [range, setRange] = useState<string>("year");

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
            // Wallet fetch is best-effort; the rest of the dashboard still renders.
        }
    }, [isOwner, isAgent]);

    useEffect(() => {
        fetchStatistics();
        fetchWallet();
    }, [fetchStatistics, fetchWallet]);

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

    // Sidebar shows Top Agents for admins (with weekly metrics) and owners
    // (simpler — just the agents managing their properties). Hidden for agents.
    const showSidebar = isAdmin || isOwner;

    return (
        <div className="p-6 space-y-6">
            {/* Greeting + role chip */}
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

            {/* KPI row — always visible, 4 cards for owner/agent (incl. wallet), 3 for admin */}
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
                        {/* ADMIN main column: Queues → Gateway → Charts */}
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

                        {/* OWNER main column: upcoming check-ins (priority) */}
                        {isOwner && (
                            <UpcomingCheckInsCard />
                        )}

                        {/* AGENT main column: network card → referral + verification → upcoming */}
                        {isAgent && (
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12 }}>
                                    <AgentNetworkDashboardCard />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <AgentReferralCard />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <AgentVerificationQueueCard />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <UpcomingCheckInsCard />
                                </Grid>
                            </Grid>
                        )}
                    </div>
                </Grid>

                {/* Sidebar — admin (with weekly metrics) and owner (simpler) only */}
                {showSidebar && (
                    <Grid size={{ xs: 12, lg: 3 }}>
                        <TopAgentsCard
                            isLoading={isStatLoading}
                            topListings={stats?.topListings}
                            showWeeklyMetrics={isAdmin}
                        />
                    </Grid>
                )}
            </Grid>
        </div>
    );
};

export default DashboardHome;

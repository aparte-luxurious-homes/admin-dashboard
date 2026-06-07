"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import Grid from "@mui/material/Grid2";
import { Skeleton } from "@/components/ui/skeleton";
import axiosRequest from "@/src/lib/api";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import { formatDate } from "@/src/lib/utils";

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

const TIER_CONFIG = {
    BRONZE: { label: "Bronze", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", icon: "solar:medal-ribbons-star-bold-duotone", activeBg: "bg-amber-700", activeColor: "text-white", activeBorder: "border-amber-700" },
    SILVER: { label: "Silver", color: "text-slate-600", bg: "bg-slate-50",  border: "border-slate-200", icon: "solar:medal-ribbons-star-bold-duotone", activeBg: "bg-slate-600", activeColor: "text-white", activeBorder: "border-slate-600" },
    GOLD:   { label: "Gold",   color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200", icon: "solar:medal-ribbons-star-bold-duotone", activeBg: "bg-yellow-500", activeColor: "text-white", activeBorder: "border-yellow-500" },
} as const;

const STATUS_CONFIG: Record<string, { bg: string; text: string }> = {
    CONFIRMED: { bg: "bg-green-100",  text: "text-green-800"  },
    PENDING:   { bg: "bg-yellow-100", text: "text-yellow-800" },
    REVERSED:  { bg: "bg-orange-100", text: "text-orange-800" },
    REJECTED:  { bg: "bg-red-100",    text: "text-red-800"    },
};

export default function AgentNetworkDashboardCard() {
    const [networkSummary, setNetworkSummary] = useState<AgentNetworkSummary | null>(null);
    const [networkLoading, setNetworkLoading] = useState(false);
    const [activityHistory, setActivityHistory] = useState<NetworkEvent[]>([]);
    const [walletData, setWalletData] = useState<Record<string, unknown> | null>(null);
    const [agentDataLoading, setAgentDataLoading] = useState(false);

    const fetchNetworkSummary = useCallback(async () => {
        setNetworkLoading(true);
        try {
            const [meRes] = await Promise.allSettled([
                axiosRequest.get(API_ROUTES.network.me),
            ]);
            if (meRes.status === "fulfilled") setNetworkSummary(meRes.value?.data?.data ?? null);
        } catch {
            // fail silently
        } finally {
            setNetworkLoading(false);
        }
    }, []);

    const fetchAgentData = useCallback(async () => {
        setAgentDataLoading(true);
        try {
            const [historyRes, walletListRes] = await Promise.allSettled([
                axiosRequest.get(API_ROUTES.network.history, { params: { size: 10 } }),
                axiosRequest.get(API_ROUTES.wallet.base),
            ]);
            if (historyRes.status === "fulfilled") {
                const body = historyRes.value?.data?.data ?? historyRes.value?.data;
                setActivityHistory(body?.items ?? []);
            }
            if (walletListRes.status === "fulfilled") {
                const raw = walletListRes.value?.data?.data;
                const firstWallet = raw?.items?.[0] ?? (Array.isArray(raw) ? raw[0] : raw) ?? null;
                const walletId: string | undefined = firstWallet?.id;
                if (walletId) {
                    try {
                        const detailRes = await axiosRequest.get(API_ROUTES.wallet.details(walletId));
                        setWalletData(detailRes?.data?.data ?? firstWallet);
                    } catch {
                        setWalletData(firstWallet);
                    }
                } else {
                    setWalletData(firstWallet);
                }
            }
        } catch {
            // fail silently
        } finally {
            setAgentDataLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNetworkSummary();
        fetchAgentData();
    }, [fetchNetworkSummary, fetchAgentData]);

    return (
        <Grid container spacing={2} sx={{ alignItems: "stretch" }}>
            {/* Main column */}
            <Grid size={{ xs: 12, lg: 9 }}>
                <div className="space-y-3">
                    {/* Top row: Tier card + Points & Earnings */}
                    <Grid container spacing={2}>
                        {/* Section 1: Tier card */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <div className="p-[20px] min-h-[270px] h-full border border-[#D9D9D9] rounded-[15px] bg-white shadow-md">
                                {networkLoading ? (
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
                                )}
                            </div>
                        </Grid>

                        {/* Section 2: Points & Earnings */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <div className="p-[20px] min-h-[270px] h-full border border-[#D9D9D9] rounded-[15px] bg-white shadow-md">
                                {networkLoading ? (
                                    <Skeleton className="h-[200px] w-full rounded-md" />
                                ) : (() => {
                                    const points30d = networkSummary?.points_30d ?? 0;
                                    const streakCount = networkSummary?.streak_count ?? 0;
                                    const walletCredit = points30d * 10;
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
                                            <div className="bg-emerald-50 rounded-xl p-3 flex items-center justify-between">
                                                <p className="text-xs text-gray-600 font-medium">{points30d.toLocaleString()} pts · ₦{walletCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} credited</p>
                                                <p className="text-[10px] text-gray-400">1pt = ₦10</p>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </Grid>
                    </Grid>

                    {/* Section 4: Recent Activity */}
                    <div className="p-[30px] border border-[#D9D9D9] rounded-[15px] bg-white shadow-md">
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
                                                        <td className="px-4 py-3 text-sm text-gray-700">{formatDate(event.created_at)}</td>
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
                    </div>
                </div>
            </Grid>

            {/* Section 3: Sidebar — Tier Benefits + Wallet */}
            <Grid size={{ xs: 12, lg: 3 }} sx={{ display: "flex", flexDirection: "column" }}>
                <div className="flex-1 p-[24px] border border-[#D9D9D9] rounded-[15px] bg-white shadow-md flex flex-col">
                    {/* Tier Benefits */}
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

                    {/* Wallet Balance */}
                    <div className="mt-auto pt-5 border-t border-gray-100">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                                <Icon icon="solar:wallet-bold-duotone" width="16" className="text-emerald-600" />
                            </div>
                            <h3 className="font-semibold text-gray-800 text-sm">Wallet</h3>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 space-y-3">
                            <div>
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Available Balance</p>
                                {agentDataLoading ? (
                                    <div className="h-7 w-32 bg-emerald-100 rounded animate-pulse" />
                                ) : (
                                    <p className="text-2xl font-bold text-emerald-700">
                                        ₦{Number(walletData?.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                )}
                            </div>
                            <div className="border-t border-emerald-100 pt-3">
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">Pending Cash</p>
                                {agentDataLoading ? (
                                    <div className="h-4 w-20 bg-emerald-100 rounded animate-pulse" />
                                ) : (
                                    <p className="text-sm font-semibold text-amber-600">
                                        ₦{Number(walletData?.pending_cash ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </Grid>
        </Grid>
    );
}

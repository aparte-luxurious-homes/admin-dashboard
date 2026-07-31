"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import axiosRequest from "@/src/lib/api";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import { Skeleton } from "@/components/ui/skeleton";

interface AgentNetworkSummary {
    current_tier: string;
    points_30d: number;
    commission_listing_pct: number;
    commission_referral_pct: number;
    is_inactive: boolean;
    grace_period_until?: string | null;
    consecutive_misses?: number | null;
}

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
    BRONZE: { label: "Bronze", color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-300",  icon: "solar:medal-ribbons-star-bold-duotone" },
    SILVER: { label: "Silver", color: "text-slate-600",  bg: "bg-slate-100", border: "border-slate-300",  icon: "solar:medal-ribbons-star-bold-duotone" },
    GOLD:   { label: "Gold",   color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-300", icon: "solar:medal-ribbons-star-bold-duotone" },
};

// TIER_TARGET / progress-toward-next-tier feed the promotion/demotion progress bar,
// which is meaningless until the Phase 3 weekly tier-evaluation cron actually moves
// agents between tiers. Re-enable alongside that work (PRD §17, Phase 3).
// const TIER_TARGET: Record<string, number> = { BRONZE: 80, SILVER: 200, GOLD: 200 };

export default function AgentNetworkCard({ userId }: { userId: string }) {
    const [data, setData]       = useState<AgentNetworkSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed]   = useState(false);

    useEffect(() => {
        if (!userId) return;
        setLoading(true);
        setFailed(false);
        axiosRequest.get(API_ROUTES.network.agents.tier(userId))
            .then((res) => {
                const d = res?.data?.data ?? res?.data;
                setData(d ?? null);
            })
            .catch(() => setFailed(true))
            .finally(() => setLoading(false));
    }, [userId]);

    if (loading) {
        return (
            <div className="mt-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Skeleton className="w-8 h-8 rounded-lg" />
                    <Skeleton className="h-5 w-36" />
                </div>
                <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex flex-col justify-center space-y-2">
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-6 w-28" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (failed || !data) return null;

    const tier     = data.current_tier;
    const tierCfg  = TIER_CONFIG[tier];
    const pts      = data.points_30d ?? 0;
    // const target   = TIER_TARGET[tier] ?? 80;
    // const progress = Math.min(100, (pts / target) * 100);
    // const nextTier = tier === "BRONZE" ? "Silver" : tier === "SILVER" ? "Gold" : null;
    const listPct  = `${(data.commission_listing_pct * 100).toFixed(1)}%`;
    const refPct   = `${(data.commission_referral_pct * 100).toFixed(1)}%`;

    return (
        <div className="mt-6 mb-6">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Icon icon="solar:ranking-bold-duotone" width="20" />
                </div>
                <h4 className="text-lg font-bold text-gray-800">Network Standing</h4>
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${data.is_inactive ? "bg-red-50 text-red-600 border-red-200" : "bg-green-50 text-green-600 border-green-200"}`}>
                    <Icon icon={data.is_inactive ? "solar:close-circle-bold-duotone" : "solar:check-circle-bold-duotone"} width="11" />
                    {data.is_inactive ? "Inactive" : "Active"}
                </span>
            </div>

            <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-6">
                {/* Stats grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                    {/* Tier */}
                    <div className="flex flex-col justify-center space-y-1.5">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tier</p>
                        {tierCfg ? (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border w-fit ${tierCfg.bg} ${tierCfg.color} ${tierCfg.border}`}>
                                <Icon icon={tierCfg.icon} width="13" />
                                {tierCfg.label}
                            </span>
                        ) : (
                            <span className="text-sm font-medium text-gray-900">{tier}</span>
                        )}
                    </div>

                    {/* 30-day points */}
                    <div className="flex flex-col justify-center space-y-1.5">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Points (30d)</p>
                        <p className="text-xl font-bold text-gray-900">{pts.toLocaleString()}</p>
                    </div>

                    {/* Listing commission */}
                    <div className="flex flex-col justify-center space-y-1.5">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Listing Commission</p>
                        <p className="text-xl font-bold text-primary">{listPct}</p>
                    </div>

                    {/* Referral commission */}
                    <div className="flex flex-col justify-center space-y-1.5">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Referral Commission</p>
                        <p className="text-xl font-bold text-primary">{refPct}</p>
                    </div>
                </div>

                {/*
                  Progress toward next tier — disabled until Phase 3 ships the weekly
                  tier-evaluation cron. Nothing moves agents between tiers yet, so a
                  "X pts to next tier" progress bar would be misleading. Re-enable
                  alongside promotion/demotion (PRD §17, Phase 3).

                {nextTier && (
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <p className="text-xs text-gray-500 font-medium">{pts.toLocaleString()} / {target} pts</p>
                            <p className="text-xs font-semibold text-primary">{Math.max(0, target - pts)} pts to {nextTier}</p>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full transition-all ${tier === "SILVER" ? "bg-slate-400" : "bg-primary"}`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}
                {!nextTier && tier === "GOLD" && (
                    <p className="text-xs font-semibold text-yellow-600 flex items-center gap-1">
                        <Icon icon="solar:medal-ribbons-star-bold-duotone" width="13" />
                        Maintaining Gold — top tier
                    </p>
                )}
                */}

                {/* Warnings */}
                {(data.consecutive_misses ?? 0) > 0 && (
                    <p className="mt-3 text-xs text-orange-600 font-medium flex items-center gap-1">
                        <Icon icon="mdi:alert-outline" width="13" />
                        {data.consecutive_misses} consecutive evaluation miss{(data.consecutive_misses ?? 0) > 1 ? "es" : ""}
                    </p>
                )}
                {/*
                  Grace period is a demotion-risk concept — meaningless until Phase 3's
                  tier-evaluation cron can actually demote anyone. Re-enable alongside
                  promotion/demotion (PRD §17, Phase 3).

                {data.grace_period_until && (
                    <p className="mt-1.5 text-xs text-amber-700 font-medium flex items-center gap-1">
                        <Icon icon="mdi:clock-alert-outline" width="13" />
                        Grace period until {new Date(data.grace_period_until).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                )}
                */}
            </div>
        </div>
    );
}

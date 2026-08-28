"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import axiosRequest from "@/src/lib/api";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermissions } from "@/src/hooks/usePermissions";
import { UserRole } from "@/src/lib/enums";
import { formatPoints } from "@/src/lib/utils";

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

const TIER_TARGET: Record<string, number> = { BRONZE: 80, SILVER: 200, GOLD: 200 };
const TIER_ORDER = ["BRONZE", "SILVER", "GOLD"] as const;

export default function AgentNetworkCard({ userId }: { userId: string }) {
    const { role } = usePermissions();
    // Mirrors the backend's require_admin on PATCH /admin/network/agents/{id}/tier —
    // only ADMIN/SUPER_ADMIN can override an agent's tier.
    const canEditTier = role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;

    const [data, setData]       = useState<AgentNetworkSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [failed, setFailed]   = useState(false);

    const [showEditTier, setShowEditTier] = useState(false);
    const [selectedTier, setSelectedTier] = useState<string>("BRONZE");
    const [isSavingTier, setIsSavingTier] = useState(false);

    const fetchTier = useCallback(() => {
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

    useEffect(() => { fetchTier(); }, [fetchTier]);

    const openEditTier = () => {
        setSelectedTier(data?.current_tier ?? "BRONZE");
        setShowEditTier(true);
    };

    const handleSaveTier = async () => {
        setIsSavingTier(true);
        try {
            await toast.promise(
                axiosRequest.patch(API_ROUTES.network.agents.tier(userId), { current_tier: selectedTier }),
                {
                    loading: "Updating tier...",
                    success: "Agent tier updated successfully",
                    error: (err) => err?.response?.data?.detail || err?.response?.data?.message || "Failed to update tier",
                }
            );
            setShowEditTier(false);
            fetchTier();
        } catch {
            // handled by toast.promise
        } finally {
            setIsSavingTier(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Skeleton className="w-7 h-7 rounded-lg" />
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
    const target   = TIER_TARGET[tier] ?? 80;
    const progress = Math.min(100, (pts / target) * 100);
    const nextTier = tier === "BRONZE" ? "Silver" : tier === "SILVER" ? "Gold" : null;
    const listPct  = `${(data.commission_listing_pct * 100).toFixed(1)}%`;
    const refPct   = `${(data.commission_referral_pct * 100).toFixed(1)}%`;
    const today           = new Date();
    const daysUntilMonday = today.getDay() === 1 ? 7 : (8 - today.getDay()) % 7;
    // Grace period only matters for a Bronze agent who hasn't earned any points yet
    // this window — once they have points, the weekly eval countdown is more useful.
    const showGracePeriod = tier === "BRONZE" && pts <= 0 && !!data.grace_period_until;

    return (
        <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-6 mb-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Icon icon="solar:ranking-bold-duotone" width="16" />
                    </div>
                    <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Network Standing</h4>
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${data.is_inactive ? "bg-red-50 text-red-600 border-red-200" : "bg-green-50 text-green-600 border-green-200"}`}>
                    <Icon icon={data.is_inactive ? "solar:close-circle-bold-duotone" : "solar:check-circle-bold-duotone"} width="12" />
                    {data.is_inactive ? "Inactive" : "Active"}
                </span>
            </div>

            <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-6">
                {/* Stats grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                    {/* Tier */}
                    <div className="flex flex-col justify-center space-y-1.5">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tier</p>
                        <div className="flex items-center gap-1.5">
                            {tierCfg ? (
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border w-fit ${tierCfg.bg} ${tierCfg.color} ${tierCfg.border}`}>
                                    <Icon icon={tierCfg.icon} width="13" />
                                    {tierCfg.label}
                                </span>
                            ) : (
                                <span className="text-sm font-medium text-gray-900">{tier}</span>
                            )}
                            {canEditTier && (
                                <button
                                    type="button"
                                    onClick={openEditTier}
                                    className="p-1 rounded-md text-gray-400 hover:text-primary hover:bg-primary/10 transition-colors"
                                    aria-label="Edit tier"
                                >
                                    <Icon icon="mdi:pencil" width="13" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* 30-day points */}
                    <div className="flex flex-col justify-center space-y-1.5">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Points (30d)</p>
                        <p className="text-xl font-bold text-gray-900">{formatPoints(pts)}</p>
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

                {nextTier && (
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <p className="text-xs text-gray-500 font-medium">{formatPoints(pts)} / {target} pts</p>
                            <p className="text-xs font-semibold text-primary">{formatPoints(Math.max(0, target - pts))} pts to {nextTier}</p>
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

                {/* Warnings */}
                {(data.consecutive_misses ?? 0) > 0 && (
                    <p className="mt-3 text-xs text-orange-600 font-medium flex items-center gap-1">
                        <Icon icon="mdi:alert-outline" width="13" />
                        {data.consecutive_misses} consecutive evaluation miss{(data.consecutive_misses ?? 0) > 1 ? "es" : ""}
                    </p>
                )}
                {showGracePeriod ? (
                    <p className="mt-1.5 text-xs text-amber-700 font-medium flex items-center gap-1">
                        <Icon icon="mdi:clock-alert-outline" width="13" />
                        Grace period until {new Date(data.grace_period_until as string).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                ) : (
                    <p className="mt-1.5 text-xs text-gray-500 font-medium flex items-center gap-1">
                        <Icon icon="solar:clock-circle-bold-duotone" width="13" />
                        Eval in {daysUntilMonday} day{daysUntilMonday !== 1 ? "s" : ""}
                    </p>
                )}
            </div>

            {/* Edit Tier Modal */}
            {showEditTier && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Edit Tier</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Manually override this agent's tier</p>
                            </div>
                            <button
                                onClick={() => setShowEditTier(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <Icon icon="lucide:x" width="18" className="text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-3">
                            <p className="text-xs text-gray-500">
                                Commission rates auto-sync to the new tier. This is logged and visible to the agent.
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                                {TIER_ORDER.map((t) => {
                                    const cfg = TIER_CONFIG[t];
                                    const isSelected = selectedTier === t;
                                    return (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => setSelectedTier(t)}
                                            className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border-2 transition-colors ${
                                                isSelected ? `${cfg.bg} ${cfg.border} ${cfg.color}` : "border-gray-200 text-gray-400 hover:border-gray-300"
                                            }`}
                                        >
                                            <Icon icon={cfg.icon} width="20" />
                                            <span className="text-xs font-bold">{cfg.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-gray-100">
                            <button
                                onClick={() => setShowEditTier(false)}
                                className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveTier}
                                disabled={isSavingTier || selectedTier === data.current_tier}
                                className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                            >
                                {isSavingTier ? (
                                    <>
                                        <Icon icon="mdi:loading" className="animate-spin" width="14" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Icon icon="mdi:content-save" width="14" />
                                        Save
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

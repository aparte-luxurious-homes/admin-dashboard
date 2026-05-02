"use client";

import { Icon } from "@iconify/react";
import { Skeleton } from "@/src/components/ui/skeleton";

interface TopAgent {
    propertyId?: string | number | null;
    agent: { id: string | number; name: string };
    totalVerifiedProperties: number;
    weeklyVerifications?: number;
    weeklyListings?: number;
}

interface TopAgentsCardProps {
    isLoading: boolean;
    topListings: TopAgent[] | undefined;
    /** Show weekly activity columns (admin tier). Owners see the simpler list. */
    showWeeklyMetrics: boolean;
}

const TopAgentsCard = ({ isLoading, topListings, showWeeklyMetrics }: TopAgentsCardProps) => {
    const list = topListings ?? [];

    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden h-full flex flex-col">
            <div className="px-5 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <Icon icon="solar:medal-star-bold-duotone" className="w-5 h-5 text-primary" />
                    Top Agents
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                    {showWeeklyMetrics
                        ? "Verifications + listings this week"
                        : "Agents managing your properties"}
                </p>
            </div>
            {isLoading ? (
                <div className="p-4 space-y-2">
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                </div>
            ) : list.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-10 gap-2">
                    <Icon icon="solar:user-id-line-duotone" className="w-10 h-10 text-gray-300" />
                    <p className="text-sm text-gray-500">No agents yet</p>
                </div>
            ) : (
                <ul className="divide-y divide-gray-100 overflow-y-auto">
                    {list.map((row, idx) => {
                        const initials = (row.agent?.name || "?")
                            .split(" ")
                            .map((p) => p[0])
                            .filter(Boolean)
                            .slice(0, 2)
                            .join("")
                            .toUpperCase();
                        const weekly =
                            (row.weeklyVerifications ?? 0) + (row.weeklyListings ?? 0);
                        return (
                            <li key={`${row.agent?.id}-${idx}`} className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0">
                                        {initials || "?"}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-sm font-medium text-gray-800 truncate">
                                            {row.agent?.name || "—"}
                                        </div>
                                        {showWeeklyMetrics ? (
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[11px] text-gray-500">
                                                    <span className="font-semibold text-gray-700">
                                                        {row.weeklyVerifications ?? 0}
                                                    </span>{" "}
                                                    verified
                                                </span>
                                                <span className="text-gray-200">·</span>
                                                <span className="text-[11px] text-gray-500">
                                                    <span className="font-semibold text-gray-700">
                                                        {row.weeklyListings ?? 0}
                                                    </span>{" "}
                                                    listed
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="text-[11px] text-gray-500">
                                                {row.totalVerifiedProperties} verified properties
                                            </div>
                                        )}
                                    </div>
                                    {showWeeklyMetrics && weekly > 0 && (
                                        <div className="text-[10px] font-medium uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                                            this week
                                        </div>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

export default TopAgentsCard;

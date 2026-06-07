"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";

// Loose row type — accepts both the rich admin shape (framework metrics)
// and the trimmed owner shape (just totalVerifiedProperties). The widget
// renders accordingly based on which fields are present.
interface TopAgent {
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
    // Backwards-compat aliases
    weeklyVerifications?: number;
    weeklyListings?: number;
}

interface TopAgentsCardProps {
    isLoading: boolean;
    topListings: TopAgent[] | undefined;
    /** Show framework metrics (admin tier). Owners see the simpler list. */
    showWeeklyMetrics: boolean;
}

const TopAgentsCard = ({ isLoading, topListings, showWeeklyMetrics }: TopAgentsCardProps) => {
    const list = topListings ?? [];

    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden h-full flex flex-col">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <Icon icon="solar:medal-star-bold-duotone" className="w-5 h-5 text-primary" />
                        Top Agents
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                        {showWeeklyMetrics
                            ? "Ranked by listings this week"
                            : "Agents managing your properties"}
                    </p>
                </div>
                {showWeeklyMetrics && (
                    <Link
                        href={PAGE_ROUTES.dashboard.reports.agentPerformance}
                        className="text-xs font-medium text-primary hover:underline"
                    >
                        Full report →
                    </Link>
                )}
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
                        // Prefer framework field, fall back to backcompat alias.
                        const listingsWeek = row.listingsThisWeek ?? row.weeklyListings ?? 0;
                        const verifiedWeek = row.verifiedThisWeek ?? row.weeklyVerifications ?? 0;
                        const verifPct = row.verificationRatePct
                            ? parseFloat(row.verificationRatePct)
                            : null;
                        const showFrameworkMetrics =
                            showWeeklyMetrics && row.listingsThisWeek !== undefined && row.listingsThisWeek !== null;

                        return (
                            <li key={`${row.agent?.id}-${idx}`} className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0">
                                        {initials || "?"}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <div className="text-sm font-medium text-gray-800 truncate">
                                                {row.agent?.name || "—"}
                                            </div>
                                            {showFrameworkMetrics && row.isActiveAgent && (
                                                <span
                                                    className="shrink-0 text-[9px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded"
                                                    title="Has at least one verified APARTMENT or HOTEL listing"
                                                >
                                                    Active
                                                </span>
                                            )}
                                            {showFrameworkMetrics && row.points30d != null && (
                                                <span
                                                    className="shrink-0 text-[9px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded"
                                                    title="Points earned in the last 30 days"
                                                >
                                                    {row.points30d} pts
                                                </span>
                                            )}
                                        </div>
                                        {showFrameworkMetrics ? (
                                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
                                                <span>
                                                    <span className="font-semibold text-gray-700">
                                                        {listingsWeek}
                                                    </span>{" "}
                                                    this week
                                                </span>
                                                <span className="text-gray-200">·</span>
                                                <span>
                                                    <span className="font-semibold text-gray-700">
                                                        {verifiedWeek}
                                                    </span>{" "}
                                                    verified
                                                </span>
                                                {row.bookingsThisWeek != null && (
                                                    <>
                                                        <span className="text-gray-200">·</span>
                                                        <span>
                                                            <span className="font-semibold text-gray-700">
                                                                {row.bookingsThisWeek}
                                                            </span>{" "}
                                                            bookings
                                                        </span>
                                                    </>
                                                )}
                                                {verifPct !== null && (
                                                    <>
                                                        <span className="text-gray-200">·</span>
                                                        <span
                                                            className={`text-[10px] font-medium px-1.5 rounded ${verifPct >= 70
                                                                ? "text-emerald-700 bg-emerald-50"
                                                                : verifPct >= 40
                                                                    ? "text-amber-700 bg-amber-50"
                                                                    : "text-red-700 bg-red-50"
                                                                }`}
                                                            title={`Verification rate (lifetime): ${verifPct.toFixed(2)}%`}
                                                        >
                                                            {verifPct.toFixed(0)}%
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-[11px] text-gray-500">
                                                {row.totalVerifiedProperties ?? 0} verified properties
                                            </div>
                                        )}
                                    </div>
                                    {showFrameworkMetrics && listingsWeek > 0 && (
                                        <div className="text-[10px] font-medium uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                                            +{listingsWeek}
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

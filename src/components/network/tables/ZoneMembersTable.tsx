'use client'

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react/dist/iconify.js";
import Loader from "@/src/components/loader";
import {
    GetNetworkAgents,
    GetNetworkStanding,
    networkAgentName,
    type NetworkAgentOption,
} from "@/src/lib/request-handlers/networkMgt";
import { useAuth } from "@/src/hooks/useAuth";
import { UserRole } from "@/src/lib/enums";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";

const PAGE_SIZE = 10;

const TIER_STYLE: Record<string, string> = {
    GOLD: "bg-yellow-50 text-yellow-700 border-yellow-300",
    SILVER: "bg-slate-100 text-slate-700 border-slate-300",
    BRONZE: "bg-orange-50 text-orange-700 border-orange-200",
};

const RELATION_STYLE: Record<NetworkAgentOption["relation"], string> = {
    self: "bg-primary/10 text-primary border-primary/20",
    mentee: "bg-emerald-50 text-emerald-700 border-emerald-200",
    zone: "bg-purple-50 text-purple-700 border-purple-200",
};

const RELATION_LABEL: Record<NetworkAgentOption["relation"], string> = {
    self: "You",
    mentee: "Mentee",
    zone: "Zone",
};

/**
 * The agents inside an Area Manager's / Regional Lead's zone tree.
 *
 * Source is GET /network/agents, which returns exactly the caller's
 * `VisibilityScope` — so this roster is the same set that scopes their events,
 * transactions, mentorships and properties. Nothing shown here can 403 when
 * used as an `agent_id` filter elsewhere.
 *
 * Search runs server-side and is debounced: a Regional Lead's region can hold
 * hundreds of agents, and filtering one page client-side would silently hide
 * everyone past it.
 *
 * Zone membership is derived through assigned properties — an agent is "in" a
 * zone when they hold a property stamped with one in the manager's tree. An
 * agent operating in the area with no assigned property there will not appear;
 * that is a property-attribution gap, not a bug in this table.
 */
export default function ZoneMembersTable() {
    const { user } = useAuth();
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);

    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearch(search.trim());
            setPage(1);
        }, 300);
        return () => clearTimeout(t);
    }, [search]);

    const { data: standing } = GetNetworkStanding(user?.role as UserRole | undefined);
    const isZoneManager = Boolean(standing?.isZoneManager);

    const { data, isLoading, isFetching } = GetNetworkAgents({
        search: debouncedSearch || undefined,
        includeSelf: false,
        page,
        size: PAGE_SIZE,
        enabled: isZoneManager,
    });

    const rows = data?.items ?? [];
    const total = data?.total ?? 0;
    const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

    if (standing && !isZoneManager) {
        return (
            <div className="p-6 mx-2 sm:mx-5 mt-5 border border-[#D9D9D9] rounded-[15px] bg-white shadow-md">
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Icon icon="mdi:map-marker-off-outline" width="40" className="text-gray-300 mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No zone assigned</h3>
                    <p className="text-sm text-gray-500 max-w-sm">
                        Zone members are visible to Area Managers and Regional Leads. You do not
                        currently hold an active zone assignment.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-[20px] mx-2 sm:mx-5 mt-5 border border-[#D9D9D9] rounded-[15px] bg-white shadow-md min-h-[calc(100vh-150px)]">
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Zone Members</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Agents operating inside the zone you manage — select one to view their profile
                    </p>
                </div>
                {total > 0 && (
                    <span className="px-3 py-1.5 rounded-lg bg-gray-100 text-sm font-medium text-gray-700">
                        {total} {total === 1 ? "agent" : "agents"}
                    </span>
                )}
            </div>

            <div className="mt-4 relative max-w-sm">
                <Icon
                    icon="mdi:magnify"
                    width="18"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or email…"
                    className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
            </div>

            <div className="mt-5">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader />
                    </div>
                ) : rows.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    <th className="px-6 py-3 text-left">Agent</th>
                                    <th className="px-6 py-3 text-left">Contact</th>
                                    <th className="px-6 py-3 text-left">Tier</th>
                                    <th className="px-6 py-3 text-left">Relationship</th>
                                    <th className="px-6 py-3 w-10" aria-label="Open profile" />
                                </tr>
                            </thead>
                            <tbody className={`divide-y divide-gray-200 ${isFetching ? "opacity-60" : ""}`}>
                                {rows.map((a) => {
                                    const name = networkAgentName(a);
                                    const tier = a.current_tier?.toUpperCase();
                                    return (
                                        <tr
                                            key={a.agent_id}
                                            onClick={() =>
                                                router.push(
                                                    PAGE_ROUTES.dashboard.network.zoneMembers.details(a.agent_id)
                                                )
                                            }
                                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-200 flex-shrink-0 bg-gray-100">
                                                        {a.profile_image ? (
                                                            <Image
                                                                src={a.profile_image}
                                                                alt={name}
                                                                fill
                                                                sizes="32px"
                                                                className="object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[11px] font-semibold text-gray-500">
                                                                {name.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900 truncate">
                                                        {name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-700 truncate">{a.email || "—"}</div>
                                                {a.phone && (
                                                    <div className="text-xs text-gray-400">{a.phone}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {tier ? (
                                                    <span
                                                        className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                                                            TIER_STYLE[tier] ?? "bg-gray-100 text-gray-600 border-gray-200"
                                                        }`}
                                                    >
                                                        {tier.charAt(0) + tier.slice(1).toLowerCase()}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border ${RELATION_STYLE[a.relation]}`}
                                                >
                                                    {RELATION_LABEL[a.relation]}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Icon
                                                    icon="mdi:chevron-right"
                                                    width="18"
                                                    className="text-gray-300"
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {totalPages > 1 && (
                            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                <p className="text-sm text-gray-500">
                                    Page {page} of {totalPages}
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        disabled={page <= 1}
                                        onClick={() => setPage((p) => p - 1)}
                                        className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        disabled={page >= totalPages}
                                        onClick={() => setPage((p) => p + 1)}
                                        className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <Icon icon="hugeicons:album-not-found-01" width="32" className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">
                            {debouncedSearch ? "No agents match that search" : "No agents in your zone yet"}
                        </h3>
                        <p className="text-sm text-gray-500 max-w-sm text-center">
                            {debouncedSearch
                                ? "Try a different name or email."
                                : "Agents appear here once they hold an assigned property inside your zone."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

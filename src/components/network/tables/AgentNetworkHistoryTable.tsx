'use client'

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import axiosRequest from "@/src/lib/api";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import { Icon } from "@iconify/react/dist/iconify.js";
import { formatDate, isSameId } from "@/src/lib/utils";
import TablePagination from "../../TablePagination";
import Loader from "@/src/components/loader";
import { LuX } from "react-icons/lu";
import { toast } from "react-hot-toast";
import { useAuth } from "@/src/hooks/useAuth";
import { UserRole } from "@/src/lib/enums";
import { GetNetworkStanding } from "@/src/lib/request-handlers/networkMgt";
import EventReason from "../EventReason";
import NetworkAgentFilter from "../NetworkAgentFilter";

interface NetworkEvent {
    id: string;
    agent_id: string;
    action_type: string;
    base_points: number;
    multiplier_applied: number;
    points_awarded: number;
    entity_type: string | null;
    entity_id: string | null;
    status: "PENDING" | "CONFIRMED" | "REVERSED" | "REJECTED";
    is_flagged: boolean;
    reason: string | null;
    adjustment_direction: "ADDITION" | "DEDUCTION";
    is_remitted: boolean;
    remitted_at: string | null;
    created_at: string;
    updated_at: string;
    // The event this row was derived from — for a MENTOR_POINT_OVERRIDE, the
    // mentee award the cut came out of.
    related_event_id: string | null;
    related_action_type: string | null;
    // Names whose event the row is. The backend attaches it to every row on
    // every feed — mentor, zone manager and plain agent alike — so the Agent
    // column never has to resolve an id client-side.
    agent?: {
        first_name?: string | null;
        last_name?: string | null;
        email?: string | null;
        profile_image?: string | null;
    } | null;
    // Whose event `related_event_id` points at. Supplied by the API so the
    // mentee is named without parsing the id out of `reason` or looking it up.
    related_agent?: {
        first_name?: string | null;
        last_name?: string | null;
        email?: string | null;
        profile_image?: string | null;
    } | null;
}

function personName(person?: { first_name?: string | null; last_name?: string | null; email?: string | null } | null): string {
    if (!person) return "--/--";
    const name = [person.first_name, person.last_name].filter(Boolean).join(" ");
    return name || person.email || "--/--";
}

const STATUS_CONFIG: Record<string, { bg: string; text: string }> = {
    CONFIRMED: { bg: "bg-green-100",  text: "text-green-800"  },
    PENDING:   { bg: "bg-yellow-100", text: "text-yellow-800" },
    REVERSED:  { bg: "bg-orange-100", text: "text-orange-800" },
    REJECTED:  { bg: "bg-red-100",    text: "text-red-800"    },
};

function formatActionType(type: string) {
    return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatEntityType(type: string | null) {
    if (!type) return "--/--";
    return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AgentNetworkHistoryTable() {
    const { user } = useAuth();
    const [events, setEvents]         = useState<NetworkEvent[]>([]);
    const [total, setTotal]           = useState(0);
    const [page, setPage]             = useState(1);
    const size                        = 20;
    const [isLoading, setIsLoading]   = useState(false);
    const [statusFilter, setStatusFilter] = useState("");
    const [actionFilter, setActionFilter] = useState("");
    // Mirrors the scope param on GET /network/history: "all" (self + mentees +
    // zone tree), "mine", "mentees", "zone". For an agent who mentors nobody
    // and manages no zone all four are equivalent.
    const [scope, setScope]           = useState("all");
    const [agentId, setAgentId]       = useState("");

    const [viewEvent, setViewEvent] = useState<NetworkEvent | null>(null);
    // Events the modal drilled down FROM, so following an override back to its
    // source award is reversible. A stack rather than a single parent: a source
    // award can itself be a MANUAL_ADJUSTMENT pointing further back.
    const [eventTrail, setEventTrail] = useState<NetworkEvent[]>([]);
    const [relatedLoading, setRelatedLoading] = useState(false);

    const openRelatedEvent = useCallback(async (from: NetworkEvent) => {
        if (!from.related_event_id) return;
        setRelatedLoading(true);
        try {
            const res = await axiosRequest.get(
                API_ROUTES.network.historyDetails(from.related_event_id),
            );
            const data = res?.data?.data ?? res?.data;
            if (!data) throw new Error("empty");
            setEventTrail((trail) => [...trail, from]);
            setViewEvent(data as NetworkEvent);
        } catch (error: any) {
            // A 403 here means the source award belongs to an agent outside the
            // caller's network — possible when a zone manager reads another
            // mentor's override row.
            toast.error(
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                "Could not open the source event",
            );
        } finally {
            setRelatedLoading(false);
        }
    }, []);

    const closeEventModal = useCallback(() => {
        setViewEvent(null);
        setEventTrail([]);
    }, []);

    const goBackOneEvent = useCallback(() => {
        setEventTrail((trail) => {
            const previous = trail[trail.length - 1];
            if (previous) setViewEvent(previous);
            return trail.slice(0, -1);
        });
    }, []);

    // Whether the caller sees anyone but themselves, and why. Mentors get the
    // mentee scopes, Area Managers / Regional Leads get the zone scope, and
    // both get the agent picker — for a plain agent every scope resolves to the
    // same rows, so the controls would be dead chrome.
    const { data: standing } = GetNetworkStanding(user?.role as UserRole | undefined);
    const isMentor      = Boolean(standing?.isMentor);
    const isZoneManager = Boolean(standing?.isZoneManager);
    const hasNetwork    = isMentor || isZoneManager;

    // A scope the caller has lost (mentorship ended, assignment expired) would
    // otherwise pin the feed empty with no visible cause.
    useEffect(() => {
        if (!standing) return;
        if ((scope === "mentees" && !isMentor) || (scope === "zone" && !isZoneManager)) {
            setScope("all");
            setPage(1);
        }
    }, [standing, scope, isMentor, isZoneManager]);

    const fetchEvents = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            params.set("page", String(page));
            params.set("size", String(size));
            if (statusFilter) params.set("status", statusFilter);
            if (actionFilter) params.set("action_type", actionFilter);
            // agent_id, not the legacy mentee_id alias: it accepts any agent in
            // the caller's network, and a zone manager's picker offers agents
            // they manage but do not mentor. It already narrows to one agent, so
            // scope alongside it is redundant and the endpoint ignores it.
            if (agentId) params.set("agent_id", agentId);
            else if (scope !== "all") params.set("scope", scope);

            const response = await axiosRequest.get(
                `${API_ROUTES.network.history}?${params.toString()}`
            );
            const data = response?.data?.data ?? response?.data;
            setEvents(data?.items ?? []);
            setTotal(data?.total ?? 0);
        } catch (error: any) {
            toast.error(error?.response?.data?.detail || error?.response?.data?.message || "Failed to fetch events");
        } finally {
            setIsLoading(false);
        }
    }, [page, size, statusFilter, actionFilter, scope, agentId]);

    useEffect(() => { fetchEvents(); }, [fetchEvents]);

    // Says exactly whose rows are on the page, so the "Events" heading is never
    // ambiguous about the widened default scope.
    const feedDescription = isMentor && isZoneManager
        ? "Activity events and points for you, your mentees, and every agent in your zone"
        : isZoneManager
            ? "Activity events and points for you and every agent in your zone"
            : isMentor
                ? "Your activity events and points history, alongside your mentees'"
                : "View your activity events and points history";

    return (
        <>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">

                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="mb-4">
                        <h1 className="text-xl font-semibold text-gray-900">Network Events</h1>
                        <p className="text-sm text-gray-500 mt-1">{feedDescription}</p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Status filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm min-w-[160px]"
                        >
                            <option value="">All</option>
                            <option value="PENDING">Pending</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="REVERSED">Reversed</option>
                            <option value="REJECTED">Rejected</option>
                        </select>

                        {/* Action type filter */}
                        <select
                            value={actionFilter}
                            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm min-w-[210px]"
                        >
                            <option value="">All Actions</option>
                            <option value="LISTING_CREATED">Listing Created</option>
                            <option value="LISTING_VERIFIED">Listing Verified</option>
                            <option value="BOOKING_CREATED">Booking Created</option>
                            <option value="REFERRED_BOOKING_CREATED">Referred Booking</option>
                            <option value="KYC_COMPLETED">KYC Completed</option>
                            <option value="PROFILE_COMPLETED">Profile Completed</option>
                            <option value="MANUAL_ADJUSTMENT">Manual Adjustment</option>
                            {/* A zone manager's feed carries their agents' override
                                rows even when they mentor nobody themselves. */}
                            {hasNetwork && <option value="MENTOR_POINT_OVERRIDE">Mentor Point Override</option>}
                        </select>

                        {hasNetwork && (
                            <>
                                {/* Whose events — the scope param on /network/history */}
                                <select
                                    value={agentId ? "" : scope}
                                    disabled={Boolean(agentId)}
                                    onChange={(e) => { setScope(e.target.value); setPage(1); }}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm min-w-[170px] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="all">Everyone</option>
                                    <option value="mine">My events only</option>
                                    {isMentor && <option value="mentees">Mentees only</option>}
                                    {isZoneManager && <option value="zone">My zone only</option>}
                                </select>

                                {/* Single-agent filter — mentees plus, for an Area
                                    Manager / Regional Lead, their zone's agents. */}
                                <NetworkAgentFilter
                                    value={agentId}
                                    onChange={(id) => { setAgentId(id); setPage(1); }}
                                    placeholder={isZoneManager ? "Search an agent…" : "Search a mentee…"}
                                />
                            </>
                        )}

                        {/* Clear filters */}
                        {(statusFilter || actionFilter || agentId || scope !== "all") && (
                            <button
                                onClick={() => {
                                    setStatusFilter(""); setActionFilter("");
                                    setScope("all"); setAgentId("");
                                    setPage(1);
                                }}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Icon icon="lucide:x" width="16" height="16" />
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* Table */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader />
                    </div>
                ) : events.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    <th className="px-6 py-3 text-left">Agent</th>
                                    <th className="px-6 py-3 text-left">Action</th>
                                    <th className="px-6 py-3 text-left">Status</th>
                                    <th className="px-6 py-3 text-left">Points</th>
                                    <th className="px-6 py-3 text-left">Entity</th>
                                    <th className="px-6 py-3 text-left">Adjustment</th>
                                    <th className="px-6 py-3 text-left">Remitted</th>
                                    <th className="px-6 py-3 text-left">Created At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {events.map((event) => {
                                    const statusCfg = STATUS_CONFIG[event.status] ?? { bg: "bg-gray-100", text: "text-gray-800" };
                                    return (
                                        <tr
                                            key={event.id}
                                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                                            onClick={() => setViewEvent(event)}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="relative w-7 h-7 rounded-full overflow-hidden border border-gray-200 shrink-0">
                                                        {event.agent?.profile_image ? (
                                                            <Image src={event.agent.profile_image} alt="" fill className="object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                                                <Icon icon="gg:profile" width="16" className="text-gray-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="text-sm text-gray-700 truncate max-w-[160px]">
                                                        {event.agent ? personName(event.agent) : "You"}
                                                    </span>
                                                    {/* The name alone can't distinguish the caller's own row
                                                        from a namesake's, and the feed is mostly their own. */}
                                                    {isSameId(event.agent_id, user?.id) && (
                                                        <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                                                            You
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                {formatActionType(event.action_type)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}>
                                                    {event.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-semibold">
                                                <span className={event.points_awarded >= 0 ? "text-green-600" : "text-red-600"}>
                                                    {event.points_awarded >= 0 ? "+" : ""}{event.points_awarded}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {formatEntityType(event.entity_type)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${event.adjustment_direction === "ADDITION" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                                    {event.adjustment_direction === "ADDITION" ? "Addition" : "Deduction"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${event.is_remitted ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                                                    {event.is_remitted ? "Yes" : "No"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {formatDate(event.created_at)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <Icon icon="hugeicons:album-not-found-01" width="32" height="32" className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No events found</h3>
                        <p className="text-sm text-gray-500">Try adjusting your filters</p>
                    </div>
                )}

                {/* Pagination */}
                {!isLoading && events.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-200">
                        <TablePagination
                            total={total}
                            currentPage={page}
                            setPage={setPage}
                            firstPage={1}
                            itemsPerPage={size}
                        />
                    </div>
                )}
            </div>

            {/* View modal — read-only */}
            {viewEvent && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <div className="min-w-0">
                                {/* Drilling into a source event replaces the modal's
                                    contents, so without this the caller loses their
                                    place in the chain they followed. */}
                                {eventTrail.length > 0 && (
                                    <button
                                        onClick={goBackOneEvent}
                                        className="flex items-center gap-1 text-xs font-medium text-primary hover:underline mb-1"
                                    >
                                        <Icon icon="lucide:arrow-left" width="13" />
                                        Back
                                    </button>
                                )}
                                <h3 className="text-lg font-semibold text-gray-900">Event Details</h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {formatActionType(viewEvent.action_type)}
                                    {viewEvent.agent && (
                                        <span className="text-gray-400"> · {personName(viewEvent.agent)}</span>
                                    )}
                                </p>
                            </div>
                            <button
                                onClick={closeEventModal}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
                            >
                                <LuX className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className={`p-6 grid grid-cols-2 gap-x-6 gap-y-5 max-h-[70vh] overflow-y-auto transition-opacity ${relatedLoading ? "opacity-50 pointer-events-none" : ""}`}>
                            {([
                                { label: "Status",         value: <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(STATUS_CONFIG[viewEvent.status] ?? { bg: "bg-gray-100", text: "text-gray-800" }).bg} ${(STATUS_CONFIG[viewEvent.status] ?? { bg: "bg-gray-100", text: "text-gray-800" }).text}`}>{viewEvent.status}</span> },
                                { label: "Points Awarded",  value: <span className={`text-xl font-bold ${viewEvent.points_awarded >= 0 ? "text-green-600" : "text-red-600"}`}>{viewEvent.points_awarded >= 0 ? "+" : ""}{viewEvent.points_awarded}</span> },
                                { label: "Base Points",     value: <span className="text-xl font-bold text-gray-900">{viewEvent.base_points}</span> },
                                { label: "Multiplier",      value: <span className="text-xl font-bold text-gray-900">{viewEvent.multiplier_applied}×</span> },
                                { label: "Adjustment",      value: <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${viewEvent.adjustment_direction === "ADDITION" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{viewEvent.adjustment_direction === "ADDITION" ? "Addition" : "Deduction"}</span> },
                                { label: "Entity",          value: formatEntityType(viewEvent.entity_type) },
                                { label: "Remitted",        value: <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${viewEvent.is_remitted ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>{viewEvent.is_remitted ? "Yes" : "No"}</span> },
                                {
                                    label: "Reason",
                                    // Full width: the override prose runs long, and
                                    // half a column wraps it into a ragged stack.
                                    wide: true,
                                    value: (
                                        <EventReason
                                            reason={viewEvent.reason}
                                            relatedAgent={viewEvent.related_agent}
                                            relatedEventId={viewEvent.related_event_id}
                                            onOpenRelated={() => openRelatedEvent(viewEvent)}
                                        />
                                    ),
                                },
                                { label: "Created At",      value: formatDate(viewEvent.created_at) },
                                { label: "Updated At",      value: formatDate(viewEvent.updated_at) },
                            ] as { label: string; value: React.ReactNode; wide?: boolean }[]).map(({ label, value, wide }) => (
                                <div key={label} className={`space-y-1 ${wide ? "col-span-2" : ""}`}>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
                                    <div className="text-sm font-medium text-gray-900">{value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

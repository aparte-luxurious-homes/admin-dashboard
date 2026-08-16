'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import axiosRequest from "@/src/lib/api";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import { Icon } from "@iconify/react/dist/iconify.js";
import { formatDate } from "@/src/lib/utils";
import TablePagination from "../../TablePagination";
import Loader from "@/src/components/loader";
import { LuX } from "react-icons/lu";
import { toast } from "react-hot-toast";
import { useAuth } from "@/src/hooks/useAuth";

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
    // Present only on a mentor's combined feed — names whose event the row is.
    agent?: {
        first_name?: string | null;
        last_name?: string | null;
        email?: string | null;
        profile_image?: string | null;
    } | null;
}

interface MenteeOption {
    id: string;
    name: string;
    email?: string | null;
    profile_image?: string | null;
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
    // Mentor feed: "all" (own + mentees), "mine", "mentees" — mirrors the
    // scope param on GET /network/history.
    const [scope, setScope]               = useState("all");
    const [menteeId, setMenteeId]         = useState("");
    const [menteeSearch, setMenteeSearch] = useState("");
    const [menteeOpen, setMenteeOpen]     = useState(false);
    const [mentees, setMentees]           = useState<MenteeOption[]>([]);

    const menteeComboRef = useRef<HTMLDivElement>(null);
    // Only mentors get the scope / mentee controls; for everyone else the three
    // scopes are equivalent and the extra chrome would be noise.
    const isMentor = mentees.length > 0;

    const [viewEvent, setViewEvent] = useState<NetworkEvent | null>(null);

    // The caller's mentees, sourced from their own mentorship list. Non-ENDED
    // only, matching the set the history endpoint authorises `mentee_id` against.
    useEffect(() => {
        axiosRequest
            // as_mentor=true is load-bearing: without it the endpoint returns
            // mappings in BOTH directions, so an agent who is themselves a mentee
            // would find their own row here and appear in their own mentee picker
            // (the history endpoint would then 403 on that mentee_id).
            .get(API_ROUTES.network.myMentorship, {
                params: { page: 1, size: 100, as_mentor: true },
            })
            .then((res) => {
                const payload = res?.data?.data ?? res?.data;
                const items = payload?.items ?? payload?.data ?? (Array.isArray(payload) ? payload : []);
                const options: MenteeOption[] = (items as any[])
                    .filter((m) => m?.status !== "ENDED" && m?.mentee_id && m?.mentor_id === user?.id)
                    .map((m) => ({
                        id: m.mentee_id,
                        name: personName(m.mentee),
                        email: m.mentee?.email ?? null,
                        profile_image: m.mentee?.profile_image ?? null,
                    }));
                // A mentee can appear once per mapping; collapse to unique ids.
                const seen = new Set<string>();
                setMentees(options.filter((o) => !seen.has(o.id) && seen.add(o.id)));
            })
            .catch(() => setMentees([]));
    }, [user?.id]);

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (menteeComboRef.current && !menteeComboRef.current.contains(e.target as Node)) {
                setMenteeOpen(false);
            }
        }
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, []);

    const fetchEvents = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            params.set("page", String(page));
            params.set("size", String(size));
            if (statusFilter) params.set("status", statusFilter);
            if (actionFilter) params.set("action_type", actionFilter);
            // mentee_id already narrows to one agent; sending scope alongside it
            // would be redundant, and the endpoint ignores scope in that case.
            if (menteeId) params.set("mentee_id", menteeId);
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
    }, [page, size, statusFilter, actionFilter, scope, menteeId]);

    useEffect(() => { fetchEvents(); }, [fetchEvents]);

    return (
        <>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">

                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="mb-4">
                        <h1 className="text-xl font-semibold text-gray-900">My Network Events</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {isMentor
                                ? "Your activity events and points history, alongside your mentees'"
                                : "View your activity events and points history"}
                        </p>
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
                            <option value="MENTOR_POINT_OVERRIDE">Mentor Point Override</option>
                        </select>

                        {isMentor && (
                            <>
                                {/* Whose events */}
                                <select
                                    value={menteeId ? "" : scope}
                                    disabled={Boolean(menteeId)}
                                    onChange={(e) => { setScope(e.target.value); setPage(1); }}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm min-w-[170px] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="all">Everyone</option>
                                    <option value="mine">My events only</option>
                                    <option value="mentees">Mentees only</option>
                                </select>

                                {/* Mentee search */}
                                <div ref={menteeComboRef} className="relative">
                                    <div className={`flex items-center border rounded-lg bg-white overflow-hidden transition-all ${menteeId ? "border-primary" : "border-gray-300"} focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary`}>
                                        <Icon icon="mdi:magnify" width="16" className="ml-3 text-gray-400 shrink-0" />
                                        <input
                                            type="text"
                                            value={menteeSearch}
                                            placeholder="Search a mentee…"
                                            onFocus={() => setMenteeOpen(true)}
                                            onChange={(e) => {
                                                setMenteeSearch(e.target.value);
                                                setMenteeOpen(true);
                                                if (!e.target.value && menteeId) { setMenteeId(""); setPage(1); }
                                            }}
                                            className="px-2 py-2 text-sm text-gray-700 bg-transparent outline-none w-52"
                                        />
                                        {menteeId && (
                                            <button
                                                onMouseDown={(e) => { e.preventDefault(); setMenteeId(""); setMenteeSearch(""); setPage(1); }}
                                                className="pr-3 text-gray-400 hover:text-gray-600"
                                            >
                                                <LuX size={14} />
                                            </button>
                                        )}
                                    </div>
                                    {menteeOpen && !menteeId && (
                                        <ul className="absolute z-50 mt-1 w-full min-w-[260px] bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                                            {mentees
                                                .filter((m) =>
                                                    m.name.toLowerCase().includes(menteeSearch.toLowerCase()) ||
                                                    (m.email ?? "").toLowerCase().includes(menteeSearch.toLowerCase())
                                                )
                                                .map((m) => (
                                                    <li
                                                        key={m.id}
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            setMenteeId(m.id);
                                                            setMenteeSearch(m.name);
                                                            setMenteeOpen(false);
                                                            setPage(1);
                                                        }}
                                                        className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 cursor-pointer first:rounded-t-xl last:rounded-b-xl"
                                                    >
                                                        <div className="relative w-7 h-7 rounded-full overflow-hidden border border-gray-200 shrink-0">
                                                            {m.profile_image ? (
                                                                <Image src={m.profile_image} alt="" fill className="object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                                                    <Icon icon="gg:profile" width="16" className="text-gray-400" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 truncate">{m.name}</p>
                                                            {m.email && <p className="text-xs text-gray-400 truncate">{m.email}</p>}
                                                        </div>
                                                    </li>
                                                ))}
                                            {mentees.filter((m) =>
                                                m.name.toLowerCase().includes(menteeSearch.toLowerCase()) ||
                                                (m.email ?? "").toLowerCase().includes(menteeSearch.toLowerCase())
                                            ).length === 0 && (
                                                <li className="px-4 py-3 text-sm text-gray-400 italic">No mentee matches that search</li>
                                            )}
                                        </ul>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Clear filters */}
                        {(statusFilter || actionFilter || menteeId || scope !== "all") && (
                            <button
                                onClick={() => {
                                    setStatusFilter(""); setActionFilter("");
                                    setScope("all"); setMenteeId(""); setMenteeSearch("");
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
                                    {isMentor && <th className="px-6 py-3 text-left">Agent</th>}
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
                                            {isMentor && (
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
                                                    </div>
                                                </td>
                                            )}
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
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Event Details</h3>
                                <p className="text-xs text-gray-500 mt-0.5">{formatActionType(viewEvent.action_type)}</p>
                            </div>
                            <button
                                onClick={() => setViewEvent(null)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <LuX className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-x-6 gap-y-5 max-h-[70vh] overflow-y-auto">
                            {([
                                { label: "Status",         value: <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(STATUS_CONFIG[viewEvent.status] ?? { bg: "bg-gray-100", text: "text-gray-800" }).bg} ${(STATUS_CONFIG[viewEvent.status] ?? { bg: "bg-gray-100", text: "text-gray-800" }).text}`}>{viewEvent.status}</span> },
                                { label: "Points Awarded",  value: <span className={`text-xl font-bold ${viewEvent.points_awarded >= 0 ? "text-green-600" : "text-red-600"}`}>{viewEvent.points_awarded >= 0 ? "+" : ""}{viewEvent.points_awarded}</span> },
                                { label: "Base Points",     value: <span className="text-xl font-bold text-gray-900">{viewEvent.base_points}</span> },
                                { label: "Multiplier",      value: <span className="text-xl font-bold text-gray-900">{viewEvent.multiplier_applied}×</span> },
                                { label: "Adjustment",      value: <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${viewEvent.adjustment_direction === "ADDITION" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{viewEvent.adjustment_direction === "ADDITION" ? "Addition" : "Deduction"}</span> },
                                { label: "Entity",          value: formatEntityType(viewEvent.entity_type) },
                                { label: "Remitted",        value: <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${viewEvent.is_remitted ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>{viewEvent.is_remitted ? "Yes" : "No"}</span> },
                                { label: "Reason",          value: viewEvent.reason || "--/--" },
                                { label: "Created At",      value: formatDate(viewEvent.created_at) },
                                { label: "Updated At",      value: formatDate(viewEvent.updated_at) },
                            ] as { label: string; value: React.ReactNode }[]).map(({ label, value }) => (
                                <div key={label} className="space-y-1">
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

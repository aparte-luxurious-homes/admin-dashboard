'use client'

import { useCallback, useEffect, useRef, useState } from "react";
import axiosRequest from "@/src/lib/api";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import { DotsIcon, SearchIcon } from "../../icons";
import { Icon } from "@iconify/react/dist/iconify.js";
import { formatDate } from "@/src/lib/utils";
import TablePagination from "../../TablePagination";
import Loader from "@/src/components/loader";
import { LuEye, LuPencil, LuRefreshCw, LuX, LuCheck } from "react-icons/lu";
import { toast } from "react-hot-toast";

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
}

interface ActionButton {
    label: string;
    Icon: React.ReactElement;
    onClick: () => void;
    hidden?: boolean;
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

export default function NetworkEventsTable() {
    const [events, setEvents]         = useState<NetworkEvent[]>([]);
    const [total, setTotal]           = useState(0);
    const [page, setPage]             = useState(1);
    const size                        = 20;
    const [isLoading, setIsLoading]   = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [actionFilter, setActionFilter] = useState("");

    const [selectedRow, setSelectedRow]     = useState<number | null>(null);
    const [modalPosition, setModalPosition] = useState<{ top: number; left: number } | null>(null);
    const [viewEvent, setViewEvent]         = useState<NetworkEvent | null>(null);
    const [editEvent, setEditEvent]         = useState<NetworkEvent | null>(null);
    const [editReason, setEditReason]       = useState("");
    const [isSaving, setIsSaving]           = useState(false);

    const modalRef = useRef<HTMLDivElement>(null);

    const fetchEvents = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            params.set("page", String(page));
            params.set("size", String(size));
            if (statusFilter) params.set("status", statusFilter);
            if (actionFilter) params.set("action_type", actionFilter);
            if (searchTerm)   params.set("agent_id", searchTerm);

            const response = await axiosRequest.get(
                `${API_ROUTES.network.events.base}?${params.toString()}`
            );
            const data = response?.data?.data ?? response?.data;
            setEvents(data?.items ?? []);
            setTotal(data?.total ?? 0);
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to fetch events");
        } finally {
            setIsLoading(false);
        }
    }, [page, size, statusFilter, actionFilter, searchTerm]);

    useEffect(() => { fetchEvents(); }, [fetchEvents]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (modalRef.current && !(modalRef.current as HTMLElement).contains(event.target as Node)) {
                setSelectedRow(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleDotsClick = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        setSelectedRow(index);
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        setModalPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
    };

    const updateEventStatus = async (eventId: string, status: string) => {
        setSelectedRow(null);
        try {
            await toast.promise(
                axiosRequest.patch(API_ROUTES.network.events.update(eventId), { status }),
                {
                    loading: "Updating event...",
                    success: `Event ${status.toLowerCase()} successfully`,
                    error: (err) => err?.response?.data?.message || "Failed to update event",
                }
            );
            fetchEvents();
        } catch {
            // error toast already handled by toast.promise
        }
    };

    const handleEditSave = async () => {
        if (!editEvent) return;
        setIsSaving(true);
        try {
            await axiosRequest.patch(API_ROUTES.network.events.update(editEvent.id), { reason: editReason });
            toast.success("Event updated successfully");
            setEditEvent(null);
            fetchEvents();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to update event");
        } finally {
            setIsSaving(false);
        }
    };

    const contextEvent = selectedRow !== null ? events[selectedRow] : null;

    const getActionButtons = (event: NetworkEvent): ActionButton[] => [
        {
            label: "View",
            Icon: <LuEye />,
            onClick: () => { setViewEvent(event); setSelectedRow(null); },
        },
        {
            label: "Edit",
            Icon: <LuPencil />,
            onClick: () => { setEditReason(event.reason ?? ""); setEditEvent(event); setSelectedRow(null); },
        },
        {
            label: "Reverse",
            Icon: <LuRefreshCw className="text-orange-500" />,
            onClick: () => updateEventStatus(event.id, "REVERSED"),
            hidden: event.status === "REVERSED",
        },
        {
            label: "Reject",
            Icon: <LuX className="text-red-500" />,
            onClick: () => updateEventStatus(event.id, "REJECTED"),
            hidden: event.status === "REJECTED",
        },
        {
            label: "Confirm",
            Icon: <LuCheck className="text-green-600" />,
            onClick: () => updateEventStatus(event.id, "CONFIRMED"),
            hidden: event.status === "CONFIRMED",
        },
    ];

    return (
        <div className="p-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">

                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center gap-4 flex-wrap mb-4">
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">Network Events</h1>
                            <p className="text-sm text-gray-500 mt-1">Monitor and manage all agent activity events</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Search */}
                        <div className="flex-1 max-w-md relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                                placeholder="Search by agent ID..."
                            />
                            <SearchIcon className="absolute top-[50%] -translate-y-1/2 left-3 w-5" color="#9CA3AF" />
                        </div>

                        {/* Status filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm min-w-[160px]"
                        >
                            <option value="">All Statuses</option>
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
                            <option value="BOOKING_CHECKED_IN">Booking Checked In</option>
                            <option value="REFERRED_BOOKING_CHECKED_IN">Referred Booking</option>
                            <option value="KYC_COMPLETED">KYC Completed</option>
                            <option value="PROFILE_COMPLETED">Profile Completed</option>
                            <option value="MANUAL_ADJUSTMENT">Manual Adjustment</option>
                        </select>

                        {/* Clear filters */}
                        {(statusFilter || actionFilter || searchTerm) && (
                            <button
                                onClick={() => { setStatusFilter(""); setActionFilter(""); setSearchTerm(""); setPage(1); }}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Icon icon="lucide:x" width="16" height="16" />
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* Table body */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader />
                    </div>
                ) : events.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    <th className="px-6 py-3 text-left">Action</th>
                                    <th className="px-6 py-3 text-left">Status</th>
                                    <th className="px-6 py-3 text-left">Points</th>
                                    <th className="px-6 py-3 text-left">Entity</th>
                                    <th className="px-6 py-3 text-left">Adjustment</th>
                                    <th className="px-6 py-3 text-left">Remitted</th>
                                    <th className="px-6 py-3 text-left">Created At</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {events.map((event, index) => {
                                    const statusCfg = STATUS_CONFIG[event.status] ?? { bg: "bg-gray-100", text: "text-gray-800" };
                                    return (
                                        <tr key={event.id} className="hover:bg-gray-50 transition-colors">
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
                                                    {event.adjustment_direction === "ADDITION" ? "+" : "−"}&nbsp;{event.adjustment_direction === "ADDITION" ? "Addition" : "Deduction"}
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
                                            <td className="px-6 py-4 text-right">
                                                                <div
                                                    className="flex justify-end items-center"
                                                    onClick={(e) => handleDotsClick(e, index)}
                                                >
                                                    <DotsIcon className="w-5 cursor-pointer hover:text-primary transition-colors text-gray-400" />
                                                </div>
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

            {/* Context menu */}
            {contextEvent && modalPosition && (
                <div
                    ref={modalRef}
                    className="fixed bg-white shadow-xl rounded-lg z-50 border border-gray-200 overflow-hidden min-w-[120px]"
                    style={{ top: modalPosition.top, left: modalPosition.left }}
                >
                    {getActionButtons(contextEvent)
                        .filter((b) => !b.hidden)
                        .map((button, idx) => (
                            <button
                                key={idx}
                                className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 transition-colors border-b last:border-b-0 border-gray-100"
                                onClick={(e) => { e.stopPropagation(); button.onClick(); }}
                            >
                                <span className="text-gray-500">{button.Icon}</span>
                                <span>{button.label}</span>
                            </button>
                        ))}
                </div>
            )}

            {/* View modal */}
            {viewEvent && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">Event Details</h3>
                            <button
                                onClick={() => setViewEvent(null)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <LuX className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-x-6 gap-y-4 max-h-[70vh] overflow-y-auto">
                            {(
                                [
                                    ["Event ID",     viewEvent.id],
                                    ["Agent ID",     viewEvent.agent_id],
                                    ["Action",       formatActionType(viewEvent.action_type)],
                                    ["Status",       viewEvent.status],
                                    ["Base Points",  String(viewEvent.base_points)],
                                    ["Multiplier",   `${viewEvent.multiplier_applied}×`],
                                    ["Points",       `${viewEvent.points_awarded >= 0 ? "+" : ""}${viewEvent.points_awarded}`],
                                    ["Entity",       formatEntityType(viewEvent.entity_type)],
                                    ["Entity ID",    viewEvent.entity_id ?? "--/--"],
                                    ["Adjustment",   viewEvent.adjustment_direction],
                                    ["Remitted",     viewEvent.is_remitted ? "Yes" : "No"],
                                    ["Reason",       viewEvent.reason ?? "--/--"],
                                    ["Created At",   formatDate(viewEvent.created_at)],
                                    ["Updated At",   formatDate(viewEvent.updated_at)],
                                ] as [string, string][]
                            ).map(([label, value]) => (
                                <div key={label} className="space-y-1">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
                                    <p className="text-sm font-medium text-gray-900 break-all">{value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit modal */}
            {editEvent && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">Edit Event</h3>
                            <button
                                onClick={() => setEditEvent(null)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <LuX className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</p>
                                <p className="text-sm font-medium text-gray-900">{formatActionType(editEvent.action_type)}</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason</label>
                                <textarea
                                    rows={4}
                                    value={editReason}
                                    onChange={(e) => setEditReason(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none"
                                    placeholder="Enter reason..."
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
                            <button
                                onClick={() => setEditEvent(null)}
                                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEditSave}
                                disabled={isSaving}
                                className="px-4 py-2 text-sm text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {isSaving ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

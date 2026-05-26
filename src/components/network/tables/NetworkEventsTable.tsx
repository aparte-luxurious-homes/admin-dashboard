'use client'

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axiosRequest from "@/src/lib/api";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import { DotsIcon, SearchIcon } from "../../icons";
import { Icon } from "@iconify/react/dist/iconify.js";
import { formatDate } from "@/src/lib/utils";
import TablePagination from "../../TablePagination";
import Loader from "@/src/components/loader";
import { LuEye, LuPencil, LuCheck, LuX } from "react-icons/lu";
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

interface Agent {
    id: string;
    profile?: { first_name?: string | null; last_name?: string | null; firstName?: string | null; lastName?: string | null };
    first_name?: string | null;
    last_name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
}

function agentFullName(a: Agent): string {
    const first = a.profile?.first_name ?? a.profile?.firstName ?? a.first_name ?? a.firstName ?? "";
    const last  = a.profile?.last_name  ?? a.profile?.lastName  ?? a.last_name  ?? a.lastName  ?? "";
    return `${first} ${last}`.trim() || "Unnamed Agent";
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
    const router = useRouter();

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

    const [confirmEventId, setConfirmEventId] = useState<string | null>(null);

    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [adjustAgentId, setAdjustAgentId]     = useState("");
    const [adjustPoints, setAdjustPoints]       = useState<number>(0);
    const [adjustReason, setAdjustReason]       = useState("");
    const [isAdjusting, setIsAdjusting]         = useState(false);

    const [agents, setAgents]               = useState<Agent[]>([]);
    const [agentsLoading, setAgentsLoading] = useState(false);

    // table search combobox
    const [tableAgentSearch, setTableAgentSearch]       = useState("");
    const [tableDropdownOpen, setTableDropdownOpen]     = useState(false);

    // modal combobox
    const [agentSearch, setAgentSearch]                 = useState("");
    const [agentDropdownOpen, setAgentDropdownOpen]     = useState(false);

    const modalRef       = useRef<HTMLDivElement>(null);
    const agentComboRef  = useRef<HTMLDivElement>(null);
    const tableComboRef  = useRef<HTMLDivElement>(null);

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
            toast.error(error?.response?.data?.detail || error?.response?.data?.message || "Failed to fetch events");
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

    useEffect(() => {
        setAgentsLoading(true);
        axiosRequest
            .get(API_ROUTES.admin.users.base, { params: { role: "AGENT", page: 1, size: 100 } })
            .then((res) => {
                const data = res?.data?.data;
                setAgents(data?.data ?? []);
            })
            .catch(() => {})
            .finally(() => setAgentsLoading(false));
    }, []);

    useEffect(() => {
        function handleOutside(e: MouseEvent) {
            if (agentComboRef.current && !agentComboRef.current.contains(e.target as Node)) {
                setAgentDropdownOpen(false);
            }
            if (tableComboRef.current && !tableComboRef.current.contains(e.target as Node)) {
                setTableDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleOutside);
        return () => document.removeEventListener("mousedown", handleOutside);
    }, []);

    const handleDotsClick = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        setSelectedRow(index);
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        setModalPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
    };

    const confirmEvent = async (eventId: string) => {
        setSelectedRow(null);
        try {
            await toast.promise(
                axiosRequest.patch(API_ROUTES.network.events.update(eventId), { status: "CONFIRMED" }),
                {
                    loading: "Confirming event...",
                    success: "Event confirmed successfully",
                    error: (err) => err?.response?.data?.detail || err?.response?.data?.message || "Failed to confirm event",
                }
            );
            fetchEvents();
        } catch {
            // handled by toast.promise
        }
    };

    const handleAdjustSubmit = async () => {
        if (!adjustAgentId.trim()) {
            toast.error("Agent ID is required");
            return;
        }
        setIsAdjusting(true);
        try {
            await toast.promise(
                axiosRequest.post(API_ROUTES.network.agents.adjust(adjustAgentId.trim()), {
                    points: adjustPoints,
                    reason: adjustReason,
                }),
                {
                    loading: "Creating adjustment...",
                    success: "Manual adjustment created successfully",
                    error: (err) => err?.response?.data?.detail || err?.response?.data?.message || "Failed to create adjustment",
                }
            );
            setShowAdjustModal(false);
            setAdjustAgentId("");
            setAdjustPoints(0);
            setAdjustReason("");
            setAgentSearch("");
            fetchEvents();
        } catch {
            // handled by toast.promise
        } finally {
            setIsAdjusting(false);
        }
    };

    const contextEvent = selectedRow !== null ? events[selectedRow] : null;

    const getActionButtons = (event: NetworkEvent): ActionButton[] => [
        {
            label: "View",
            Icon: <LuEye />,
            onClick: () => {
                setSelectedRow(null);
                router.push(PAGE_ROUTES.dashboard.network.events.details(event.id));
            },
        },
        {
            label: "Edit",
            Icon: <LuPencil />,
            onClick: () => {
                setSelectedRow(null);
                router.push(`${PAGE_ROUTES.dashboard.network.events.details(event.id)}?edit=true`);
            },
        },
        {
            label: "Confirm",
            Icon: <LuCheck className="text-green-600" />,
            onClick: () => { setSelectedRow(null); setConfirmEventId(event.id); },
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
                        <button
                            onClick={() => setShowAdjustModal(true)}
                            className="px-4 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                        >
                            <Icon icon="lucide:plus" width="16" height="16" />
                            Manual Adjustment
                        </button>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Search by agent name */}
                        <div className="flex-1 max-w-md relative" ref={tableComboRef}>
                            <input
                                type="text"
                                value={tableAgentSearch}
                                onChange={(e) => {
                                    setTableAgentSearch(e.target.value);
                                    setSearchTerm("");
                                    setPage(1);
                                    setTableDropdownOpen(true);
                                }}
                                onFocus={() => setTableDropdownOpen(true)}
                                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                                placeholder="Search by agent name..."
                            />
                            <SearchIcon className="absolute top-[50%] -translate-y-1/2 left-3 w-5" color="#9CA3AF" />
                            {tableDropdownOpen && !agentsLoading && tableAgentSearch && (
                                <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                    {agents
                                        .filter((a) => agentFullName(a).toLowerCase().includes(tableAgentSearch.toLowerCase()))
                                        .map((a) => (
                                            <li
                                                key={a.id}
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    setTableAgentSearch(agentFullName(a));
                                                    setSearchTerm(a.id);
                                                    setPage(1);
                                                    setTableDropdownOpen(false);
                                                }}
                                                className="px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                                            >
                                                {agentFullName(a)}
                                            </li>
                                        ))}
                                    {agents.filter((a) => agentFullName(a).toLowerCase().includes(tableAgentSearch.toLowerCase())).length === 0 && (
                                        <li className="px-3 py-2.5 text-sm text-gray-400 italic">No agents found</li>
                                    )}
                                </ul>
                            )}
                        </div>

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
                            <option value="BOOKING_CHECKED_IN">Booking Checked In</option>
                            <option value="REFERRED_BOOKING_CHECKED_IN">Referred Booking</option>
                            <option value="KYC_COMPLETED">KYC Completed</option>
                            <option value="PROFILE_COMPLETED">Profile Completed</option>
                            <option value="MANUAL_ADJUSTMENT">Manual Adjustment</option>
                        </select>

                        {/* Clear filters */}
                        {(statusFilter || actionFilter || searchTerm || tableAgentSearch) && (
                            <button
                                onClick={() => { setStatusFilter(""); setActionFilter(""); setSearchTerm(""); setTableAgentSearch(""); setPage(1); }}
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
                                        <tr
                                            key={event.id}
                                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                                            onClick={() => router.push(PAGE_ROUTES.dashboard.network.events.details(event.id))}
                                        >
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

            {/* Confirm Event Modal */}
            {confirmEventId && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="p-6">
                            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                                <LuCheck className="w-6 h-6 text-green-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">Confirm event?</h3>
                            <p className="text-sm text-gray-500">This will mark the event as confirmed and award the associated points to the agent. This action cannot be undone.</p>
                        </div>
                        <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-gray-100">
                            <button
                                onClick={() => setConfirmEventId(null)}
                                className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => { confirmEvent(confirmEventId); setConfirmEventId(null); }}
                                className="px-8 py-2.5 text-sm font-bold text-white bg-green-600 rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-600/20"
                            >
                                Yes, confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Manual Adjustment Modal */}
            {showAdjustModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Manual Adjustment</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Award or deduct points for an agent</p>
                            </div>
                            <button
                                onClick={() => { setShowAdjustModal(false); setAgentSearch(""); setAdjustAgentId(""); }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <LuX className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
                                Manually credit or debit points on an agent&apos;s network balance. Use a <span className="font-semibold">positive value</span> to award points and a <span className="font-semibold">negative value</span> to deduct them. This action is logged and cannot be undone.
                            </div>
                            <div className="space-y-1" ref={agentComboRef}>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Agent</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={agentSearch}
                                        onChange={(e) => {
                                            setAgentSearch(e.target.value);
                                            setAdjustAgentId("");
                                            setAgentDropdownOpen(true);
                                        }}
                                        onFocus={() => setAgentDropdownOpen(true)}
                                        placeholder={agentsLoading ? "Loading agents..." : "Search agent by name..."}
                                        disabled={agentsLoading}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                    {agentDropdownOpen && !agentsLoading && (
                                        <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                            {agents
                                                .filter((a) => agentFullName(a).toLowerCase().includes(agentSearch.toLowerCase()))
                                                .map((a) => (
                                                    <li
                                                        key={a.id}
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            setAdjustAgentId(a.id);
                                                            setAgentSearch(agentFullName(a));
                                                            setAgentDropdownOpen(false);
                                                        }}
                                                        className="px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                                                    >
                                                        {agentFullName(a)}
                                                    </li>
                                                ))}
                                            {agents.filter((a) => agentFullName(a).toLowerCase().includes(agentSearch.toLowerCase())).length === 0 && (
                                                <li className="px-3 py-2.5 text-sm text-gray-400 italic">No agents found</li>
                                            )}
                                        </ul>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Points</label>
                                <input
                                    type="number"
                                    value={adjustPoints}
                                    onChange={(e) => setAdjustPoints(Number(e.target.value))}
                                    placeholder="e.g. 50 or -50"
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                                />
                                <p className="text-xs text-gray-400">Use a negative number to deduct points</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason</label>
                                <textarea
                                    value={adjustReason}
                                    onChange={(e) => setAdjustReason(e.target.value)}
                                    placeholder="Provide a reason for this adjustment..."
                                    rows={3}
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-gray-100">
                            <button
                                onClick={() => { setShowAdjustModal(false); setAgentSearch(""); setAdjustAgentId(""); }}
                                className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAdjustSubmit}
                                disabled={isAdjusting}
                                className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                            >
                                {isAdjusting ? "Submitting..." : "Submit"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
        </div>
    );
}

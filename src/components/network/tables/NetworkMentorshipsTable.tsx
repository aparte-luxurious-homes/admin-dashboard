'use client'

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axiosRequest from "@/src/lib/api";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import { DotsIcon } from "../../icons";
import { Icon } from "@iconify/react/dist/iconify.js";
import { formatDate } from "@/src/lib/utils";
import Loader from "@/src/components/loader";
import { LuEye } from "react-icons/lu";
import { toast } from "react-hot-toast";

interface MentorshipUser {
    id?: string;
    email?: string;
    role?: string;
    // flat (detail response)
    first_name?: string;
    last_name?: string;
    profile_image?: string;
    // nested (list response)
    profile?: {
        first_name?: string;
        last_name?: string;
        profile_image?: string;
    };
}

interface Mentorship {
    id: string;
    mentor_id: string;
    mentee_id: string;
    status: string;
    invited_by_mentor: boolean;
    is_flagged: boolean;
    started_at: string | null;
    ended_at: string | null;
    paused_at: string | null;
    created_at: string;
    updated_at: string;
    mentor?: MentorshipUser;
    mentee?: MentorshipUser;
    mentor_tier?: string;
    mentee_tier?: string;
}

interface Agent {
    id: string;
    email?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    profile?: { first_name?: string | null; last_name?: string | null; firstName?: string | null; lastName?: string | null; email?: string | null };
}

const STATUS_CONFIG: Record<string, { bg: string; text: string }> = {
    // PENDING is legacy — nothing is created in this state any more (both agent
    // and admin mentorship creation are now immediate/ACTIVE). Retained so any
    // row predating the drop_mentorship_acceptance_001 migration still renders.
    PENDING: { bg: "bg-blue-100",   text: "text-blue-700"   },
    ACTIVE:  { bg: "bg-green-100",  text: "text-green-800"  },
    PAUSED:  { bg: "bg-yellow-100", text: "text-yellow-800" },
    ENDED:   { bg: "bg-gray-100",   text: "text-gray-600"   },
};

function fullName(user?: MentorshipUser, fallback?: string): string {
    if (!user) return fallback ?? "—";
    const firstName = user.first_name || user.profile?.first_name;
    const lastName  = user.last_name  || user.profile?.last_name;
    const name = [firstName, lastName].filter(Boolean).join(" ");
    return name || user.email || fallback || "—";
}

function agentFullName(agent: Agent): string {
    const first = agent.profile?.first_name || agent.profile?.firstName || agent.first_name || agent.firstName || "";
    const last  = agent.profile?.last_name  || agent.profile?.lastName  || agent.last_name  || agent.lastName  || "";
    return [first, last].filter(Boolean).join(" ");
}

function agentEmail(agent: Agent): string {
    return agent.email || agent.profile?.email || "";
}

function agentDisplayName(agent: Agent): string {
    return agentFullName(agent) || agentEmail(agent) || agent.id;
}

export default function NetworkMentorshipsTable() {
    const [mentorships, setMentorships] = useState<Mentorship[]>([]);
    const [isLoading, setIsLoading]     = useState(false);
    const [page, setPage]               = useState(1);
    const [totalPages, setTotalPages]   = useState(1);
    const [statusFilter, setStatusFilter] = useState("");

    // Mentor combobox
    const [mentorSearch, setMentorSearch]           = useState("");
    const [mentorId, setMentorId]                   = useState("");
    const [mentorDropdownOpen, setMentorDropdownOpen] = useState(false);

    // Mentee combobox
    const [menteeSearch, setMenteeSearch]           = useState("");
    const [menteeId, setMenteeId]                   = useState("");
    const [menteeDropdownOpen, setMenteeDropdownOpen] = useState(false);

    // Agents list (shared between both comboboxes)
    const [agents, setAgents]           = useState<Agent[]>([]);
    const [agentsLoading, setAgentsLoading] = useState(false);

    const router = useRouter();

    // Context menu
    const [selectedRow, setSelectedRow]     = useState<number | null>(null);
    const [modalPosition, setModalPosition] = useState<{ top: number; left: number } | null>(null);

    // Status update
    const [statusTarget, setStatusTarget]         = useState<{ id: string; newStatus: string; name: string } | null>(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    // Create mapping modal
    const [showCreateModal, setShowCreateModal]   = useState(false);
    const [showCreateConfirm, setShowCreateConfirm] = useState(false);
    const [isCreating, setIsCreating]             = useState(false);
    const [createMentorSearch, setCreateMentorSearch]   = useState("");
    const [createMentorId, setCreateMentorId]           = useState("");
    const [createMentorOpen, setCreateMentorOpen]       = useState(false);
    const [createMenteeSearch, setCreateMenteeSearch]   = useState("");
    const [createMenteeId, setCreateMenteeId]           = useState("");
    const [createMenteeOpen, setCreateMenteeOpen]       = useState(false);

    const navigateToDetail = (id: string) => router.push(PAGE_ROUTES.dashboard.network.mentorship.details(id));

    const menuRef             = useRef<HTMLDivElement>(null);
    const mentorComboRef      = useRef<HTMLDivElement>(null);
    const menteeComboRef      = useRef<HTMLDivElement>(null);
    const createMentorRef     = useRef<HTMLDivElement>(null);
    const createMenteeRef     = useRef<HTMLDivElement>(null);

    const filteredMentors = agents.filter((a) =>
        agentDisplayName(a).toLowerCase().includes(mentorSearch.toLowerCase())
    );
    const filteredMentees = agents.filter((a) =>
        agentDisplayName(a).toLowerCase().includes(menteeSearch.toLowerCase())
    );
    const filteredCreateMentors = agents.filter((a) =>
        agentDisplayName(a).toLowerCase().includes(createMentorSearch.toLowerCase())
    );
    const filteredCreateMentees = agents.filter((a) =>
        agentDisplayName(a).toLowerCase().includes(createMenteeSearch.toLowerCase())
    );

    // Fetch agents once on mount
    useEffect(() => {
        async function loadAgents() {
            setAgentsLoading(true);
            try {
                const res = await axiosRequest.get(API_ROUTES.admin.users.base, {
                    params: { role: "AGENT", page: 1, size: 100 },
                });
                const list = res?.data?.data?.data ?? res?.data?.data ?? res?.data ?? [];
                setAgents(Array.isArray(list) ? list : []);
            } catch {
                // non-critical
            } finally {
                setAgentsLoading(false);
            }
        }
        loadAgents();
    }, []);

    const fetchMentorships = useCallback(async () => {
        setIsLoading(true);
        try {
            const params: Record<string, string | number> = { page, size: 20 };
            if (statusFilter) params.status = statusFilter;
            if (mentorId)     params.mentor_id = mentorId;
            if (menteeId)     params.mentee_id = menteeId;
            const response = await axiosRequest.get(API_ROUTES.network.mentorships.base, { params });
            const payload = response?.data?.data ?? response?.data;
            const items = payload?.items ?? payload?.data ?? (Array.isArray(payload) ? payload : []);
            setMentorships(items);
            const total = payload?.total ?? items.length;
            setTotalPages(Math.max(1, Math.ceil(total / 20)));
        } catch (error: any) {
            toast.error(error?.response?.data?.detail || error?.response?.data?.message || "Failed to fetch mentorships");
        } finally {
            setIsLoading(false);
        }
    }, [page, statusFilter, mentorId, menteeId]);

    useEffect(() => { fetchMentorships(); }, [fetchMentorships]);

    // Click-outside: context menu + all comboboxes
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setSelectedRow(null);
            }
            if (mentorComboRef.current && !mentorComboRef.current.contains(e.target as Node)) {
                setMentorDropdownOpen(false);
            }
            if (menteeComboRef.current && !menteeComboRef.current.contains(e.target as Node)) {
                setMenteeDropdownOpen(false);
            }
            if (createMentorRef.current && !createMentorRef.current.contains(e.target as Node)) {
                setCreateMentorOpen(false);
            }
            if (createMenteeRef.current && !createMenteeRef.current.contains(e.target as Node)) {
                setCreateMenteeOpen(false);
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

    const selectMentor = (agent: Agent) => {
        setMentorSearch(agentDisplayName(agent));
        setMentorId(agent.id);
        setMentorDropdownOpen(false);
        setPage(1);
    };

    const clearMentor = () => {
        setMentorSearch("");
        setMentorId("");
        setPage(1);
    };

    const selectMentee = (agent: Agent) => {
        setMenteeSearch(agentDisplayName(agent));
        setMenteeId(agent.id);
        setMenteeDropdownOpen(false);
        setPage(1);
    };

    const clearMentee = () => {
        setMenteeSearch("");
        setMenteeId("");
        setPage(1);
    };

    const resetCreateModal = () => {
        setCreateMentorSearch("");
        setCreateMentorId("");
        setCreateMentorOpen(false);
        setCreateMenteeSearch("");
        setCreateMenteeId("");
        setCreateMenteeOpen(false);
        setShowCreateModal(false);
        setShowCreateConfirm(false);
    };

    const handleCreate = async () => {
        if (!createMentorId || !createMenteeId) return;
        setIsCreating(true);
        try {
            await toast.promise(
                axiosRequest.post(API_ROUTES.network.mentorships.base, {
                    mentor_id: createMentorId,
                    mentee_id: createMenteeId,
                }),
                {
                    loading: "Creating mapping...",
                    success: "Mentorship mapping created",
                    error: (err) => err?.response?.data?.detail || err?.response?.data?.message || "Failed to create mapping",
                }
            );
            resetCreateModal();
            fetchMentorships();
        } catch {
            // handled by toast.promise
        } finally {
            setIsCreating(false);
        }
    };

    const handleStatusUpdate = async () => {
        if (!statusTarget) return;
        setIsUpdatingStatus(true);
        try {
            await toast.promise(
                axiosRequest.patch(API_ROUTES.network.mentorships.details(statusTarget.id), {
                    status: statusTarget.newStatus,
                }),
                {
                    loading: "Updating status...",
                    success: `Status updated to ${statusTarget.newStatus}`,
                    error: (err) => err?.response?.data?.detail || err?.response?.data?.message || "Failed to update status",
                }
            );
            setStatusTarget(null);
            fetchMentorships();
        } catch {
            // handled by toast.promise
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const contextMentorship = selectedRow !== null ? mentorships[selectedRow] : null;

    return (
        <div className="p-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">

                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-start justify-between flex-wrap gap-4">
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">Mentorship Mappings</h1>
                            <p className="text-sm text-gray-500 mt-1">Agent mentor–mentee relationships in the network</p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                        >
                            <Icon icon="mdi:plus" width="16" />
                            Create Mapping
                        </button>
                    </div>

                    {/* Filters row */}
                    <div className="mt-4 flex items-center gap-3 flex-wrap">

                        {/* Mentor combobox */}
                        <div ref={mentorComboRef} className="relative">
                            <div className="flex items-center border border-gray-200 rounded-lg bg-white overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
                                <input
                                    type="text"
                                    placeholder={agentsLoading ? "Loading agents..." : "Filter by mentor"}
                                    value={mentorSearch}
                                    onChange={(e) => { setMentorSearch(e.target.value); setMentorDropdownOpen(true); if (!e.target.value) { setMentorId(""); setPage(1); } }}
                                    onFocus={() => setMentorDropdownOpen(true)}
                                    className="px-3 py-2 text-sm text-gray-700 bg-transparent outline-none w-44"
                                />
                                {mentorId && (
                                    <button
                                        onMouseDown={(e) => { e.preventDefault(); clearMentor(); }}
                                        className="pr-2 text-gray-400 hover:text-gray-600"
                                    >
                                        <Icon icon="lucide:x" width="14" />
                                    </button>
                                )}
                            </div>
                            {mentorDropdownOpen && filteredMentors.length > 0 && (
                                <ul className="absolute z-50 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                    {filteredMentors.map((agent) => (
                                        <li
                                            key={agent.id}
                                            onMouseDown={(e) => { e.preventDefault(); selectMentor(agent); }}
                                            className="px-3 py-2 hover:bg-gray-50 cursor-pointer"
                                        >
                                            <p className="text-sm font-semibold text-gray-900">{agentFullName(agent) || agentEmail(agent)}</p>
                                            {agentFullName(agent) && agentEmail(agent) && <p className="text-xs text-gray-400 mt-0.5">{agentEmail(agent)}</p>}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Mentee combobox */}
                        <div ref={menteeComboRef} className="relative">
                            <div className="flex items-center border border-gray-200 rounded-lg bg-white overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
                                <input
                                    type="text"
                                    placeholder={agentsLoading ? "Loading agents..." : "Filter by mentee"}
                                    value={menteeSearch}
                                    onChange={(e) => { setMenteeSearch(e.target.value); setMenteeDropdownOpen(true); if (!e.target.value) { setMenteeId(""); setPage(1); } }}
                                    onFocus={() => setMenteeDropdownOpen(true)}
                                    className="px-3 py-2 text-sm text-gray-700 bg-transparent outline-none w-44"
                                />
                                {menteeId && (
                                    <button
                                        onMouseDown={(e) => { e.preventDefault(); clearMentee(); }}
                                        className="pr-2 text-gray-400 hover:text-gray-600"
                                    >
                                        <Icon icon="lucide:x" width="14" />
                                    </button>
                                )}
                            </div>
                            {menteeDropdownOpen && filteredMentees.length > 0 && (
                                <ul className="absolute z-50 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                    {filteredMentees.map((agent) => (
                                        <li
                                            key={agent.id}
                                            onMouseDown={(e) => { e.preventDefault(); selectMentee(agent); }}
                                            className="px-3 py-2 hover:bg-gray-50 cursor-pointer"
                                        >
                                            <p className="text-sm font-semibold text-gray-900">{agentFullName(agent) || agentEmail(agent)}</p>
                                            {agentFullName(agent) && agentEmail(agent) && <p className="text-xs text-gray-400 mt-0.5">{agentEmail(agent)}</p>}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Status filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                            <option value="">All</option>
                            <option value="PENDING">Pending</option>
                            <option value="ACTIVE">Active</option>
                            <option value="PAUSED">Paused</option>
                            <option value="ENDED">Ended</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader />
                    </div>
                ) : mentorships.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    <th className="px-6 py-3 text-left">Mentor</th>
                                    <th className="px-6 py-3 text-left">Mentee</th>
                                    <th className="px-6 py-3 text-left">Status</th>
                                    <th className="px-6 py-3 text-left">Flagged</th>
                                    <th className="px-6 py-3 text-left">Started</th>
                                    <th className="px-6 py-3 text-left">Created</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {mentorships.map((m, index) => {
                                    const statusCfg = STATUS_CONFIG[m.status] ?? STATUS_CONFIG.ENDED;
                                    return (
                                        <tr
                                            key={m.id}
                                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                                            onClick={() => navigateToDetail(m.id)}
                                        >
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-medium text-gray-900">{fullName(m.mentor, m.mentor_id)}</p>
                                                {m.mentor?.email && <p className="text-xs text-gray-500">{m.mentor.email}</p>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-gray-700">{fullName(m.mentee, m.mentee_id)}</p>
                                                {m.mentee?.email && <p className="text-xs text-gray-500">{m.mentee.email}</p>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}>
                                                    {m.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {m.is_flagged ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                                                        <Icon icon="mdi:flag" width="14" /> Yes
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {m.started_at ? formatDate(m.started_at) : "—"}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {formatDate(m.created_at)}
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

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
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
                            <Icon icon="hugeicons:album-not-found-01" width="32" height="32" className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No mentorship mappings found</h3>
                    </div>
                )}
            </div>

            {/* Context menu */}
            {contextMentorship && modalPosition && (
                <div
                    ref={menuRef}
                    className="fixed bg-white shadow-xl rounded-lg z-50 border border-gray-200 overflow-hidden min-w-[160px]"
                    style={{ top: modalPosition.top, left: modalPosition.left }}
                >
                    <button
                        className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 transition-colors border-b border-gray-100"
                        onClick={(e) => { e.stopPropagation(); setSelectedRow(null); navigateToDetail(contextMentorship.id); }}
                    >
                        <span className="text-gray-500"><LuEye /></span>
                        <span>View details</span>
                    </button>

                    {/* Status transitions — hide the current status. PENDING is not a
                        valid transition target: admin PATCH only accepts ACTIVE/PAUSED/ENDED
                        since the acceptance flow was removed. */}
                    {(["ACTIVE", "PAUSED", "ENDED"] as const)
                        .filter((s) => s !== contextMentorship.status)
                        .map((s) => {
                            const icons: Record<string, string> = {
                                ACTIVE:  "mdi:check-circle-outline",
                                PAUSED:  "mdi:pause-circle-outline",
                                ENDED:   "mdi:stop-circle-outline",
                            };
                            const colors: Record<string, string> = {
                                ACTIVE:  "text-green-600",
                                PAUSED:  "text-yellow-600",
                                ENDED:   "text-gray-500",
                            };
                            return (
                                <button
                                    key={s}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 transition-colors border-b last:border-b-0 border-gray-100"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setStatusTarget({ id: contextMentorship.id, newStatus: s, name: fullName(contextMentorship.mentor, contextMentorship.mentor_id) });
                                        setSelectedRow(null);
                                    }}
                                >
                                    <Icon icon={icons[s]} width="14" className={colors[s]} />
                                    <span>Set {s.charAt(0) + s.slice(1).toLowerCase()}</span>
                                </button>
                            );
                        })
                    }
                </div>
            )}

            {/* Status update confirm modal */}
            {statusTarget && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="p-6">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <Icon icon="mdi:swap-horizontal" width="24" className="text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">Update status?</h3>
                            <p className="text-sm text-gray-500">
                                Set this mentorship to{" "}
                                <span className="font-semibold text-gray-700">{statusTarget.newStatus}</span>?
                                This action will be applied immediately.
                            </p>
                        </div>
                        <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-gray-100">
                            <button
                                onClick={() => setStatusTarget(null)}
                                className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleStatusUpdate}
                                disabled={isUpdatingStatus}
                                className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20"
                            >
                                Yes, update
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Mapping modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Create Mentorship Mapping</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Assign a mentor to guide a mentee agent</p>
                            </div>
                            <button
                                onClick={resetCreateModal}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <Icon icon="lucide:x" width="18" className="text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* Info banner */}
                            <div className="flex gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                <Icon icon="mdi:information-outline" width="18" className="text-blue-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-blue-700 leading-relaxed">
                                    This creates a mentorship relationship between two agents. The selected mentor (Silver-tier or above) will be paired with the mentee. The mapping becomes <span className="font-semibold">ACTIVE</span> immediately and the mentee is notified. It will fail if the mentee is already in a paused or existing mentorship.
                                </p>
                            </div>

                            {/* Mentor combobox */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Mentor Agent</label>
                                <div ref={createMentorRef} className="relative">
                                    <div className={`flex items-center border rounded-xl bg-gray-50/50 overflow-hidden transition-all ${createMentorId ? "border-primary" : "border-gray-200"} focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary`}>
                                        <input
                                            type="text"
                                            placeholder={agentsLoading ? "Loading agents..." : "Search mentor by name…"}
                                            value={createMentorSearch}
                                            onChange={(e) => { setCreateMentorSearch(e.target.value); setCreateMentorOpen(true); if (!e.target.value) setCreateMentorId(""); }}
                                            onFocus={() => setCreateMentorOpen(true)}
                                            className="flex-1 px-4 py-3 text-sm text-gray-700 bg-transparent outline-none"
                                        />
                                        {createMentorId ? (
                                            <button
                                                onMouseDown={(e) => { e.preventDefault(); setCreateMentorSearch(""); setCreateMentorId(""); }}
                                                className="pr-3 text-gray-400 hover:text-gray-600"
                                            >
                                                <Icon icon="lucide:x" width="14" />
                                            </button>
                                        ) : (
                                            <Icon icon="mdi:chevron-down" width="18" className="mr-3 text-gray-400" />
                                        )}
                                    </div>
                                    {createMentorOpen && filteredCreateMentors.length > 0 && (
                                        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                                            {filteredCreateMentors.map((agent) => (
                                                <li
                                                    key={agent.id}
                                                    onMouseDown={(e) => { e.preventDefault(); setCreateMentorSearch(agentDisplayName(agent)); setCreateMentorId(agent.id); setCreateMentorOpen(false); }}
                                                    className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer first:rounded-t-xl last:rounded-b-xl"
                                                >
                                                    <p className="text-sm font-semibold text-gray-900">{agentFullName(agent) || agentEmail(agent)}</p>
                                                    {agentFullName(agent) && agentEmail(agent) && <p className="text-xs text-gray-400 mt-0.5">{agentEmail(agent)}</p>}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            {/* Mentee combobox */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Mentee Agent</label>
                                <div ref={createMenteeRef} className="relative">
                                    <div className={`flex items-center border rounded-xl bg-gray-50/50 overflow-hidden transition-all ${createMenteeId ? "border-primary" : "border-gray-200"} focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary`}>
                                        <input
                                            type="text"
                                            placeholder={agentsLoading ? "Loading agents..." : "Search mentee by name…"}
                                            value={createMenteeSearch}
                                            onChange={(e) => { setCreateMenteeSearch(e.target.value); setCreateMenteeOpen(true); if (!e.target.value) setCreateMenteeId(""); }}
                                            onFocus={() => setCreateMenteeOpen(true)}
                                            className="flex-1 px-4 py-3 text-sm text-gray-700 bg-transparent outline-none"
                                        />
                                        {createMenteeId ? (
                                            <button
                                                onMouseDown={(e) => { e.preventDefault(); setCreateMenteeSearch(""); setCreateMenteeId(""); }}
                                                className="pr-3 text-gray-400 hover:text-gray-600"
                                            >
                                                <Icon icon="lucide:x" width="14" />
                                            </button>
                                        ) : (
                                            <Icon icon="mdi:chevron-down" width="18" className="mr-3 text-gray-400" />
                                        )}
                                    </div>
                                    {createMenteeOpen && filteredCreateMentees.length > 0 && (
                                        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                                            {filteredCreateMentees.map((agent) => (
                                                <li
                                                    key={agent.id}
                                                    onMouseDown={(e) => { e.preventDefault(); setCreateMenteeSearch(agentDisplayName(agent)); setCreateMenteeId(agent.id); setCreateMenteeOpen(false); }}
                                                    className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer first:rounded-t-xl last:rounded-b-xl"
                                                >
                                                    <p className="text-sm font-semibold text-gray-900">{agentFullName(agent) || agentEmail(agent)}</p>
                                                    {agentFullName(agent) && agentEmail(agent) && <p className="text-xs text-gray-400 mt-0.5">{agentEmail(agent)}</p>}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="mt-2 pt-4 px-6 pb-6 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                onClick={resetCreateModal}
                                className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => setShowCreateConfirm(true)}
                                disabled={!createMentorId || !createMenteeId}
                                className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                            >
                                <Icon icon="mdi:plus" width="14" />
                                Create Mapping
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create confirm modal */}
            {showCreateConfirm && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="p-6">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <Icon icon="mdi:account-multiple-plus" width="24" className="text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">Create mentorship mapping?</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                You are about to pair <span className="font-semibold text-gray-700">{createMentorSearch}</span> as mentor with <span className="font-semibold text-gray-700">{createMenteeSearch}</span> as mentee. The mapping becomes <span className="font-semibold">ACTIVE</span> immediately and the mentee is notified.
                            </p>
                        </div>
                        <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-gray-100">
                            <button
                                onClick={() => setShowCreateConfirm(false)}
                                className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => { setShowCreateConfirm(false); handleCreate(); }}
                                disabled={isCreating}
                                className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20"
                            >
                                Yes, create
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

'use client'

import { MESSAGES } from '@/src/lib/messages';
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/hooks/useAuth";
import axiosRequest from "@/src/lib/api";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import { DotsIcon } from "../../icons";
import { Icon } from "@iconify/react/dist/iconify.js";
import { formatDate, isSameId } from "@/src/lib/utils";
import Loader from "@/src/components/loader";
import { LuEye, LuPencil, LuCheck, LuPause, LuX, LuClock } from "react-icons/lu";
import { toast } from "react-hot-toast";
import { UserRole } from "@/src/lib/enums";
import { GetNetworkStanding } from "@/src/lib/request-handlers/networkMgt";

type Role = "AREA_MANAGER" | "REGIONAL_LEAD";
type EmploymentMode = "COMMISSION_ONLY" | "SALARIED_OVERLAY";
type AssignmentStatus = "ACTIVE" | "SUSPENDED" | "ENDED" | "EXPIRED";

interface ZoneAssignment {
    id: string;
    user_id: string;
    zone_id: string;
    role: Role;
    override_rate: number;
    monthly_gbv_threshold: number;
    employment_mode: EmploymentMode;
    start_date?: string | null;
    end_date?: string | null;
    status?: AssignmentStatus;
    zone?: { id: string; name: string; type: string };
    user?: { id?: string; first_name?: string; last_name?: string; email?: string; profile?: { first_name?: string; last_name?: string } };
}

interface Zone { id: string; name: string; type: string; }
interface Agent {
    id: string;
    email?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    profile?: {
        first_name?: string | null;
        last_name?: string | null;
        firstName?: string | null;
        lastName?: string | null;
        email?: string | null;
    };
}

const ROLE_CONFIG: Record<Role, { label: string; bg: string; text: string; border: string; defaultRate: number; defaultThreshold: number }> = {
    AREA_MANAGER:  { label: "Area Manager",   bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200",   defaultRate: 3, defaultThreshold: 5000000  },
    REGIONAL_LEAD: { label: "Regional Lead",  bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", defaultRate: 1, defaultThreshold: 25000000 },
};

const MODE_CONFIG: Record<EmploymentMode, { label: string; bg: string; text: string }> = {
    COMMISSION_ONLY:  { label: "Commission Only",  bg: "bg-green-100",  text: "text-green-800"  },
    SALARIED_OVERLAY: { label: "Salaried Overlay", bg: "bg-amber-100",  text: "text-amber-800"  },
};

const STATUS_CONFIG: Record<AssignmentStatus, { label: string; bg: string; text: string; border: string; icon: React.ReactElement }> = {
    ACTIVE:    { label: "Active",    bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200",  icon: <LuCheck className="text-green-600" />   },
    SUSPENDED: { label: "Suspended", bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", icon: <LuPause className="text-yellow-600" />  },
    ENDED:     { label: "Ended",     bg: "bg-gray-100",  text: "text-gray-600",   border: "border-gray-200",   icon: <LuX className="text-gray-500" />        },
    EXPIRED:   { label: "Expired",   bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200",    icon: <LuClock className="text-red-500" />     },
};

function resolveAssignmentUser(a: ZoneAssignment, agentsList: Agent[]): ZoneAssignment["user"] | undefined {
    return a.user ?? (agentsList.find(ag => ag.id === a.user_id) as ZoneAssignment["user"] | undefined);
}

function resolveAssignmentZone(a: ZoneAssignment, zonesList: Zone[]): Zone | undefined {
    return a.zone ?? zonesList.find(z => z.id === a.zone_id);
}

function agentName(user?: ZoneAssignment["user"]): string {
    if (!user) return "—";
    const first = user.first_name || user.profile?.first_name || "";
    const last  = user.last_name  || user.profile?.last_name  || "";
    return [first, last].filter(Boolean).join(" ") || user.email || "—";
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

function formatNGN(amount: number) {
    return `₦${amount.toLocaleString()}`;
}

export default function NetworkZoneAssignmentsTable() {
    const router = useRouter();
    const { user } = useAuth();
    const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
    // A Regional Lead's tree holds the Area Managers running the cities beneath
    // them — the roster they are accountable for — so their list is widened and
    // gains the same scope / role / zone narrowing the admin table has.
    const { data: standing } = GetNetworkStanding(user?.role as UserRole | undefined);
    const isZoneManager = Boolean(standing?.isZoneManager);
    const showFilters = isAdmin || isZoneManager;
    const [assignments, setAssignments] = useState<ZoneAssignment[]>([]);
    const [isLoading, setIsLoading]     = useState(false);
    const [page, setPage]               = useState(1);
    const [totalPages, setTotalPages]   = useState(1);
    const [roleFilter, setRoleFilter]     = useState("");
    const [zoneFilter, setZoneFilter]     = useState("");
    // Mirrors the scope param on GET /network/zone-assignments: "all" (own rows
    // plus the zone tree's), "mine", "zone". Agent-side only — the admin table
    // is unscoped.
    const [scope, setScope]               = useState("all");
    const [zoneSearch, setZoneSearch]     = useState("");
    const [zoneDropdownOpen, setZoneDropdownOpen] = useState(false);

    const [zones, setZones]           = useState<Zone[]>([]);
    // Zone options for a zone manager, harvested from the rows the endpoint
    // returns — every zone on a returned row is inside the tree it authorises,
    // so `zone_id` drawn from here can never come back 403. Accumulated rather
    // than derived from the current page: once a zone filter is applied the
    // page holds only that zone, and a derived list would collapse to it.
    const [agentZones, setAgentZones] = useState<Zone[]>([]);
    const [agents, setAgents]         = useState<Agent[]>([]);
    const [agentsLoading, setAgentsLoading] = useState(false);

    const [selectedRow, setSelectedRow]     = useState<number | null>(null);
    const [modalPosition, setModalPosition] = useState<{ top: number; left: number } | null>(null);
    const [viewAssignment, setViewAssignment] = useState<ZoneAssignment | null>(null);

    // Create
    const [showCreateModal, setShowCreateModal]     = useState(false);
    const [showCreateConfirm, setShowCreateConfirm] = useState(false);
    const [isCreating, setIsCreating]               = useState(false);
    const [createAgentId, setCreateAgentId]         = useState("");
    const [createAgentSearch, setCreateAgentSearch] = useState("");
    const [agentDropdownOpen, setAgentDropdownOpen] = useState(false);
    const [createZoneId, setCreateZoneId]           = useState("");
    const [createRole, setCreateRole]               = useState<Role>("AREA_MANAGER");
    const [createOverrideRate, setCreateOverrideRate]         = useState(3);
    const [createGbvThreshold, setCreateGbvThreshold]         = useState(5000000);
    const [createEmploymentMode, setCreateEmploymentMode]     = useState<EmploymentMode>("COMMISSION_ONLY");
    const [createStartDate, setCreateStartDate]               = useState("");
    const [createEndDate, setCreateEndDate]                   = useState("");

    // Edit
    const [editAssignment, setEditAssignment]                 = useState<ZoneAssignment | null>(null);
    const [showEditConfirm, setShowEditConfirm]               = useState(false);
    const [isSaving, setIsSaving]                             = useState(false);
    const [editOverrideRate, setEditOverrideRate]             = useState(0);
    const [editGbvThreshold, setEditGbvThreshold]             = useState(0);
    const [editEmploymentMode, setEditEmploymentMode]         = useState<EmploymentMode>("COMMISSION_ONLY");
    const [editEndDate, setEditEndDate]                       = useState("");

    // Quick status update
    const [statusUpdateTarget, setStatusUpdateTarget] = useState<ZoneAssignment | null>(null);
    const [pendingStatus, setPendingStatus]           = useState<AssignmentStatus | null>(null);
    const [isUpdatingStatus, setIsUpdatingStatus]     = useState(false);

    // Payout job
    const [showPayoutConfirm, setShowPayoutConfirm] = useState(false);
    const [isRunningPayout, setIsRunningPayout]     = useState(false);

    const menuRef        = useRef<HTMLDivElement>(null);
    const agentComboRef  = useRef<HTMLDivElement>(null);
    const zoneComboRef   = useRef<HTMLDivElement>(null);

    const fetchAssignments = useCallback(async () => {
        setIsLoading(true);
        try {
            const params: Record<string, any> = { page, size: 20 };
            if (roleFilter) params.role    = roleFilter;
            if (zoneFilter) params.zone_id = zoneFilter;
            // scope is agent-side only — the admin listing is already unscoped,
            // and /admin/... would reject the param.
            if (!isAdmin && scope !== "all") params.scope = scope;
            const endpoint = isAdmin
                ? API_ROUTES.network.configs.zones.assignments.base
                : API_ROUTES.network.myZoneAssignments;
            const res = await axiosRequest.get(endpoint, { params });
            const data = res?.data?.data ?? res?.data;
            const items = data?.items ?? data?.data ?? (Array.isArray(data) ? data : []);
            setAssignments(items);
            if (!isAdmin) {
                setAgentZones((prev) => {
                    const merged = new Map(prev.map((z) => [z.id, z]));
                    (items as ZoneAssignment[]).forEach((a) => {
                        if (a.zone?.id) merged.set(a.zone.id, a.zone);
                    });
                    return Array.from(merged.values());
                });
            }
            const total = data?.total ?? items.length;
            setTotalPages(Math.max(1, Math.ceil(total / 20)));
        } catch (error: any) {
            toast.error(error?.response?.data?.detail || error?.response?.data?.message || "Failed to fetch zone assignments");
        } finally {
            setIsLoading(false);
        }
    }, [page, roleFilter, zoneFilter, scope, isAdmin]);

    useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

    // Load zones + agents (admin only — agents have zone info embedded in their assignments)
    useEffect(() => {
        if (!isAdmin) return;

        axiosRequest.get(API_ROUTES.network.configs.zones.base, { params: { page: 1, size: 200 } })
            .then((res) => {
                const data = res?.data?.data ?? res?.data;
                const items = data?.items ?? data?.data ?? (Array.isArray(data) ? data : []);
                setZones(items);
            }).catch(() => {});

        setAgentsLoading(true);
        axiosRequest.get(API_ROUTES.admin.users.base, { params: { role: "AGENT", page: 1, size: 100 } })
            .then((res) => {
                const data = res?.data?.data;
                setAgents(data?.data ?? []);
            }).catch(() => {})
            .finally(() => setAgentsLoading(false));
    }, [isAdmin]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setSelectedRow(null);
            if (agentComboRef.current && !agentComboRef.current.contains(e.target as Node)) setAgentDropdownOpen(false);
            if (zoneComboRef.current && !zoneComboRef.current.contains(e.target as Node)) setZoneDropdownOpen(false);
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

    const resetCreate = () => {
        setShowCreateModal(false);
        setShowCreateConfirm(false);
        setCreateAgentId("");
        setCreateAgentSearch("");
        setCreateZoneId("");
        setCreateRole("AREA_MANAGER");
        setCreateOverrideRate(0.03);
        setCreateGbvThreshold(5000000);
        setCreateEmploymentMode("COMMISSION_ONLY");
        setCreateStartDate("");
        setCreateEndDate("");
    };

    const onRoleChange = (role: Role) => {
        setCreateRole(role);
        setCreateOverrideRate(ROLE_CONFIG[role].defaultRate);
        setCreateGbvThreshold(ROLE_CONFIG[role].defaultThreshold);
    };

    const handleCreate = async () => {
        setIsCreating(true);
        try {
            await toast.promise(
                axiosRequest.post(API_ROUTES.network.configs.zones.assignments.base, {
                    user_id: createAgentId,
                    zone_id: createZoneId,
                    role: createRole,
                    override_rate: createOverrideRate / 100,
                    monthly_gbv_threshold: createGbvThreshold,
                    employment_mode: createEmploymentMode,
                    ...(createStartDate ? { start_date: createStartDate } : {}),
                    ...(createEndDate   ? { end_date:   createEndDate   } : {}),
                }),
                {
                    loading: "Creating assignment...",
                    success: "Zone assignment created",
                    error: (err) => err?.response?.data?.detail || err?.response?.data?.message || "Failed to create assignment",
                }
            );
            resetCreate();
            fetchAssignments();
        } catch {
        } finally {
            setIsCreating(false);
        }
    };

    const openEdit = (a: ZoneAssignment) => {
        setEditAssignment(a);
        setEditOverrideRate(parseFloat((a.override_rate * 100).toFixed(4)));
        setEditGbvThreshold(a.monthly_gbv_threshold);
        setEditEmploymentMode(a.employment_mode);
        setEditEndDate(a.end_date ?? "");
        setSelectedRow(null);
    };

    const handleEdit = async () => {
        if (!editAssignment) return;
        setIsSaving(true);
        try {
            await toast.promise(
                axiosRequest.patch(API_ROUTES.network.configs.zones.assignments.details(editAssignment.id), {
                    override_rate: editOverrideRate / 100,
                    monthly_gbv_threshold: editGbvThreshold,
                    employment_mode: editEmploymentMode,
                    ...(editEndDate ? { end_date: editEndDate } : {}),
                }),
                {
                    loading: "Saving changes...",
                    success: "Assignment updated",
                    error: (err) => err?.response?.data?.detail || err?.response?.data?.message || "Failed to update assignment",
                }
            );
            setEditAssignment(null);
            setShowEditConfirm(false);
            fetchAssignments();
        } catch {
        } finally {
            setIsSaving(false);
        }
    };

    const handleStatusUpdate = async () => {
        if (!statusUpdateTarget || !pendingStatus) return;
        setIsUpdatingStatus(true);
        try {
            await toast.promise(
                axiosRequest.patch(API_ROUTES.network.configs.zones.assignments.details(statusUpdateTarget.id), {
                    status: pendingStatus,
                }),
                {
                    loading: "Updating status...",
                    success: "Assignment status updated",
                    error: (err) => err?.response?.data?.detail || err?.response?.data?.message || "Failed to update status",
                }
            );
            setStatusUpdateTarget(null);
            setPendingStatus(null);
            fetchAssignments();
        } catch {
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handlePayout = async () => {
        setIsRunningPayout(true);
        try {
            await toast.promise(
                axiosRequest.post(API_ROUTES.network.zonePayoutJob),
                {
                    loading: "Running zone payout job...",
                    success: "Zone payout job completed successfully",
                    error: (err) => err?.response?.data?.detail || err?.response?.data?.message || "Zone payout job failed",
                }
            );
            setShowPayoutConfirm(false);
        } catch {
        } finally {
            setIsRunningPayout(false);
        }
    };

    const zoneOptions = isAdmin ? zones : agentZones;

    const filteredAgents = agents.filter((a) => agentDisplayName(a).toLowerCase().includes(createAgentSearch.toLowerCase()));
    const contextAssignment = selectedRow !== null ? assignments[selectedRow] : null;

    return (
        <div className="p-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">Zone Assignments</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {isAdmin
                                    ? "Assign Area Managers and Regional Leads to geographic zones"
                                    : isZoneManager
                                        ? "Your assignment, and every assignment inside the zone you manage"
                                        : "Your zone assignment and role details"}
                            </p>
                        </div>
                        {isAdmin && (
                            <div className="flex items-center gap-2 flex-wrap">
                                <button
                                    onClick={() => setShowPayoutConfirm(true)}
                                    disabled={isRunningPayout}
                                    className="px-4 py-2.5 text-sm font-bold text-emerald-600 bg-transparent border border-emerald-600 rounded-xl hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                                >
                                    <Icon icon="lucide:coins" width="16" />
                                    Run Zone Payout
                                </button>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                                >
                                    <Icon icon="mdi:plus" width="16" />
                                    Create Assignment
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Filters — admins and zone managers; a plain agent has one row */}
                    {showFilters && (
                    <div className="mt-4 flex items-center gap-3 flex-wrap">
                        {/* Zone search-select */}
                        <div className="relative" ref={zoneComboRef}>
                            <input
                                type="text"
                                value={zoneSearch}
                                onChange={(e) => { setZoneSearch(e.target.value); setZoneDropdownOpen(true); if (!e.target.value) { setZoneFilter(""); setPage(1); } }}
                                onFocus={() => setZoneDropdownOpen(true)}
                                onBlur={() => setZoneDropdownOpen(false)}
                                placeholder="Search zone..."
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-48"
                            />
                            {zoneFilter && (
                                <button
                                    onMouseDown={(e) => { e.preventDefault(); setZoneFilter(""); setZoneSearch(""); setPage(1); }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <Icon icon="mdi:close-circle" width="14" />
                                </button>
                            )}
                            {zoneDropdownOpen && (
                                <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                                    {zoneOptions
                                        .filter((z) => z.name.toLowerCase().includes(zoneSearch.toLowerCase()))
                                        .map((z) => (
                                            <li
                                                key={z.id}
                                                onMouseDown={(e) => { e.preventDefault(); setZoneFilter(z.id); setZoneSearch(z.name); setZoneDropdownOpen(false); setPage(1); }}
                                                className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 ${zoneFilter === z.id ? "bg-primary/5 font-medium text-primary" : "text-gray-700"}`}
                                            >
                                                {z.name} <span className="text-xs text-gray-400">({z.type})</span>
                                            </li>
                                        ))}
                                    {zoneOptions.filter((z) => z.name.toLowerCase().includes(zoneSearch.toLowerCase())).length === 0 && (
                                        <li className="px-3 py-2 text-sm text-gray-400 italic">No zones found</li>
                                    )}
                                </ul>
                            )}
                        </div>
                        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                            <option value="">All Roles</option>
                            <option value="AREA_MANAGER">Area Manager</option>
                            <option value="REGIONAL_LEAD">Regional Lead</option>
                        </select>

                        {!isAdmin && isZoneManager && (
                            <select
                                value={scope}
                                onChange={(e) => { setScope(e.target.value); setPage(1); }}
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-w-[180px]"
                            >
                                <option value="all">Everyone</option>
                                <option value="mine">My assignments only</option>
                                <option value="zone">My zone only</option>
                            </select>
                        )}

                        {(roleFilter || zoneFilter || scope !== "all") && (
                            <button
                                onClick={() => { setRoleFilter(""); setZoneFilter(""); setZoneSearch(""); setScope("all"); setPage(1); }}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Icon icon="lucide:x" width="16" height="16" />
                                Clear
                            </button>
                        )}
                    </div>
                    )}
                </div>

                {/* Table */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12"><Loader /></div>
                ) : assignments.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    <th className="px-6 py-3 text-left">Zone</th>
                                    <th className="px-6 py-3 text-left">Agent</th>
                                    <th className="px-6 py-3 text-left">Role</th>
                                    <th className="px-6 py-3 text-left">Override Rate</th>
                                    <th className="px-6 py-3 text-left">GBV Threshold</th>
                                    <th className="px-6 py-3 text-left">Status</th>
                                    <th className="px-6 py-3 text-left">Start Date</th>
                                    {isAdmin && <th className="px-6 py-3 text-right">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {assignments.map((a, index) => {
                                    const roleCfg = ROLE_CONFIG[a.role];
                                    const resolvedZone = resolveAssignmentZone(a, zones);
                                    const resolvedUser = resolveAssignmentUser(a, agents);
                                    return (
                                        <tr key={a.id} className="hover:bg-gray-50 transition-colors cursor-pointer"
                                            onClick={() => router.push(PAGE_ROUTES.dashboard.network.zoneAssignments.details(a.id))}
                                        >
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-medium text-gray-900">{resolvedZone?.name ?? "—"}</p>
                                                {resolvedZone?.type && <p className="text-xs text-gray-400">{resolvedZone.type}</p>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-medium text-gray-900">{agentName(resolvedUser)}</p>
                                                    {/* A zone manager's list carries other managers' rows;
                                                        without this their own is indistinguishable. */}
                                                    {!isAdmin && isSameId(a.user_id, user?.id) && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                                                            You
                                                        </span>
                                                    )}
                                                </div>
                                                {resolvedUser?.email && <p className="text-xs text-gray-500">{resolvedUser.email}</p>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleCfg.bg} ${roleCfg.text} ${roleCfg.border}`}>
                                                    {roleCfg.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">{(a.override_rate * 100).toFixed(1)}%</td>
                                            <td className="px-6 py-4 text-sm text-gray-700">{formatNGN(a.monthly_gbv_threshold)}</td>
                                            <td className="px-6 py-4">
                                                {(() => {
                                                    const cfg = a.status ? STATUS_CONFIG[a.status] : null;
                                                    return cfg ? (
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                                                            {cfg.label}
                                                        </span>
                                                    ) : <span className="text-sm text-gray-400">—</span>;
                                                })()}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">{a.start_date ? formatDate(a.start_date) : "—"}</td>
                                            {isAdmin && (
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end" onClick={(e) => handleDotsClick(e, index)}>
                                                        <DotsIcon className="w-5 cursor-pointer hover:text-primary transition-colors text-gray-400" />
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {totalPages > 1 && (
                            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
                                <div className="flex items-center gap-2">
                                    <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Previous</button>
                                    <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Next</button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4"><Icon icon="hugeicons:album-not-found-01" width="32" height="32" className="text-gray-400" /></div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No zone assignments found</h3>
                    </div>
                )}
            </div>

            {/* Context menu */}
            {contextAssignment && modalPosition && (
                <div ref={menuRef} className="fixed bg-white shadow-xl rounded-lg z-50 border border-gray-200 overflow-hidden min-w-[160px]" style={{ top: modalPosition.top, left: modalPosition.left }}>
                    {[
                        { label: "View", Icon: <LuEye />, onClick: () => { router.push(PAGE_ROUTES.dashboard.network.zoneAssignments.details(contextAssignment.id)); setSelectedRow(null); } },
                        { label: "Edit", Icon: <LuPencil />, onClick: () => { router.push(`${PAGE_ROUTES.dashboard.network.zoneAssignments.details(contextAssignment.id)}?edit=true`); setSelectedRow(null); } },
                    ].map((btn, i) => (
                        <button key={i} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 transition-colors border-b border-gray-100"
                            onClick={(e) => { e.stopPropagation(); btn.onClick(); }}>
                            <span className="text-gray-500">{btn.Icon}</span>
                            <span>{btn.label}</span>
                        </button>
                    ))}
                    {/* Status shortcuts — only show statuses other than current */}
                    {(["ACTIVE", "SUSPENDED", "ENDED", "EXPIRED"] as AssignmentStatus[])
                        .filter((s) => s !== contextAssignment.status)
                        .map((s) => {
                            const cfg = STATUS_CONFIG[s];
                            return (
                                <button
                                    key={s}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-sm transition-colors border-b last:border-b-0 border-gray-100"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setStatusUpdateTarget(contextAssignment);
                                        setPendingStatus(s);
                                        setSelectedRow(null);
                                    }}
                                >
                                    <span className="flex-shrink-0">{cfg.icon}</span>
                                    <span className={`${cfg.text} font-medium`}>Set {cfg.label}</span>
                                </button>
                            );
                        })}
                </div>
            )}

            {/* View modal */}
            {viewAssignment && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">Assignment Details</h3>
                            <button onClick={() => setViewAssignment(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><Icon icon="lucide:x" width="18" className="text-gray-500" /></button>
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-x-6 gap-y-4">
                            {([
                                ["Agent",          agentName(resolveAssignmentUser(viewAssignment, agents))],
                                ["Zone",           (() => { const z = resolveAssignmentZone(viewAssignment, zones); return z ? `${z.name} (${z.type})` : "—"; })()],
                                ["Role",           <span key="role" className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${ROLE_CONFIG[viewAssignment.role].bg} ${ROLE_CONFIG[viewAssignment.role].text} ${ROLE_CONFIG[viewAssignment.role].border}`}>{ROLE_CONFIG[viewAssignment.role].label}</span>],
                                ["Status",         (() => { const cfg = viewAssignment.status ? STATUS_CONFIG[viewAssignment.status] : null; return cfg ? <span key="status" className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>{cfg.label}</span> : <span key="status">—</span>; })()],
                                ["Override Rate",  `${(viewAssignment.override_rate * 100).toFixed(1)}%`],
                                ["GBV Threshold",  formatNGN(viewAssignment.monthly_gbv_threshold)],
                                ["Employment",     <span key="employment" className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${MODE_CONFIG[viewAssignment.employment_mode].bg} ${MODE_CONFIG[viewAssignment.employment_mode].text}`}>{MODE_CONFIG[viewAssignment.employment_mode].label}</span>],
                                ["Start Date",     viewAssignment.start_date ? formatDate(viewAssignment.start_date) : "—"],
                                ["End Date",       viewAssignment.end_date   ? formatDate(viewAssignment.end_date)   : "—"],
                            ] as [string, React.ReactNode][]).map(([label, value]) => (
                                <div key={label} className="space-y-1">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
                                    <div className="text-sm font-medium text-gray-900">{value}</div>
                                </div>
                            ))}
                        </div>
                        {isAdmin && (
                            <div className="px-6 pb-6 flex justify-end gap-3">
                                <button onClick={() => { setViewAssignment(null); openEdit(viewAssignment); }} className="px-6 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
                                    <Icon icon="mdi:pencil" width="14" /> Edit
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Create modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Create Zone Assignment</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Assign an Area Manager or Regional Lead to a zone</p>
                            </div>
                            <button onClick={resetCreate} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><Icon icon="lucide:x" width="18" className="text-gray-500" /></button>
                        </div>
                        <div className="p-6 space-y-5 overflow-y-auto">
                            {/* Info banner */}
                            <div className="flex gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                <Icon icon="mdi:information-outline" width="18" className="text-blue-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-blue-700 leading-relaxed">
                                    Area Managers earn <span className="font-semibold">3% of zone platform margin</span> for zones above ₦5M/month GBV. Regional Leads earn <span className="font-semibold">1% of region margin</span> for regions above ₦25M/month. Earnings unlock only above the GBV threshold — pre-threshold zones earn nothing (or operate on salaried model).
                                </p>
                            </div>

                            {/* Agent combobox */}
                            <div className="space-y-2" ref={agentComboRef}>
                                <label className="text-sm font-semibold text-gray-700">Agent</label>
                                <div className="relative">
                                    <input type="text" value={createAgentSearch} onChange={(e) => { setCreateAgentSearch(e.target.value); setCreateAgentId(""); setAgentDropdownOpen(true); }} onFocus={() => setAgentDropdownOpen(true)}
                                        placeholder={agentsLoading ? "Loading agents..." : "Search agent by name..."}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-gray-50/50" />
                                    {agentDropdownOpen && !agentsLoading && (
                                        <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                                            {filteredAgents.length > 0 ? filteredAgents.map((a) => (
                                                <li key={a.id} onMouseDown={(e) => { e.preventDefault(); setCreateAgentId(a.id); setCreateAgentSearch(agentDisplayName(a)); setAgentDropdownOpen(false); }}
                                                    className="px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                                                    <p className="font-medium text-gray-900">{agentFullName(a) || agentEmail(a) || "—"}</p>
                                                    {agentFullName(a) && agentEmail(a) && (
                                                        <p className="text-xs text-gray-400 mt-0.5">{agentEmail(a)}</p>
                                                    )}
                                                </li>
                                            )) : <li className="px-4 py-3 text-sm text-gray-400 italic">No agents found</li>}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            {/* Zone */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Zone</label>
                                <select value={createZoneId} onChange={(e) => setCreateZoneId(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-gray-50/50">
                                    <option value="">Select zone…</option>
                                    {zones.map((z) => <option key={z.id} value={z.id}>{z.name} ({z.type})</option>)}
                                </select>
                            </div>

                            {/* Role */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Role</label>
                                <select value={createRole} onChange={(e) => onRoleChange(e.target.value as Role)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-gray-50/50">
                                    <option value="AREA_MANAGER">Area Manager (City / district scope)</option>
                                    <option value="REGIONAL_LEAD">Regional Lead (State / multi-city scope)</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Override rate */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Override Rate</label>
                                    <div className="relative">
                                        <input type="number" step="0.01" min={0} max={100} value={createOverrideRate} onChange={(e) => setCreateOverrideRate(Number(e.target.value))} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-gray-50/50 pr-8" />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                                    </div>
                                </div>
                                {/* GBV threshold */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Monthly GBV Threshold</label>
                                    <input type="number" min={0} value={createGbvThreshold} onChange={(e) => setCreateGbvThreshold(Number(e.target.value))} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-gray-50/50" />
                                    <p className="text-xs text-gray-400">In NGN (e.g. 5000000 = ₦5M)</p>
                                </div>
                            </div>

                            {/* Employment mode */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Employment Mode</label>
                                <select value={createEmploymentMode} onChange={(e) => setCreateEmploymentMode(e.target.value as EmploymentMode)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-gray-50/50">
                                    <option value="COMMISSION_ONLY">Commission Only — earns % of zone margin above threshold</option>
                                    <option value="SALARIED_OVERLAY">Salaried Overlay — salaried until zone hits threshold, then commission</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Start Date</label>
                                    <input type="date" value={createStartDate} onChange={(e) => setCreateStartDate(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-gray-50/50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">End Date <span className="font-normal text-gray-400">(optional)</span></label>
                                    <input type="date" value={createEndDate} onChange={(e) => setCreateEndDate(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-gray-50/50" />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
                            <button onClick={resetCreate} className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
                            <button onClick={() => {
                                if (!createAgentId) { toast.error(MESSAGES.MSG_AGENT_IS_REQUIRED); return; }
                                if (!createZoneId)  { toast.error(MESSAGES.MSG_ZONE_IS_REQUIRED);  return; }
                                setShowCreateConfirm(true);
                            }} className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
                                <Icon icon="mdi:plus" width="14" /> Create
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create confirm */}
            {showCreateConfirm && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="p-6">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4"><Icon icon="mdi:map-marker-account-outline" width="24" className="text-primary" /></div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">Create assignment?</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                Assign <span className="font-semibold text-gray-700">{createAgentSearch}</span> as <span className="font-semibold text-gray-700">{ROLE_CONFIG[createRole].label}</span> to <span className="font-semibold text-gray-700">{zones.find((z) => z.id === createZoneId)?.name ?? "selected zone"}</span> at {createOverrideRate}% override rate.
                            </p>
                        </div>
                        <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-gray-100">
                            <button onClick={() => setShowCreateConfirm(false)} className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
                            <button onClick={() => { setShowCreateConfirm(false); handleCreate(); }} disabled={isCreating} className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20">Yes, create</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit modal */}
            {editAssignment && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Edit Assignment</h3>
                                <p className="text-xs text-gray-500 mt-0.5">{agentName(resolveAssignmentUser(editAssignment, agents))} · {resolveAssignmentZone(editAssignment, zones)?.name}</p>
                            </div>
                            <button onClick={() => setEditAssignment(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><Icon icon="lucide:x" width="18" className="text-gray-500" /></button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">Override Rate</label>
                                    <input type="number" step="0.01" min={0} max={100} value={editOverrideRate} onChange={(e) => setEditOverrideRate(Number(e.target.value))} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-gray-50/50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">GBV Threshold</label>
                                    <input type="number" min={0} value={editGbvThreshold} onChange={(e) => setEditGbvThreshold(Number(e.target.value))} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-gray-50/50" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Employment Mode</label>
                                <select value={editEmploymentMode} onChange={(e) => setEditEmploymentMode(e.target.value as EmploymentMode)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-gray-50/50">
                                    <option value="COMMISSION_ONLY">Commission Only</option>
                                    <option value="SALARIED_OVERLAY">Salaried Overlay</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">End Date <span className="font-normal text-gray-400">(optional)</span></label>
                                <input type="date" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-gray-50/50" />
                            </div>
                        </div>
                        <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-gray-100">
                            <button onClick={() => setEditAssignment(null)} className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
                            <button onClick={() => setShowEditConfirm(true)} className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
                                <Icon icon="mdi:content-save" width="14" /> Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit confirm */}
            {showEditConfirm && editAssignment && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="p-6">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4"><Icon icon="mdi:content-save" width="24" className="text-primary" /></div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">Save changes?</h3>
                            <p className="text-sm text-gray-500">Update assignment for <span className="font-semibold text-gray-700">{agentName(resolveAssignmentUser(editAssignment, agents))}</span> in <span className="font-semibold text-gray-700">{resolveAssignmentZone(editAssignment, zones)?.name}</span>.</p>
                        </div>
                        <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-gray-100">
                            <button onClick={() => setShowEditConfirm(false)} className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
                            <button onClick={() => { setShowEditConfirm(false); handleEdit(); }} disabled={isSaving} className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20">Yes, save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Zone payout confirm */}
            {showPayoutConfirm && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="p-6">
                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4"><Icon icon="lucide:coins" width="24" className="text-emerald-600" /></div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Run Zone Payout?</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                This processes monthly zone payouts for all assigned Area Managers and Regional Leads. Only zones that have met their GBV threshold this month will generate payouts — zones below threshold receive nothing.
                            </p>
                            <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700 leading-relaxed">
                                <span className="font-semibold">Rates:</span> Area Managers earn 3% of zone platform margin · Regional Leads earn 1% of region platform margin. This action cannot be undone — ensure all zone data has been reviewed before proceeding.
                            </div>
                        </div>
                        <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-gray-100">
                            <button onClick={() => setShowPayoutConfirm(false)} className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
                            <button onClick={() => { setShowPayoutConfirm(false); handlePayout(); }} disabled={isRunningPayout} className="px-8 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-600/20">Yes, run payout</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Status update confirm */}
            {statusUpdateTarget && pendingStatus && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="p-6">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <Icon icon="mdi:tag-check-outline" width="24" className="text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">Update status?</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                Change assignment status to{" "}
                                <span className={`font-semibold ${STATUS_CONFIG[pendingStatus].text}`}>
                                    {STATUS_CONFIG[pendingStatus].label}
                                </span>
                                {statusUpdateTarget.zone?.name && (
                                    <> for <span className="font-semibold text-gray-700">{statusUpdateTarget.zone.name}</span></>
                                )}
                                ? This action will take effect immediately.
                            </p>
                        </div>
                        <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-gray-100">
                            <button
                                onClick={() => { setStatusUpdateTarget(null); setPendingStatus(null); }}
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
        </div>
    );
}

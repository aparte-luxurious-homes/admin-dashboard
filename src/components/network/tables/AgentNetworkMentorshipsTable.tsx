'use client'

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import axiosRequest from "@/src/lib/api";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import { Icon } from "@iconify/react/dist/iconify.js";
import { formatDate, isSameId } from "@/src/lib/utils";
import Loader from "@/src/components/loader";
import MenteeCandidatePicker, { MenteeCandidate, candidateName } from "./MenteeCandidatePicker";
import { toast } from "react-hot-toast";
import { useAuth } from "@/src/hooks/useAuth";
import { UserRole } from "@/src/lib/enums";
import { GetNetworkStanding } from "@/src/lib/request-handlers/networkMgt";
import NetworkAgentFilter from "../NetworkAgentFilter";

interface MentorshipUser {
    id?: string;
    email?: string;
    phone?: string;
    role?: string;
    first_name?: string;
    last_name?: string;
    profile_image?: string;
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

const STATUS_CONFIG: Record<string, { bg: string; text: string }> = {
    // PENDING is where a mentor's own request sits until the mentee's zone lead
    // or an admin settles it. Retained so
    // any row predating the drop_mentorship_acceptance_001 migration still renders.
    PENDING: { bg: "bg-blue-100",   text: "text-blue-700"   },
    ACTIVE:  { bg: "bg-green-100",  text: "text-green-800"  },
    PAUSED:  { bg: "bg-yellow-100", text: "text-yellow-800" },
    ENDED:   { bg: "bg-gray-100",   text: "text-gray-600"   },
};

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
    BRONZE: { label: "Bronze", color: "text-amber-700",  bg: "bg-amber-50",   border: "border-amber-300"  },
    SILVER: { label: "Silver", color: "text-slate-600",  bg: "bg-slate-100",  border: "border-slate-300"  },
    GOLD:   { label: "Gold",   color: "text-yellow-600", bg: "bg-yellow-50",  border: "border-yellow-300" },
};

// Tiers a mentor may take on, mirroring the backend's `order < mentor order`
// filter in MentorshipService.list_mentee_candidates — GOLD may mentor SILVER
// *and* BRONZE, not only the tier immediately below.
const TIERS_BELOW: Record<string, string[]> = {
    SILVER: ["BRONZE"],
    GOLD:   ["SILVER", "BRONZE"],
};

function tiersBelowLabel(tier: string | null): string {
    const tiers = tier ? TIERS_BELOW[tier] ?? [] : [];
    const labels = tiers.map((t) => TIER_CONFIG[t]?.label ?? t);
    if (labels.length === 0) return "lower-tier";
    if (labels.length === 1) return labels[0];
    return `${labels.slice(0, -1).join(", ")} or ${labels[labels.length - 1]}`;
}

function fullName(user?: MentorshipUser, fallback?: string): string {
    if (!user) return fallback ?? "—";
    const firstName = user.first_name || user.profile?.first_name;
    const lastName  = user.last_name  || user.profile?.last_name;
    const name = [firstName, lastName].filter(Boolean).join(" ");
    return name || user.email || fallback || "—";
}

function profileImage(user?: MentorshipUser): string | undefined {
    return user?.profile_image || user?.profile?.profile_image;
}

/**
 * Marks the caller's own row. Load-bearing once a zone manager's list carries
 * other people's pairs — without it "Mentorships" reads as if every row were
 * theirs.
 */
function YouBadge() {
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
            You
        </span>
    );
}

function TierBadge({ tier }: { tier?: string }) {
    if (!tier) return null;
    const cfg = TIER_CONFIG[tier];
    if (!cfg) return null;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
            <Icon icon="solar:medal-ribbons-star-bold-duotone" width="12" />
            {cfg.label}
        </span>
    );
}

function AgentModalCard({ label, user, tier }: { label: string; user?: MentorshipUser; tier?: string }) {
    const img = profileImage(user);
    return (
        <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 flex-shrink-0">
                    {img ? (
                        <Image src={img} alt={label} fill className="object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <Icon icon="gg:profile" width="26" className="text-gray-400" />
                        </div>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">{fullName(user, "—")}</p>
                    {user?.email && <p className="text-xs text-gray-500 mt-0.5 truncate">{user.email}</p>}
                    {user?.phone && <p className="text-xs text-gray-400 mt-0.5">{user.phone}</p>}
                    <div className="mt-1.5">
                        <TierBadge tier={tier} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AgentNetworkMentorshipsTable() {
    const { user } = useAuth();

    // Tier is fetched fresh from the server so it cannot be spoofed via client-side state
    const [agentTier, setAgentTier] = useState<string | null>(null);

    const [mentorships, setMentorships] = useState<Mentorship[]>([]);
    const [isLoading, setIsLoading]     = useState(false);
    const [page, setPage]               = useState(1);
    const [totalPages, setTotalPages]   = useState(1);
    const [statusFilter, setStatusFilter] = useState("");
    // Mirrors the scope param on GET /network/mentorship: "all" (own mappings
    // plus, for an Area Manager / Regional Lead, every mapping in their zone
    // tree), "mine", "zone". Equivalent for an agent managing no zone.
    const [scope, setScope]             = useState("all");
    const [agentId, setAgentId]         = useState("");

    const [viewMentorship, setViewMentorship]     = useState<Mentorship | null>(null);
    const [detailMentorship, setDetailMentorship] = useState<Mentorship | null>(null);

    // Row action menu. A zone lead supervises mentorships across their patch, so
    // they get the same row actions an admin has; a plain agent gets only the
    // actions they are a party to.
    const [menuRow, setMenuRow] = useState<number | null>(null);
    const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
    const [decisionTarget, setDecisionTarget] = useState<{ id: string; action: "approve" | "reject"; pair: string } | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [isDeciding, setIsDeciding] = useState(false);
    const [statusTarget, setStatusTarget] = useState<{ id: string; newStatus: string } | null>(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    // Zone-lead direct assign. Distinct from the invite flow above: a lead pairs
    // two OTHER agents and the mapping lands ACTIVE, because the lead is the
    // approver — there is no request to raise.
    // Two-step, mirroring the admin's Create Mentorship Mapping: step 1 picks
    // the mentor, step 2 is the same multi-select candidate table. A lead pairs
    // in batches for the same reason an admin does — onboarding a cohort under
    // one mentor is the common case, and one-at-a-time made that N trips.
    const [showAssignModal, setShowAssignModal]   = useState(false);
    const [assignStep, setAssignStep]             = useState<1 | 2>(1);
    const [assignMentorId, setAssignMentorId]     = useState("");
    const [assignMentorName, setAssignMentorName] = useState("");
    // Staged for the confirm dialog, exactly as the admin flow stages its own.
    const [pendingAssigns, setPendingAssigns]     = useState<MenteeCandidate[]>([]);
    const [isAssigning, setIsAssigning]           = useState(false);
    // Bumped after a successful batch so the picker refetches and clears.
    const [assignToken, setAssignToken]           = useState(0);

    // Invite modal
    const [showInviteModal, setShowInviteModal] = useState(false);
    // Candidates staged for confirmation — one row (menu action) or a batch.
    const [pendingInvites, setPendingInvites]   = useState<MenteeCandidate[]>([]);
    const [isInviting, setIsInviting]           = useState(false);
    // Bumped after a successful invite so the picker refetches and clears.
    const [candidatesToken, setCandidatesToken] = useState(0);
    const [menteeCap, setMenteeCap]             = useState(0);
    const [remainingSlots, setRemainingSlots]   = useState(0);
    const [allowanceLoaded, setAllowanceLoaded] = useState(false);

    // Fetch the current agent's tier from /network/me — server-sourced so it cannot be
    // manipulated client-side; the invite button is not rendered at all for non-eligible tiers
    useEffect(() => {
        axiosRequest
            .get(API_ROUTES.network.me)
            .then((res) => {
                const data = res?.data?.data ?? res?.data;
                setAgentTier(data?.tier ?? data?.current_tier ?? null);
                const summary = data?.mentorship;
                // mentee_cap mirrors NETWORK_MENTEE_CAP. The ?? 10 is only a
                // fallback for a backend older than the field — it matches the
                // server default, and the server re-checks the cap per invite.
                const cap = summary?.mentee_cap ?? 10;
                setMenteeCap(cap);
                setRemainingSlots(
                    summary?.remaining_mentee_slots ??
                    Math.max(0, cap - (summary?.active_mentee_count ?? 0)),
                );
                setAllowanceLoaded(true);
            })
            .catch(() => {});
    }, [candidatesToken]);

    const closeAssign = () => {
        setShowAssignModal(false);
        setAssignStep(1);
        setAssignMentorId("");
        setAssignMentorName("");
        setPendingAssigns([]);
    };

    /**
     * No batch endpoint exists, so a multi-select fans out one POST per mentee
     * — the same shape the admin table uses. allSettled rather than all: a
     * rejection partway through (the mentor hit their cap, someone else
     * mentored the agent first) must not discard the mappings that already
     * succeeded.
     */
    const handleAssign = async () => {
        if (!assignMentorId || pendingAssigns.length === 0) return;
        setIsAssigning(true);
        try {
            const results = await Promise.allSettled(
                pendingAssigns.map((c) =>
                    axiosRequest.post(API_ROUTES.network.assignMentorship, {
                        mentor_id: assignMentorId,
                        mentee_id: c.agent_id ?? c.id ?? c.user_id,
                    }),
                ),
            );
            const failures = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
            const succeeded = results.length - failures.length;

            if (succeeded > 0) {
                toast.success(
                    succeeded === 1
                        ? "Mentorship created and is now active"
                        : `${succeeded} mentorships created and are now active`,
                );
            }
            if (failures.length > 0) {
                // One toast per distinct reason — a batch that trips the cap
                // would otherwise stack identical messages. Every eligibility
                // rule the mentor path enforces applies here too, so surface
                // the server's reason rather than a generic failure.
                const reasons = new Set(
                    failures.map((f: any) =>
                        f.reason?.response?.data?.detail ||
                        f.reason?.response?.data?.message ||
                        "Failed to create the mentorship",
                    ),
                );
                reasons.forEach((reason) => toast.error(reason as string));
            }

            setPendingAssigns([]);
            if (succeeded > 0) {
                setAssignToken((t) => t + 1);   // refresh candidates + allowance
                fetchMentorships();
                if (succeeded === results.length) closeAssign();
            }
        } finally {
            setIsAssigning(false);
        }
    };

    const canInvite = agentTier === "SILVER" || agentTier === "GOLD";
    const tierBelow = tiersBelowLabel(agentTier);

    // An Area Manager / Regional Lead supervises mentorship quality across their
    // region, so their list is widened to the zone tree and gains the scope +
    // agent controls. A plain agent's list is only ever their own mappings.
    const { data: standing } = GetNetworkStanding(user?.role as UserRole | undefined);
    const isMentor      = Boolean(standing?.isMentor);
    const isZoneManager = Boolean(standing?.isZoneManager);
    const hasNetwork    = isMentor || isZoneManager;

    // Drop a scope the caller has since lost, so the list can't pin empty with
    // no visible cause.
    useEffect(() => {
        if (standing && scope === "zone" && !isZoneManager) {
            setScope("all");
            setPage(1);
        }
    }, [standing, scope, isZoneManager]);

    const fetchMentorships = useCallback(async () => {
        setIsLoading(true);
        try {
            const params: Record<string, string | number> = { page, size: 20 };
            if (statusFilter) params.status = statusFilter;
            // agent_id already narrows to one agent's mappings, so scope
            // alongside it would be redundant — the endpoint ignores it there.
            if (agentId) params.agent_id = agentId;
            else if (scope !== "all") params.scope = scope;
            const response = await axiosRequest.get(API_ROUTES.network.myMentorship, { params });
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
    }, [page, statusFilter, scope, agentId]);

    useEffect(() => { fetchMentorships(); }, [fetchMentorships]);

    // Fetch full detail whenever the view modal opens
    useEffect(() => {
        const id = viewMentorship?.id;
        if (!id) { setDetailMentorship(null); return; }
        axiosRequest
            .get(API_ROUTES.network.myMentorshipDetails(id))
            .then((res) => {
                const data: Mentorship = res?.data?.data ?? res?.data;
                setDetailMentorship(data);
            })
            .catch(() => {});
    }, [viewMentorship?.id]);

    const handleDecision = async () => {
        if (!decisionTarget) return;
        const { id, action } = decisionTarget;
        setIsDeciding(true);
        try {
            await toast.promise(
                action === "approve"
                    ? axiosRequest.post(API_ROUTES.network.approveMentorship(id), {})
                    : axiosRequest.post(API_ROUTES.network.rejectMentorship(id), {
                        ...(rejectReason.trim() ? { reason: rejectReason.trim() } : {}),
                    }),
                {
                    loading: action === "approve" ? "Approving request..." : "Rejecting request...",
                    success: action === "approve"
                        ? "Request approved — the mentorship is now active"
                        : "Request rejected and removed",
                    // The lead's zone is re-checked server-side, so an out-of-zone
                    // decision comes back as a reason worth showing verbatim.
                    error: (err) => err?.response?.data?.detail || err?.response?.data?.message
                        || `Failed to ${action} the request`,
                }
            );
            setDecisionTarget(null);
            setRejectReason("");
            fetchMentorships();
        } catch {
            // surfaced by toast.promise; modal stays open for a retry
        } finally {
            setIsDeciding(false);
        }
    };

    const handleStatusUpdate = async () => {
        if (!statusTarget) return;
        setIsUpdatingStatus(true);
        try {
            await toast.promise(
                axiosRequest.patch(API_ROUTES.network.myMentorshipDetails(statusTarget.id), {
                    status: statusTarget.newStatus,
                }),
                {
                    loading: "Updating status...",
                    success: `Status updated to ${statusTarget.newStatus}`,
                    error: (err) => err?.response?.data?.detail || err?.response?.data?.message
                        || "Failed to update status",
                }
            );
            setStatusTarget(null);
            fetchMentorships();
        } catch {
            // surfaced by toast.promise
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const openModal = (m: Mentorship) => { setViewMentorship(m); setDetailMentorship(null); };
    const closeModal = () => { setViewMentorship(null); setDetailMentorship(null); };

    const resetInviteModal = () => {
        setShowInviteModal(false);
        setPendingInvites([]);
    };

    /**
     * There is no batch endpoint, so a multi-select fans out one POST per
     * mentee. allSettled rather than all: a rejection partway through (cap
     * reached, someone else mentored them first) must not discard the
     * mentorships that did succeed.
     */
    const handleInvite = async () => {
        if (pendingInvites.length === 0) return;
        setIsInviting(true);
        try {
            const results = await Promise.allSettled(
                pendingInvites.map((c) =>
                    axiosRequest.post(API_ROUTES.network.createMentorshipInvite, {
                        mentee_id: c.agent_id ?? c.id ?? c.user_id,
                    }),
                ),
            );
            const failures = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
            const succeeded = results.length - failures.length;

            if (succeeded > 0) {
                toast.success(
                    succeeded === 1
                        ? "Mentorship created and is now active"
                        : `${succeeded} mentorships created and are now active`,
                );
            }
            if (failures.length > 0) {
                // One toast per distinct reason — a batch that trips the cap
                // would otherwise stack identical messages.
                const reasons = new Set(
                    failures.map((f: any) =>
                        f.reason?.response?.data?.detail ||
                        f.reason?.response?.data?.message ||
                        "Failed to create mentorship",
                    ),
                );
                reasons.forEach((reason) => toast.error(reason as string));
            }

            setPendingInvites([]);
            if (succeeded > 0) {
                setCandidatesToken((t) => t + 1);   // refresh allowance + candidate list
                fetchMentorships();
                if (succeeded === pendingInvites.length) setShowInviteModal(false);
            }
        } finally {
            setIsInviting(false);
        }
    };

    const modalData = detailMentorship ?? viewMentorship;

    return (
        <div className="p-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">

                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">Mentorships</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {isZoneManager
                                    ? "Mentor–mentee relationships in your zone, alongside your own"
                                    : "Your active and past mentor–mentee relationships"}
                            </p>
                        </div>
                        {/*
                          * Invite button: conditionally rendered (not CSS-hidden) based on
                          * server-fetched tier. Absent from the DOM entirely for Bronze agents —
                          * cannot be revealed via browser inspect element.
                          */}
                        <div className="flex items-center gap-2 flex-wrap">
                            {/*
                              * Zone leads pair two other agents directly. Gated on the
                              * server-fetched `isZoneManager` standing, so it is absent from
                              * the DOM for anyone without an ACTIVE zone assignment — the
                              * endpoint re-checks the zone tree regardless.
                              */}
                            {isZoneManager && (
                                <button
                                    onClick={() => setShowAssignModal(true)}
                                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                                >
                                    <Icon icon="mdi:account-switch-outline" width="16" />
                                    Create Mapping
                                </button>
                            )}
                            {canInvite && (
                                <button
                                    onClick={() => setShowInviteModal(true)}
                                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                                >
                                    <Icon icon="mdi:account-multiple-plus-outline" width="16" />
                                    Add Mentees
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-3 flex-wrap">
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

                        {isZoneManager && (
                            <select
                                value={agentId ? "" : scope}
                                disabled={Boolean(agentId)}
                                onChange={(e) => { setScope(e.target.value); setPage(1); }}
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-w-[180px] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="all">Everyone</option>
                                <option value="mine">My mentorships only</option>
                                <option value="zone">My zone only</option>
                            </select>
                        )}

                        {hasNetwork && (
                            <NetworkAgentFilter
                                value={agentId}
                                onChange={(id) => { setAgentId(id); setPage(1); }}
                                placeholder={isZoneManager ? "Search an agent…" : "Search a mentee…"}
                            />
                        )}

                        {(statusFilter || agentId || scope !== "all") && (
                            <button
                                onClick={() => { setStatusFilter(""); setScope("all"); setAgentId(""); setPage(1); }}
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
                ) : mentorships.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    <th className="px-6 py-3 text-left">Mentor</th>
                                    <th className="px-6 py-3 text-left">Mentee</th>
                                    <th className="px-6 py-3 text-left">Status</th>
                                    <th className="px-6 py-3 text-left">Started</th>
                                    <th className="px-6 py-3 text-left">Ended</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {mentorships.map((m, index) => {
                                    const statusCfg = STATUS_CONFIG[m.status] ?? STATUS_CONFIG.ENDED;
                                    const mentorImg = profileImage(m.mentor);
                                    const menteeImg = profileImage(m.mentee);
                                    return (
                                        <tr
                                            key={m.id}
                                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                                            onClick={() => openModal(m)}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
                                                        {mentorImg ? (
                                                            <Image src={mentorImg} alt="mentor" fill className="object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                                                <Icon icon="gg:profile" width="18" className="text-gray-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-base font-semibold text-gray-900">{fullName(m.mentor, m.mentor_id)}</p>
                                                            {isSameId(m.mentor_id, user?.id) && <YouBadge />}
                                                        </div>
                                                        {m.mentor?.email && <p className="text-xs text-gray-500 mt-0.5">{m.mentor.email}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
                                                        {menteeImg ? (
                                                            <Image src={menteeImg} alt="mentee" fill className="object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                                                <Icon icon="gg:profile" width="18" className="text-gray-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-base font-semibold text-gray-900">{fullName(m.mentee, m.mentee_id)}</p>
                                                            {isSameId(m.mentee_id, user?.id) && <YouBadge />}
                                                        </div>
                                                        {m.mentee?.email && <p className="text-xs text-gray-500 mt-0.5">{m.mentee.email}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}>
                                                    {m.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {m.started_at ? formatDate(m.started_at) : "—"}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {m.ended_at ? formatDate(m.ended_at) : "—"}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                                        // Fixed-positioned menu: anchor to the viewport rect so it
                                                        // is not clipped by the table's overflow-x-auto wrapper.
                                                        setMenuPos({ top: r.bottom + 4, left: Math.max(8, r.right - 180) });
                                                        setMenuRow(menuRow === index ? null : index);
                                                    }}
                                                    className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
                                                    aria-label="Row actions"
                                                >
                                                    <Icon icon="mdi:dots-vertical" width="18" />
                                                </button>
                                            </td>
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
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <Icon icon="hugeicons:album-not-found-01" width="32" height="32" className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No mentorship mappings found</h3>
                    </div>
                )}
            </div>

            {/* Row actions. Backdrop closes on any outside click. */}
            {menuRow !== null && mentorships[menuRow] && (() => {
                const m = mentorships[menuRow];
                const isParty = isSameId(m.mentor_id, user?.id) || isSameId(m.mentee_id, user?.id);
                const pair = `${fullName(m.mentor, m.mentor_id)} -> ${fullName(m.mentee, m.mentee_id)}`;
                // A lead may settle and re-status anything in their zone; a plain
                // agent may only end a mentorship they are part of. Both are
                // re-checked server-side - this only keeps dead options off screen.
                const canSettle = isZoneManager && m.status === "PENDING";
                const canRestatus = isZoneManager && m.status !== "PENDING";
                // No self-service exit. Ending a mentorship is a supervisory act:
                // a party who wants out asks their zone lead or an admin to do
                // it. The API refuses it either way - no agent key holds
                // network.end_mentorship any more.
                void isParty;
                return (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setMenuRow(null)} />
                        <div
                            className="fixed bg-white shadow-xl rounded-lg z-50 border border-gray-200 overflow-hidden min-w-[180px]"
                            style={{ top: menuPos.top, left: menuPos.left }}
                        >
                            <button
                                className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 transition-colors border-b border-gray-100"
                                onClick={() => { setMenuRow(null); openModal(m); }}
                            >
                                <Icon icon="mdi:eye-outline" width="14" className="text-gray-500" />
                                <span>View details</span>
                            </button>

                            {canSettle && (
                                <>
                                    <button
                                        className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 transition-colors border-b border-gray-100"
                                        onClick={() => { setMenuRow(null); setDecisionTarget({ id: m.id, action: "approve", pair }); }}
                                    >
                                        <Icon icon="mdi:check-decagram-outline" width="14" className="text-green-600" />
                                        <span>Approve request</span>
                                    </button>
                                    <button
                                        className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 transition-colors border-b border-gray-100"
                                        onClick={() => { setMenuRow(null); setRejectReason(""); setDecisionTarget({ id: m.id, action: "reject", pair }); }}
                                    >
                                        <Icon icon="mdi:close-octagon-outline" width="14" className="text-red-600" />
                                        <span>Reject request</span>
                                    </button>
                                </>
                            )}

                            {canRestatus && (["ACTIVE", "PAUSED", "ENDED"] as const)
                                .filter((st) => st !== m.status)
                                .map((st) => {
                                    const icons: Record<string, string> = {
                                        ACTIVE: "mdi:check-circle-outline",
                                        PAUSED: "mdi:pause-circle-outline",
                                        ENDED: "mdi:stop-circle-outline",
                                    };
                                    const colors: Record<string, string> = {
                                        ACTIVE: "text-green-600",
                                        PAUSED: "text-yellow-600",
                                        ENDED: "text-gray-500",
                                    };
                                    return (
                                        <button
                                            key={st}
                                            className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 transition-colors border-b last:border-b-0 border-gray-100"
                                            onClick={() => { setMenuRow(null); setStatusTarget({ id: m.id, newStatus: st }); }}
                                        >
                                            <Icon icon={icons[st]} width="14" className={colors[st]} />
                                            <span>Set {st.charAt(0) + st.slice(1).toLowerCase()}</span>
                                        </button>
                                    );
                                })}


                        </div>
                    </>
                );
            })()}

            {/* Approve / reject a PENDING request */}
            {decisionTarget && (() => {
                const isReject = decisionTarget.action === "reject";
                return (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                            <div className="p-6">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isReject ? "bg-red-50" : "bg-green-50"}`}>
                                    <Icon
                                        icon={isReject ? "mdi:close-octagon-outline" : "mdi:check-decagram-outline"}
                                        width="24"
                                        className={isReject ? "text-red-600" : "text-green-600"}
                                    />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                    {isReject ? "Reject this request?" : "Approve this request?"}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    <span className="font-semibold text-gray-700">{decisionTarget.pair}</span>
                                    {isReject ? (
                                        <> will be <span className="font-semibold text-red-600">permanently deleted</span>, not
                                        archived. Both agents are notified, naming you. The mentor may request again.</>
                                    ) : (
                                        <> becomes <span className="font-semibold text-green-700">active</span> immediately and
                                        overrides begin accruing. Both agents are notified.</>
                                    )}
                                </p>
                                {isReject && (
                                    <div className="mt-4">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                            Reason <span className="font-normal normal-case tracking-normal text-gray-400">(optional)</span>
                                        </label>
                                        <textarea
                                            value={rejectReason}
                                            onChange={(e) => setRejectReason(e.target.value)}
                                            rows={3}
                                            placeholder="Included in the notification sent to both agents"
                                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-gray-100">
                                <button
                                    onClick={() => { setDecisionTarget(null); setRejectReason(""); }}
                                    disabled={isDeciding}
                                    className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 disabled:opacity-40 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDecision}
                                    disabled={isDeciding}
                                    className={`px-8 py-2.5 text-sm font-bold text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg ${
                                        isReject ? "bg-red-600 hover:bg-red-700 shadow-red-600/20" : "bg-primary hover:bg-primary/90 shadow-primary/20"
                                    }`}
                                >
                                    {isReject ? "Yes, reject" : "Yes, approve"}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Status change confirm */}
            {statusTarget && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="p-6">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <Icon icon="mdi:swap-horizontal" width="24" className="text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">Update status?</h3>
                            <p className="text-sm text-gray-500">
                                Set this mentorship to{" "}
                                <span className="font-semibold text-gray-700">{statusTarget.newStatus}</span>?
                                {statusTarget.newStatus === "ENDED" && " Ending is permanent - it cannot be reactivated."}
                            </p>
                        </div>
                        <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-gray-100">
                            <button
                                onClick={() => setStatusTarget(null)}
                                disabled={isUpdatingStatus}
                                className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 disabled:opacity-40 transition-colors"
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

            {/* View modal */}
            {viewMentorship && modalData && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[94vh] flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
                            <h3 className="text-lg font-semibold text-gray-900">Mentorship Details</h3>
                            <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <Icon icon="lucide:x" width="18" className="text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <AgentModalCard label="Mentor" user={modalData.mentor} tier={modalData.mentor_tier} />
                                <AgentModalCard label="Mentee" user={modalData.mentee} tier={modalData.mentee_tier} />
                            </div>
                            <div className="border-t border-gray-100 pt-5 grid grid-cols-2 gap-x-8 gap-y-5">
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</p>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(STATUS_CONFIG[modalData.status] ?? STATUS_CONFIG.ENDED).bg} ${(STATUS_CONFIG[modalData.status] ?? STATUS_CONFIG.ENDED).text}`}>
                                        {modalData.status}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Invited by Mentor</p>
                                    <p className="text-sm text-gray-700">{modalData.invited_by_mentor ? "Yes" : "No"}</p>
                                </div>
                                {modalData.is_flagged && (
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Flagged</p>
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                            <Icon icon="mdi:flag" width="12" /> Yes
                                        </span>
                                    </div>
                                )}
                                {modalData.started_at && (
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Started</p>
                                        <p className="text-sm text-gray-700">{formatDate(modalData.started_at)}</p>
                                    </div>
                                )}
                                {modalData.status === "PAUSED" && modalData.paused_at && (
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Paused</p>
                                        <p className="text-sm text-gray-700">{formatDate(modalData.paused_at)}</p>
                                    </div>
                                )}
                                {modalData.status === "ENDED" && modalData.ended_at && (
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ended</p>
                                        <p className="text-sm text-gray-700">{formatDate(modalData.ended_at)}</p>
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</p>
                                    <p className="text-sm text-gray-700">{formatDate(modalData.created_at)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Updated</p>
                                    <p className="text-sm text-gray-700">{formatDate(modalData.updated_at)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 pb-6 flex-shrink-0 flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                            <button onClick={closeModal} className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Invite Mentee modal — wide, table-driven picker */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Take on Mentees</h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    As a <span className="font-semibold">{agentTier}</span> agent you can mentor{" "}
                                    <span className="font-semibold">{tierBelow}</span> agents. Each mentorship becomes{" "}
                                    <span className="font-semibold">ACTIVE</span> immediately and the mentee is notified.
                                </p>
                            </div>
                            <button onClick={resetInviteModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0">
                                <Icon icon="lucide:x" width="18" className="text-gray-500" />
                            </button>
                        </div>

                        <MenteeCandidatePicker
                            tiersBelowLabel={tierBelow}
                            remainingSlots={remainingSlots}
                            menteeCap={menteeCap}
                            allowanceLoaded={allowanceLoaded}
                            isSubmitting={isInviting}
                            refreshToken={candidatesToken}
                            onMentorOne={(c) => setPendingInvites([c])}
                            onMentorMany={(cs) => setPendingInvites(cs)}
                        />
                    </div>
                </div>
            )}

            {/* Zone-lead direct assign */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className={`bg-white rounded-2xl shadow-xl w-full overflow-hidden flex flex-col ${assignStep === 1 ? "max-w-md" : "max-w-4xl"}`}>
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
                            <div className="min-w-0">
                                <h3 className="text-lg font-semibold text-gray-900">Create Mentorship Mapping</h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {assignStep === 1
                                        ? "Step 1 of 2 — choose the mentor"
                                        : <>Step 2 of 2 — choose mentees for <span className="font-semibold text-gray-700">{assignMentorName}</span></>}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {assignStep === 2 && (
                                    <button
                                        onClick={() => { setAssignStep(1); setPendingAssigns([]); }}
                                        disabled={isAssigning}
                                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition-colors"
                                    >
                                        <Icon icon="mdi:arrow-left" width="14" />
                                        Change mentor
                                    </button>
                                )}
                                <button
                                    onClick={closeAssign}
                                    disabled={isAssigning}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40"
                                >
                                    <Icon icon="lucide:x" width="18" className="text-gray-500" />
                                </button>
                            </div>
                        </div>

                        {assignStep === 1 ? (
                            <>
                                <div className="p-6 space-y-5">
                                    {/* Info banner — mirrors the admin's, but says ACTIVE
                                        without qualification: a lead IS the approver, so
                                        their create skips the PENDING request entirely. */}
                                    <div className="flex gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                        <Icon icon="mdi:information-outline" width="18" className="text-blue-500 shrink-0 mt-0.5" />
                                        <p className="text-xs text-blue-700 leading-relaxed">
                                            Pick the mentor first — they must be Silver-tier or above. The next step lists
                                            only the agents in your zone that mentor is eligible to take on. Each mapping
                                            becomes <span className="font-semibold">ACTIVE</span> immediately and both
                                            agents are notified — no approval step, because you are the approver.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700">Mentor Agent</label>
                                        {/*
                                          * NetworkAgentFilter reads GET /network/agents, which
                                          * returns exactly the caller's visibility scope. For a
                                          * lead that is their zone tree — the same set the assign
                                          * endpoint validates against, so a selection made here
                                          * cannot come back as out-of-zone.
                                          */}
                                        <NetworkAgentFilter
                                            value={assignMentorId}
                                            onChange={(id: string, label?: string) => {
                                                setAssignMentorId(id);
                                                setAssignMentorName(label ?? "");
                                            }}
                                            placeholder="Search a Silver or Gold agent in your zone…"
                                        />
                                        <p className="text-[11px] text-gray-400">
                                            Must be Silver or Gold, and ranked above every mentee you pick.
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-2 pt-4 px-6 pb-6 border-t border-gray-100 flex justify-end gap-3">
                                    <button
                                        onClick={closeAssign}
                                        className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => setAssignStep(2)}
                                        disabled={!assignMentorId}
                                        className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                                    >
                                        Choose mentees
                                        <Icon icon="mdi:arrow-right" width="14" />
                                    </button>
                                </div>
                            </>
                        ) : (
                            /*
                             * Same picker the admin uses, pointed at the AGENT candidates
                             * endpoint with mentor_id. That param makes the endpoint list
                             * candidates for the chosen mentor rather than the caller, and
                             * restricts them to the caller's zone tree — so nothing the
                             * table offers can be refused by the assign endpoint.
                             */
                            <MenteeCandidatePicker
                                voice="mentor"
                                tiersBelowLabel="lower-tier"
                                endpoint={API_ROUTES.network.mentorshipCandidates}
                                extraParams={{ mentor_id: assignMentorId }}
                                menteeCap={0}
                                remainingSlots={0}
                                allowanceLoaded={false}
                                isSubmitting={isAssigning}
                                refreshToken={assignToken}
                                onMentorOne={(c) => setPendingAssigns([c])}
                                onMentorMany={(cs) => setPendingAssigns(cs)}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* Assign confirm — same shape and copy as the admin's create confirm. */}
            {pendingAssigns.length > 0 && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="p-6">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <Icon icon="mdi:account-multiple-plus" width="24" className="text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                {pendingAssigns.length === 1 ? "Create mentorship mapping?" : `Create ${pendingAssigns.length} mappings?`}
                            </h3>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                You are about to pair <span className="font-semibold text-gray-700">{assignMentorName}</span> as mentor with{" "}
                                {pendingAssigns.length === 1 ? (
                                    <span className="font-semibold text-gray-700">{candidateName(pendingAssigns[0])}</span>
                                ) : (
                                    <span className="font-semibold text-gray-700">{pendingAssigns.length} mentees</span>
                                )}. Each mapping becomes <span className="font-semibold">ACTIVE</span> immediately and both agents are notified.
                            </p>
                            {pendingAssigns.length > 1 && (
                                <ul className="mt-4 max-h-32 overflow-y-auto space-y-1 border-t border-gray-100 pt-3">
                                    {pendingAssigns.map((c) => (
                                        <li key={c.agent_id ?? c.id ?? c.user_id} className="text-xs text-gray-500 truncate">
                                            {candidateName(c)}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-gray-100">
                            <button
                                onClick={() => setPendingAssigns([])}
                                disabled={isAssigning}
                                className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 disabled:opacity-40 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAssign}
                                disabled={isAssigning}
                                className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20"
                            >
                                {isAssigning ? "Creating..." : "Yes, create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Invite confirmation */}
            {pendingInvites.length > 0 && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="p-8">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <Icon icon="mdi:account-plus-outline" width="24" className="text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                {pendingInvites.length === 1 ? "Request this mentorship?" : `Request ${pendingInvites.length} mentorships?`}
                            </h3>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                {pendingInvites.length === 1 ? (
                                    <>
                                        You are about to request{" "}
                                        <span className="font-semibold text-gray-700">{candidateName(pendingInvites[0])}</span>{" "}
                                        as your mentee.
                                    </>
                                ) : (
                                    <>You are about to request <span className="font-semibold text-gray-700">{pendingInvites.length} agents</span> as your mentees.</>
                                )}{" "}
                                {pendingInvites.length === 1 ? "This is sent" : "These are sent"} as a{" "}
                                <span className="font-semibold">request</span> for their zone lead or an
                                administrator to approve — overrides only start accruing once approved.
                            </p>
                            {pendingInvites.length > 1 && (
                                <ul className="mt-4 max-h-32 overflow-y-auto space-y-1 border-t border-gray-100 pt-3">
                                    {pendingInvites.map((c) => (
                                        <li key={c.agent_id ?? c.id ?? c.user_id} className="text-xs text-gray-500 truncate">
                                            {candidateName(c)}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-gray-100">
                            <button
                                onClick={() => setPendingInvites([])}
                                disabled={isInviting}
                                className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 disabled:opacity-40 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleInvite}
                                disabled={isInviting}
                                className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20"
                            >
                                {isInviting ? "Submitting..." : "Yes, send request"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

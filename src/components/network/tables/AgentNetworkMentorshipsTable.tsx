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
    // PENDING is legacy — nothing is created in this state any more. Retained so
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
                    <div className="mt-4 flex items-center gap-3 flex-wrap">
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                            <option value="">All</option>
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

            {/* Invite confirmation */}
            {pendingInvites.length > 0 && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="p-8">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <Icon icon="mdi:account-plus-outline" width="24" className="text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                {pendingInvites.length === 1 ? "Start this mentorship?" : `Start ${pendingInvites.length} mentorships?`}
                            </h3>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                {pendingInvites.length === 1 ? (
                                    <>
                                        You are about to take on{" "}
                                        <span className="font-semibold text-gray-700">{candidateName(pendingInvites[0])}</span>{" "}
                                        as your mentee.
                                    </>
                                ) : (
                                    <>You are about to take on <span className="font-semibold text-gray-700">{pendingInvites.length} agents</span> as your mentees.</>
                                )}{" "}
                                The mentorship becomes <span className="font-semibold">ACTIVE</span> immediately and they are notified.
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
                                {isInviting ? "Creating..." : "Yes, proceed"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

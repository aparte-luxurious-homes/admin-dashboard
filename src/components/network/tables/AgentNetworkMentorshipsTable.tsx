'use client'

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import axiosRequest from "@/src/lib/api";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import { Icon } from "@iconify/react/dist/iconify.js";
import { formatDate } from "@/src/lib/utils";
import Loader from "@/src/components/loader";
import { toast } from "react-hot-toast";
import { useAuth } from "@/src/hooks/useAuth";

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

interface Candidate {
    id?: string;
    user_id?: string;
    agent_id?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    profile_image?: string;
    current_tier?: string;
    profile?: {
        first_name?: string;
        last_name?: string;
        profile_image?: string;
    };
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

function fullName(user?: MentorshipUser | Candidate, fallback?: string): string {
    if (!user) return fallback ?? "—";
    const firstName = user.first_name || user.profile?.first_name;
    const lastName  = user.last_name  || user.profile?.last_name;
    const name = [firstName, lastName].filter(Boolean).join(" ");
    return name || user.email || fallback || "—";
}

function profileImage(user?: MentorshipUser | Candidate): string | undefined {
    return user?.profile_image || user?.profile?.profile_image;
}

function candidateId(c: Candidate): string {
    return (c.id ?? c.user_id ?? c.agent_id ?? "") as string;
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

    const [viewMentorship, setViewMentorship]     = useState<Mentorship | null>(null);
    const [detailMentorship, setDetailMentorship] = useState<Mentorship | null>(null);

    // Invite modal
    const [showInviteModal, setShowInviteModal]     = useState(false);
    const [showInviteConfirm, setShowInviteConfirm] = useState(false);
    const [candidates, setCandidates]               = useState<Candidate[]>([]);
    const [candidatesLoading, setCandidatesLoading] = useState(false);
    const [candidateSearch, setCandidateSearch]     = useState("");
    const [candidateDropdownOpen, setCandidateDropdownOpen] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
    const [isInviting, setIsInviting]               = useState(false);

    const candidateComboRef = useRef<HTMLDivElement>(null);

    // Fetch the current agent's tier from /network/me — server-sourced so it cannot be
    // manipulated client-side; the invite button is not rendered at all for non-eligible tiers
    useEffect(() => {
        axiosRequest
            .get(API_ROUTES.network.me)
            .then((res) => {
                const data = res?.data?.data ?? res?.data;
                setAgentTier(data?.tier ?? data?.current_tier ?? null);
            })
            .catch(() => {});
    }, []);

    const canInvite = agentTier === "SILVER" || agentTier === "GOLD";
    const tierBelow = tiersBelowLabel(agentTier);

    const fetchMentorships = useCallback(async () => {
        setIsLoading(true);
        try {
            const params: Record<string, string | number> = { page, size: 20 };
            if (statusFilter) params.status = statusFilter;
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
    }, [page, statusFilter]);

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

    // Fetch candidates when the invite modal opens, and again (debounced) on every
    // search change. The endpoint pages at PAGE_LIMIT, so filtering a single page
    // client-side hid every eligible agent past the first page.
    useEffect(() => {
        if (!showInviteModal) { setCandidates([]); return; }
        // Selecting a candidate writes their name into the box — not a new search
        if (selectedCandidate && candidateSearch === fullName(selectedCandidate)) return;

        const term = candidateSearch.trim();
        const timer = setTimeout(() => {
            setCandidatesLoading(true);
            axiosRequest
                .get(API_ROUTES.network.mentorshipCandidates, {
                    params: { page: 1, size: 100, ...(term ? { search: term } : {}) },
                })
                .then((res) => {
                    const payload = res?.data?.data ?? res?.data;
                    const items = payload?.items ?? payload?.data ?? (Array.isArray(payload) ? payload : []);
                    setCandidates(items);
                })
                .catch(() => toast.error("Failed to load candidates"))
                .finally(() => setCandidatesLoading(false));
        }, term ? 300 : 0);
        return () => clearTimeout(timer);
    }, [showInviteModal, candidateSearch, selectedCandidate]);

    // Click-outside handler for the candidate combo box
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (candidateComboRef.current && !candidateComboRef.current.contains(e.target as Node)) {
                setCandidateDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const openModal = (m: Mentorship) => { setViewMentorship(m); setDetailMentorship(null); };
    const closeModal = () => { setViewMentorship(null); setDetailMentorship(null); };

    const resetInviteModal = () => {
        setShowInviteModal(false);
        setShowInviteConfirm(false);
        setSelectedCandidate(null);
        setCandidateSearch("");
        setCandidateDropdownOpen(false);
    };

    const handleInvite = async () => {
        if (!selectedCandidate) return;
        setIsInviting(true);
        try {
            await toast.promise(
                axiosRequest.post(API_ROUTES.network.createMentorshipInvite, { mentee_id: candidateId(selectedCandidate) }),
                {
                    loading: "Sending invite...",
                    success: "Mentorship invite sent successfully",
                    error: (err) => err?.response?.data?.detail || err?.response?.data?.message || "Failed to send invite",
                }
            );
            resetInviteModal();
            fetchMentorships();
        } catch {
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
                            <h1 className="text-xl font-semibold text-gray-900">My Mentorships</h1>
                            <p className="text-sm text-gray-500 mt-1">Your active and past mentor–mentee relationships</p>
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
                                <Icon icon="mdi:account-plus-outline" width="16" />
                                Invite Mentee
                            </button>
                        )}
                    </div>
                    <div className="mt-4">
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
                                                        <p className="text-base font-semibold text-gray-900">{fullName(m.mentor, m.mentor_id)}</p>
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
                                                        <p className="text-base font-semibold text-gray-900">{fullName(m.mentee, m.mentee_id)}</p>
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

            {/* Invite Mentee modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Invite a Mentee</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Send a mentorship invitation</p>
                            </div>
                            <button onClick={resetInviteModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <Icon icon="lucide:x" width="18" className="text-gray-500" />
                            </button>
                        </div>
                        <div className="p-8 space-y-6 min-h-[320px]">
                            {/* Explanation */}
                            <div className="flex gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                <Icon icon="mdi:information-outline" width="18" className="text-blue-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-blue-700 leading-relaxed">
                                    As a <span className="font-semibold">{agentTier}</span> agent, you can invite a{" "}
                                    <span className="font-semibold">{tierBelow}</span> agent to be your mentee. The mentorship becomes <span className="font-semibold">ACTIVE</span> as soon as you add them — there is no acceptance step — and the mentee is notified.
                                </p>
                            </div>

                            {/* Candidate search-select */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Select {tierBelow} Agent
                                </label>
                                <div ref={candidateComboRef} className="relative">
                                    <div className={`flex items-center border rounded-xl bg-gray-50/50 overflow-hidden transition-all ${selectedCandidate ? "border-primary" : "border-gray-200"} focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary`}>
                                        <input
                                            type="text"
                                            placeholder={`Search ${tierBelow.toLowerCase()} agents by name or email…`}
                                            value={candidateSearch}
                                            onChange={(e) => {
                                                setCandidateSearch(e.target.value);
                                                setCandidateDropdownOpen(true);
                                                if (!e.target.value) setSelectedCandidate(null);
                                            }}
                                            onFocus={() => setCandidateDropdownOpen(true)}
                                            className="flex-1 px-4 py-3 text-sm text-gray-700 bg-transparent outline-none"
                                        />
                                        {selectedCandidate ? (
                                            <button
                                                onMouseDown={(e) => { e.preventDefault(); setSelectedCandidate(null); setCandidateSearch(""); }}
                                                className="pr-3 text-gray-400 hover:text-gray-600"
                                            >
                                                <Icon icon="lucide:x" width="14" />
                                            </button>
                                        ) : (
                                            <Icon icon="mdi:chevron-down" width="18" className="mr-3 text-gray-400" />
                                        )}
                                    </div>

                                    {candidateDropdownOpen && (
                                        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-96 overflow-y-auto">
                                            {candidatesLoading ? (
                                                <li className="px-4 py-3 text-sm text-gray-400 italic">Searching…</li>
                                            ) : candidates.length > 0 ? candidates.map((c) => {
                                                const img = profileImage(c);
                                                return (
                                                    <li
                                                        key={candidateId(c)}
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            setSelectedCandidate(c);
                                                            setCandidateSearch(fullName(c));
                                                            setCandidateDropdownOpen(false);
                                                        }}
                                                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer first:rounded-t-xl last:rounded-b-xl"
                                                    >
                                                        <div className="relative w-7 h-7 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
                                                            {img ? (
                                                                <Image src={img} alt="" fill className="object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                                                    <Icon icon="gg:profile" width="16" className="text-gray-400" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-medium truncate">{fullName(c)}</p>
                                                            {c.email && <p className="text-xs text-gray-400 truncate">{c.email}</p>}
                                                        </div>
                                                        <TierBadge tier={c.current_tier} />
                                                    </li>
                                                );
                                            }) : (
                                                <li className="px-4 py-3 text-sm text-gray-400 italic">No candidates found</li>
                                            )}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-gray-100">
                            <button onClick={resetInviteModal} className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={() => setShowInviteConfirm(true)}
                                disabled={!selectedCandidate}
                                className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                            >
                                <Icon icon="mdi:send-outline" width="14" />
                                Send Invite
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Invite confirmation modal */}
            {showInviteConfirm && selectedCandidate && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="p-8 min-h-[260px] flex flex-col justify-center">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <Icon icon="mdi:account-plus-outline" width="24" className="text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">Send invite?</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">
                                You are about to invite{" "}
                                <span className="font-semibold text-gray-700">{fullName(selectedCandidate)}</span>{" "}
                                as your mentee. The mentorship becomes <span className="font-semibold">ACTIVE</span> immediately and they are notified.
                            </p>
                        </div>
                        <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-gray-100">
                            <button
                                onClick={() => setShowInviteConfirm(false)}
                                className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => { setShowInviteConfirm(false); handleInvite(); }}
                                disabled={isInviting}
                                className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20"
                            >
                                Yes, send
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

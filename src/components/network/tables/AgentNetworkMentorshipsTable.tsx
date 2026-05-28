'use client'

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import axiosRequest from "@/src/lib/api";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import { Icon } from "@iconify/react/dist/iconify.js";
import { formatDate } from "@/src/lib/utils";
import Loader from "@/src/components/loader";
import { toast } from "react-hot-toast";

interface MentorshipUser {
    id?: string;
    email?: string;
    phone?: string;
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

const STATUS_CONFIG: Record<string, { bg: string; text: string }> = {
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
    const [mentorships, setMentorships] = useState<Mentorship[]>([]);
    const [isLoading, setIsLoading]     = useState(false);
    const [page, setPage]               = useState(1);
    const [totalPages, setTotalPages]   = useState(1);
    const [statusFilter, setStatusFilter] = useState("");

    const [viewMentorship, setViewMentorship] = useState<Mentorship | null>(null);
    const [detailMentorship, setDetailMentorship] = useState<Mentorship | null>(null);

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

    // Fetch full detail whenever the modal opens
    useEffect(() => {
        if (!viewMentorship) {
            setDetailMentorship(null);
            return;
        }
        axiosRequest
            .get(API_ROUTES.network.myMentorshipDetails(viewMentorship.id))
            .then((res) => {
                const data: Mentorship = res?.data?.data ?? res?.data;
                setDetailMentorship(data);
            })
            .catch(() => {
                // silently fall back to list data
            });
    }, [viewMentorship?.id]);

    const openModal = (m: Mentorship) => {
        setViewMentorship(m);
        setDetailMentorship(null);
    };

    const closeModal = () => {
        setViewMentorship(null);
        setDetailMentorship(null);
    };

    // Use enriched detail when available, fall back to list row data
    const modalData = detailMentorship ?? viewMentorship;

    return (
        <div className="p-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">

                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">My Mentorships</h1>
                        <p className="text-sm text-gray-500 mt-1">Your active and past mentor–mentee relationships</p>
                    </div>
                    <div className="mt-4">
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
                                                        {m.mentor?.email && (
                                                            <p className="text-xs text-gray-500 mt-0.5">{m.mentor.email}</p>
                                                        )}
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
                                                        {m.mentee?.email && (
                                                            <p className="text-xs text-gray-500 mt-0.5">{m.mentee.email}</p>
                                                        )}
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

            {/* View modal */}
            {viewMentorship && modalData && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
                            <h3 className="text-lg font-semibold text-gray-900">Mentorship Details</h3>
                            <button
                                onClick={closeModal}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <Icon icon="lucide:x" width="18" className="text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6 overflow-y-auto">
                            {/* Mentor & Mentee cards side by side */}
                            <div className="grid grid-cols-2 gap-4">
                                <AgentModalCard
                                    label="Mentor"
                                    user={modalData.mentor}
                                    tier={modalData.mentor_tier}
                                />
                                <AgentModalCard
                                    label="Mentee"
                                    user={modalData.mentee}
                                    tier={modalData.mentee_tier}
                                />
                            </div>

                            {/* Mapping info */}
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
                        <div className="px-6 pb-6 flex-shrink-0 flex justify-end border-t border-gray-100 pt-4">
                            <button
                                onClick={closeModal}
                                className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

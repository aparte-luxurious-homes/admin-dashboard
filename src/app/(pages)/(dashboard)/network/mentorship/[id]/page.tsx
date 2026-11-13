"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import Grid from "@mui/material/Grid2";
import { Skeleton } from "@/src/components/ui/skeleton";
import BreadCrumb from "@/src/components/breadcrumb";
import axiosRequest from "@/src/lib/api";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import { formatDate, isSameId } from "@/src/lib/utils";
import { useAuth } from "@/src/hooks/useAuth";
import { UserRole } from "@/src/lib/enums";
import { GetNetworkStanding } from "@/src/lib/request-handlers/networkMgt";

interface MentorshipUser {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    profile_image?: string;
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

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
    // PENDING is legacy — nothing is created in this state any more (both agent
    // and admin mentorship creation are now immediate/ACTIVE). Retained so any
    // row predating the drop_mentorship_acceptance_001 migration still renders.
    PENDING: { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200"   },
    ACTIVE:  { bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200"  },
    PAUSED:  { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
    ENDED:   { bg: "bg-gray-50",   text: "text-gray-600",   border: "border-gray-200"   },
};

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
    BRONZE: { label: "Bronze", color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-300"  },
    SILVER: { label: "Silver", color: "text-slate-600",  bg: "bg-slate-100", border: "border-slate-300"  },
    GOLD:   { label: "Gold",   color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-300" },
};

// Admin PATCH only accepts these three targets — PENDING is not a valid status
// to move a mapping into (nothing accepts it since the acceptance flow was removed).
const MENTORSHIP_STATUSES = ["ACTIVE", "PAUSED", "ENDED"] as const;

function fullName(user?: MentorshipUser, fallback?: string): string {
    if (!user) return fallback ?? "--/--";
    const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
    return name || user.email || fallback || "--/--";
}

function TierBadge({ tier }: { tier?: string }) {
    if (!tier) return null;
    const cfg = TIER_CONFIG[tier];
    if (!cfg) return null;
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
            <Icon icon="solar:medal-ribbons-star-bold-duotone" width="12" />
            {cfg.label}
        </span>
    );
}

function AgentCard({ label, user, tier, profileId, showProfileLink, profileHref, profileLabel }: {
    label: string;
    user?: MentorshipUser;
    tier?: string;
    profileId?: string;
    showProfileLink?: boolean;
    /**
     * Where "View Profile" points. Admins get the full user-management record;
     * an agent gets the scoped network profile, because agents do not hold
     * `users.read` and the admin route would bounce them. When the card IS the
     * caller, the page routes them to their own settings instead.
     */
    profileHref?: (id: string) => string;
    profileLabel?: string;
}) {
    return (
        <div>
            <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Icon icon="solar:user-bold-duotone" width="20" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-800">{label}</h4>
                </div>
                {showProfileLink && profileId && (
                    <Link
                        href={
                            profileHref
                                ? profileHref(profileId)
                                : `/user-management/agents/${profileId}`
                        }
                        className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors"
                    >
                        <Icon icon="mdi:open-in-new" width="13" />
                        {profileLabel ?? "View Profile"}
                    </Link>
                )}
            </div>
            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-gray-200 flex-shrink-0">
                        {user?.profile_image ? (
                            <Image src={user.profile_image} alt={label} fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                <Icon icon="gg:profile" width="30" className="text-gray-400" />
                            </div>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900">{fullName(user, "--/--")}</p>
                        {user?.email && (
                            <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
                        )}
                        {user?.phone && (
                            <p className="text-xs text-gray-400 mt-0.5">{user.phone}</p>
                        )}
                        <div className="mt-2">
                            <TierBadge tier={tier} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function MentorshipDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const id     = String(params?.id ?? "");
    const isAgent = user?.role === UserRole.AGENT;

    const [mentorship, setMentorship] = useState<Mentorship | null>(null);
    const [isLoading, setIsLoading]   = useState(false);

    // A zone lead settles requests and re-statuses mappings in their patch, the
    // same actions an admin has here. Read from server-fetched standing, not a
    // role check: "is a zone lead" is not knowable from the role alone.
    const { data: standing } = GetNetworkStanding(user?.role as UserRole | undefined);
    const isZoneManager = Boolean(standing?.isZoneManager);
    // Settling requests and re-statusing is a supervisory act: zone leads and
    // admins only. A mentor sees the same page but has no action on it, which
    // is exactly what the API allows them.
    const canDecide = !isAgent || isZoneManager;
    // Profile links follow visibility, not authority. A mentor's mentee is in
    // their scope, so the link resolves for them; a plain agent's scope is only
    // themselves, and the profile page says so rather than erroring.
    const canViewProfiles = !isAgent || isZoneManager || Boolean(standing?.isMentor);

    // Both parties get a link. Where it goes depends on who is being looked at:
    // the caller's own card leads to their settings, where the record is theirs
    // to edit, rather than to a read-only copy of themselves.
    const isSelf = (agentId?: string) => Boolean(agentId && isSameId(agentId, user?.id));
    const profileHrefFor = (agentId: string) =>
        isSelf(agentId)
            ? PAGE_ROUTES.dashboard.settings.personalInfo
            : PAGE_ROUTES.dashboard.network.agents.details(agentId);

    const [decision, setDecision] = useState<"approve" | "reject" | null>(null);
    const [decisionReason, setDecisionReason] = useState("");
    const [isDeciding, setIsDeciding] = useState(false);

    const [isEditing, setIsEditing]         = useState(false);
    const [editStatus, setEditStatus]       = useState("");
    const [editIsFlagged, setEditIsFlagged] = useState(false);
    const [editReason, setEditReason]       = useState("");
    const [isSaving, setIsSaving]           = useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);

    const fetchMentorship = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const endpoint = isAgent
                ? API_ROUTES.network.myMentorshipDetails(id)
                : API_ROUTES.network.mentorships.details(id);
            const response = await axiosRequest.get(endpoint);
            const data: Mentorship = response?.data?.data ?? response?.data;
            setMentorship(data);
            setEditStatus(data.status);
            setEditIsFlagged(data.is_flagged);
            setEditReason("");
        } catch (error: any) {
            toast.error(error?.response?.data?.detail || error?.response?.data?.message || "Failed to fetch mentorship");
        } finally {
            setIsLoading(false);
        }
        // `isAgent` belongs in the deps: useAuth resolves asynchronously, so the
        // first render has no user and would otherwise pin this callback to the
        // admin endpoint — 403ing for every agent, permanently, since `id` never
        // changes to retrigger it.
    }, [id, isAgent]);

    useEffect(() => { fetchMentorship(); }, [fetchMentorship]);

    const handleDecision = async () => {
        if (!mentorship || !decision) return;
        setIsDeciding(true);
        try {
            await toast.promise(
                decision === "approve"
                    ? axiosRequest.post(API_ROUTES.network.approveMentorship(mentorship.id), {})
                    : axiosRequest.post(API_ROUTES.network.rejectMentorship(mentorship.id), {
                        ...(decisionReason.trim() ? { reason: decisionReason.trim() } : {}),
                    }),
                {
                    loading: decision === "approve" ? "Approving..." : "Rejecting...",
                    success: decision === "approve"
                        ? "Request approved — the mentorship is now active"
                        : "Request rejected and removed",
                    error: (err) => err?.response?.data?.detail || err?.response?.data?.message
                        || `Failed to ${decision} the request`,
                }
            );
            setDecision(null);
            setDecisionReason("");
            // A rejection deletes the row, so there is nothing left to show.
            if (decision === "reject") {
                router.push(PAGE_ROUTES.dashboard.network.mentorship.base);
            } else {
                fetchMentorship();
            }
        } catch {
            // surfaced by toast.promise
        } finally {
            setIsDeciding(false);
        }
    };

    const handleSave = async () => {
        if (!mentorship) return;
        setIsSaving(true);
        try {
            await toast.promise(
                // Agents PATCH their own route; the admin route is closed to
                // them. `is_flagged` is admin-only server-side and 403s the
                // whole request if an agent sends it, so it is omitted rather
                // than sent and refused.
                axiosRequest.patch(
                    isAgent
                        ? API_ROUTES.network.myMentorshipDetails(mentorship.id)
                        : API_ROUTES.network.mentorships.details(mentorship.id),
                    {
                        status: editStatus,
                        ...(isAgent ? {} : { is_flagged: editIsFlagged }),
                        ...(editReason.trim() ? { reason: editReason.trim() } : {}),
                    }
                ),
                {
                    loading: "Saving changes...",
                    success: "Mentorship updated successfully",
                    error: (err) => err?.response?.data?.detail || err?.response?.data?.message || "Failed to update mentorship",
                }
            );
            setIsEditing(false);
            fetchMentorship();
        } catch {
            // handled by toast.promise
        } finally {
            setIsSaving(false);
        }
    };

    const cancelEdit = () => {
        if (mentorship) {
            setEditStatus(mentorship.status);
            setEditIsFlagged(mentorship.is_flagged);
            setEditReason("");
        }
        setIsEditing(false);
    };

    return (
        <>
        <div className="p-[30px] mt-10 mb-100 border border-[#D9D9D9] rounded-[15px] bg-white shadow-md min-h-[calc(100vh-150px)]">
            <BreadCrumb
                description=""
                active="Mentorship Details"
                link_one={PAGE_ROUTES.dashboard.network.mentorship.base}
                link_one_name="Mentorship"
            />

            <div className="mt-0">
                <div className="flex justify-between items-center mb-[50px] mt-[10px]">
                    <h3 className="font-semibold">Mentorship Details</h3>
                    {!isEditing && !isAgent && (
                        <button
                            onClick={() => setIsEditing(true)}
                            disabled={isLoading || !mentorship}
                            className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                        >
                            <Icon icon="mdi:pencil" width="16" />
                            Edit
                        </button>
                    )}
                </div>

                {isLoading ? (
                    <div className="space-y-6">
                        <Skeleton className="h-[140px] w-full rounded-2xl" />
                        <Skeleton className="h-[280px] w-full rounded-2xl" />
                    </div>
                ) : !mentorship ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <Icon icon="hugeicons:album-not-found-01" width="32" height="32" className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">Mentorship not found</h3>
                        <button
                            onClick={() => router.push(PAGE_ROUTES.dashboard.network.mentorship.base)}
                            className="mt-4 px-4 py-2 text-sm text-primary hover:underline"
                        >
                            Back to mentorships
                        </button>
                    </div>
                ) : (
                    <>
                    <Grid container spacing={4}>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <AgentCard
                                label="Mentor"
                                user={mentorship.mentor}
                                tier={mentorship.mentor_tier}
                                profileId={mentorship.mentor_id}
                                showProfileLink={!isAgent || canViewProfiles || isSelf(mentorship.mentor_id)}
                                profileHref={isAgent ? profileHrefFor : undefined}
                                profileLabel={isAgent && isSelf(mentorship.mentor_id) ? "My Profile" : undefined}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 6 }}>
                            <AgentCard
                                label="Mentee"
                                user={mentorship.mentee}
                                tier={mentorship.mentee_tier}
                                profileId={mentorship.mentee_id}
                                showProfileLink={!isAgent || canViewProfiles || isSelf(mentorship.mentee_id)}
                                profileHref={isAgent ? profileHrefFor : undefined}
                                profileLabel={isAgent && isSelf(mentorship.mentee_id) ? "My Profile" : undefined}
                            />
                        </Grid>

                        {/* Mapping Information */}
                        <Grid size={{ xs: 12 }}>
                            <div className="mt-2 pt-6 border-t border-gray-100">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                        <Icon icon="solar:info-circle-bold-duotone" width="20" />
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-800">Mapping Information</h4>
                                </div>
                                <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                        <div className="space-y-1.5">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</p>
                                            {isEditing ? (
                                                <select
                                                    value={editStatus}
                                                    onChange={(e) => setEditStatus(e.target.value)}
                                                    className="w-full h-[42px] px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white"
                                                >
                                                    {MENTORSHIP_STATUSES.map((s) => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                            ) : (() => {
                                                const cfg = STATUS_CONFIG[mentorship.status] ?? STATUS_CONFIG.ENDED;
                                                return (
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                                                        {mentorship.status}
                                                    </span>
                                                );
                                            })()}
                                        </div>

                                        <div className="space-y-1.5">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Flagged</p>
                                            {isEditing ? (
                                                <div className="h-[42px] px-3 bg-white rounded-lg border border-gray-300 flex items-center justify-between">
                                                    <span className="text-sm font-medium text-gray-700">{editIsFlagged ? "Flagged" : "Not flagged"}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditIsFlagged((prev) => !prev)}
                                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${editIsFlagged ? "bg-red-500" : "bg-gray-300"}`}
                                                    >
                                                        <span className={`${editIsFlagged ? "translate-x-6" : "translate-x-1"} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                                                    </button>
                                                </div>
                                            ) : (
                                                mentorship.is_flagged ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                                                        <Icon icon="mdi:flag" width="12" /> Flagged
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                                        Not flagged
                                                    </span>
                                                )
                                            )}
                                        </div>

                                        <div className="space-y-1">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Invited by Mentor</p>
                                            <p className="text-sm font-medium text-gray-900">{mentorship.invited_by_mentor ? "Yes" : "No"}</p>
                                        </div>

                                        {mentorship.started_at && (
                                            <div className="space-y-1">
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Started At</p>
                                                <p className="text-sm font-medium text-gray-900">{formatDate(mentorship.started_at)}</p>
                                            </div>
                                        )}

                                        {mentorship.status === "PAUSED" && mentorship.paused_at && (
                                            <div className="space-y-1">
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Paused At</p>
                                                <p className="text-sm font-medium text-gray-900">{formatDate(mentorship.paused_at)}</p>
                                            </div>
                                        )}

                                        {mentorship.status === "ENDED" && mentorship.ended_at && (
                                            <div className="space-y-1">
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ended At</p>
                                                <p className="text-sm font-medium text-gray-900">{formatDate(mentorship.ended_at)}</p>
                                            </div>
                                        )}

                                        <div className="space-y-1">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Created At</p>
                                            <p className="text-sm font-medium text-gray-900">{formatDate(mentorship.created_at)}</p>
                                        </div>

                                        <div className="space-y-1">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Updated</p>
                                            <p className="text-sm font-medium text-gray-900">{formatDate(mentorship.updated_at)}</p>
                                        </div>

                                        {isEditing && (
                                            <div className="md:col-span-2 space-y-1.5">
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason <span className="normal-case font-normal text-gray-400">(optional)</span></p>
                                                <textarea
                                                    rows={3}
                                                    value={editReason}
                                                    onChange={(e) => setEditReason(e.target.value)}
                                                    placeholder="Provide a reason for this update..."
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white resize-none"
                                                />
                                            </div>
                                        )}

                                    </div>
                                </div>
                            </div>
                        </Grid>

                    </Grid>

                    {isEditing && (
                        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                onClick={cancelEdit}
                                className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => setShowSaveConfirm(true)}
                                disabled={isSaving}
                                className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                            >
                                <Icon icon="mdi:content-save" width="16" />
                                Save Changes
                            </button>
                        </div>
                    )}
                    </>
                )}
            </div>
        </div>

        {showSaveConfirm && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                    <div className="p-6">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <Icon icon="mdi:content-save" width="24" className="text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Save changes?</h3>
                        <p className="text-sm text-gray-500">
                            You are about to update this mentorship&apos;s status
                            {mentorship && editStatus !== mentorship.status && <> to <span className="font-semibold text-gray-700">{editStatus}</span></>}
                            {mentorship && editIsFlagged !== mentorship.is_flagged && <> and {editIsFlagged ? "flag" : "unflag"} it</>}.
                            {" "}Please confirm you want to proceed.
                        </p>
                    </div>
                    <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-gray-100">
                        <button
                            onClick={() => setShowSaveConfirm(false)}
                            className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => { setShowSaveConfirm(false); handleSave(); }}
                            disabled={isSaving}
                            className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20"
                        >
                            Yes, save
                        </button>
                    </div>
                </div>
            </div>
        )}
            {decision && (() => {
                const isReject = decision === "reject";
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
                                    {isReject
                                        ? "The request will be permanently deleted, not archived. Both agents are notified, naming you. The mentor may request again."
                                        : "The mentorship becomes active immediately and overrides begin accruing. Both agents are notified."}
                                </p>
                                {isReject && (
                                    <div className="mt-4">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                                            Reason <span className="font-normal normal-case tracking-normal text-gray-400">(optional)</span>
                                        </label>
                                        <textarea
                                            value={decisionReason}
                                            onChange={(e) => setDecisionReason(e.target.value)}
                                            rows={3}
                                            placeholder="Included in the notification sent to both agents"
                                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-gray-100">
                                <button
                                    onClick={() => { setDecision(null); setDecisionReason(""); }}
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

        </>
    );
}

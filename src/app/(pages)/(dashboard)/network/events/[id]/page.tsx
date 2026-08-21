"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import Grid from "@mui/material/Grid2";
import { Skeleton } from "@/components/ui/skeleton";
import BreadCrumb from "@/src/components/breadcrumb";
import axiosRequest from "@/src/lib/api";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import { extractUuids, formatDate, formatEventReason } from "@/src/lib/utils";

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
    related_event_id: string | null;
    is_remitted: boolean;
    remitted_at: string | null;
    created_at: string;
    updated_at: string;
}

interface UserProfile {
    first_name?: string | null;
    firstName?: string | null;
    last_name?: string | null;
    lastName?: string | null;
    profile_image?: string | null;
    profileImage?: string | null;
    kyc_status?: string;
    kycStatus?: string;
}

interface AgentUser {
    id: string | number;
    email: string;
    phone?: string | null;
    role: string | Record<string, any>;
    is_active?: boolean;
    isActive?: boolean;
    profile?: UserProfile;
    first_name?: string | null;
    firstName?: string | null;
    last_name?: string | null;
    lastName?: string | null;
    profile_image?: string | null;
    profileImage?: string | null;
    kyc_status?: string;
    kycStatus?: string;
}

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
    BRONZE: { label: "Bronze", color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-300"  },
    SILVER: { label: "Silver", color: "text-slate-600",  bg: "bg-slate-100", border: "border-slate-300"  },
    GOLD:   { label: "Gold",   color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-300" },
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
    CONFIRMED: { bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200" },
    PENDING:   { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
    REVERSED:  { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
    REJECTED:  { bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200"    },
};

function formatActionType(type: string) {
    return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatEntityType(type: string | null) {
    if (!type) return "--/--";
    return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getAgentName(agent: AgentUser): string {
    const firstName = agent?.profile?.first_name || agent?.profile?.firstName || agent?.first_name || agent?.firstName || "";
    const lastName  = agent?.profile?.last_name  || agent?.profile?.lastName  || agent?.last_name  || agent?.lastName  || "";
    return [firstName, lastName].filter(Boolean).join(" ") || "--/--";
}

function getAgentImage(agent: AgentUser): string | null {
    return agent?.profile?.profile_image || agent?.profile?.profileImage || agent?.profile_image || agent?.profileImage || null;
}

function getKycStatus(agent: AgentUser): string {
    return agent?.profile?.kyc_status || agent?.profile?.kycStatus || agent?.kyc_status || agent?.kycStatus || "--/--";
}

function getRoleName(role: string | Record<string, any>): string {
    if (typeof role === "string") return role;
    return role?.name || role?.value || "--/--";
}

const EVENT_STATUSES = ["PENDING", "CONFIRMED", "REVERSED", "REJECTED"] as const;

export default function NetworkEventDetail() {
    const params       = useParams();
    const router       = useRouter();
    const searchParams = useSearchParams();
    const id           = String(params?.id ?? "");

    const [event, setEvent]           = useState<NetworkEvent | null>(null);
    const [agent, setAgent]           = useState<AgentUser | null>(null);
    const [agentTier, setAgentTier]   = useState<string | null>(null);
    const [eventLoading, setEventLoading] = useState(false);
    const [agentLoading, setAgentLoading] = useState(false);

    // Names for the agent ids frozen into the reason string — a
    // MENTOR_POINT_OVERRIDE row names its mentee by raw UUID. Resolved per id
    // rather than from a directory page, so it never depends on the mentee
    // happening to fall inside the first page of the agent list.
    const [reasonNames, setReasonNames] = useState<Record<string, string>>({});

    const [isEditing, setIsEditing]       = useState(searchParams.get("edit") === "true");
    const [editStatus, setEditStatus]     = useState<string>("");
    const [editReason, setEditReason]     = useState<string>("");
    const [isSaving, setIsSaving]         = useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);

    const fetchEvent = useCallback(async () => {
        if (!id) return;
        setEventLoading(true);
        try {
            const response = await axiosRequest.get(API_ROUTES.network.events.details(id));
            const data: NetworkEvent = response?.data?.data ?? response?.data;
            setEvent(data);
            setEditStatus(data.status);
            setEditReason(data.reason ?? "");
        } catch (error: any) {
            toast.error(error?.response?.data?.detail || error?.response?.data?.message || "Failed to fetch event");
        } finally {
            setEventLoading(false);
        }
    }, [id]);

    const fetchAgent = useCallback(async (agentId: string) => {
        setAgentLoading(true);
        try {
            const response = await axiosRequest.get(API_ROUTES.admin.users.userByUuid(agentId));
            setAgent(response?.data?.data ?? response?.data);
        } catch {
            // agent info is supplementary; fail silently
        } finally {
            setAgentLoading(false);
        }
    }, []);

    useEffect(() => { fetchEvent(); }, [fetchEvent]);

    useEffect(() => {
        if (event?.agent_id) fetchAgent(event.agent_id);
    }, [event?.agent_id, fetchAgent]);

    useEffect(() => {
        const ids = extractUuids(event?.reason).filter((uuid) => !reasonNames[uuid]);
        if (ids.length === 0) return;
        let cancelled = false;
        Promise.allSettled(
            ids.map((uuid) => axiosRequest.get(API_ROUTES.admin.users.userByUuid(uuid))),
        ).then((results) => {
            if (cancelled) return;
            const resolved: Record<string, string> = {};
            results.forEach((result, i) => {
                if (result.status !== "fulfilled") return;
                const data = result.value?.data?.data ?? result.value?.data;
                const name = data ? getAgentName(data as AgentUser) : "";
                // getAgentName returns the "--/--" placeholder for a nameless
                // profile; substituting that would be worse than the id.
                if (name && name !== "--/--") resolved[ids[i]] = name;
            });
            if (Object.keys(resolved).length > 0) {
                setReasonNames((prev) => ({ ...prev, ...resolved }));
            }
        });
        return () => { cancelled = true; };
        // reasonNames is deliberately out of the dep list — it is what this
        // effect writes, and the filter above already makes the run idempotent.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [event?.reason]);

    useEffect(() => {
        if (!event?.agent_id) { setAgentTier(null); return; }
        axiosRequest.get(API_ROUTES.network.agents.tier(event.agent_id))
            .then((res) => {
                const d = res?.data?.data ?? res?.data;
                setAgentTier(d?.current_tier ?? null);
            })
            .catch(() => { /* non-critical */ });
    }, [event?.agent_id]);

    const handleSave = async () => {
        if (!event) return;
        setIsSaving(true);
        try {
            await toast.promise(
                axiosRequest.patch(API_ROUTES.network.events.update(event.id), {
                    status: editStatus,
                    reason: editReason,
                }),
                {
                    loading: "Saving changes...",
                    success: "Event updated successfully",
                    error: (err) => err?.response?.data?.detail || err?.response?.data?.message || "Failed to update event",
                }
            );
            setIsEditing(false);
            fetchEvent();
        } catch {
            // handled by toast.promise
        } finally {
            setIsSaving(false);
        }
    };

    const agentImage = agent ? getAgentImage(agent) : null;

    return (
        <>
        <div className="p-[30px] mt-10 mb-100 border border-[#D9D9D9] rounded-[15px] bg-white shadow-md min-h-[calc(100vh-150px)]">
            <BreadCrumb
                description=""
                active="Event Details"
                link_one={PAGE_ROUTES.dashboard.network.events.base}
                link_one_name="Network Events"
            />

            <div className="mt-0">
                <div className="flex justify-between items-center mb-[50px] mt-[10px]">
                    <h3 className="font-semibold">Event Details</h3>
                    {!isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            disabled={eventLoading || !event}
                            className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                        >
                            <Icon icon="mdi:pencil" width="16" />
                            Edit
                        </button>
                    )}
                </div>

                {eventLoading ? (
                    <div className="space-y-6">
                        <Skeleton className="h-[120px] w-full rounded-2xl" />
                        <Skeleton className="h-[300px] w-full rounded-2xl" />
                    </div>
                ) : !event ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <Icon icon="hugeicons:album-not-found-01" width="32" height="32" className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">Event not found</h3>
                        <button
                            onClick={() => router.push(PAGE_ROUTES.dashboard.network.events.base)}
                            className="mt-4 px-4 py-2 text-sm text-primary hover:underline"
                        >
                            Back to events
                        </button>
                    </div>
                ) : (
                    <>
                    <Grid container spacing={4}>

                        {/* Agent Card */}
                        <Grid size={{ xs: 12 }}>
                            <div className="flex items-center justify-between gap-2 mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                        <Icon icon="solar:user-bold-duotone" width="20" />
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-800">Agent</h4>
                                </div>
                                {agent?.id && (
                                    <Link
                                        href={`/user-management/agents/${agent.id}`}
                                        className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors"
                                    >
                                        <Icon icon="mdi:open-in-new" width="13" />
                                        View Profile
                                    </Link>
                                )}
                            </div>
                            {agentLoading ? (
                                <Skeleton className="h-[100px] w-full rounded-2xl" />
                            ) : (
                                <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                                    <div className="flex items-center gap-4 mb-5">
                                        <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-gray-300 flex-shrink-0">
                                            {agentImage ? (
                                                <Image
                                                    src={agentImage}
                                                    alt="agent"
                                                    fill
                                                    className="object-cover rounded-full"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                                    <Icon icon="gg:profile" width="28" height="28" className="text-gray-500" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-semibold text-gray-900">{agent ? getAgentName(agent) : "--/--"}</p>
                                                {agentTier && TIER_CONFIG[agentTier] && (() => {
                                                    const tc = TIER_CONFIG[agentTier];
                                                    return (
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${tc.bg} ${tc.color} ${tc.border}`}>
                                                            <Icon icon="solar:medal-ribbons-star-bold-duotone" width="11" />
                                                            {tc.label}
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                            <p className="text-xs text-gray-500">{agent?.email || "--/--"}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-1">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</p>
                                            <p className="text-sm font-medium text-gray-900">{agent?.phone || "--/--"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</p>
                                            <p className="text-sm font-medium text-gray-900">{agent ? getRoleName(agent.role) : "--/--"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">KYC Status</p>
                                            <p className="text-sm font-medium text-gray-900">{agent ? getKycStatus(agent) : "--/--"}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Grid>

                        {/* Event Details Card */}
                        <Grid size={{ xs: 12 }}>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    <Icon icon="solar:info-circle-bold-duotone" width="20" />
                                </div>
                                <h4 className="text-lg font-bold text-gray-800">Event Information</h4>
                            </div>
                            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Event ID</p>
                                        <p className="text-sm font-medium text-gray-900 break-all">{event.id}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Action Type</p>
                                        <p className="text-sm font-medium text-gray-900">{formatActionType(event.action_type)}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</p>
                                        {isEditing ? (
                                            <select
                                                value={editStatus}
                                                onChange={(e) => setEditStatus(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white"
                                            >
                                                {EVENT_STATUSES.map((s) => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                        ) : (() => {
                                            const cfg = STATUS_CONFIG[event.status] ?? { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" };
                                            return (
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                                                    {event.status}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Points Awarded</p>
                                        <p className={`text-xl font-bold ${event.points_awarded >= 0 ? "text-green-600" : "text-red-600"}`}>
                                            {event.points_awarded >= 0 ? "+" : ""}{event.points_awarded}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Base Points</p>
                                        <p className="text-xl font-bold text-gray-900">{event.base_points}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Multiplier</p>
                                        <p className="text-xl font-bold text-gray-900">{event.multiplier_applied}×</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Adjustment</p>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${event.adjustment_direction === "ADDITION" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                            {event.adjustment_direction === "ADDITION" ? "Addition" : "Deduction"}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Entity Type</p>
                                        <p className="text-sm font-medium text-gray-900">{formatEntityType(event.entity_type)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Entity ID</p>
                                        <p className="text-sm font-medium text-gray-900 break-all">{event.entity_id || "--/--"}</p>
                                    </div>
                                    {event.action_type === "MANUAL_ADJUSTMENT" && (
                                        <div className="space-y-1">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Related Event ID</p>
                                            {event.related_event_id ? (
                                                <Link
                                                    href={PAGE_ROUTES.dashboard.network.events.details(event.related_event_id)}
                                                    className="text-sm font-medium text-green-600 hover:text-green-700 hover:underline break-all"
                                                >
                                                    {event.related_event_id}
                                                </Link>
                                            ) : (
                                                <p className="text-sm font-medium text-gray-900">--/--</p>
                                            )}
                                        </div>
                                    )}
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Flagged</p>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${event.is_flagged ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-600"}`}>
                                            {event.is_flagged ? "Yes" : "No"}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Remitted</p>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${event.is_remitted ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                                            {event.is_remitted ? "Yes" : "No"}
                                        </span>
                                    </div>
                                    {event.remitted_at && (
                                        <div className="space-y-1">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Remitted At</p>
                                            <p className="text-sm font-medium text-gray-900">{formatDate(event.remitted_at)}</p>
                                        </div>
                                    )}
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Created At</p>
                                        <p className="text-sm font-medium text-gray-900">{formatDate(event.created_at)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Updated At</p>
                                        <p className="text-sm font-medium text-gray-900">{formatDate(event.updated_at)}</p>
                                    </div>
                                    <div className={`space-y-2 ${isEditing ? "md:col-span-2" : ""}`}>
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Reason</p>
                                        {isEditing ? (
                                            <textarea
                                                rows={4}
                                                value={editReason}
                                                onChange={(e) => setEditReason(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none bg-white"
                                                placeholder="Enter reason..."
                                            />
                                        ) : (
                                            <p className="text-sm font-medium text-gray-900">
                                                {formatEventReason(event.reason, (uuid) => reasonNames[uuid]) || "--/--"}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Grid>

                    </Grid>

                    {isEditing && (
                        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => setShowSaveConfirm(true)}
                                disabled={isSaving}
                                className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                            >
                                <Icon icon="mdi:content-save" />
                                Save Changes
                            </button>
                        </div>
                    )}
                    </>
                )}
            </div>
        </div>

            {/* Save Changes Confirmation Modal */}
            {showSaveConfirm && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="p-6">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <Icon icon="mdi:content-save" width="24" className="text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">Save changes?</h3>
                            <p className="text-sm text-gray-500">You are about to update this event&apos;s status{editReason ? " and reason" : ""}. Please confirm you want to proceed.</p>
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
        </>
    );
}

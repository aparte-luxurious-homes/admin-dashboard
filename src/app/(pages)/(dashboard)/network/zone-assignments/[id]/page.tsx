"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/src/hooks/useAuth";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import Grid from "@mui/material/Grid2";
import { Skeleton } from "@/components/ui/skeleton";
import BreadCrumb from "@/src/components/breadcrumb";
import axiosRequest from "@/src/lib/api";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import { formatDate } from "@/src/lib/utils";
import type { ViewBBox } from "@/src/components/network/BBoxMapViewer";

const BBoxMapViewer = dynamic(() => import("@/src/components/network/BBoxMapViewer"), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center" style={{ height: 420 }}>
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    ),
});

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
    status: AssignmentStatus;
    created_at: string;
    updated_at: string;
    user?: {
        first_name?: string;
        last_name?: string;
        email?: string;
        phone?: string;
        profile_image?: string;
    };
    zone?: {
        id: string;
        name: string;
        type: string;
        status?: string;
        parent_zone_id?: string | null;
        parent_zone?: { id: string; name: string; type: string } | null;
        resolver_config?: {
            city?: string;
            state?: string;
            country?: string;
            bbox?: { lat_min?: number; lat_max?: number; lng_min?: number; lng_max?: number };
        } | null;
    };
}

const ROLE_CONFIG: Record<Role, { label: string; bg: string; text: string; border: string }> = {
    AREA_MANAGER:  { label: "Area Manager",  bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200"   },
    REGIONAL_LEAD: { label: "Regional Lead", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
};

const STATUS_CONFIG: Record<AssignmentStatus, { bg: string; text: string; border: string }> = {
    ACTIVE:    { bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200"  },
    SUSPENDED: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
    ENDED:     { bg: "bg-gray-100",  text: "text-gray-600",   border: "border-gray-200"   },
    EXPIRED:   { bg: "bg-red-50",    text: "text-red-700",    border: "border-red-200"    },
};

const ZONE_TYPE_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
    CITY:   { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200"   },
    AREA:   { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
    REGION: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
};

const ASSIGNMENT_STATUSES: AssignmentStatus[] = ["ACTIVE", "SUSPENDED", "ENDED", "EXPIRED"];

function agentDisplayName(user?: ZoneAssignment["user"]): string {
    const first = user?.first_name ?? "";
    const last  = user?.last_name  ?? "";
    return [first, last].filter(Boolean).join(" ") || user?.email || "—";
}

function formatNGN(amount: number) {
    return `₦${amount.toLocaleString()}`;
}

export default function ZoneAssignmentDetailPage() {
    const params       = useParams();
    const router       = useRouter();
    const searchParams = useSearchParams();
    const id           = String(params?.id ?? "");
    const { user: authUser } = useAuth();
    const isAdmin            = authUser?.role === "ADMIN" || authUser?.role === "SUPER_ADMIN";

    const [assignment, setAssignment] = useState<ZoneAssignment | null>(null);
    const [isLoading, setIsLoading]   = useState(false);
    const [parentZoneData, setParentZoneData] = useState<{ id: string; name: string; type: string } | null>(null);

    const [isEditing, setIsEditing]             = useState(searchParams.get("edit") === "true");
    const [editRate, setEditRate]               = useState(0);
    const [editThreshold, setEditThreshold]     = useState(0);
    const [editMode, setEditMode]               = useState<EmploymentMode>("COMMISSION_ONLY");
    const [editStatus, setEditStatus]           = useState<AssignmentStatus>("ACTIVE");
    const [isSaving, setIsSaving]               = useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const [showViewMap, setShowViewMap]         = useState(false);

    const fetchAssignment = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const endpoint = isAdmin
                ? API_ROUTES.network.configs.zones.assignments.details(id)
                : API_ROUTES.network.myZoneAssignmentDetails(id);
            const res = await axiosRequest.get(endpoint);
            const data: ZoneAssignment = res?.data?.data ?? res?.data;
            setAssignment(data);
            setEditRate(parseFloat((data.override_rate * 100).toFixed(4)));
            setEditThreshold(data.monthly_gbv_threshold);
            setEditMode(data.employment_mode);
            setEditStatus(data.status ?? "ACTIVE");
        } catch (error: any) {
            toast.error(error?.response?.data?.detail || error?.response?.data?.message || "Failed to fetch assignment");
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchAssignment(); }, [fetchAssignment]);

    // Fetch parent zone details when the API only returns parent_zone_id without the embedded object
    useEffect(() => {
        const pid = assignment?.zone?.parent_zone_id;
        if (!pid) { setParentZoneData(null); return; }
        // If the embedded parent_zone object is already present, use it directly
        if (assignment?.zone?.parent_zone) {
            setParentZoneData(assignment.zone.parent_zone);
            return;
        }
        axiosRequest.get(API_ROUTES.network.configs.zones.details(pid))
            .then((res) => {
                const z = res?.data?.data ?? res?.data;
                if (z?.id) setParentZoneData({ id: z.id, name: z.name, type: z.type });
            })
            .catch(() => { /* non-critical */ });
    }, [assignment?.zone?.parent_zone_id, assignment?.zone?.parent_zone]);

    const handleSave = async () => {
        if (!assignment) return;
        setIsSaving(true);
        try {
            await toast.promise(
                axiosRequest.patch(API_ROUTES.network.configs.zones.assignments.details(assignment.id), {
                    override_rate: editRate / 100,
                    monthly_gbv_threshold: editThreshold,
                    employment_mode: editMode,
                    status: editStatus,
                }),
                {
                    loading: "Saving changes...",
                    success: "Assignment updated",
                    error: (err) => err?.response?.data?.detail || err?.response?.data?.message || "Failed to update assignment",
                }
            );
            setIsEditing(false);
            fetchAssignment();
        } catch {
        } finally {
            setIsSaving(false);
        }
    };

    const cancelEdit = () => {
        if (assignment) {
            setEditRate(parseFloat((assignment.override_rate * 100).toFixed(4)));
            setEditThreshold(assignment.monthly_gbv_threshold);
            setEditMode(assignment.employment_mode);
            setEditStatus(assignment.status ?? "ACTIVE");
        }
        setIsEditing(false);
    };

    const user = assignment?.user;
    const zone = assignment?.zone;
    const roleCfg = assignment ? ROLE_CONFIG[assignment.role] : null;
    const statusCfg = assignment ? (STATUS_CONFIG[assignment.status] ?? STATUS_CONFIG.ENDED) : null;
    const zoneTypeCfg = zone ? (ZONE_TYPE_CONFIG[zone.type] ?? ZONE_TYPE_CONFIG.CITY) : null;

    return (
        <>
        <div className="p-[30px] mt-10 mb-100 border border-[#D9D9D9] rounded-[15px] bg-white shadow-md min-h-[calc(100vh-150px)]">
            <BreadCrumb
                description=""
                active="Assignment Details"
                link_one={PAGE_ROUTES.dashboard.network.zoneAssignments.base}
                link_one_name="Zone Assignments"
            />

            <div className="mt-0">
                <div className="flex justify-between items-center mb-[50px] mt-[10px]">
                    <h3 className="font-semibold">Assignment Details</h3>
                    {isAdmin && !isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            disabled={isLoading || !assignment}
                            className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                        >
                            <Icon icon="mdi:pencil" width="16" />
                            Edit
                        </button>
                    )}
                </div>

                {isLoading ? (
                    <div className="space-y-6">
                        <Skeleton className="h-[120px] w-full rounded-2xl" />
                        <Skeleton className="h-[120px] w-full rounded-2xl" />
                        <Skeleton className="h-[300px] w-full rounded-2xl" />
                    </div>
                ) : !assignment ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <Icon icon="hugeicons:album-not-found-01" width="32" height="32" className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">Assignment not found</h3>
                        <button
                            onClick={() => router.push(PAGE_ROUTES.dashboard.network.zoneAssignments.base)}
                            className="mt-4 px-4 py-2 text-sm text-primary hover:underline"
                        >
                            Back to zone assignments
                        </button>
                    </div>
                ) : (
                    <>
                    <Grid container spacing={4}>

                        {/* Agent Card — admin only */}
                        {isAdmin && (
                        <Grid size={{ xs: 12 }}>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    <Icon icon="solar:user-bold-duotone" width="20" />
                                </div>
                                <h4 className="text-lg font-bold text-gray-800">Agent</h4>
                            </div>
                            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                                <div className="flex items-center gap-4">
                                    <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-gray-200 flex-shrink-0">
                                        {user?.profile_image ? (
                                            <Image src={user.profile_image} alt="agent" fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                                <Icon icon="gg:profile" width="30" className="text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-gray-900">{agentDisplayName(user)}</p>
                                        {user?.email && <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>}
                                        {user?.phone && <p className="text-xs text-gray-400 mt-0.5">{user.phone}</p>}
                                    </div>
                                </div>
                            </div>
                        </Grid>
                        )}

                        {/* Assignment Information */}
                        <Grid size={{ xs: 12 }}>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    <Icon icon="solar:info-circle-bold-duotone" width="20" />
                                </div>
                                <h4 className="text-lg font-bold text-gray-800">Assignment Information</h4>
                            </div>
                            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                    <div className="space-y-1.5">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</p>
                                        {isEditing ? (
                                            <select
                                                value={editStatus}
                                                onChange={(e) => setEditStatus(e.target.value as AssignmentStatus)}
                                                className="w-full h-[42px] px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white"
                                            >
                                                {ASSIGNMENT_STATUSES.map((s) => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                        ) : statusCfg && (
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                                                {assignment.status}
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</p>
                                        {roleCfg && (
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleCfg.bg} ${roleCfg.text} ${roleCfg.border}`}>
                                                {roleCfg.label}
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Override Rate</p>
                                        {isEditing ? (
                                            <div className="relative">
                                                <input
                                                    type="number" step="0.01" min={0} max={100}
                                                    value={editRate}
                                                    onChange={(e) => setEditRate(Number(e.target.value))}
                                                    className="w-full px-4 py-2.5 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                                            </div>
                                        ) : (
                                            <p className="text-xl font-bold text-gray-900">{(assignment.override_rate * 100).toFixed(1)}%</p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Monthly GBV Threshold</p>
                                        {isEditing ? (
                                            <input
                                                type="number" min={0}
                                                value={editThreshold}
                                                onChange={(e) => setEditThreshold(Number(e.target.value))}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white"
                                            />
                                        ) : (
                                            <p className="text-xl font-bold text-gray-900">{formatNGN(assignment.monthly_gbv_threshold)}</p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Employment Mode</p>
                                        {isEditing ? (
                                            <select
                                                value={editMode}
                                                onChange={(e) => setEditMode(e.target.value as EmploymentMode)}
                                                className="w-full h-[42px] px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white"
                                            >
                                                <option value="COMMISSION_ONLY">Commission Only</option>
                                                <option value="SALARIED_OVERLAY">Salaried Overlay</option>
                                            </select>
                                        ) : (
                                            <p className="text-sm font-medium text-gray-900">
                                                {assignment.employment_mode === "COMMISSION_ONLY" ? "Commission Only" : "Salaried Overlay"}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">End Date</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {assignment.end_date ? formatDate(assignment.end_date) : "—"}
                                        </p>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Start Date</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {assignment.start_date ? formatDate(assignment.start_date) : "—"}
                                        </p>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Created At</p>
                                        <p className="text-sm font-medium text-gray-900">{formatDate(assignment.created_at)}</p>
                                    </div>

                                </div>

                                {/* Zone Information — inside the assignment card */}
                                {zone && (
                                    <div className="pt-5 border-t border-gray-200">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                    <Icon icon="solar:map-point-bold-duotone" width="16" />
                                                </div>
                                                <p className="text-sm font-bold text-gray-700 uppercase tracking-wider">Zone</p>
                                            </div>
                                            {isAdmin && (
                                                <button
                                                    onClick={() => router.push(PAGE_ROUTES.dashboard.network.zones.details(zone.id))}
                                                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors"
                                                >
                                                    <Icon icon="mdi:open-in-new" width="13" />
                                                    View Zone
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-1">
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Zone Name</p>
                                                <p className="text-sm font-medium text-gray-900">{zone.name}</p>
                                            </div>

                                            <div className="space-y-1">
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Zone Type</p>
                                                {zoneTypeCfg && (
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${zoneTypeCfg.bg} ${zoneTypeCfg.text} ${zoneTypeCfg.border}`}>
                                                        {zone.type}
                                                    </span>
                                                )}
                                            </div>

                                            {zone.status && (
                                                <div className="space-y-1">
                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Zone Status</p>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${zone.status === "ACTIVE" ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                                                        {zone.status}
                                                    </span>
                                                </div>
                                            )}

                                            {zone.parent_zone_id && (
                                                <div className="space-y-1">
                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Parent Zone</p>
                                                    {parentZoneData ? (
                                                        isAdmin ? (
                                                            <Link
                                                                href={PAGE_ROUTES.dashboard.network.zones.details(parentZoneData.id)}
                                                                className="inline-flex items-center gap-1 text-primary hover:underline font-medium text-sm"
                                                            >
                                                                {parentZoneData.name}
                                                                <span className="text-xs font-normal text-gray-500">({parentZoneData.type})</span>
                                                            </Link>
                                                        ) : (
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {parentZoneData.name} <span className="text-gray-500">({parentZoneData.type})</span>
                                                            </p>
                                                        )
                                                    ) : (
                                                        <p className="text-xs text-gray-400 font-mono">{zone.parent_zone_id}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Resolver config */}
                                        {zone.resolver_config && (() => {
                                            const rc = zone.resolver_config!;
                                            const hasAddress = rc.city || rc.state || rc.country;
                                            const hasBbox    = rc.bbox && Object.values(rc.bbox).some((v) => v !== undefined);
                                            if (!hasAddress && !hasBbox) return null;
                                            return (
                                                <div className="mt-5 space-y-3">
                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Resolver Config</p>
                                                    <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
                                                        {hasAddress && (
                                                            <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
                                                                {(["city", "state", "country"] as const).map((k) => (
                                                                    <div key={k} className="px-4 py-3 space-y-0.5">
                                                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{k}</p>
                                                                        <p className="text-sm font-medium text-gray-800 truncate">
                                                                            {rc[k] || <span className="text-gray-300">—</span>}
                                                                        </p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {hasBbox && (
                                                            <div className="px-4 py-3 space-y-2.5">
                                                                <div className="flex items-center justify-between">
                                                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Bounding Box</p>
                                                                    <button
                                                                        onClick={() => setShowViewMap(true)}
                                                                        className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors"
                                                                    >
                                                                        <Icon icon="mdi:map-outline" width="13" />
                                                                        View on Map
                                                                    </button>
                                                                </div>
                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                                    {[
                                                                        { label: "Lat min", val: rc.bbox!.lat_min },
                                                                        { label: "Lat max", val: rc.bbox!.lat_max },
                                                                        { label: "Lng min", val: rc.bbox!.lng_min },
                                                                        { label: "Lng max", val: rc.bbox!.lng_max },
                                                                    ].filter(({ val }) => val !== undefined).map(({ label, val }) => (
                                                                        <div key={label} className="bg-gray-50 rounded-lg p-2.5">
                                                                            <p className="text-[10px] font-semibold text-gray-400 uppercase">{label}</p>
                                                                            <p className="text-sm font-bold text-gray-800 mt-0.5">{val}</p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}
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

        {/* View on Map modal */}
        {showViewMap && zone?.resolver_config?.bbox && (() => {
            const b = zone.resolver_config!.bbox as ViewBBox;
            return (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">{zone.name}</h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {[zone.resolver_config!.city, zone.resolver_config!.state, zone.resolver_config!.country]
                                        .filter(Boolean).join(", ") || "Zone boundary"}
                                </p>
                            </div>
                            <button onClick={() => setShowViewMap(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <Icon icon="lucide:x" width="18" className="text-gray-500" />
                            </button>
                        </div>
                        <BBoxMapViewer bbox={b} />
                    </div>
                </div>
            );
        })()}

        {showSaveConfirm && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                    <div className="p-6">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <Icon icon="mdi:content-save" width="24" className="text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Save changes?</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            You are about to update this zone assignment
                            {assignment && editStatus !== assignment.status && (
                                <> — status will change to <span className="font-semibold text-gray-700">{editStatus}</span></>
                            )}.
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
        </>
    );
}

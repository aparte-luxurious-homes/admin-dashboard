"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import Grid from "@mui/material/Grid2";
import { Skeleton } from "@/components/ui/skeleton";
import BreadCrumb from "@/src/components/breadcrumb";
import axiosRequest from "@/src/lib/api";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import { formatDate } from "@/src/lib/utils";

type ZoneType = "CITY" | "AREA" | "REGION";

interface Zone {
    id: string;
    type: ZoneType;
    name: string;
    status?: string;
    parent_zone_id?: string | null;
    parent_zone?: { id: string; name: string; type: string } | null;
    resolver_config?: Record<string, any> | null;
    created_at?: string;
    updated_at?: string;
}

const TYPE_CONFIG: Record<ZoneType, { bg: string; text: string; border: string }> = {
    CITY:   { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200"   },
    AREA:   { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
    REGION: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
};

const ZONE_TYPES: ZoneType[] = ["CITY", "AREA", "REGION"];

function TypeBadge({ type }: { type: ZoneType }) {
    const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.CITY;
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
            {type}
        </span>
    );
}

function StatusBadge({ status }: { status?: string }) {
    if (!status) return <span className="text-sm font-medium text-gray-400">—</span>;
    const isActive = status === "ACTIVE";
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
            {status}
        </span>
    );
}

function parseJson(raw: string): [Record<string, any> | null, string] {
    if (!raw.trim()) return [null, ""];
    try { return [JSON.parse(raw), ""]; } catch { return [null, "Invalid JSON"]; }
}

export default function ZoneDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id     = String(params?.id ?? "");

    const [zone, setZone]           = useState<Zone | null>(null);
    const [allZones, setAllZones]   = useState<Zone[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const [isEditing, setIsEditing]             = useState(false);
    const [editName, setEditName]               = useState("");
    const [editType, setEditType]               = useState<ZoneType>("CITY");
    const [editParentId, setEditParentId]       = useState("");
    const [editResolverJson, setEditResolverJson] = useState("");
    const [editJsonError, setEditJsonError]     = useState("");
    const [isSaving, setIsSaving]               = useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting]               = useState(false);

    const fetchZone = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const res = await axiosRequest.get(API_ROUTES.network.configs.zones.details(id));
            const data: Zone = res?.data?.data ?? res?.data;
            setZone(data);
            setEditName(data.name);
            setEditType(data.type);
            setEditParentId(data.parent_zone_id ?? "");
            setEditResolverJson(data.resolver_config ? JSON.stringify(data.resolver_config, null, 2) : "");
        } catch (error: any) {
            toast.error(error?.response?.data?.detail || error?.response?.data?.message || "Failed to fetch zone");
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchZone(); }, [fetchZone]);

    useEffect(() => {
        axiosRequest.get(API_ROUTES.network.configs.zones.base, { params: { page: 1, size: 200 } })
            .then((res) => {
                const data = res?.data?.data ?? res?.data;
                const items = data?.items ?? data?.data ?? (Array.isArray(data) ? data : []);
                setAllZones(items.filter((z: Zone) => z.id !== id));
            })
            .catch(() => {});
    }, [id]);

    const handleSave = async () => {
        if (!zone) return;
        const [resolver, err] = parseJson(editResolverJson);
        if (err) { setEditJsonError(err); return; }
        setIsSaving(true);
        try {
            await toast.promise(
                axiosRequest.patch(API_ROUTES.network.configs.zones.details(zone.id), {
                    type: editType,
                    name: editName.trim(),
                    ...(editParentId ? { parent_zone_id: editParentId } : {}),
                    ...(resolver     ? { resolver_config: resolver }    : {}),
                }),
                {
                    loading: "Saving changes...",
                    success: "Zone updated",
                    error: (err) => err?.response?.data?.detail || err?.response?.data?.message || "Failed to update zone",
                }
            );
            setIsEditing(false);
            setShowSaveConfirm(false);
            fetchZone();
        } catch {
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!zone) return;
        setIsDeleting(true);
        try {
            await toast.promise(
                axiosRequest.delete(API_ROUTES.network.configs.zones.details(zone.id)),
                {
                    loading: "Deleting zone...",
                    success: "Zone deleted",
                    error: (err) => err?.response?.data?.detail || err?.response?.data?.message || "Failed to delete zone",
                }
            );
            router.push(PAGE_ROUTES.dashboard.network.zones.base);
        } catch {
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const cancelEdit = () => {
        if (zone) {
            setEditName(zone.name);
            setEditType(zone.type);
            setEditParentId(zone.parent_zone_id ?? "");
            setEditResolverJson(zone.resolver_config ? JSON.stringify(zone.resolver_config, null, 2) : "");
            setEditJsonError("");
        }
        setIsEditing(false);
    };

    const parentLabel = (z: Zone) => {
        if (z.parent_zone) return `${z.parent_zone.name} (${z.parent_zone.type})`;
        if (!z.parent_zone_id) return "—";
        const found = allZones.find((a) => a.id === z.parent_zone_id);
        return found ? `${found.name} (${found.type})` : z.parent_zone_id;
    };

    return (
        <>
        <div className="p-[30px] mt-10 mb-100 border border-[#D9D9D9] rounded-[15px] bg-white shadow-md min-h-[calc(100vh-150px)]">
            <BreadCrumb
                description=""
                active="Zone Details"
                link_one={PAGE_ROUTES.dashboard.network.zones.base}
                link_one_name="Geographic Zones"
            />

            <div className="mt-0">
                <div className="flex justify-between items-center mb-[50px] mt-[10px]">
                    <h3 className="font-semibold">Zone Details</h3>
                    {!isEditing && zone && (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                disabled={isLoading}
                                className="px-6 py-2.5 text-sm font-bold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                            >
                                <Icon icon="mdi:trash-can-outline" width="16" />
                                Delete
                            </button>
                            <button
                                onClick={() => setIsEditing(true)}
                                disabled={isLoading}
                                className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                            >
                                <Icon icon="mdi:pencil" width="16" />
                                Edit
                            </button>
                        </div>
                    )}
                </div>

                {isLoading ? (
                    <div className="space-y-6">
                        <Skeleton className="h-[200px] w-full rounded-2xl" />
                        <Skeleton className="h-[200px] w-full rounded-2xl" />
                    </div>
                ) : !zone ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <Icon icon="hugeicons:album-not-found-01" width="32" height="32" className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">Zone not found</h3>
                        <button
                            onClick={() => router.push(PAGE_ROUTES.dashboard.network.zones.base)}
                            className="mt-4 px-4 py-2 text-sm text-primary hover:underline"
                        >
                            Back to zones
                        </button>
                    </div>
                ) : (
                    <>
                    <Grid container spacing={4}>

                        {/* Zone header card */}
                        <Grid size={{ xs: 12 }}>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    <Icon icon="solar:map-point-bold-duotone" width="20" />
                                </div>
                                <h4 className="text-lg font-bold text-gray-800">Zone Information</h4>
                            </div>
                            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                                {/* Header */}
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <Icon icon="solar:map-point-bold-duotone" width="28" className="text-primary" />
                                    </div>
                                    <div>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="text-lg font-bold text-gray-900 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white w-full"
                                            />
                                        ) : (
                                            <p className="text-lg font-bold text-gray-900">{zone.name}</p>
                                        )}
                                        <div className="flex items-center gap-2 mt-1.5">
                                            {!isEditing && <TypeBadge type={zone.type} />}
                                            <StatusBadge status={zone.status} />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Zone ID</p>
                                        <p className="text-sm font-medium text-gray-900 break-all">{zone.id}</p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</p>
                                        {isEditing ? (
                                            <select
                                                value={editType}
                                                onChange={(e) => setEditType(e.target.value as ZoneType)}
                                                className="w-full h-[42px] px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white"
                                            >
                                                {ZONE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        ) : (
                                            <TypeBadge type={zone.type} />
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Parent Zone</p>
                                        {isEditing ? (
                                            <select
                                                value={editParentId}
                                                onChange={(e) => setEditParentId(e.target.value)}
                                                className="w-full h-[42px] px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white"
                                            >
                                                <option value="">None</option>
                                                {allZones.map((z) => (
                                                    <option key={z.id} value={z.id}>{z.name} ({z.type})</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <p className="text-sm font-medium text-gray-900">{parentLabel(zone)}</p>
                                        )}
                                    </div>

                                    {zone.created_at && (
                                        <div className="space-y-1">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Created At</p>
                                            <p className="text-sm font-medium text-gray-900">{formatDate(zone.created_at)}</p>
                                        </div>
                                    )}

                                    {zone.updated_at && (
                                        <div className="space-y-1">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Updated</p>
                                            <p className="text-sm font-medium text-gray-900">{formatDate(zone.updated_at)}</p>
                                        </div>
                                    )}

                                    <div className={`space-y-1.5 ${isEditing ? "md:col-span-2" : (zone.resolver_config ? "md:col-span-2" : "")}`}>
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            Resolver Config <span className="normal-case font-normal text-gray-400">(JSON)</span>
                                        </p>
                                        {isEditing ? (
                                            <>
                                                <textarea
                                                    rows={5}
                                                    value={editResolverJson}
                                                    onChange={(e) => { setEditResolverJson(e.target.value); setEditJsonError(""); }}
                                                    placeholder={'{\n  "postcodes": ["101001"]\n}'}
                                                    className={`w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-mono bg-white resize-none ${editJsonError ? "border-red-400" : "border-gray-300"}`}
                                                />
                                                {editJsonError && <p className="text-xs text-red-500">{editJsonError}</p>}
                                            </>
                                        ) : zone.resolver_config ? (
                                            <pre className="text-xs bg-white border border-gray-200 rounded-lg p-3 overflow-auto max-h-40">
                                                {JSON.stringify(zone.resolver_config, null, 2)}
                                            </pre>
                                        ) : (
                                            <p className="text-sm text-gray-400 italic">—</p>
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
                                onClick={() => {
                                    if (!editName.trim()) { toast.error("Zone name is required"); return; }
                                    const [, err] = parseJson(editResolverJson);
                                    if (err) { setEditJsonError(err); return; }
                                    setShowSaveConfirm(true);
                                }}
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

        {/* Save confirm */}
        {showSaveConfirm && zone && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                    <div className="p-6">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <Icon icon="mdi:content-save" width="24" className="text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Save changes?</h3>
                        <p className="text-sm text-gray-500">
                            Update zone <span className="font-semibold text-gray-700">{editName || zone.name}</span> with the new details.
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

        {/* Delete confirm */}
        {showDeleteConfirm && zone && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                    <div className="p-6">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                            <Icon icon="mdi:trash-can-outline" width="24" className="text-red-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Delete zone?</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            You are about to delete <span className="font-semibold text-gray-700">{zone.name}</span>.
                            Any zone assignments linked to this zone will also be affected. This cannot be undone.
                        </p>
                    </div>
                    <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-gray-100">
                        <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="px-8 py-2.5 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-600/20"
                        >
                            Yes, delete
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}

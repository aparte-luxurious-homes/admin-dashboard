"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import type { BBoxResult } from "@/src/components/network/BBoxMapPicker";
import type { ViewBBox } from "@/src/components/network/BBoxMapViewer";

const BBoxMapPicker = dynamic(() => import("@/src/components/network/BBoxMapPicker"), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center" style={{ height: 420 }}>
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    ),
});

const BBoxMapViewer = dynamic(() => import("@/src/components/network/BBoxMapViewer"), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center" style={{ height: 420 }}>
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    ),
});

// ── Types ────────────────────────────────────────────────────────────────────

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

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildResolverConfig(
    city: string, state: string, country: string,
    latMin: string, latMax: string, lngMin: string, lngMax: string,
): Record<string, any> | null {
    const obj: Record<string, any> = {};
    if (city.trim())    obj.city    = city.trim();
    if (state.trim())   obj.state   = state.trim();
    if (country.trim()) obj.country = country.trim();
    const bboxAny = [latMin, latMax, lngMin, lngMax].some((v) => v.trim() !== "");
    if (bboxAny) {
        const bbox: Record<string, number> = {};
        if (latMin.trim() !== "") bbox.lat_min = parseFloat(latMin);
        if (latMax.trim() !== "") bbox.lat_max = parseFloat(latMax);
        if (lngMin.trim() !== "") bbox.lng_min = parseFloat(lngMin);
        if (lngMax.trim() !== "") bbox.lng_max = parseFloat(lngMax);
        obj.bbox = bbox;
    }
    return Object.keys(obj).length > 0 ? obj : null;
}

async function reverseGeocode(lat: number, lon: number) {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            { headers: { "Accept-Language": "en", "User-Agent": "AparteAdminDashboard/1.0" } },
        );
        if (!res.ok) return null;
        const data = await res.json();
        const addr = data?.address ?? {};
        return {
            city:    addr.city || addr.town || addr.village || addr.county || "",
            state:   addr.state   || "",
            country: addr.country || "",
        };
    } catch {
        return null;
    }
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ZoneDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id     = String(params?.id ?? "");

    const [zone, setZone]           = useState<Zone | null>(null);
    const [allZones, setAllZones]   = useState<Zone[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Edit state — core fields
    const [isEditing, setIsEditing]       = useState(false);
    const [editName, setEditName]         = useState("");
    const [editType, setEditType]         = useState<ZoneType>("CITY");
    const [editParentId, setEditParentId] = useState("");
    const [isSaving, setIsSaving]         = useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);

    // Edit state — resolver config fields
    const [editCity, setEditCity]       = useState("");
    const [editState, setEditState]     = useState("");
    const [editCountry, setEditCountry] = useState("");
    const [editLatMin, setEditLatMin]   = useState("");
    const [editLatMax, setEditLatMax]   = useState("");
    const [editLngMin, setEditLngMin]   = useState("");
    const [editLngMax, setEditLngMax]   = useState("");

    // Map integration
    const [showMap, setShowMap]         = useState(false);
    const [showViewMap, setShowViewMap] = useState(false);
    const [pendingGeo, setPendingGeo]   = useState<BBoxResult | null>(null);
    const [showGeoAsk, setShowGeoAsk]   = useState(false);
    const [isGeocoding, setIsGeocoding] = useState(false);

    // Delete
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting]               = useState(false);

    // ── Helpers ────────────────────────────────────────────────────────────

    const seedEditFields = (z: Zone) => {
        setEditName(z.name);
        setEditType(z.type);
        setEditParentId(z.parent_zone_id ?? "");
        const cfg = z.resolver_config ?? {};
        setEditCity(cfg.city ?? "");
        setEditState(cfg.state ?? "");
        setEditCountry(cfg.country ?? "");
        setEditLatMin(cfg.bbox?.lat_min?.toString() ?? "");
        setEditLatMax(cfg.bbox?.lat_max?.toString() ?? "");
        setEditLngMin(cfg.bbox?.lng_min?.toString() ?? "");
        setEditLngMax(cfg.bbox?.lng_max?.toString() ?? "");
    };

    // ── Data fetching ──────────────────────────────────────────────────────

    const fetchZone = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const res = await axiosRequest.get(API_ROUTES.network.configs.zones.details(id));
            const data: Zone = res?.data?.data ?? res?.data;
            setZone(data);
            seedEditFields(data);
        } catch (error: any) {
            toast.error(error?.response?.data?.detail || error?.response?.data?.message || "Failed to fetch zone");
        } finally {
            setIsLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // ── Actions ────────────────────────────────────────────────────────────

    const handleSave = async () => {
        if (!zone) return;
        const resolver = buildResolverConfig(editCity, editState, editCountry, editLatMin, editLatMax, editLngMin, editLngMax);
        setIsSaving(true);
        try {
            await toast.promise(
                axiosRequest.patch(API_ROUTES.network.configs.zones.details(zone.id), {
                    type: editType,
                    name: editName.trim(),
                    ...(editParentId ? { parent_zone_id: editParentId } : {}),
                    resolver_config: resolver,
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
        if (zone) seedEditFields(zone);
        setIsEditing(false);
    };

    const parentLabel = (z: Zone) => {
        if (z.parent_zone) return `${z.parent_zone.name} (${z.parent_zone.type})`;
        if (!z.parent_zone_id) return "—";
        const found = allZones.find((a) => a.id === z.parent_zone_id);
        return found ? `${found.name} (${found.type})` : z.parent_zone_id;
    };

    const hasBbox = [editLatMin, editLatMax, editLngMin, editLngMax].some((v) => v.trim() !== "");

    // ── Render ─────────────────────────────────────────────────────────────

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
                        <Grid size={{ xs: 12 }}>
                            {/* Zone name — where the header used to be */}
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                    <Icon icon="solar:map-point-bold-duotone" width="18" />
                                </div>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="text-lg font-bold text-gray-900 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white flex-1 max-w-sm"
                                    />
                                ) : (
                                    <h4 className="text-lg font-bold text-gray-800">{zone.name}</h4>
                                )}
                            </div>

                            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                    {/* Zone ID */}
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Zone ID</p>
                                        <p className="text-sm font-medium text-gray-900 break-all">{zone.id}</p>
                                    </div>

                                    {/* Type */}
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

                                    {/* Parent Zone */}
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

                                    {/* Created At + Last Updated — always side by side */}
                                    <div className="md:col-span-2 grid grid-cols-2 gap-6">
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
                                    </div>

                                    {/* Resolver Config — full width */}
                                    <div className="md:col-span-2 space-y-2">
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Resolver Config</p>

                                        {isEditing ? (
                                            /* ── Edit mode: structured form fields ── */
                                            <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
                                                {/* City / State / Country */}
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                    {([
                                                        { label: "City",    value: editCity,    set: setEditCity,    ph: "e.g. Lagos Island" },
                                                        { label: "State",   value: editState,   set: setEditState,   ph: "e.g. Lagos"        },
                                                        { label: "Country", value: editCountry, set: setEditCountry, ph: "e.g. Nigeria"      },
                                                    ] as const).map(({ label, value, set, ph }) => (
                                                        <div key={label} className="space-y-1">
                                                            <label className="text-xs font-medium text-gray-500">{label}</label>
                                                            <input
                                                                type="text"
                                                                value={value}
                                                                onChange={(e) => (set as (v: string) => void)(e.target.value)}
                                                                placeholder={ph}
                                                                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-gray-50/50"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Bounding box */}
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-xs font-medium text-gray-500">
                                                            Bounding Box <span className="font-normal text-gray-400">(coordinates)</span>
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowMap(true)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors"
                                                        >
                                                            <Icon icon="mdi:map-search-outline" width="13" />
                                                            Draw on Map
                                                        </button>
                                                    </div>
                                                    {hasBbox && (
                                                        <div className="flex items-center gap-1.5 px-3 py-2 bg-green-50 border border-green-100 rounded-lg text-xs text-green-700">
                                                            <Icon icon="mdi:check-circle-outline" width="13" />
                                                            Bounds set — you can still edit the values below
                                                        </div>
                                                    )}
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                        {([
                                                            { label: "Lat min", value: editLatMin, set: setEditLatMin, ph: "e.g. 6.42" },
                                                            { label: "Lat max", value: editLatMax, set: setEditLatMax, ph: "e.g. 6.48" },
                                                            { label: "Lng min", value: editLngMin, set: setEditLngMin, ph: "e.g. 3.38" },
                                                            { label: "Lng max", value: editLngMax, set: setEditLngMax, ph: "e.g. 3.42" },
                                                        ] as const).map(({ label, value, set, ph }) => (
                                                            <div key={label} className="space-y-1">
                                                                <label className="text-xs font-medium text-gray-500">{label}</label>
                                                                <input
                                                                    type="number"
                                                                    step="any"
                                                                    value={value}
                                                                    onChange={(e) => (set as (v: string) => void)(e.target.value)}
                                                                    placeholder={ph}
                                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-gray-50/50"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : zone.resolver_config ? (
                                            /* ── View mode: structured display ── */
                                            <div className="rounded-xl border border-gray-100 bg-white overflow-hidden">
                                                {/* City / State / Country — 3-column grid */}
                                                {(["city", "state", "country"] as const).some((k) => zone.resolver_config![k]) && (
                                                    <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
                                                        {(["city", "state", "country"] as const).map((k) => (
                                                            <div key={k} className="px-4 py-3 space-y-0.5">
                                                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{k}</p>
                                                                <p className="text-sm font-medium text-gray-800 truncate">
                                                                    {zone.resolver_config![k] || <span className="text-gray-300">—</span>}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Bounding box + View on Map */}
                                                {zone.resolver_config.bbox && (() => {
                                                    const b = zone.resolver_config.bbox;
                                                    return (
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
                                                                    { label: "Lat min", val: b.lat_min },
                                                                    { label: "Lat max", val: b.lat_max },
                                                                    { label: "Lng min", val: b.lng_min },
                                                                    { label: "Lng max", val: b.lng_max },
                                                                ].filter(({ val }) => val !== undefined).map(({ label, val }) => (
                                                                    <div key={label} className="bg-gray-50 rounded-lg p-2.5">
                                                                        <p className="text-[10px] font-semibold text-gray-400 uppercase">{label}</p>
                                                                        <p className="text-sm font-bold text-gray-800 mt-0.5">{val}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-400 italic">No resolver config set</p>
                                        )}
                                    </div>

                                </div>
                            </div>
                        </Grid>
                    </Grid>

                    {isEditing && (
                        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end gap-3">
                            <button onClick={cancelEdit} className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (!editName.trim()) { toast.error("Zone name is required"); return; }
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

        {/* View on Map modal (read-only) */}
        {showViewMap && zone?.resolver_config?.bbox && (() => {
            const b = zone.resolver_config!.bbox as ViewBBox;
            return (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
                        <div className="flex items-center justify-between p-5 border-b border-gray-100">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">{zone.name}</h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {[zone.resolver_config!.city, zone.resolver_config!.state, zone.resolver_config!.country].filter(Boolean).join(", ") || "Zone boundary"}
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

        {/* Map modal */}
        {showMap && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
                    <div className="flex items-center justify-between p-5 border-b border-gray-100">
                        <div>
                            <h3 className="text-base font-semibold text-gray-900">Draw Bounding Box</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Click twice on the map to outline the zone area</p>
                        </div>
                        <button onClick={() => setShowMap(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                            <Icon icon="lucide:x" width="18" className="text-gray-500" />
                        </button>
                    </div>
                    <BBoxMapPicker
                        onConfirm={(bbox) => {
                            setEditLatMin(String(bbox.lat_min));
                            setEditLatMax(String(bbox.lat_max));
                            setEditLngMin(String(bbox.lng_min));
                            setEditLngMax(String(bbox.lng_max));
                            setShowMap(false);
                            setPendingGeo(bbox);
                            setShowGeoAsk(true);
                        }}
                        onClose={() => setShowMap(false)}
                    />
                </div>
            </div>
        )}

        {/* Geo auto-fill ask */}
        {showGeoAsk && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                    <div className="p-6">
                        <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <Icon icon="mdi:map-marker-question-outline" width="22" className="text-primary" />
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 mb-1">Auto-fill address fields?</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            Would you like us to look up the City, State and Country for the selected area and fill those fields automatically?
                        </p>
                    </div>
                    <div className="flex items-center gap-2 px-6 py-4 border-t border-gray-100">
                        <button
                            onClick={() => { setShowGeoAsk(false); setPendingGeo(null); }}
                            className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                        >
                            No thanks
                        </button>
                        <button
                            disabled={isGeocoding}
                            onClick={async () => {
                                if (!pendingGeo) { setShowGeoAsk(false); return; }
                                setIsGeocoding(true);
                                const centerLat = (pendingGeo.lat_min + pendingGeo.lat_max) / 2;
                                const centerLng = (pendingGeo.lng_min + pendingGeo.lng_max) / 2;
                                const location = await reverseGeocode(centerLat, centerLng);
                                setIsGeocoding(false);
                                if (location) {
                                    if (location.city)    setEditCity(location.city);
                                    if (location.state)   setEditState(location.state);
                                    if (location.country) setEditCountry(location.country);
                                }
                                setShowGeoAsk(false);
                                setPendingGeo(null);
                            }}
                            className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-primary/20 flex items-center justify-center gap-1.5"
                        >
                            {isGeocoding ? (
                                <>
                                    <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Looking up…
                                </>
                            ) : "Yes, auto-fill"}
                        </button>
                    </div>
                </div>
            </div>
        )}

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
                        <button onClick={() => setShowSaveConfirm(false)} className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">
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
                        <button onClick={() => setShowDeleteConfirm(false)} className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">
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

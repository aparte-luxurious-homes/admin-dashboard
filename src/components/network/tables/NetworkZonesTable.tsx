'use client'

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axiosRequest from "@/src/lib/api";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import { DotsIcon } from "../../icons";
import { Icon } from "@iconify/react/dist/iconify.js";
import { formatDate } from "@/src/lib/utils";
import Loader from "@/src/components/loader";
import { LuEye, LuPencil, LuTrash2 } from "react-icons/lu";
import { toast } from "react-hot-toast";

type ZoneType = "CITY" | "AREA" | "REGION";

interface Zone {
    id: string;
    type: ZoneType;
    name: string;
    status?: string;
    parent_zone_id?: string | null;
    resolver_config?: Record<string, any> | null;
    created_at?: string;
    updated_at?: string;
}

const TYPE_CONFIG: Record<ZoneType, { bg: string; text: string; border: string }> = {
    CITY:   { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200"   },
    AREA:   { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
    REGION: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
};

function TypeBadge({ type }: { type: ZoneType }) {
    const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.CITY;
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
            {type}
        </span>
    );
}

export default function NetworkZonesTable() {
    const router = useRouter();
    const [zones, setZones]         = useState<Zone[]>([]);
    const [allZones, setAllZones]   = useState<Zone[]>([]); // for parent-zone select
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage]           = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [typeFilter, setTypeFilter] = useState("");
    const [nameSearch, setNameSearch] = useState("");

    const [selectedRow, setSelectedRow]     = useState<number | null>(null);
    const [modalPosition, setModalPosition] = useState<{ top: number; left: number } | null>(null);
    const [viewZone, setViewZone]           = useState<Zone | null>(null);

    // Create
    const [showCreateModal, setShowCreateModal]     = useState(false);
    const [showCreateConfirm, setShowCreateConfirm] = useState(false);
    const [createName, setCreateName]               = useState("");
    const [createType, setCreateType]               = useState<ZoneType>("CITY");
    const [createParentId, setCreateParentId]       = useState("");
    const [createResolverJson, setCreateResolverJson] = useState("");
    const [createJsonError, setCreateJsonError]     = useState("");
    const [isCreating, setIsCreating]               = useState(false);

    // Edit
    const [editZone, setEditZone]                   = useState<Zone | null>(null);
    const [showEditConfirm, setShowEditConfirm]     = useState(false);
    const [editName, setEditName]                   = useState("");
    const [editType, setEditType]                   = useState<ZoneType>("CITY");
    const [editParentId, setEditParentId]           = useState("");
    const [editResolverJson, setEditResolverJson]   = useState("");
    const [editJsonError, setEditJsonError]         = useState("");
    const [isSaving, setIsSaving]                   = useState(false);

    // Delete
    const [deleteTarget, setDeleteTarget]           = useState<Zone | null>(null);
    const [isDeleting, setIsDeleting]               = useState(false);

    const menuRef = useRef<HTMLDivElement>(null);

    const fetchZones = useCallback(async () => {
        setIsLoading(true);
        try {
            const params: Record<string, any> = { page, size: 20 };
            if (typeFilter)  params.type = typeFilter;
            if (nameSearch)  params.search = nameSearch;
            const res = await axiosRequest.get(API_ROUTES.network.configs.zones.base, { params });
            const data = res?.data?.data ?? res?.data;
            const items = data?.items ?? data?.data ?? (Array.isArray(data) ? data : []);
            setZones(items);
            const total = data?.total ?? items.length;
            setTotalPages(Math.max(1, Math.ceil(total / 20)));
        } catch (error: any) {
            toast.error(error?.response?.data?.detail || error?.response?.data?.message || "Failed to fetch zones");
        } finally {
            setIsLoading(false);
        }
    }, [page, typeFilter, nameSearch]);

    useEffect(() => { fetchZones(); }, [fetchZones]);

    // Load all zones once for parent-zone select
    useEffect(() => {
        axiosRequest.get(API_ROUTES.network.configs.zones.base, { params: { page: 1, size: 200 } })
            .then((res) => {
                const data = res?.data?.data ?? res?.data;
                const items = data?.items ?? data?.data ?? (Array.isArray(data) ? data : []);
                setAllZones(items);
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setSelectedRow(null);
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

    const parseJson = (raw: string): [Record<string, any> | null, string] => {
        if (!raw.trim()) return [null, ""];
        try { return [JSON.parse(raw), ""]; } catch { return [null, "Invalid JSON"]; }
    };

    const resetCreate = () => {
        setShowCreateModal(false);
        setShowCreateConfirm(false);
        setCreateName("");
        setCreateType("CITY");
        setCreateParentId("");
        setCreateResolverJson("");
        setCreateJsonError("");
    };

    const handleCreate = async () => {
        const [resolver, err] = parseJson(createResolverJson);
        if (err) { setCreateJsonError(err); return; }
        setIsCreating(true);
        try {
            await toast.promise(
                axiosRequest.post(API_ROUTES.network.configs.zones.base, {
                    type: createType,
                    name: createName.trim(),
                    ...(createParentId ? { parent_zone_id: createParentId } : {}),
                    ...(resolver       ? { resolver_config: resolver }       : {}),
                }),
                {
                    loading: "Creating zone...",
                    success: "Zone created",
                    error: (err) => err?.response?.data?.detail || err?.response?.data?.message || "Failed to create zone",
                }
            );
            resetCreate();
            fetchZones();
        } catch {
        } finally {
            setIsCreating(false);
        }
    };

    const openEdit = (zone: Zone) => {
        setEditZone(zone);
        setEditName(zone.name);
        setEditType(zone.type);
        setEditParentId(zone.parent_zone_id ?? "");
        setEditResolverJson(zone.resolver_config ? JSON.stringify(zone.resolver_config, null, 2) : "");
        setEditJsonError("");
        setSelectedRow(null);
    };

    const handleEdit = async () => {
        if (!editZone) return;
        const [resolver, err] = parseJson(editResolverJson);
        if (err) { setEditJsonError(err); return; }
        setIsSaving(true);
        try {
            await toast.promise(
                axiosRequest.patch(API_ROUTES.network.configs.zones.details(editZone.id), {
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
            setEditZone(null);
            setShowEditConfirm(false);
            fetchZones();
        } catch {
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await toast.promise(
                axiosRequest.delete(API_ROUTES.network.configs.zones.details(deleteTarget.id)),
                {
                    loading: "Deleting zone...",
                    success: "Zone deleted",
                    error: (err) => err?.response?.data?.detail || err?.response?.data?.message || "Failed to delete zone",
                }
            );
            setDeleteTarget(null);
            fetchZones();
        } catch {
        } finally {
            setIsDeleting(false);
        }
    };

    const parentName = (id?: string | null) => {
        if (!id) return "—";
        const z = allZones.find((z) => z.id === id);
        return z ? `${z.name} (${z.type})` : id;
    };

    const contextZone = selectedRow !== null ? zones[selectedRow] : null;

    return (
        <div className="p-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">Geographic Zones</h1>
                        <p className="text-sm text-gray-500 mt-1">Define cities, areas, and regions for zone-based management and payouts</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                    >
                        <Icon icon="mdi:plus" width="16" />
                        Create Zone
                    </button>
                </div>

                {/* Filters */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 flex-wrap">
                    <div className="relative">
                        <Icon icon="mdi:magnify" width="16" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={nameSearch}
                            onChange={(e) => { setNameSearch(e.target.value); setPage(1); }}
                            placeholder="Search by name..."
                            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-56"
                        />
                    </div>
                    <select
                        value={typeFilter}
                        onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                        <option value="">All Types</option>
                        <option value="CITY">City</option>
                        <option value="AREA">Area</option>
                        <option value="REGION">Region</option>
                    </select>
                </div>

                {/* Table */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12"><Loader /></div>
                ) : zones.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    <th className="px-6 py-3 text-left">Name</th>
                                    <th className="px-6 py-3 text-left">Type</th>
                                    <th className="px-6 py-3 text-left">Parent Zone</th>
                                    <th className="px-6 py-3 text-left">Updated At</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {zones.map((zone, index) => (
                                    <tr key={zone.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => router.push(PAGE_ROUTES.dashboard.network.zones.details(zone.id))}>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{zone.name}</td>
                                        <td className="px-6 py-4"><TypeBadge type={zone.type} /></td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{parentName(zone.parent_zone_id)}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{zone.updated_at ? formatDate(zone.updated_at) : "—"}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end" onClick={(e) => handleDotsClick(e, index)}>
                                                <DotsIcon className="w-5 cursor-pointer hover:text-primary transition-colors text-gray-400" />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
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
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No zones found</h3>
                    </div>
                )}
            </div>

            {/* Context menu */}
            {contextZone && modalPosition && (
                <div ref={menuRef} className="fixed bg-white shadow-xl rounded-lg z-50 border border-gray-200 overflow-hidden min-w-[140px]" style={{ top: modalPosition.top, left: modalPosition.left }}>
                    {[
                        { label: "View",   Icon: <LuEye />,     onClick: () => { router.push(PAGE_ROUTES.dashboard.network.zones.details(contextZone.id)); setSelectedRow(null); } },
                        { label: "Edit",   Icon: <LuPencil />,  onClick: () => { openEdit(contextZone); } },
                        { label: "Delete", Icon: <LuTrash2 className="text-red-500" />, onClick: () => { setDeleteTarget(contextZone); setSelectedRow(null); } },
                    ].map((btn, i) => (
                        <button key={i} className={`w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-sm transition-colors border-b last:border-b-0 border-gray-100 ${btn.label === "Delete" ? "text-red-600" : "text-gray-700"}`}
                            onClick={(e) => { e.stopPropagation(); btn.onClick(); }}>
                            <span>{btn.Icon}</span>
                            <span>{btn.label}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* View modal */}
            {viewZone && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">Zone Details</h3>
                            <button onClick={() => setViewZone(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <Icon icon="lucide:x" width="18" className="text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-1"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</p><p className="text-sm font-medium text-gray-900">{viewZone.name}</p></div>
                            <div className="space-y-1"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</p><TypeBadge type={viewZone.type} /></div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</p>
                                {viewZone.status ? (
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${viewZone.status === "ACTIVE" ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"}`}>
                                        {viewZone.status}
                                    </span>
                                ) : <p className="text-sm text-gray-400">—</p>}
                            </div>
                            <div className="space-y-1"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Parent Zone</p><p className="text-sm text-gray-700">{parentName(viewZone.parent_zone_id)}</p></div>
                            {viewZone.resolver_config && (
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Resolver Config</p>
                                    <pre className="text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-auto max-h-40">{JSON.stringify(viewZone.resolver_config, null, 2)}</pre>
                                </div>
                            )}
                            {viewZone.updated_at && <div className="space-y-1"><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Updated</p><p className="text-sm text-gray-700">{formatDate(viewZone.updated_at)}</p></div>}
                        </div>
                    </div>
                </div>
            )}

            {/* Create modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Create Zone</h3>
                                <p className="text-xs text-gray-500 mt-0.5">Define a geographic city, area, or region</p>
                            </div>
                            <button onClick={resetCreate} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <Icon icon="lucide:x" width="18" className="text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5 overflow-y-auto">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Zone Name</label>
                                <input type="text" value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="e.g. Lagos Island" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-gray-50/50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Type</label>
                                <select value={createType} onChange={(e) => setCreateType(e.target.value as ZoneType)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-gray-50/50">
                                    <option value="CITY">CITY</option>
                                    <option value="AREA">AREA</option>
                                    <option value="REGION">REGION</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Parent Zone <span className="font-normal text-gray-400">(optional)</span></label>
                                <select value={createParentId} onChange={(e) => setCreateParentId(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-gray-50/50">
                                    <option value="">None</option>
                                    {allZones.map((z) => <option key={z.id} value={z.id}>{z.name} ({z.type})</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Resolver Config <span className="font-normal text-gray-400">(optional JSON)</span></label>
                                <textarea rows={4} value={createResolverJson} onChange={(e) => { setCreateResolverJson(e.target.value); setCreateJsonError(""); }} placeholder={'{\n  "postcodes": ["101001"],\n  "city_keywords": ["Lagos Island"]\n}'} className={`w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-mono bg-gray-50/50 resize-none ${createJsonError ? "border-red-400" : "border-gray-200"}`} />
                                {createJsonError && <p className="text-xs text-red-500">{createJsonError}</p>}
                            </div>
                        </div>
                        <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
                            <button onClick={resetCreate} className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
                            <button onClick={() => { if (!createName.trim()) { toast.error("Zone name is required"); return; } const [, err] = parseJson(createResolverJson); if (err) { setCreateJsonError(err); return; } setShowCreateConfirm(true); }} className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
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
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4"><Icon icon="mdi:map-marker-plus-outline" width="24" className="text-primary" /></div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">Create zone?</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">Create <span className="font-semibold text-gray-700">{createName}</span> as a <span className="font-semibold text-gray-700">{createType}</span> zone{createParentId ? ` under ${parentName(createParentId)}` : ""}.</p>
                        </div>
                        <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-gray-100">
                            <button onClick={() => setShowCreateConfirm(false)} className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
                            <button onClick={() => { setShowCreateConfirm(false); handleCreate(); }} disabled={isCreating} className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20">Yes, create</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit modal */}
            {editZone && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Edit Zone</h3>
                                <p className="text-xs text-gray-500 mt-0.5">{editZone.name}</p>
                            </div>
                            <button onClick={() => setEditZone(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><Icon icon="lucide:x" width="18" className="text-gray-500" /></button>
                        </div>
                        <div className="p-6 space-y-5 overflow-y-auto">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Zone Name</label>
                                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-gray-50/50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Type</label>
                                <select value={editType} onChange={(e) => setEditType(e.target.value as ZoneType)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-gray-50/50">
                                    <option value="CITY">CITY</option>
                                    <option value="AREA">AREA</option>
                                    <option value="REGION">REGION</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Parent Zone <span className="font-normal text-gray-400">(optional)</span></label>
                                <select value={editParentId} onChange={(e) => setEditParentId(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-gray-50/50">
                                    <option value="">None</option>
                                    {allZones.filter((z) => z.id !== editZone?.id).map((z) => <option key={z.id} value={z.id}>{z.name} ({z.type})</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Resolver Config <span className="font-normal text-gray-400">(optional JSON)</span></label>
                                <textarea rows={5} value={editResolverJson} onChange={(e) => { setEditResolverJson(e.target.value); setEditJsonError(""); }} className={`w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-mono bg-gray-50/50 resize-none ${editJsonError ? "border-red-400" : "border-gray-200"}`} />
                                {editJsonError && <p className="text-xs text-red-500">{editJsonError}</p>}
                            </div>
                        </div>
                        <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
                            <button onClick={() => setEditZone(null)} className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
                            <button onClick={() => { if (!editName.trim()) { toast.error("Name is required"); return; } const [, err] = parseJson(editResolverJson); if (err) { setEditJsonError(err); return; } setShowEditConfirm(true); }} className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2">
                                <Icon icon="mdi:content-save" width="14" /> Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit confirm */}
            {showEditConfirm && editZone && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="p-6">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4"><Icon icon="mdi:content-save" width="24" className="text-primary" /></div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">Save changes?</h3>
                            <p className="text-sm text-gray-500">Update zone <span className="font-semibold text-gray-700">{editZone.name}</span> with the new details.</p>
                        </div>
                        <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-gray-100">
                            <button onClick={() => setShowEditConfirm(false)} className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
                            <button onClick={() => { setShowEditConfirm(false); handleEdit(); }} disabled={isSaving} className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20">Yes, save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete confirm */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="p-6">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4"><Icon icon="mdi:trash-can-outline" width="24" className="text-red-600" /></div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">Delete zone?</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">You are about to delete <span className="font-semibold text-gray-700">{deleteTarget.name}</span>. Any zone assignments linked to this zone will also be affected. This cannot be undone.</p>
                        </div>
                        <div className="flex justify-end items-center gap-3 px-6 py-4 border-t border-gray-100">
                            <button onClick={() => setDeleteTarget(null)} className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
                            <button onClick={handleDelete} disabled={isDeleting} className="px-8 py-2.5 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-600/20">Yes, delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

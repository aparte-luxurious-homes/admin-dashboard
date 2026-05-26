'use client'

import { useCallback, useEffect, useRef, useState } from "react";
import axiosRequest from "@/src/lib/api";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import { DotsIcon } from "../../icons";
import { Icon } from "@iconify/react/dist/iconify.js";
import { formatDate } from "@/src/lib/utils";
import Loader from "@/src/components/loader";
import { LuEye, LuPencil } from "react-icons/lu";
import { toast } from "react-hot-toast";

interface ActionConfig {
    action_type: string;
    base_points: number;
    is_active: boolean;
    updated_at: string;
}

const STATUS_CONFIG = {
    active:   { bg: "bg-green-100",  text: "text-green-800"  },
    inactive: { bg: "bg-gray-100",   text: "text-gray-600"   },
};

function formatActionType(type: string) {
    return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function NetworkActionsTable() {
    const [actions, setActions]       = useState<ActionConfig[]>([]);
    const [isLoading, setIsLoading]   = useState(false);

    const [selectedRow, setSelectedRow]     = useState<number | null>(null);
    const [modalPosition, setModalPosition] = useState<{ top: number; left: number } | null>(null);
    const [viewAction, setViewAction]       = useState<ActionConfig | null>(null);
    const [editAction, setEditAction]       = useState<ActionConfig | null>(null);
    const [editBasePoints, setEditBasePoints] = useState(0);
    const [editIsActive, setEditIsActive]     = useState(true);
    const [isSaving, setIsSaving]             = useState(false);

    const menuRef = useRef<HTMLDivElement>(null);

    const fetchActions = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axiosRequest.get(API_ROUTES.network.configs.actions.base);
            const data = response?.data?.data ?? response?.data;
            setActions(Array.isArray(data) ? data : []);
        } catch (error: any) {
            toast.error(error?.response?.data?.detail || error?.response?.data?.message || "Failed to fetch action configs");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchActions(); }, [fetchActions]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setSelectedRow(null);
            }
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

    const openEdit = (action: ActionConfig) => {
        setEditBasePoints(action.base_points);
        setEditIsActive(action.is_active);
        setEditAction(action);
        setSelectedRow(null);
    };

    const handleSave = async () => {
        if (!editAction) return;
        setIsSaving(true);
        try {
            await toast.promise(
                axiosRequest.put(
                    API_ROUTES.network.configs.actions.update(editAction.action_type),
                    { base_points: editBasePoints, is_active: editIsActive }
                ),
                {
                    loading: "Saving...",
                    success: "Action config updated",
                    error: (err) => err?.response?.data?.detail || err?.response?.data?.message || "Failed to update",
                }
            );
            setEditAction(null);
            fetchActions();
        } catch {
            // handled by toast.promise
        } finally {
            setIsSaving(false);
        }
    };

    const contextAction = selectedRow !== null ? actions[selectedRow] : null;

    return (
        <div className="p-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">

                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <h1 className="text-xl font-semibold text-gray-900">Action Configs</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage point values and active state for each agent action</p>
                </div>

                {/* Table */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader />
                    </div>
                ) : actions.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    <th className="px-6 py-3 text-left">Action Type</th>
                                    <th className="px-6 py-3 text-left">Base Points</th>
                                    <th className="px-6 py-3 text-left">Status</th>
                                    <th className="px-6 py-3 text-left">Last Updated</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {actions.map((action, index) => {
                                    const statusCfg = action.is_active ? STATUS_CONFIG.active : STATUS_CONFIG.inactive;
                                    return (
                                        <tr
                                            key={action.action_type}
                                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                                            onClick={() => setViewAction(action)}
                                        >
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                {formatActionType(action.action_type)}
                                            </td>
                                            <td className="px-6 py-4 text-xl font-bold text-gray-900">
                                                {action.base_points}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}>
                                                    {action.is_active ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {formatDate(action.updated_at)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div
                                                    className="flex justify-end items-center"
                                                    onClick={(e) => handleDotsClick(e, index)}
                                                >
                                                    <DotsIcon className="w-5 cursor-pointer hover:text-primary transition-colors text-gray-400" />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <Icon icon="hugeicons:album-not-found-01" width="32" height="32" className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No action configs found</h3>
                    </div>
                )}
            </div>

            {/* Context menu */}
            {contextAction && modalPosition && (
                <div
                    ref={menuRef}
                    className="fixed bg-white shadow-xl rounded-lg z-50 border border-gray-200 overflow-hidden min-w-[120px]"
                    style={{ top: modalPosition.top, left: modalPosition.left }}
                >
                    {[
                        {
                            label: "View",
                            Icon: <LuEye />,
                            onClick: () => { setViewAction(contextAction); setSelectedRow(null); },
                        },
                        {
                            label: "Edit",
                            Icon: <LuPencil />,
                            onClick: () => openEdit(contextAction),
                        },
                    ].map((btn, idx) => (
                        <button
                            key={idx}
                            className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 transition-colors border-b last:border-b-0 border-gray-100"
                            onClick={(e) => { e.stopPropagation(); btn.onClick(); }}
                        >
                            <span className="text-gray-500">{btn.Icon}</span>
                            <span>{btn.label}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* View modal */}
            {viewAction && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">Action Details</h3>
                            <button
                                onClick={() => setViewAction(null)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <Icon icon="lucide:x" width="18" className="text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Action Type</p>
                                <p className="text-sm font-medium text-gray-900">{formatActionType(viewAction.action_type)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Base Points</p>
                                <p className="text-xl font-bold text-gray-900">{viewAction.base_points}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</p>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${viewAction.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                                    {viewAction.is_active ? "Active" : "Inactive"}
                                </span>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Updated</p>
                                <p className="text-sm font-medium text-gray-900">{formatDate(viewAction.updated_at)}</p>
                            </div>
                        </div>
                        <div className="px-6 pb-6 flex justify-end">
                            <button
                                onClick={() => { setViewAction(null); openEdit(viewAction); }}
                                className="px-6 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                            >
                                <Icon icon="mdi:pencil" width="14" />
                                Edit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit modal */}
            {editAction && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Edit Action</h3>
                                <p className="text-xs text-gray-500 mt-0.5">{formatActionType(editAction.action_type)}</p>
                            </div>
                            <button
                                onClick={() => setEditAction(null)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <Icon icon="lucide:x" width="18" className="text-gray-500" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Base Points</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={editBasePoints}
                                    onChange={(e) => setEditBasePoints(parseInt(e.target.value) || 0)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-gray-50/50 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Status</label>
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">{editIsActive ? "Active" : "Inactive"}</span>
                                    <button
                                        type="button"
                                        onClick={() => setEditIsActive((prev) => !prev)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${editIsActive ? "bg-primary" : "bg-gray-300"}`}
                                    >
                                        <span className={`${editIsActive ? "translate-x-6" : "translate-x-1"} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="mt-2 pt-4 px-6 pb-6 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                onClick={() => setEditAction(null)}
                                className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                            >
                                {isSaving ? (
                                    <>
                                        <Icon icon="mdi:loading" className="animate-spin" width="14" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Icon icon="mdi:content-save" width="14" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

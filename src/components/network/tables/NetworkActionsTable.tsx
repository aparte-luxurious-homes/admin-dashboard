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
import { usePermissions } from "@/src/hooks/usePermissions";
import { UserRole } from "@/src/lib/enums";

interface ActionConfig {
    action_type: string;
    base_points: number;
    is_active: boolean;
    updated_at: string;
    description?: string | null;
    // Fractions (0.05 = 5%). Stored per MENTOR tier; the cut is transferred out
    // of the mentee's award, not minted on top.
    mentor_override_gold_pct?: number | string | null;
    mentor_override_silver_pct?: number | string | null;
}

/**
 * Lowest override rate that actually pays out.
 *
 * The backend rounds the mentor's cut half-up to a whole point, so a rate of
 * r only yields anything once the mentee's award reaches 0.5/r points. At 2%
 * that is a 25-point award; below 2% the threshold climbs past every base
 * value we award, and the rate silently pays nothing while still displaying
 * as configured. 0 stays valid as the explicit "this tier earns nothing" switch.
 */
const MIN_OVERRIDE_PCT = 2;

const OVERRIDE_HELP =
    `Enter 0 to switch a tier's override off, or ${MIN_OVERRIDE_PCT}% and above. ` +
    `Anything between rounds down to zero points on real awards, so it would ` +
    `look configured but never pay out.`;

/** Stored fraction (0.05) -> display percent (5). */
function pctToInput(fraction?: number | string | null): string {
    const value = Number(fraction ?? 0);
    if (!Number.isFinite(value)) return "0";
    return String(Number((value * 100).toFixed(2)));
}

/** Display percent ("5") -> stored fraction (0.05). */
function inputToPct(input: string): number {
    const value = parseFloat(input);
    if (!Number.isFinite(value)) return 0;
    return Number((value / 100).toFixed(4));
}

/** Returns an error string, or null when the value is acceptable. */
function validateOverride(input: string, label: string): string | null {
    const trimmed = input.trim();
    if (trimmed === "") return `${label} override is required — enter 0 to switch it off.`;
    const value = parseFloat(trimmed);
    if (!Number.isFinite(value) || value < 0) return `${label} override must be 0 or a positive number.`;
    if (value > 100) return `${label} override cannot exceed 100%.`;
    if (value > 0 && value < MIN_OVERRIDE_PCT) {
        return `${label} override must be 0 or at least ${MIN_OVERRIDE_PCT}%. ` +
               `Rates below ${MIN_OVERRIDE_PCT}% round down to zero points and never pay out.`;
    }
    return null;
}

function formatOverride(fraction?: number | string | null): string {
    const value = Number(fraction ?? 0);
    if (!Number.isFinite(value) || value <= 0) return "Off";
    return `${Number((value * 100).toFixed(2))}%`;
}

const STATUS_CONFIG = {
    active:   { bg: "bg-green-100",  text: "text-green-800"  },
    inactive: { bg: "bg-gray-100",   text: "text-gray-600"   },
};

function formatActionType(type: string) {
    return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function describeAction(action: Pick<ActionConfig, "description">) {
    return action.description || "No description available for this action yet.";
}

function truncateDescription(description: string, maxLength = 60) {
    return description.length > maxLength ? `${description.slice(0, maxLength)}...` : description;
}

export default function NetworkActionsTable() {
    const { role } = usePermissions();
    // Mirrors the backend's require_operations_admin on PUT /configs/actions/{type} —
    // SUPPORT_ADMIN can view (like any admin) but not edit action configs.
    const canEditActions = role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN || role === UserRole.OPERATIONS_ADMIN;
    const [actions, setActions]       = useState<ActionConfig[]>([]);
    const [isLoading, setIsLoading]   = useState(false);

    const [selectedRow, setSelectedRow]     = useState<number | null>(null);
    const [modalPosition, setModalPosition] = useState<{ top: number; left: number } | null>(null);
    const [viewAction, setViewAction]       = useState<ActionConfig | null>(null);
    const [editAction, setEditAction]       = useState<ActionConfig | null>(null);
    const [editBasePoints, setEditBasePoints] = useState(0);
    const [editIsActive, setEditIsActive]     = useState(true);
    const [editDescription, setEditDescription] = useState("");
    // Held as strings so the field can be cleared mid-edit without snapping to 0
    const [editGoldPct, setEditGoldPct]     = useState("0");
    const [editSilverPct, setEditSilverPct] = useState("0");
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
        setEditDescription(action.description || "");
        setEditGoldPct(pctToInput(action.mentor_override_gold_pct));
        setEditSilverPct(pctToInput(action.mentor_override_silver_pct));
        setEditAction(action);
        setSelectedRow(null);
    };

    const goldError   = validateOverride(editGoldPct, "Gold");
    const silverError = validateOverride(editSilverPct, "Silver");

    const handleSave = async () => {
        if (!editAction) return;
        if (goldError || silverError) {
            toast.error(goldError || silverError || "Check the override percentages");
            return;
        }
        setIsSaving(true);
        try {
            await toast.promise(
                axiosRequest.put(
                    API_ROUTES.network.configs.actions.update(editAction.action_type),
                    {
                        base_points: editBasePoints,
                        is_active: editIsActive,
                        description: editDescription,
                        mentor_override_gold_pct: inputToPct(editGoldPct),
                        mentor_override_silver_pct: inputToPct(editSilverPct),
                    }
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
                    <p className="text-sm text-gray-500 mt-1">
                        {canEditActions
                            ? "Manage point values and active state for each agent action"
                            : "See what actions earn you points and how many"}
                    </p>
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
                                    <th className="px-6 py-3 text-left whitespace-nowrap">Gold Ovr.</th>
                                    <th className="px-6 py-3 text-left whitespace-nowrap">Silver Ovr.</th>
                                    {canEditActions && <th className="px-6 py-3 text-left">Status</th>}
                                    <th className={`px-6 py-3 text-left ${!canEditActions ? "w-[520px]" : ""}`}>Description</th>
                                    <th className="px-6 py-3 text-left">Last Updated</th>
                                    {canEditActions && <th className="px-6 py-3 text-right">Actions</th>}
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
                                            <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                                                {formatOverride(action.mentor_override_gold_pct)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                                                {formatOverride(action.mentor_override_silver_pct)}
                                            </td>
                                            {canEditActions && (
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}>
                                                        {action.is_active ? "Active" : "Inactive"}
                                                    </span>
                                                </td>
                                            )}
                                            <td className="px-6 py-4 text-sm text-gray-600" title={describeAction(action)}>
                                                {truncateDescription(describeAction(action))}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {formatDate(action.updated_at)}
                                            </td>
                                            {canEditActions && (
                                                <td className="px-6 py-4 text-right">
                                                    <div
                                                        className="flex justify-end items-center"
                                                        onClick={(e) => handleDotsClick(e, index)}
                                                    >
                                                        <DotsIcon className="w-5 cursor-pointer hover:text-primary transition-colors text-gray-400" />
                                                    </div>
                                                </td>
                                            )}
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
                        ...(canEditActions ? [{
                            label: "Edit",
                            Icon: <LuPencil />,
                            onClick: () => openEdit(contextAction),
                        }] : []),
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
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
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
                            <div className="space-y-2">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Mentor Override</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="px-3 py-2.5 rounded-xl border border-yellow-200 bg-yellow-50/60">
                                        <p className="text-[11px] font-semibold text-yellow-700 uppercase tracking-wider">Gold Ovr.</p>
                                        <p className="text-lg font-bold text-gray-900 mt-0.5">
                                            {formatOverride(viewAction.mentor_override_gold_pct)}
                                        </p>
                                    </div>
                                    <div className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50">
                                        <p className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Silver Ovr.</p>
                                        <p className="text-lg font-bold text-gray-900 mt-0.5">
                                            {formatOverride(viewAction.mentor_override_silver_pct)}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Taken out of the mentee&apos;s award for this action, not added on top.
                                </p>
                            </div>
                            {canEditActions && (
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</p>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${viewAction.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                                        {viewAction.is_active ? "Active" : "Inactive"}
                                    </span>
                                </div>
                            )}
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</p>
                                <p className="text-sm text-gray-700">{describeAction(viewAction)}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Updated</p>
                                <p className="text-sm font-medium text-gray-900">{formatDate(viewAction.updated_at)}</p>
                            </div>
                        </div>
                        {canEditActions && (
                            <div className="px-6 pb-6 flex justify-end">
                                <button
                                    onClick={() => { setViewAction(null); openEdit(viewAction); }}
                                    className="px-6 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                                >
                                    <Icon icon="mdi:pencil" width="14" />
                                    Edit
                                </button>
                            </div>
                        )}
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
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Mentor Point Override</label>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    Share of this action&apos;s points handed to the mentee&apos;s mentor. It is
                                    taken <span className="font-semibold">out of</span> the mentee&apos;s award, not
                                    added on top. {OVERRIDE_HELP}
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Gold mentor</label>
                                        <div className={`flex items-center border rounded-xl bg-gray-50/50 overflow-hidden transition-all ${goldError ? "border-red-300" : "border-gray-200"}`}>
                                            <input
                                                type="number"
                                                min={0}
                                                max={100}
                                                step={0.5}
                                                value={editGoldPct}
                                                onFocus={(e) => e.target.select()}
                                                onChange={(e) => setEditGoldPct(e.target.value)}
                                                className="flex-1 w-full px-4 py-3 text-sm bg-transparent outline-none"
                                            />
                                            <span className="pr-3 text-sm text-gray-400">%</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Silver mentor</label>
                                        <div className={`flex items-center border rounded-xl bg-gray-50/50 overflow-hidden transition-all ${silverError ? "border-red-300" : "border-gray-200"}`}>
                                            <input
                                                type="number"
                                                min={0}
                                                max={100}
                                                step={0.5}
                                                value={editSilverPct}
                                                onFocus={(e) => e.target.select()}
                                                onChange={(e) => setEditSilverPct(e.target.value)}
                                                className="flex-1 w-full px-4 py-3 text-sm bg-transparent outline-none"
                                            />
                                            <span className="pr-3 text-sm text-gray-400">%</span>
                                        </div>
                                    </div>
                                </div>
                                {(goldError || silverError) && (
                                    <p className="flex items-start gap-1.5 text-xs text-red-600">
                                        <Icon icon="mdi:alert-circle-outline" width="14" className="shrink-0 mt-0.5" />
                                        <span>{goldError || silverError}</span>
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-semibold text-gray-700">Description</label>
                                    <span className={`text-xs ${editDescription.length > 255 ? "text-red-500 font-semibold" : "text-gray-400"}`}>
                                        {editDescription.length}/255
                                    </span>
                                </div>
                                <textarea
                                    rows={3}
                                    maxLength={255}
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    placeholder="What does this action reward, and when?"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-gray-50/50 transition-all resize-none"
                                />
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
                                disabled={isSaving || Boolean(goldError) || Boolean(silverError)}
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

"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { GetKycHistory } from "@/src/lib/request-handlers/userMgt";

interface Props {
    userId: string;
}

interface HistoryItem {
    id: string;
    previous_status: string | null;
    new_status: string;
    rejection_reason: string | null;
    provider: string | null;
    trigger: string;
    comment: string | null;
    performer_id: string | null;
    performer_label: string | null;
    kyc_doc_id: string | null;
    created_at: string | null;
}

function statusColor(status: string): string {
    switch (status) {
        case "VERIFIED": return "text-green-700 bg-green-50 border-green-200";
        case "REJECTED": return "text-red-700 bg-red-50 border-red-200";
        case "PENDING":  return "text-yellow-700 bg-yellow-50 border-yellow-200";
        default:         return "text-gray-700 bg-gray-50 border-gray-200";
    }
}

function triggerIcon(trigger: string): string {
    switch (trigger) {
        case "ADMIN_REVIEW":  return "mdi:account-tie";
        case "AUTO_VERIFY":   return "mdi:robot";
        case "USER_RESUBMIT": return "mdi:refresh";
        case "DOC_UPLOAD":    return "mdi:file-upload-outline";
        case "BACKFILL":      return "mdi:history";
        default:              return "mdi:circle-medium";
    }
}

function triggerLabel(trigger: string): string {
    switch (trigger) {
        case "ADMIN_REVIEW":  return "Admin review";
        case "AUTO_VERIFY":   return "Auto-verify";
        case "USER_RESUBMIT": return "User resubmission";
        case "DOC_UPLOAD":    return "Document upload";
        case "BACKFILL":      return "Initial state";
        default:              return trigger;
    }
}

function formatDate(iso: string | null): string {
    if (!iso) return "";
    try {
        const d = new Date(iso);
        return d.toLocaleString("en-NG", {
            day: "numeric", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit",
        });
    } catch {
        return iso;
    }
}

const KycHistoryTimeline: React.FC<Props> = ({ userId }) => {
    const { data, isLoading } = GetKycHistory(userId);
    const items: HistoryItem[] = data?.data?.data?.items || [];

    return (
        <section className="mt-6">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Icon icon="solar:history-3-bold-duotone" width="20" />
                </div>
                <h4 className="text-lg font-bold text-gray-800">KYC Activity</h4>
            </div>

            <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-5">
                {isLoading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Icon icon="mdi:loading" className="animate-spin w-4 h-4" /> Loading activity...
                    </div>
                ) : items.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-6">No KYC activity recorded yet.</p>
                ) : (
                    <ol className="relative border-l-2 border-gray-200 ml-3 space-y-5">
                        {items.map((it) => (
                            <li key={it.id} className="ml-6">
                                <span className="absolute -left-[13px] flex items-center justify-center w-6 h-6 bg-white border-2 border-gray-200 rounded-full">
                                    <Icon icon={triggerIcon(it.trigger)} className="w-3.5 h-3.5 text-gray-600" />
                                </span>
                                <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {it.previous_status && (
                                            <>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${statusColor(it.previous_status)}`}>
                                                    {it.previous_status}
                                                </span>
                                                <Icon icon="mdi:arrow-right" className="w-4 h-4 text-gray-400" />
                                            </>
                                        )}
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${statusColor(it.new_status)}`}>
                                            {it.new_status}
                                        </span>
                                        <span className="text-xs text-gray-500">· {triggerLabel(it.trigger)}</span>
                                    </div>
                                    <p className="text-sm text-gray-700">
                                        <span className="font-medium">{it.performer_label || "System"}</span>
                                        <span className="text-gray-500"> · {formatDate(it.created_at)}</span>
                                    </p>
                                    {it.rejection_reason && (
                                        <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded px-2 py-1.5">
                                            <span className="font-semibold">Reason:</span> {it.rejection_reason}
                                        </p>
                                    )}
                                    {it.comment && (
                                        <p className="text-xs text-gray-600 italic">{it.comment}</p>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ol>
                )}
            </div>
        </section>
    );
};

export default KycHistoryTimeline;

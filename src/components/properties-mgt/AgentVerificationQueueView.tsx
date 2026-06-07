"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import BreadCrumb from "@/src/components/breadcrumb";
import { GetAgentVerificationQueue } from "@/src/lib/request-handlers/propertyMgt";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";

const STATUS_OPTIONS = [
    { value: "PENDING",  label: "Pending"  },
    { value: "VERIFIED", label: "Verified" },
    { value: "REJECTED", label: "Rejected" },
] as const;

function statusPill(status: string) {
    const colors: Record<string, string> = {
        PENDING:  "bg-yellow-100 text-yellow-700 border-yellow-200",
        VERIFIED: "bg-green-100 text-green-700 border-green-200",
        REJECTED: "bg-red-100 text-red-700 border-red-200",
    };
    const klass = colors[status] || "bg-gray-100 text-gray-700 border-gray-200";
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${klass}`}>
            {status}
        </span>
    );
}

const AgentVerificationQueueView: React.FC = () => {
    const [page, setPage] = useState(1);
    const [size] = useState(20);
    const [status, setStatus] = useState<"PENDING" | "VERIFIED" | "REJECTED">("PENDING");

    const { data, isLoading, refetch, isFetching } = GetAgentVerificationQueue({ page, size, status });

    const payload = data?.data?.data || {};
    const items: any[] = payload.items || [];
    const total: number = payload.total || 0;
    const kpis = payload.kpis || { total_assigned_pending: 0, oldest_pending_days: null };
    const totalPages = Math.max(1, Math.ceil(total / size));
    const oldestDays = kpis.oldest_pending_days as number | null;
    const oldestUrgent = oldestDays !== null && oldestDays > 7;

    return (
        <div className="p-[20px] mr-5 ml-5 mt-5 mb-100 border border-[#D9D9D9] rounded-[15px] bg-white shadow-md min-h-[calc(100vh-150px)]">
            <BreadCrumb
                description=""
                active="My Verifications"
                link_one={PAGE_ROUTES.dashboard.propertyManagement.allProperties.base}
                link_one_name="Property Management"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 mt-2">
                <div>
                    <h3 className="font-semibold text-lg">Verifications Assigned to Me</h3>
                    <p className="text-sm text-gray-500">Properties waiting on your on-site verification.</p>
                </div>
                <button
                    onClick={() => refetch()}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50 flex items-center gap-2"
                    disabled={isFetching}
                >
                    <Icon icon={isFetching ? "mdi:loading" : "mdi:refresh"} className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
                    Refresh
                </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total assigned (pending)</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{kpis.total_assigned_pending ?? 0}</p>
                </div>
                <div className={`border rounded-2xl p-4 ${oldestUrgent ? "bg-red-50 border-red-200" : "bg-gray-50/50 border-gray-100"}`}>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Oldest pending</p>
                    <p className={`text-2xl font-bold mt-1 ${oldestUrgent ? "text-red-700" : "text-gray-900"}`}>
                        {oldestDays === null ? "—" : `${oldestDays} day${oldestDays === 1 ? "" : "s"}`}
                    </p>
                    {oldestUrgent && (
                        <p className="text-xs text-red-700 mt-1 flex items-center gap-1">
                            <Icon icon="mdi:alert" className="w-3.5 h-3.5" />
                            Over a week — please get to it.
                        </p>
                    )}
                </div>
            </div>

            {/* Status filter */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
                {STATUS_OPTIONS.map((o) => (
                    <button
                        key={o.value}
                        onClick={() => { setStatus(o.value); setPage(1); }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
                            status === o.value
                                ? "bg-primary text-white border-primary"
                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                    >
                        {o.label}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                <th className="text-left font-semibold px-4 py-3">Property</th>
                                <th className="text-left font-semibold px-4 py-3">Location</th>
                                <th className="text-left font-semibold px-4 py-3">Status</th>
                                <th className="text-left font-semibold px-4 py-3">Evidence</th>
                                <th className="text-left font-semibold px-4 py-3">Assigned</th>
                                <th className="text-right font-semibold px-4 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
                            ) : items.length === 0 ? (
                                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                                    <Icon icon="mdi:check-circle-outline" className="w-10 h-10 mx-auto text-green-500 mb-2" />
                                    Nothing assigned to you. Take a break.
                                </td></tr>
                            ) : items.map((it) => {
                                const propertyId = it.property?.id;
                                const detailPath = propertyId
                                    ? PAGE_ROUTES.dashboard.propertyManagement.allProperties.verifications.details(propertyId, it.id)
                                    : null;
                                return (
                                    <tr key={it.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-900">{it.property?.name || "(unnamed)"}</p>
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">
                                            {[it.property?.city, it.property?.state].filter(Boolean).join(", ") || "—"}
                                        </td>
                                        <td className="px-4 py-3">{statusPill(it.status)}</td>
                                        <td className="px-4 py-3 text-gray-700">{it.evidence_count ?? 0} item(s)</td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">
                                            {it.created_at ? new Date(it.created_at).toLocaleDateString("en-NG", {
                                                day: "numeric", month: "short", year: "numeric",
                                            }) : "—"}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {detailPath ? (
                                                <Link
                                                    href={detailPath}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary border border-primary/30 rounded-lg hover:bg-primary/5"
                                                >
                                                    Open <Icon icon="mdi:chevron-right" className="w-4 h-4" />
                                                </Link>
                                            ) : (
                                                <span className="text-xs text-gray-400">—</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
                        <p className="text-xs text-gray-500">Page {page} of {totalPages} ({total} total)</p>
                        <div className="flex gap-2">
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50"
                            >Previous</button>
                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50"
                            >Next</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AgentVerificationQueueView;

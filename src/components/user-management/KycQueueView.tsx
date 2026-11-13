"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import BreadCrumb from "@/src/components/breadcrumb";
import { GetKycQueue } from "@/src/lib/request-handlers/userMgt";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import { UserRole } from "@/src/lib/enums";

const ROLE_OPTIONS = [
    { value: "", label: "All roles" },
    { value: UserRole.GUEST, label: "Guest" },
    { value: UserRole.OWNER, label: "Owner" },
    { value: UserRole.AGENT, label: "Agent" },
];

function detailPathFor(role: string, userId: string): string | null {
    switch (role) {
        case UserRole.GUEST: return PAGE_ROUTES.dashboard.userManagement.guests.details(userId as any);
        case UserRole.OWNER: return PAGE_ROUTES.dashboard.userManagement.owners.details(userId as any);
        case UserRole.AGENT: return PAGE_ROUTES.dashboard.userManagement.agents.details(userId as any);
        case UserRole.SUPER_ADMIN:
        case UserRole.ADMIN:
        case UserRole.OPERATIONS_ADMIN:
        case UserRole.SUPPORT_ADMIN:
        case UserRole.ANALYST:
            return PAGE_ROUTES.dashboard.userManagement.admins.details(userId as any);
        default:
            return null;
    }
}

const KycQueueView: React.FC = () => {
    const [page, setPage] = useState(1);
    const [size] = useState(20);
    const [role, setRole] = useState<string>("");

    const { data, isLoading, refetch, isFetching } = GetKycQueue({ page, size, role, sort: "age_desc" });

    const payload = data?.data?.data || {};
    const items: any[] = payload.items || [];
    const total: number = payload.total || 0;
    const kpis = payload.kpis || { total_pending: 0, oldest_pending_days: null, by_role: {} };

    const totalPages = Math.max(1, Math.ceil(total / size));
    const oldestDays = kpis.oldest_pending_days as number | null;
    const oldestUrgent = oldestDays !== null && oldestDays > 7;

    return (
        <div className="p-[20px] mr-5 ml-5 mt-5 mb-100 border border-[#D9D9D9] rounded-[15px] bg-white shadow-md min-h-[calc(100vh-150px)]">
            <BreadCrumb
                description=""
                active="KYC Queue"
                link_one="/user-management/guests"
                link_one_name="User Management"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 mt-2">
                <div>
                    <h3 className="font-semibold text-lg">Pending KYC Reviews</h3>
                    <p className="text-sm text-gray-500">Oldest first — clear the backlog and the user gets back to using the platform.</p>
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

            {/* KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total pending</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{kpis.total_pending ?? 0}</p>
                </div>
                <div className={`border rounded-2xl p-4 ${oldestUrgent ? "bg-red-50 border-red-200" : "bg-gray-50/50 border-gray-100"}`}>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Oldest pending</p>
                    <p className={`text-2xl font-bold mt-1 ${oldestUrgent ? "text-red-700" : "text-gray-900"}`}>
                        {oldestDays === null ? "—" : `${oldestDays} day${oldestDays === 1 ? "" : "s"}`}
                    </p>
                    {oldestUrgent && (
                        <p className="text-xs text-red-700 mt-1 flex items-center gap-1">
                            <Icon icon="mdi:alert" className="w-3.5 h-3.5" />
                            Over a week — bump it up.
                        </p>
                    )}
                </div>
                <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">By role</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {Object.entries(kpis.by_role || {}).length === 0 && (
                            <span className="text-sm text-gray-500">No pending reviews</span>
                        )}
                        {Object.entries(kpis.by_role || {}).map(([r, count]) => (
                            <span key={r} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white border border-gray-200">
                                <span className="text-gray-600">{r}</span>
                                <span className="text-gray-900 font-semibold">{count as number}</span>
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
                <select
                    value={role}
                    onChange={(e) => { setRole(e.target.value); setPage(1); }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                >
                    {ROLE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                <th className="text-left font-semibold px-4 py-3">Name</th>
                                <th className="text-left font-semibold px-4 py-3">Email</th>
                                <th className="text-left font-semibold px-4 py-3">Role</th>
                                <th className="text-left font-semibold px-4 py-3">Days waiting</th>
                                <th className="text-left font-semibold px-4 py-3">Provider</th>
                                <th className="text-right font-semibold px-4 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
                            ) : items.length === 0 ? (
                                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                                    <Icon icon="mdi:check-circle-outline" className="w-10 h-10 mx-auto text-green-500 mb-2" />
                                    No pending KYC reviews. Nice work.
                                </td></tr>
                            ) : items.map((it) => {
                                const fullName = [it.first_name, it.last_name].filter(Boolean).join(" ") || "(no name)";
                                const days = it.days_waiting as number | null;
                                const urgent = days !== null && days > 7;
                                const detailPath = detailPathFor(it.role, it.user_id);
                                return (
                                    <tr key={it.user_id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {it.profile_image ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={it.profile_image} alt="" className="w-8 h-8 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
                                                        {fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    <p className="font-medium text-gray-900 truncate">{fullName}</p>
                                                    {it.phone && <p className="text-xs text-gray-500">{it.phone}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">{it.email || "—"}</td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                {it.role}
                                            </span>
                                        </td>
                                        <td className={`px-4 py-3 ${urgent ? "text-red-700 font-semibold" : "text-gray-700"}`}>
                                            {days === null ? "—" : `${days} day${days === 1 ? "" : "s"}`}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">
                                            {it.kyc_provider ? (
                                                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                                                    <Icon icon="mdi:robot" className="w-3.5 h-3.5" /> {it.kyc_provider}
                                                </span>
                                            ) : "—"}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {detailPath ? (
                                                <Link
                                                    href={detailPath}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary border border-primary/30 rounded-lg hover:bg-primary/5"
                                                >
                                                    Review <Icon icon="mdi:chevron-right" className="w-4 h-4" />
                                                </Link>
                                            ) : (
                                                <span className="text-xs text-gray-400">No detail page</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
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

export default KycQueueView;

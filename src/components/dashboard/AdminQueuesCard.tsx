"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { GetAdminQueues, QueueSummary } from "@/src/lib/request-handlers/dashboardMgt";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";

interface QueueRowProps {
    icon: string;
    label: string;
    href: string;
    summary: QueueSummary | undefined;
    accentColor: string; // tailwind classes like "text-amber-600 bg-amber-50"
}

const QueueRow = ({ icon, label, href, summary, accentColor }: QueueRowProps) => {
    const count = summary?.count ?? 0;
    const oldest = summary?.oldest_age_days ?? 0;
    const isStale = oldest >= 7;
    return (
        <Link
            href={href}
            className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
        >
            <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${accentColor}`}>
                    <Icon icon={icon} className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{label}</div>
                    {count > 0 ? (
                        <div className={`text-xs ${isStale ? "text-red-600 font-medium" : "text-gray-500"}`}>
                            oldest {oldest} day{oldest === 1 ? "" : "s"} ago
                            {isStale && " · backlog"}
                        </div>
                    ) : (
                        <div className="text-xs text-gray-400">Up to date</div>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <span
                    className={`text-2xl font-bold ${
                        count === 0 ? "text-gray-300" : isStale ? "text-red-600" : "text-gray-800"
                    }`}
                >
                    {count}
                </span>
                <Icon
                    icon="mdi:chevron-right"
                    className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors"
                />
            </div>
        </Link>
    );
};

const AdminQueuesCard = () => {
    const { data, isLoading } = GetAdminQueues();

    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <Icon icon="solar:checklist-minimalistic-bold-duotone" className="w-5 h-5 text-primary" />
                    Action Queues
                </h3>
                <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                    Triage
                </span>
            </div>
            {isLoading ? (
                <div className="p-4 space-y-2">
                    <Skeleton className="h-14 w-full rounded-lg" />
                    <Skeleton className="h-14 w-full rounded-lg" />
                    <Skeleton className="h-14 w-full rounded-lg" />
                    <Skeleton className="h-14 w-full rounded-lg" />
                </div>
            ) : (
                <div className="divide-y divide-gray-100">
                    <QueueRow
                        icon="solar:document-add-bold-duotone"
                        label="KYC Reviews Pending"
                        href={PAGE_ROUTES.dashboard.userManagement.kycQueue.base}
                        summary={data?.kyc_pending}
                        accentColor="text-blue-600 bg-blue-50"
                    />
                    <QueueRow
                        icon="solar:shield-check-bold-duotone"
                        label="Property Verifications"
                        href={PAGE_ROUTES.dashboard.propertyManagement.manageVerifications.base}
                        summary={data?.verifications_pending}
                        accentColor="text-purple-600 bg-purple-50"
                    />
                    <QueueRow
                        icon="solar:danger-triangle-bold-duotone"
                        label="Open Disputes"
                        href={PAGE_ROUTES.dashboard.bookingManagement.bookingDisputes.base}
                        summary={data?.open_disputes}
                        accentColor="text-red-600 bg-red-50"
                    />
                    <QueueRow
                        icon="solar:bell-bing-bold-duotone"
                        label="Booking Requests"
                        href={PAGE_ROUTES.dashboard.bookingManagement.bookingRequests.base}
                        summary={data?.booking_requests}
                        accentColor="text-amber-600 bg-amber-50"
                    />
                </div>
            )}
        </div>
    );
};

export default AdminQueuesCard;

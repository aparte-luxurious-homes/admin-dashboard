"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import { useDebouncedValue } from "@/src/hooks/useDebouncedValue";
import { FLEX_KIND_LABEL, FLEX_STATUS_LABEL, isOpenPayment, koboToNaira, plansToCsv } from "@/src/lib/flexPayments";
import { GetFlexPayments } from "@/src/lib/request-handlers/flexPaymentsMgt";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import { FlexPaymentKind, FlexPaymentStatus } from "@/src/lib/types/flexPayments";
import { formatMoney } from "@/src/lib/utils";
import EmptyState from "@/src/components/shared/EmptyState";
import ErrorState from "@/src/components/shared/ErrorState";
import PageHeader from "@/src/components/shared/PageHeader";
import { Skeleton } from "@/src/components/ui/skeleton";
import TablePagination from "@/src/components/TablePagination";
import DueLabel from "./DueLabel";
import FlexPaymentStatusChip from "./FlexPaymentStatusChip";

const PAGE_SIZE = 15;
const STATUS_TABS: Array<FlexPaymentStatus | "ALL"> = [
    "ALL",
    FlexPaymentStatus.PARTIALLY_PAID,
    FlexPaymentStatus.PENDING,
    FlexPaymentStatus.FAILED,
    FlexPaymentStatus.EXPIRED,
    FlexPaymentStatus.FULLY_PAID,
    FlexPaymentStatus.REFUNDED,
];

const money = (kobo: number) => formatMoney(koboToNaira(kobo));

/** Admin monitor for every instalment and invite-friends booking. */
export default function FlexPaymentsView() {
    const [status, setStatus] = useState<FlexPaymentStatus | "ALL">("ALL");
    const [kind, setKind] = useState<FlexPaymentKind | "ALL">("ALL");
    const [expiringSoon, setExpiringSoon] = useState(false);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const debouncedSearch = useDebouncedValue(search);

    // Any filter change returns to the first page.
    useEffect(() => setPage(1), [status, kind, expiringSoon, debouncedSearch]);

    const query = GetFlexPayments({
        page,
        limit: PAGE_SIZE,
        status,
        kind,
        attention: expiringSoon ? "EXPIRING_SOON" : "NONE",
        search: debouncedSearch || undefined,
    });
    const rows = query.data?.items ?? [];
    const total = query.data?.total ?? 0;
    const filtered = status !== "ALL" || kind !== "ALL" || expiringSoon || !!debouncedSearch;

    const exportCsv = () => {
        const blob = new Blob([plansToCsv(rows)], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `flexible-payments-page-${page}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`Exported ${rows.length} rows`);
    };

    return (
        <div>
            <PageHeader
                title="Flexible payments"
                subtitle="Instalment and invite-friends bookings: what's been paid, what's outstanding and what's about to expire."
                actions={
                    <button
                        type="button"
                        onClick={exportCsv}
                        disabled={rows.length === 0}
                        title="Exports the rows on this page"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                    >
                        <Icon icon="lucide:download" width={16} />
                        Export this page (CSV)
                    </button>
                }
            />

            <div className="mb-4 space-y-3">
                <div className="flex gap-1 overflow-x-auto pb-1" role="tablist" aria-label="Filter by payment status">
                    {STATUS_TABS.map((tab) => (
                        <button
                            key={tab}
                            role="tab"
                            aria-selected={status === tab}
                            onClick={() => setStatus(tab)}
                            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm ${
                                status === tab ? "bg-primary text-white" : "bg-white text-gray-700 hover:bg-gray-100"
                            }`}
                        >
                            {tab === "ALL" ? "All" : FLEX_STATUS_LABEL[tab]}
                        </button>
                    ))}
                </div>
                <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    <select
                        value={kind}
                        onChange={(e) => setKind(e.target.value as FlexPaymentKind | "ALL")}
                        aria-label="Filter by payment type"
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                    >
                        <option value="ALL">All types</option>
                        {Object.values(FlexPaymentKind).map((k) => (
                            <option key={k} value={k}>
                                {FLEX_KIND_LABEL[k]}
                            </option>
                        ))}
                    </select>
                    <label className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
                        <input type="checkbox" checked={expiringSoon} onChange={(e) => setExpiringSoon(e.target.checked)} />
                        Expiring in 24 hours
                    </label>
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search booking, guest or property"
                        aria-label="Search flexible payments"
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:outline-none md:ml-auto md:w-72"
                    />
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                {query.isLoading ? (
                    <div className="space-y-3 p-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} className="h-14 w-full" />
                        ))}
                    </div>
                ) : query.isError ? (
                    <ErrorState
                        message={query.error instanceof Error ? query.error.message : "Couldn't load flexible payments"}
                        onRetry={() => query.refetch()}
                    />
                ) : rows.length === 0 ? (
                    <EmptyState
                        icon="solar:card-transfer-bold-duotone"
                        title={filtered ? "Nothing matches these filters" : "No flexible payments yet"}
                        description={filtered ? undefined : "Instalment and invite-friends bookings will appear here."}
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[860px] text-left text-sm">
                            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                                <tr>
                                    <th className="px-4 py-3">Booking</th>
                                    <th className="px-4 py-3">Guest / property</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Paid</th>
                                    <th className="px-4 py-3">Due</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {rows.map((row) => {
                                    const percent =
                                        row.totalKobo > 0 ? Math.min(100, Math.floor((row.paidKobo / row.totalKobo) * 100)) : 0;
                                    return (
                                        <tr key={row.planId} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={PAGE_ROUTES.dashboard.bookingManagement.bookings.details(row.bookingId)}
                                                    className="font-medium text-primary hover:underline"
                                                >
                                                    {row.bookingRef}
                                                </Link>
                                            </td>
                                            <td className="max-w-[16rem] px-4 py-3">
                                                <span className="block truncate text-gray-900">{row.guestName}</span>
                                                <span className="block truncate text-xs text-gray-500">{row.propertyName}</span>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3 text-gray-700">{FLEX_KIND_LABEL[row.kind]}</td>
                                            <td className="px-4 py-3">
                                                <FlexPaymentStatusChip status={row.status} />
                                            </td>
                                            <td className="min-w-[10rem] px-4 py-3">
                                                <span className="block text-gray-900">
                                                    {money(row.paidKobo)} <span className="text-gray-400">/ {money(row.totalKobo)}</span>
                                                </span>
                                                <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
                                                    <span className="block h-full bg-primary" style={{ width: `${percent}%` }} />
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3">
                                                <DueLabel dueAt={row.dueAt} settled={!isOpenPayment(row.status)} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {total > PAGE_SIZE && (
                <div className="mt-4">
                    <TablePagination total={total} itemsPerPage={PAGE_SIZE} currentPage={page} setPage={setPage} />
                </div>
            )}
        </div>
    );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import BreadCrumb from "@/src/components/breadcrumb";
import TablePagination from "@/src/components/TablePagination";
import { useTableState } from "@/src/hooks/useTableState";
import { getApiErrorMessage } from "@/src/lib/apiError";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import { useAuth } from "@/src/hooks/useAuth";
import {
    canFixEmail,
    EmailHealthItem,
    EmailStatus,
    GetEmailHealthList,
    GetEmailHealthSummary,
    ResendFailedEmails,
} from "@/src/lib/request-handlers/emailHealthMgt";
import FixEmailDialog from "./FixEmailDialog";
import { formatBounceDate } from "./EmailHealthChip";

const PAGE_SIZE = 20;

const TABS: { status: EmailStatus; label: string; hint: string }[] = [
    {
        status: "UNDELIVERABLE",
        label: "Undeliverable",
        hint: "Emails to these addresses have stopped. Nothing reaches them until the address is fixed.",
    },
    {
        status: "BOUNCING",
        label: "Bouncing",
        hint: "Some emails to these addresses are bouncing. Three soft bounces in a week makes one undeliverable.",
    },
];

/** The user detail page for this person, which depends on their role. */
function userDetailHref(role: string, userId: string): string {
    const um = PAGE_ROUTES.dashboard.userManagement;
    // The detail routes are typed `(id: number)` but every caller passes the UUID.
    const id = userId as unknown as number;
    switch (role) {
        case "GUEST":
            return um.guests.details(id);
        case "OWNER":
            return um.owners.details(id);
        case "AGENT":
            return um.agents.details(id);
        default:
            return um.admins.details(id);
    }
}

function formatRole(role: string) {
    const r = (role || "").replace(/_/g, " ").toLowerCase();
    return r.charAt(0).toUpperCase() + r.slice(1);
}

/**
 * Every person whose email address our emails are bouncing off, so staff can
 * correct it and resend what they missed. Search, tab and page live in the
 * URL (useTableState) — the route needs a Suspense boundary for that.
 */
const EmailDeliveryView: React.FC = () => {
    const table = useTableState({ filterKeys: ["status"] });
    const status: EmailStatus = table.filters.status === "BOUNCING" ? "BOUNCING" : "UNDELIVERABLE";
    const { page, setPage, search, debouncedSearch } = table;

    const { data, isLoading, isError, error, isFetching, refetch } = GetEmailHealthList({
        status,
        search: debouncedSearch,
        page,
        size: PAGE_SIZE,
    });
    const summary = GetEmailHealthSummary();
    const resend = ResendFailedEmails();
    // SUPPORT_ADMIN sees the list and can Resend, but cannot change an address.
    const { user: viewer } = useAuth();
    const mayFix = canFixEmail(viewer?.role);

    const [fixing, setFixing] = useState<EmailHealthItem | null>(null);
    const [resendingId, setResendingId] = useState<string | null>(null);

    const items = data?.items ?? [];
    const total = data?.total ?? 0;
    const activeTab = TABS.find((t) => t.status === status) ?? TABS[0];

    const onResend = async (item: EmailHealthItem) => {
        setResendingId(item.user_id);
        try {
            const { resent } = await resend.mutateAsync(item.user_id);
            toast.success(
                resent > 0
                    ? `Re-sent ${resent} email${resent === 1 ? "" : "s"} to ${item.email}.`
                    : "Nothing to resend for this person."
            );
        } catch (err) {
            toast.error(getApiErrorMessage(err, "Couldn't resend the failed emails."));
        } finally {
            setResendingId(null);
        }
    };

    const countFor = (s: EmailStatus): number | null => {
        if (!summary.data) return null;
        return s === "UNDELIVERABLE" ? summary.data.undeliverable : summary.data.bouncing;
    };

    return (
        <div className="p-[20px] mr-5 ml-5 mt-5 mb-100 border border-[#D9D9D9] rounded-[15px] bg-white shadow-md min-h-[calc(100vh-150px)]">
            <BreadCrumb
                description=""
                active="Email delivery"
                link_one={PAGE_ROUTES.dashboard.userManagement.guests.base}
                link_one_name="User Management"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 mb-5 mt-2">
                <div>
                    <h3 className="font-semibold text-lg">Email delivery</h3>
                    <p className="text-sm text-gray-500">
                        People whose emails aren&apos;t arriving, usually because of a mistyped address.
                        Fixing the address re-sends their recent failed emails.
                    </p>
                </div>
                <button
                    onClick={() => {
                        refetch();
                        summary.refetch();
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50 flex items-center gap-2"
                    disabled={isFetching}
                >
                    <Icon
                        icon={isFetching ? "mdi:loading" : "mdi:refresh"}
                        className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
                    />
                    Refresh
                </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1 self-start" role="tablist">
                    {TABS.map((tab) => {
                        const active = tab.status === status;
                        const count = countFor(tab.status);
                        return (
                            <button
                                key={tab.status}
                                role="tab"
                                aria-selected={active}
                                onClick={() => table.setFilter("status", tab.status === "UNDELIVERABLE" ? "" : tab.status)}
                                className={`px-4 py-1.5 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${
                                    active ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
                                }`}
                            >
                                {tab.label}
                                {count !== null && (
                                    <span
                                        className={`text-xs px-1.5 py-0.5 rounded-full ${
                                            tab.status === "UNDELIVERABLE"
                                                ? "bg-red-50 text-red-700"
                                                : "bg-amber-50 text-amber-700"
                                        }`}
                                    >
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
                <div className="relative w-full md:w-80">
                    <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => table.setSearch(e.target.value)}
                        placeholder="Search by name, email or phone"
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    />
                </div>
            </div>
            <p className="text-xs text-gray-500 mb-4">{activeTab.hint}</p>

            <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                <th className="text-left font-semibold px-4 py-3">Person</th>
                                <th className="text-left font-semibold px-4 py-3">Email</th>
                                <th className="text-left font-semibold px-4 py-3">Reason</th>
                                <th className="text-left font-semibold px-4 py-3 whitespace-nowrap">Since</th>
                                <th className="text-left font-semibold px-4 py-3 whitespace-nowrap">Failed emails</th>
                                <th className="text-left font-semibold px-4 py-3">Their agent</th>
                                <th className="text-right font-semibold px-4 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">Loading...</td>
                                </tr>
                            ) : isError ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                                        {getApiErrorMessage(error, "Couldn't load email delivery problems.")}
                                    </td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                                        <Icon icon="mdi:email-check-outline" className="w-10 h-10 mx-auto text-green-500 mb-2" />
                                        {debouncedSearch
                                            ? "No one matches that search."
                                            : status === "UNDELIVERABLE"
                                                ? "No undeliverable addresses."
                                                : "No addresses are bouncing."}
                                    </td>
                                </tr>
                            ) : (
                                items.map((it) => {
                                    const since = formatBounceDate(it.email_bounced_at);
                                    const busy = resendingId === it.user_id;
                                    return (
                                        <tr key={it.user_id} className="hover:bg-gray-50 align-top">
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={userDetailHref(it.role, it.user_id)}
                                                    className="font-medium text-gray-900 hover:text-primary"
                                                >
                                                    {it.name || "(no name)"}
                                                </Link>
                                                <p className="text-xs text-gray-500">{formatRole(it.role)}</p>
                                                {it.phone && <p className="text-xs text-gray-500">{it.phone}</p>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <p
                                                    className={`break-all ${
                                                        it.email_status === "UNDELIVERABLE" ? "text-red-700" : "text-amber-700"
                                                    }`}
                                                >
                                                    {it.email}
                                                </p>
                                                {it.email_suggestion && (
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        Did they mean{" "}
                                                        <span className="font-medium text-gray-700">{it.email_suggestion}</span>?
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 min-w-[180px]">
                                                {it.email_bounce_reason || "—"}
                                            </td>
                                            <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{since || "—"}</td>
                                            <td className="px-4 py-3 text-gray-700">
                                                <p className="font-medium">{it.failed_emails_count ?? 0}</p>
                                                {it.last_failed_subject && (
                                                    <p className="text-xs text-gray-500 max-w-[220px] truncate" title={it.last_failed_subject}>
                                                        Last: {it.last_failed_subject}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">
                                                {it.agent ? (
                                                    <>
                                                        <p>{it.agent.name || "(no name)"}</p>
                                                        {it.agent.email && (
                                                            <p className="text-xs text-gray-500 break-all">{it.agent.email}</p>
                                                        )}
                                                    </>
                                                ) : (
                                                    "—"
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    {mayFix && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setFixing(it)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-primary rounded-lg hover:bg-primary/90 whitespace-nowrap"
                                                        >
                                                            <Icon icon="mdi:email-edit-outline" className="w-4 h-4" />
                                                            Fix email
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => onResend(it)}
                                                        disabled={busy}
                                                        title="Re-send emails that failed in the last 7 days"
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary border border-primary/30 rounded-lg hover:bg-primary/5 disabled:opacity-50 whitespace-nowrap"
                                                    >
                                                        <Icon
                                                            icon={busy ? "mdi:loading" : "mdi:email-sync-outline"}
                                                            className={`w-4 h-4 ${busy ? "animate-spin" : ""}`}
                                                        />
                                                        Resend
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {total > PAGE_SIZE && (
                    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                        <TablePagination
                            total={total}
                            itemsPerPage={PAGE_SIZE}
                            currentPage={page}
                            setPage={setPage}
                        />
                    </div>
                )}
            </div>

            {mayFix && fixing && (
                <FixEmailDialog
                    isOpen={!!fixing}
                    onClose={() => setFixing(null)}
                    userId={fixing.user_id}
                    userLabel={fixing.name}
                    currentEmail={fixing.email}
                    suggestion={fixing.email_suggestion}
                    reason={fixing.email_bounce_reason}
                />
            )}
        </div>
    );
};

export default EmailDeliveryView;

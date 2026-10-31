"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import { Skeleton } from "@/src/components/ui/skeleton";
import TablePagination from "@/src/components/TablePagination";
import { useTableState } from "@/src/hooks/useTableState";
import { useAuth } from "@/src/hooks/useAuth";
import { getApiErrorMessage } from "@/src/lib/apiError";
import {
    AdjustmentRequest,
    AdjustmentStatus,
    ApproveAdjustment,
    CancelAdjustment,
    GetAdjustmentRequests,
    RejectAdjustment,
} from "@/src/lib/request-handlers/financeMgt";

const PAGE_SIZE = 20;
const TABS = ["PENDING", "APPROVED", "REJECTED", "ALL"] as const;
type Tab = (typeof TABS)[number];
const TAB_LABEL: Record<Tab, string> = {
    PENDING: "Pending",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    ALL: "All",
};

const STATUS_STYLE: Record<AdjustmentStatus, string> = {
    PENDING: "bg-amber-50 text-amber-700",
    APPLYING: "bg-sky-50 text-sky-700",
    APPROVED: "bg-emerald-50 text-emerald-700",
    REJECTED: "bg-red-50 text-red-700",
    CANCELLED: "bg-gray-100 text-gray-600",
    FAILED: "bg-red-50 text-red-700",
};

const money = (value: string, currency: string) =>
    `${currency === "NGN" ? "₦" : `${currency} `}${Number(value || 0).toLocaleString("en-NG", {
        maximumFractionDigits: 2,
    })}`;

const roleLabel = (role?: string | null) =>
    role ? role.charAt(0) + role.slice(1).toLowerCase().replace(/_/g, " ") : "";

function ago(iso: string | null): string {
    if (!iso) return "";
    const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} h ago`;
    const days = Math.round(hours / 24);
    return days === 1 ? "yesterday" : `${days} days ago`;
}

function fileName(url: string): string {
    try {
        return decodeURIComponent(new URL(url).pathname.split("/").pop() || "receipt");
    } catch {
        return "receipt";
    }
}

interface CardProps {
    req: AdjustmentRequest;
    canApprove: boolean;
    isMine: boolean;
}

const RequestCard = ({ req, canApprove, isMine }: CardProps) => {
    const { mutate: approve, isPending: approving } = ApproveAdjustment();
    const { mutate: reject, isPending: rejecting } = RejectAdjustment();
    const { mutate: cancel, isPending: cancelling } = CancelAdjustment();
    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectNote, setRejectNote] = useState("");
    const [rejectTouched, setRejectTouched] = useState(false);

    const pending = req.status === "PENDING";
    const credit = req.action === "CREDIT";
    const holder = req.wallet_holder;
    const amount = money(req.amount, req.currency);
    const busy = approving || rejecting || cancelling;

    const onApprove = () =>
        approve(
            { id: req.id },
            {
                onSuccess: () =>
                    toast.success(
                        `Approved. ${amount} ${credit ? "credited to" : "debited from"} ${holder?.name ?? "the wallet"}.`,
                    ),
                onError: (err) => toast.error(getApiErrorMessage(err, "Could not approve the adjustment")),
            },
        );

    const onReject = () => {
        setRejectTouched(true);
        if (rejectNote.trim().length < 3) return;
        reject(
            { id: req.id, note: rejectNote.trim() },
            {
                onSuccess: () => {
                    setRejectOpen(false);
                    toast.success("Rejected. The requester has been notified.");
                },
                onError: (err) => toast.error(getApiErrorMessage(err, "Could not reject the adjustment")),
            },
        );
    };

    const onCancel = () =>
        cancel(
            { id: req.id },
            {
                onSuccess: () => toast.success("Request cancelled."),
                onError: (err) => toast.error(getApiErrorMessage(err, "Could not cancel the request")),
            },
        );

    const decided =
        req.decided_by && (req.status === "APPROVED" || req.status === "REJECTED" || req.status === "FAILED")
            ? ` · ${req.status === "REJECTED" ? "rejected" : "approved"} by ${req.decided_by.name}`
            : "";

    return (
        <article className="grid grid-cols-[auto_minmax(0,1fr)] md:grid-cols-[auto_minmax(0,1fr)_auto] gap-x-4 gap-y-3 px-5 py-4">
            <div
                className={`w-24 rounded-xl px-3 py-2 ${
                    credit ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
                }`}
            >
                <div className="text-[10px] font-medium uppercase tracking-wider opacity-80">
                    {credit ? "Credit" : "Debit"}
                </div>
                <div className="text-sm font-bold tabular-nums break-all">{amount}</div>
            </div>

            <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900">
                    {holder?.name ?? "Unknown wallet"}
                    {holder?.role && <span className="font-normal text-gray-400"> · {roleLabel(holder.role)}</span>}
                </div>
                <p className="text-sm text-gray-700 mt-0.5 break-words">{req.reason}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                    {req.reference_number && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-xs text-gray-700">
                            <Icon icon="mdi:pound" className="w-3.5 h-3.5" /> {req.reference_number}
                        </span>
                    )}
                    {req.receipt_url && (
                        <a
                            href={req.receipt_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-xs text-primary hover:underline max-w-full"
                        >
                            <Icon icon="solar:bill-list-linear" className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{fileName(req.receipt_url)}</span>
                        </a>
                    )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    Requested by {req.requested_by?.name ?? "someone"}
                    {req.requested_by_role ? ` (${roleLabel(req.requested_by_role)})` : ""} · {ago(req.created_at)}
                    {decided}
                    {req.decision_note ? ` · "${req.decision_note}"` : ""}
                </p>
                {req.status === "FAILED" && req.apply_error && (
                    <p className="text-xs text-red-600 mt-1">Not applied: {req.apply_error}</p>
                )}
                {req.comment && <p className="text-xs text-gray-400 mt-1">Note: {req.comment}</p>}
            </div>

            <div className="col-span-2 md:col-span-1 flex md:flex-col items-center md:items-end justify-between gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[req.status]}`}>
                    {TAB_LABEL[req.status as Tab] ?? roleLabel(req.status)}
                </span>
                {pending && canApprove && !isMine && (
                    <div className="flex gap-2">
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => setRejectOpen((o) => !o)}
                            className="px-3 py-1.5 rounded-lg border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                            Reject
                        </button>
                        <button
                            type="button"
                            disabled={busy}
                            onClick={onApprove}
                            className="px-3 py-1.5 rounded-lg bg-primary text-xs font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                        >
                            {approving ? "Applying..." : "Approve and apply"}
                        </button>
                    </div>
                )}
                {pending && isMine && (
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Waiting for {canApprove ? "another admin" : "an admin"}</span>
                        <button
                            type="button"
                            disabled={busy}
                            onClick={onCancel}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            {cancelling ? "Cancelling..." : "Cancel"}
                        </button>
                    </div>
                )}
            </div>

            {rejectOpen && (
                <div className="col-span-2 md:col-span-3 rounded-xl border border-red-100 bg-red-50/50 p-3 space-y-2">
                    <label htmlFor={`rej-${req.id}`} className="block text-sm font-medium text-red-700">
                        Why is this being rejected? The requester sees this.
                    </label>
                    <textarea
                        id={`rej-${req.id}`}
                        rows={2}
                        value={rejectNote}
                        onChange={(e) => setRejectNote(e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg text-sm outline-none resize-none bg-white focus:ring-2 focus:ring-red-200 ${
                            rejectTouched && rejectNote.trim().length < 3 ? "border-red-400" : "border-gray-300"
                        }`}
                        placeholder="e.g. No matching transfer on the company account"
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setRejectOpen(false)}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-700"
                        >
                            Keep it
                        </button>
                        <button
                            type="button"
                            disabled={rejecting}
                            onClick={onReject}
                            className="px-3 py-1.5 rounded-lg bg-red-600 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                        >
                            {rejecting ? "Rejecting..." : "Reject request"}
                        </button>
                    </div>
                </div>
            )}
        </article>
    );
};

/**
 * Admins and super admins decide here. Operations and support admins see
 * only their own requests, which the API scopes for them.
 */
const WalletAdjustmentsView = () => {
    const { user } = useAuth();
    const table = useTableState({ filterKeys: ["status"] });
    const tab = (TABS as readonly string[]).includes(table.filters.status ?? "")
        ? (table.filters.status as Tab)
        : "PENDING";

    const { data, isLoading, isError } = GetAdjustmentRequests({
        status: tab === "ALL" ? undefined : tab,
        page: table.page,
        size: PAGE_SIZE,
    });
    const canApprove = Boolean(data?.can_approve);
    const items = data?.items ?? [];

    return (
        <div className="p-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                    <h1 className="text-xl font-semibold text-gray-900">
                        {data && !canApprove ? "My adjustment requests" : "Wallet adjustments"}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {data && !canApprove
                            ? "Adjustments you filed. An admin or super admin approves each one before the balance changes."
                            : "Credits and debits filed by operations and support, waiting for an admin."}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-4" role="group" aria-label="Status">
                        {TABS.map((t) => (
                            <button
                                key={t}
                                type="button"
                                aria-pressed={tab === t}
                                onClick={() => table.setFilter("status", t === "PENDING" ? "" : t)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                    tab === t ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-100"
                                }`}
                            >
                                {TAB_LABEL[t]}
                                {t === "PENDING" && canApprove && (data?.pending_total ?? 0) > 0 && (
                                    <span
                                        className={`px-1.5 rounded-full text-xs tabular-nums ${
                                            tab === t ? "bg-white/20" : "bg-amber-100 text-amber-800"
                                        }`}
                                    >
                                        {data?.pending_total}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-5 space-y-3">
                        <Skeleton className="h-24 w-full rounded-xl" />
                        <Skeleton className="h-24 w-full rounded-xl" />
                    </div>
                ) : isError ? (
                    <div className="p-8 text-center text-sm text-gray-500">Could not load adjustment requests.</div>
                ) : items.length === 0 ? (
                    <div className="p-10 text-center text-sm text-gray-400">
                        {tab === "PENDING"
                            ? canApprove
                                ? "Nothing waiting. New requests from operations and support appear here."
                                : "You have no requests waiting for an admin."
                            : "No requests here yet."}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {items.map((req) => (
                            <RequestCard
                                key={req.id}
                                req={req}
                                canApprove={canApprove}
                                isMine={String(req.requested_by?.id) === String(user?.id)}
                            />
                        ))}
                    </div>
                )}

                {(data?.total ?? 0) > PAGE_SIZE && (
                    <div className="px-5 py-3 border-t border-gray-100">
                        <TablePagination
                            total={data?.total ?? 0}
                            itemsPerPage={PAGE_SIZE}
                            currentPage={table.page}
                            setPage={table.setPage}
                        />
                    </div>
                )}

                {canApprove && (
                    <p className="px-5 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-500">
                        You cannot approve a request you filed yourself. Approving re-checks the balance, so a
                        debit the wallet can no longer cover is marked Failed instead of applied.
                    </p>
                )}
            </div>
        </div>
    );
};

export default WalletAdjustmentsView;

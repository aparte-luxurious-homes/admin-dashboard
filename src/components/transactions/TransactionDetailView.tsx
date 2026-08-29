"use client";

import BreadCrumb from "@/src/components/breadcrumb";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import { useEffect, useState, useCallback } from "react";
import axiosRequest from "@/src/lib/api";
import { toast } from "react-hot-toast";
import { Skeleton } from "@/src/components/ui/skeleton";
import Badge from "@/src/components/badge";
import { useParams } from "next/navigation";
import { formatDate, formatMoney } from "@/src/lib/utils";
import { Icon } from "@iconify/react";
import { ApproveRefundModal } from "@/src/components/finance-mgt/modals/ApproveRefundModal";
import { ApproveWithdrawalModal } from "@/src/components/finance-mgt/modals/ApproveWithdrawalModal";
import { RejectWithdrawalModal } from "@/src/components/finance-mgt/modals/RejectWithdrawalModal";
import { ReverseWithdrawalModal } from "@/src/components/finance-mgt/modals/ReverseWithdrawalModal";
import { Button } from "@/src/components/ui/button";
import { usePermissions } from "@/src/hooks/usePermissions";

interface Transaction {
    id: string;
    wallet_id: string;
    user_id: string;
    action: string;
    transaction_type: string;
    comment: string;
    currency: string;
    reference: string;
    payment_reference: string;
    amount: string;
    description: string;
    status: string;
    refund_proof: string;
    created_at: string;
    updated_at: string;
    user?: {
        email: string;
        first_name?: string;
        last_name?: string;
    };
    wallet?: {
        balance: string;
        currency: string;
    };
    payment?: {
        provider: string;
        status: string;
        customer_email?: string;
        payment_metadata?: any;
        fees?: string;
    };
}

interface TransactionDetailViewProps {
    title: string;
    backLink: string;
    backLinkName: string;
}

/* ── Helpers ── */

const ACTION_STYLES: Record<string, string> = {
    CREDIT: "bg-green-100 text-green-700 border-green-200",
    DEBIT: "bg-red-100 text-red-700 border-red-200",
};

const STATUS_ICONS: Record<string, { icon: string; color: string }> = {
    SUCCESSFUL: { icon: "mdi:check-circle", color: "text-green-500" },
    PENDING: { icon: "mdi:clock-outline", color: "text-yellow-500" },
    PENDING_APPROVAL: { icon: "mdi:clock-alert-outline", color: "text-orange-500" },
    AWAITING_AUTHORIZATION: { icon: "mdi:shield-lock-outline", color: "text-blue-500" },
    FAILED: { icon: "mdi:close-circle", color: "text-red-500" },
    REJECTED: { icon: "mdi:close-circle", color: "text-red-500" },
    OFFLINE_REFUNDED: { icon: "mdi:cash-refund", color: "text-gray-500" },
};

function CopyField({ label, value }: { label: string; value: string | null | undefined }) {
    const display = value || "--/--";
    const canCopy = value && value !== "--/--";

    const handleCopy = () => {
        if (canCopy) {
            navigator.clipboard.writeText(value);
            toast(`${label} copied!`);
        }
    };

    return (
        <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
            <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900 font-mono truncate">{display}</p>
                {canCopy && (
                    <button
                        onClick={handleCopy}
                        className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                        title={`Copy ${label}`}
                    >
                        <Icon icon="mdi:content-copy" width="14" />
                    </button>
                )}
            </div>
        </div>
    );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
    return (
        <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
            <p className="text-sm font-medium text-gray-900">{value || "--/--"}</p>
        </div>
    );
}

function SectionHeader({ icon, title }: { icon: string; title: string }) {
    return (
        <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Icon icon={icon} width="20" />
            </div>
            <h4 className="text-lg font-bold text-gray-800">{title}</h4>
        </div>
    );
}

/* ── Skeleton ── */

function DetailSkeleton() {
    return (
        <div className="space-y-6 mt-6">
            <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-6">
                <div className="flex gap-4 items-center">
                    <Skeleton className="w-16 h-16 rounded-xl" />
                    <div className="flex-1 space-y-3">
                        <Skeleton className="h-8 w-40" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                </div>
                <div className="border-t border-gray-200 my-5" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-5 w-28" />
                        </div>
                    ))}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-48 rounded-2xl" />
                <Skeleton className="h-48 rounded-2xl" />
            </div>
        </div>
    );
}

/* ── Main Component ── */

const TransactionDetailView = ({ title, backLink, backLinkName }: TransactionDetailViewProps) => {
    const [data, setData] = useState<Transaction | null>(null);
    const [loading, setLoading] = useState(false);
    // Kept so the empty state can tell "no such transaction" apart from "not
    // yours to see" — rendering both as "not found" hid a real 403 behind a
    // message that sent people looking for a missing record.
    const [loadError, setLoadError] = useState<{ status?: number; message: string } | null>(null);
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [isWithdrawalApprovalOpen, setIsWithdrawalApprovalOpen] = useState(false);
    const [isWithdrawalRejectionOpen, setIsWithdrawalRejectionOpen] = useState(false);
    const [isWithdrawalReverseOpen, setIsWithdrawalReverseOpen] = useState(false);
    const params = useParams();
    const id = params?.id;
    const { canManageFinances } = usePermissions();

    const fetchData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setLoadError(null);
        try {
            const response = await axiosRequest.get(
                API_ROUTES.transactions.details(String(id))
            );
            setData(response?.data?.data);
        } catch (error: any) {
            // FastAPI raises HTTPException with the reason under `detail`;
            // `message` only exists on the success wrapper, so reading it alone
            // always fell through to the generic fallback.
            const message =
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                "Failed to fetch transaction details";
            setData(null);
            setLoadError({ status: error?.response?.status, message });
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const fullName = data?.user
        ? `${data.user.first_name || ""} ${data.user.last_name || ""}`.trim() || data.user.email
        : "--/--";

    const statusInfo = STATUS_ICONS[data?.status || ""] || STATUS_ICONS.PENDING;
    const actionStyle = ACTION_STYLES[data?.action || ""] || "";
    const isPendingApproval = data?.status === "PENDING_APPROVAL";
    const isWithdrawal = data?.transaction_type === "WITHDRAWAL";
    // Reverse applies to a payout that did NOT settle: stuck awaiting OTP, still
    // in-flight, or marked successful but failed at the provider.
    const canReverseWithdrawal =
        isWithdrawal && ["AWAITING_AUTHORIZATION", "PENDING", "SUCCESSFUL"].includes(data?.status ?? "");

    return (
        <>
            <div className="p-[20px] mr-5 ml-5 mt-5 mb-100 border border-[#D9D9D9] rounded-[15px] bg-white shadow-md min-h-[calc(100vh-150px)]">
                <BreadCrumb
                    description=""
                    active={title}
                    link_one={backLink}
                    link_one_name={backLinkName}
                />

                <div className="flex justify-between items-center mb-6 mt-2">
                    <h3 className="font-semibold">{title}</h3>
                </div>

                {loading ? (
                    <DetailSkeleton />
                ) : !data ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <Icon
                            icon={loadError?.status === 403 ? "mdi:lock-outline" : "mdi:receipt-text-remove-outline"}
                            width="48"
                            className="mb-3"
                        />
                        <p className="text-lg font-medium">
                            {loadError?.status === 403
                                ? "You don't have access to this transaction"
                                : "Transaction not found"}
                        </p>
                        {loadError?.message && (
                            <p className="text-sm mt-1">{loadError.message}</p>
                        )}
                    </div>
                ) : (
                    <>
                        {/* ── Header Card ── */}
                        <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-6 mb-6">
                            {/* Top row: Amount + Status + Actions */}
                            <div className="flex flex-col sm:flex-row gap-4 sm:items-start">
                                {/* Amount icon */}
                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                    data.action === "CREDIT"
                                        ? "bg-green-100 text-green-600"
                                        : "bg-red-100 text-red-600"
                                }`}>
                                    <Icon
                                        icon={data.action === "CREDIT" ? "mdi:arrow-down-bold" : "mdi:arrow-up-bold"}
                                        width="28"
                                    />
                                </div>

                                {/* Amount + Meta */}
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        {formatMoney(Number(data.amount || 0), data.currency)}
                                    </h2>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase bg-primary/10 text-primary border border-primary/20">
                                            {data.transaction_type}
                                        </span>
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase border ${actionStyle}`}>
                                            {data.action}
                                        </span>
                                        <span className="text-xs text-gray-400">|</span>
                                        <div className="flex items-center gap-1">
                                            <Icon icon={statusInfo.icon} width="16" className={statusInfo.color} />
                                            <Badge status={data.status?.toLowerCase() || ""} />
                                        </div>
                                    </div>
                                </div>

                                {/* Action buttons — Admin-only approval/rejection */}
                                {isPendingApproval && canManageFinances && (
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {isWithdrawal && (
                                            <Button
                                                onClick={() => setIsWithdrawalRejectionOpen(true)}
                                                className="bg-red-600 text-white hover:bg-red-700"
                                            >
                                                <Icon icon="mdi:close" className="mr-1" width="16" />
                                                Reject
                                            </Button>
                                        )}
                                        <Button
                                            onClick={() => {
                                                if (isWithdrawal) {
                                                    setIsWithdrawalApprovalOpen(true);
                                                } else {
                                                    setIsApproveModalOpen(true);
                                                }
                                            }}
                                            className="bg-primary text-white hover:bg-primary/90"
                                        >
                                            <Icon icon="mdi:check" className="mr-1" width="16" />
                                            {isWithdrawal ? "Approve Withdrawal" : "Approve Refund"}
                                        </Button>
                                    </div>
                                )}

                                {/* Reverse — for payouts that did not settle (awaiting OTP / in-flight / provider-failed) */}
                                {canReverseWithdrawal && canManageFinances && (
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <Button
                                            onClick={() => setIsWithdrawalReverseOpen(true)}
                                            className="bg-amber-600 text-white hover:bg-amber-700"
                                        >
                                            <Icon icon="mdi:backup-restore" className="mr-1" width="16" />
                                            Reverse
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Divider */}
                            <div className="border-t border-gray-200 my-5" />

                            {/* Quick info row */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Field label="Customer" value={fullName} />
                                <Field label="Email" value={data.user?.email} />
                                <Field label="Created" value={data.created_at ? formatDate(data.created_at) : null} />
                                <Field label="Last Updated" value={data.updated_at ? formatDate(data.updated_at) : null} />
                            </div>
                        </div>

                        {/* ── Details Grid ── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            {/* References & IDs */}
                            <div>
                                <SectionHeader icon="solar:document-bold-duotone" title="References" />
                                <div className="grid grid-cols-1 gap-4 bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                                    <CopyField label="Transaction Reference" value={data.reference} />
                                    {data.payment_reference && (
                                        <CopyField label="Payment Reference" value={data.payment_reference} />
                                    )}
                                    <CopyField label="User ID" value={data.user_id} />
                                    <CopyField label="Wallet ID" value={data.wallet_id} />
                                </div>
                            </div>

                            {/* Wallet & Financials */}
                            <div>
                                <SectionHeader icon="solar:wallet-bold-duotone" title="Financial Details" />
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                                    <Field
                                        label="Wallet Balance"
                                        value={data.wallet ? formatMoney(Number(data.wallet.balance), data.wallet.currency) : null}
                                    />
                                    {data.payment && (
                                        <>
                                            <Field label="Payment Provider" value={data.payment.provider} />
                                            <Field label="Gateway Status" value={data.payment.status} />
                                            <Field
                                                label="Processing Fees"
                                                value={data.payment.fees
                                                    ? formatMoney(Number(data.payment.fees), data.currency)
                                                    : "None"
                                                }
                                            />
                                        </>
                                    )}
                                    {!data.payment && (
                                        <Field label="Payment Provider" value="SYSTEM" />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── Additional Details (conditional) ── */}
                        {(data.description || data.comment || data.refund_proof) && (
                            <div className="mb-6">
                                <SectionHeader icon="solar:notes-bold-duotone" title="Notes & Attachments" />
                                <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 space-y-4">
                                    {data.description && (
                                        <Field label="Description" value={data.description} />
                                    )}
                                    {data.comment && (
                                        <Field label="Comment" value={data.comment} />
                                    )}
                                    {data.refund_proof && (
                                        <div className="space-y-1">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Refund Proof</p>
                                            <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl">
                                                <Icon icon="mdi:file-document-outline" width="20" className="text-gray-400 flex-shrink-0" />
                                                <span className="text-sm text-gray-700 truncate flex-1">
                                                    {data.refund_proof.split("/").pop()}
                                                </span>
                                                <a
                                                    href={data.refund_proof}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors flex-shrink-0"
                                                >
                                                    View
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modals */}
            {data && (
                <ApproveRefundModal
                    isOpen={isApproveModalOpen}
                    onClose={() => {
                        setIsApproveModalOpen(false);
                        fetchData();
                    }}
                    transactionId={data.id}
                    amount={data.amount}
                    currency={data.currency}
                />
            )}

            {data && isWithdrawal && (
                <>
                    <ApproveWithdrawalModal
                        isOpen={isWithdrawalApprovalOpen}
                        onClose={() => {
                            setIsWithdrawalApprovalOpen(false);
                            fetchData();
                        }}
                        transactionId={data.id}
                        userId={data.user_id}
                        email={data.user?.email || ""}
                        amount={data.amount}
                        currency={data.currency}
                        walletId={data.wallet_id}
                    />
                    <RejectWithdrawalModal
                        isOpen={isWithdrawalRejectionOpen}
                        onClose={() => {
                            setIsWithdrawalRejectionOpen(false);
                            fetchData();
                        }}
                        transactionId={data.id}
                        email={data.user?.email || ""}
                        amount={data.amount}
                        currency={data.currency}
                        walletId={data.wallet_id}
                    />
                    <ReverseWithdrawalModal
                        isOpen={isWithdrawalReverseOpen}
                        onClose={() => {
                            setIsWithdrawalReverseOpen(false);
                            fetchData();
                        }}
                        transactionId={data.id}
                        email={data.user?.email || ""}
                        amount={data.amount}
                        currency={data.currency}
                        walletId={data.wallet_id}
                        status={data.status}
                    />
                </>
            )}
        </>
    );
};

export default TransactionDetailView;

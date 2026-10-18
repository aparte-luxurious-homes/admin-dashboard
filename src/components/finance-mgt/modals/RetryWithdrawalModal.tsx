"use client";

import { useState } from "react";
import Modal from "../../modal/Modal";
import { RetryWithdrawal } from "@/src/lib/request-handlers/financeMgt";
import { toast } from "react-hot-toast";

/**
 * Whether a withdrawal can be re-sent: it failed, was refunded by a reversal, and
 * was not a deliberate admin rejection or already retried. This only decides
 * whether to SHOW the button — the backend enforces every rule independently
 * (including "retry the original, not a retry", which needs data the row lacks).
 */
export function isRetryableWithdrawal(tx?: {
    transaction_type?: string;
    status?: string;
    description?: string | null;
    comment?: string | null;
} | null): boolean {
    if (!tx || tx.transaction_type !== "WITHDRAWAL" || tx.status !== "FAILED") return false;
    const description = tx.description || "";
    if (!description.includes("Reversed:")) return false;
    if (description.includes("Reversed: rejected by admin")) return false;
    return true;
}

interface RetryWithdrawalModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactionId: string;
    amount: string | number;
    currency: string;
    walletId: string;
    email: string;
}

export function RetryWithdrawalModal({
    isOpen,
    onClose,
    transactionId,
    amount,
    currency,
    walletId,
    email,
}: RetryWithdrawalModalProps) {
    const retryWithdrawal = RetryWithdrawal();
    const [note, setNote] = useState("");

    const handleClose = () => {
        setNote("");
        onClose();
    };

    const handleRetry = () => {
        retryWithdrawal.mutate(
            {
                walletId,
                payload: {
                    transaction_id: transactionId,
                    ...(note.trim() ? { note: note.trim() } : {}),
                },
            },
            {
                onSuccess: (res: any) => {
                    if (res?.data?.requires_otp) {
                        toast.success(
                            "Payout re-sent. Authorize the new withdrawal with the Monnify OTP to release it."
                        );
                    } else {
                        toast.success("Payout re-sent — awaiting settlement.");
                    }
                    handleClose();
                },
                onError: (err: any) => {
                    toast.error(
                        err?.response?.data?.detail?.message ||
                        err?.response?.data?.message ||
                        (typeof err?.response?.data?.detail === "string" ? err.response.data.detail : null) ||
                        "Failed to retry withdrawal"
                    );
                },
            }
        );
    };

    const content = (
        <div className="text-left space-y-6">
            <div className="p-4 bg-sky-50 rounded-lg border border-sky-100">
                <p className="text-sm text-gray-600">
                    You are re-sending a withdrawal of{" "}
                    <span className="font-bold text-gray-900">
                        {currency} {Number(amount).toLocaleString()}
                    </span>{" "}
                    for <span className="font-medium text-gray-900">{email}</span> to the same bank
                    account.
                </p>
                <p className="text-xs text-gray-500 mt-2">
                    Use this when the payout failed on <span className="font-semibold">our</span> side
                    (e.g. an expired provider API key or an outage) and the money was refunded. The
                    user&apos;s wallet is debited again (amount + current transfer fee) and a new
                    payout is sent immediately. Fix the underlying fault first — if the retry fails
                    again it is refunded automatically and the user is not emailed.
                </p>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Note (optional)</label>
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={500}
                    placeholder="e.g. Monnify key rotated — re-sending."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-200 focus:border-sky-400 outline-none resize-none"
                    rows={2}
                />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                    onClick={handleClose}
                    disabled={retryWithdrawal.isPending}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleRetry}
                    disabled={retryWithdrawal.isPending}
                    className="px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {retryWithdrawal.isPending ? "Sending..." : "Retry Payout"}
                </button>
            </div>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Retry Withdrawal" content={content} />
    );
}

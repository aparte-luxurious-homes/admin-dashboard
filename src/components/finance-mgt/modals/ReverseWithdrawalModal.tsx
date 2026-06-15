"use client";

import { useState } from "react";
import Modal from "../../modal/Modal";
import { ReverseWithdrawal } from "@/src/lib/request-handlers/financeMgt";
import { toast } from "react-hot-toast";

interface ReverseWithdrawalModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactionId: string;
    amount: string | number;
    currency: string;
    walletId: string;
    email: string;
    /** Current status of the withdrawal — shown for context. */
    status?: string;
}

export function ReverseWithdrawalModal({
    isOpen,
    onClose,
    transactionId,
    amount,
    currency,
    walletId,
    email,
    status,
}: ReverseWithdrawalModalProps) {
    const reverseWithdrawal = ReverseWithdrawal();
    const [reason, setReason] = useState("");
    const [skipProviderCheck, setSkipProviderCheck] = useState(false);

    const reasonValid = reason.trim().length >= 3;

    const reset = () => {
        setReason("");
        setSkipProviderCheck(false);
    };

    const handleReverse = () => {
        if (!reasonValid) {
            toast.error("Please enter a reason (at least 3 characters).");
            return;
        }

        const payload = {
            transaction_id: transactionId,
            reason: reason.trim(),
            skip_provider_check: skipProviderCheck,
        };

        reverseWithdrawal.mutate(
            {
                walletId,
                payload,
            },
            {
                onSuccess: () => {
                    toast.success("Withdrawal reversed and funds returned to wallet");
                    reset();
                    onClose();
                },
                onError: (err: any) => {
                    toast.error(
                        err?.response?.data?.message ||
                        err?.response?.data?.detail?.message ||
                        err?.response?.data?.detail ||
                        "Failed to reverse withdrawal"
                    );
                },
            }
        );
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const content = (
        <div className="text-left space-y-6">
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-sm text-gray-600">
                    You are reversing a withdrawal of{" "}
                    <span className="font-bold text-gray-900">
                        {currency} {Number(amount).toLocaleString()}
                    </span>{" "}
                    for user <span className="font-medium text-gray-900">{email}</span>
                    {status ? (
                        <>
                            {" "}
                            (currently <span className="font-medium text-gray-900">{status}</span>)
                        </>
                    ) : null}
                    .
                </p>
                <p className="text-xs text-gray-500 mt-2">
                    Use this only when the payout did <span className="font-semibold">not</span>{" "}
                    reach the recipient (provider failed it, or the OTP authorization expired).
                    The amount and any transfer fee are refunded to the user&apos;s wallet.
                </p>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                    Reason for reversal <span className="text-red-500">*</span>
                </label>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Provider failed the transfer / OTP window expired — ops confirmed payout did not settle."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none resize-none"
                    rows={3}
                />
                {!reasonValid && reason.length > 0 && (
                    <p className="text-xs text-red-500">Reason must be at least 3 characters.</p>
                )}
            </div>

            <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 cursor-pointer">
                <input
                    type="checkbox"
                    checked={skipProviderCheck}
                    onChange={(e) => setSkipProviderCheck(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-400"
                />
                <span className="text-xs text-gray-600">
                    <span className="font-semibold text-gray-800">
                        Skip provider verification
                    </span>{" "}
                    — bypass the automatic check with the provider. Only tick this if you have
                    already confirmed with the provider that the payout will{" "}
                    <span className="font-semibold">not</span> settle. Otherwise, leave it off and
                    the system will refuse to refund a payout that actually succeeded.
                </span>
            </label>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                    onClick={handleClose}
                    disabled={reverseWithdrawal.isPending}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleReverse}
                    disabled={reverseWithdrawal.isPending || !reasonValid}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {reverseWithdrawal.isPending ? "Processing..." : "Reverse & Refund"}
                </button>
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Reverse Withdrawal"
            content={content}
        />
    );
}

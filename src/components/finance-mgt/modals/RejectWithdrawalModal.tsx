"use client";

import { useState } from "react";
import Modal from "../../modal/Modal";
import { RejectWithdrawal } from "@/src/lib/request-handlers/financeMgt";
import { toast } from "react-hot-toast";

interface RejectWithdrawalModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactionId: string;
    amount: string | number;
    currency: string;
    walletId: string;
    email: string;
}

export function RejectWithdrawalModal({
    isOpen,
    onClose,
    transactionId,
    amount,
    currency,
    walletId,
    email,
}: RejectWithdrawalModalProps) {
    const rejectWithdrawal = RejectWithdrawal();
    const [reason, setReason] = useState("");

    const handleReject = () => {
        const payload = {
            transaction_id: transactionId,
            reason: reason || undefined,
        };

        rejectWithdrawal.mutate(
            {
                walletId,
                payload,
            },
            {
                onSuccess: () => {
                    toast.success("Withdrawal rejected and funds returned to wallet");
                    setReason("");
                    onClose();
                },
                onError: (err: any) => {
                    toast.error(err?.response?.data?.message || err?.response?.data?.detail || "Failed to reject withdrawal");
                },
            }
        );
    };

    const content = (
        <div className="text-left space-y-6">
            <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                <p className="text-sm text-gray-600">
                    You are rejecting a withdrawal of <span className="font-bold text-gray-900">{currency} {Number(amount).toLocaleString()}</span> for user <span className="font-medium text-gray-900">{email}</span>.
                </p>
                <p className="text-xs text-gray-500 mt-2">
                    The amount will be refunded back to the user&apos;s wallet balance.
                </p>
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                    Reason for rejection <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Unverified payout account, suspicious activity..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none resize-none"
                    rows={3}
                />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                    onClick={onClose}
                    disabled={rejectWithdrawal.isPending}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleReject}
                    disabled={rejectWithdrawal.isPending}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {rejectWithdrawal.isPending ? "Processing..." : "Reject & Refund"}
                </button>
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Reject Withdrawal"
            content={content}
        />
    );
}

"use client";

import { useState } from "react";
import Modal from "../../modal/Modal";
import { ApproveWithdrawal } from "@/src/lib/request-handlers/financeMgt";
import { toast } from "react-hot-toast";

interface ApproveWithdrawalModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactionId: string;
    userId: string;
    email: string;
    amount: string | number;
    currency: string;
    walletId: string;
}

export function ApproveWithdrawalModal({
    isOpen,
    onClose,
    transactionId,
    userId,
    email,
    amount,
    currency,
    walletId
}: ApproveWithdrawalModalProps) {
    const approveWithdrawal = ApproveWithdrawal();

    const handleApprove = () => {
        const payload = {
            user_id: userId,
            transaction_id: transactionId,
            email: email
        };

        approveWithdrawal.mutate(
            {
                walletId,
                payload
            },
            {
                onSuccess: () => {
                    toast.success("Withdrawal approved and payout initiated");
                    onClose();
                },
                onError: (err: any) => {
                    toast.error(err?.response?.data?.message || "Failed to approve withdrawal");
                }
            }
        );
    };

    const content = (
        <div className="text-left space-y-6">
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                <p className="text-sm text-gray-600">
                    You are approving a withdrawal of <span className="font-bold text-gray-900">{currency} {Number(amount).toLocaleString()}</span> for user <span className="font-medium text-gray-900">{email}</span>.
                </p>
                <p className="text-xs text-gray-500 mt-2">
                    This action will trigger an automated payout to the user's verified bank account via the default payment gateway.
                </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                    onClick={onClose}
                    disabled={approveWithdrawal.isPending}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleApprove}
                    disabled={approveWithdrawal.isPending}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {approveWithdrawal.isPending ? "Processing..." : "Confirm & Payout"}
                </button>
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Approve Withdrawal"
            content={content}
        />
    );
}

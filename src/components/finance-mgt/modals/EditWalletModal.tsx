"use client";

import { useState, useEffect } from "react";
import Modal from "../../modal/Modal";
import { UpdateWallet } from "@/src/lib/request-handlers/financeMgt";
import { toast } from "react-hot-toast";

interface EditWalletModalProps {
    isOpen: boolean;
    onClose: () => void;
    walletId: string;
    currentBalance: string | number;
    currentPendingCash?: string | number;
    currency?: string;
    userName?: string;
    onSuccess?: () => void;
}

export function EditWalletModal({
    isOpen,
    onClose,
    walletId,
    currentBalance,
    currency = "NGN",
    userName,
    onSuccess,
}: EditWalletModalProps) {
    const { mutate: updateWallet, isPending } = UpdateWallet();
    const [action, setAction] = useState<"CREDIT" | "DEBIT">("CREDIT");
    const [amount, setAmount] = useState("");
    const [reason, setReason] = useState("");
    const [comment, setComment] = useState("");

    useEffect(() => {
        if (isOpen) {
            setAction("CREDIT");
            setAmount("");
            setReason("");
            setComment("");
        }
    }, [isOpen]);

    const handleSave = () => {
        if (!amount || parseFloat(amount) <= 0) {
            toast.error("Enter a valid amount");
            return;
        }
        if (!reason.trim()) {
            toast.error("Reason is required");
            return;
        }

        updateWallet(
            {
                walletId,
                payload: {
                    action,
                    amount,
                    reason: reason.trim(),
                    ...(comment.trim() ? { comment: comment.trim() } : {}),
                },
            },
            {
                onSuccess: () => {
                    toast.success(`Wallet ${action.toLowerCase()}ed successfully`);
                    onSuccess?.();
                    onClose();
                },
                onError: (err: any) => {
                    toast.error(err?.response?.data?.detail || "Failed to adjust wallet");
                },
            }
        );
    };

    const content = (
        <div className="space-y-5">
            {userName && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                    Adjusting wallet for <span className="font-medium">{userName}</span>.
                    A transaction record will be created for audit.
                </div>
            )}

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                Current balance: <span className="font-semibold">{currency} {Number(currentBalance).toLocaleString()}</span>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                <select
                    value={action}
                    onChange={(e) => setAction(e.target.value as "CREDIT" | "DEBIT")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                >
                    <option value="CREDIT">Credit (Add funds)</option>
                    <option value="DEBIT">Debit (Remove funds)</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount ({currency})
                </label>
                <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    placeholder="e.g. 5000.00"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                    placeholder="Why is this adjustment being made?"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Note (optional)
                </label>
                <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    placeholder="Internal note"
                />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                    onClick={onClose}
                    disabled={isPending}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={isPending || !amount || !reason.trim()}
                    className={`px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                        action === "DEBIT"
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-primary hover:bg-primary/90"
                    }`}
                >
                    {isPending ? "Processing..." : `${action === "CREDIT" ? "Credit" : "Debit"} Wallet`}
                </button>
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Adjust Wallet"
            content={content}
        />
    );
}

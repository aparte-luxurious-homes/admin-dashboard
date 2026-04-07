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
    currentPendingCash,
    currency = "NGN",
    userName,
    onSuccess,
}: EditWalletModalProps) {
    const { mutate: updateWallet, isPending } = UpdateWallet();
    const [balance, setBalance] = useState(String(currentBalance ?? ""));
    const [pendingCash, setPendingCash] = useState(String(currentPendingCash ?? ""));

    useEffect(() => {
        if (isOpen) {
            setBalance(String(currentBalance ?? ""));
            setPendingCash(String(currentPendingCash ?? ""));
        }
    }, [isOpen, currentBalance, currentPendingCash]);

    const handleSave = () => {
        const payload: Record<string, string> = {};
        if (balance !== String(currentBalance)) payload.balance = balance;
        if (pendingCash !== String(currentPendingCash)) payload.pending_cash = pendingCash;

        if (Object.keys(payload).length === 0) {
            toast.error("No changes to save");
            return;
        }

        updateWallet(
            { walletId, payload },
            {
                onSuccess: () => {
                    toast.success("Wallet updated successfully");
                    onSuccess?.();
                    onClose();
                },
                onError: (err: any) => {
                    toast.error(err?.response?.data?.detail || "Failed to update wallet");
                },
            }
        );
    };

    const content = (
        <div className="space-y-5">
            {userName && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                    <strong>Admin override</strong> — directly modifying wallet for{" "}
                    <span className="font-medium">{userName}</span>. This action is audit-logged.
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Balance ({currency})
                </label>
                <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    placeholder="e.g. 50000.00"
                />
                <p className="text-xs text-gray-500 mt-1">Current: {currency} {Number(currentBalance).toLocaleString()}</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pending Cash ({currency})
                </label>
                <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={pendingCash}
                    onChange={(e) => setPendingCash(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                    placeholder="e.g. 0.00"
                />
                <p className="text-xs text-gray-500 mt-1">Current: {currency} {Number(currentPendingCash ?? 0).toLocaleString()}</p>
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
                    disabled={isPending}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                    {isPending ? "Saving..." : "Save Changes"}
                </button>
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Wallet Balance"
            content={content}
        />
    );
}

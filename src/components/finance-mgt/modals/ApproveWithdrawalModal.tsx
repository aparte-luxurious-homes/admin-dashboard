"use client";

import { useState } from "react";
import Modal from "../../modal/Modal";
import { ApproveWithdrawal, VerifyPayoutAccount } from "@/src/lib/request-handlers/financeMgt";
import { toast } from "react-hot-toast";

interface ProviderMismatchInfo {
    message: string;
    payout_account_id: string;
    wallet_id: string;
    verified_by: string | null;
    disbursement_provider: string;
}

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
    const verifyPayout = VerifyPayoutAccount();
    const [mismatch, setMismatch] = useState<ProviderMismatchInfo | null>(null);
    const [step, setStep] = useState<"confirm" | "mismatch" | "reverifying">("confirm");

    const handleClose = () => {
        setMismatch(null);
        setStep("confirm");
        onClose();
    };

    const handleApprove = () => {
        const payload = {
            user_id: userId,
            transaction_id: transactionId,
            email: email
        };

        approveWithdrawal.mutate(
            { walletId, payload },
            {
                onSuccess: () => {
                    toast.success("Withdrawal approved and payout initiated");
                    handleClose();
                },
                onError: (err: any) => {
                    const detail = err?.response?.data?.detail;
                    if (detail?.error_code === "PROVIDER_MISMATCH") {
                        setMismatch(detail as ProviderMismatchInfo);
                        setStep("mismatch");
                    } else {
                        toast.error(
                            detail?.message || detail || err?.response?.data?.message || "Failed to approve withdrawal"
                        );
                    }
                }
            }
        );
    };

    const handleReverifyAndRetry = () => {
        if (!mismatch) return;
        setStep("reverifying");

        verifyPayout.mutate(
            {
                walletId: mismatch.wallet_id || walletId,
                accountId: mismatch.payout_account_id,
            },
            {
                onSuccess: () => {
                    toast.success("Payout account re-verified successfully. Retrying approval...");
                    // Auto-retry the approval
                    handleApprove();
                },
                onError: (err: any) => {
                    const detail = err?.response?.data?.detail;
                    toast.error(
                        typeof detail === "string" ? detail : detail?.message || err?.response?.data?.message || "Re-verification failed"
                    );
                    setStep("mismatch");
                }
            }
        );
    };

    const isProcessing = approveWithdrawal.isPending || verifyPayout.isPending;

    const confirmContent = (
        <div className="text-left space-y-6">
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                <p className="text-sm text-gray-600">
                    You are approving a withdrawal of <span className="font-bold text-gray-900">{currency} {Number(amount).toLocaleString()}</span> for user <span className="font-medium text-gray-900">{email}</span>.
                </p>
                <p className="text-xs text-gray-500 mt-2">
                    This action will trigger an automated payout to the user&apos;s verified bank account via the configured disbursement gateway.
                </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                    onClick={handleClose}
                    disabled={isProcessing}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleApprove}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {approveWithdrawal.isPending ? "Processing..." : "Confirm & Payout"}
                </button>
            </div>
        </div>
    );

    const mismatchContent = mismatch && (
        <div className="text-left space-y-5">
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-start gap-3">
                    <span className="text-amber-500 text-xl mt-0.5">&#9888;</span>
                    <div>
                        <p className="text-sm font-semibold text-amber-800">Bank Account Verification Mismatch</p>
                        <p className="text-sm text-amber-700 mt-1">
                            This user&apos;s payout account was verified with <span className="font-semibold">{mismatch.verified_by || "an unknown provider"}</span>,
                            but the current disbursement provider is <span className="font-semibold">{mismatch.disbursement_provider}</span>.
                        </p>
                        <p className="text-sm text-amber-700 mt-2">
                            Bank codes differ between providers, so the account must be re-verified with <span className="font-semibold">{mismatch.disbursement_provider}</span> before the payout can proceed.
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">What happens next</p>
                <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                    <li>The payout account will be re-verified with <span className="font-medium">{mismatch.disbursement_provider}</span></li>
                    <li>If verification succeeds, the withdrawal approval will be retried automatically</li>
                    <li>If verification fails, no payout will be made and you can investigate further</li>
                </ol>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                    onClick={handleClose}
                    disabled={isProcessing}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleReverifyAndRetry}
                    disabled={isProcessing}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {step === "reverifying" ? "Re-verifying..." : `Re-verify with ${mismatch.disbursement_provider} & Retry`}
                </button>
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={step === "confirm" ? "Approve Withdrawal" : "Payout Account Mismatch"}
            content={step === "confirm" ? confirmContent : mismatchContent}
        />
    );
}

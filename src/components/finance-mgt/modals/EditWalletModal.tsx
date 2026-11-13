"use client";

import { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import Modal from "../../modal/Modal";
import { UpdateWallet, UploadAdjustmentReceipt } from "@/src/lib/request-handlers/financeMgt";
import { getApiErrorMessage } from "@/src/lib/apiError";
import { useAuth } from "@/src/hooks/useAuth";
import { UserRole } from "@/src/lib/enums";

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

// Mirrors the API (services/finances/adjustments.py): ADMIN and SUPER_ADMIN
// apply at once, everyone else files a request an admin must approve. Only
// the wording depends on this; the response's `applied` flag is the truth.
const APPROVER_ROLES = [UserRole.ADMIN, UserRole.SUPER_ADMIN];
const MIN_REASON = 5;
const RECEIPT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const RECEIPT_MAX_BYTES = 10 * 1024 * 1024;

const fmt = (n: number, currency: string) =>
    `${currency} ${n.toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;

export function EditWalletModal({
    isOpen,
    onClose,
    walletId,
    currentBalance,
    currency = "NGN",
    userName,
    onSuccess,
}: EditWalletModalProps) {
    const { user } = useAuth();
    const isApprover = APPROVER_ROLES.includes(user?.role as UserRole);
    const { mutate: updateWallet, isPending } = UpdateWallet();
    const { mutateAsync: uploadReceipt, isPending: isUploading } = UploadAdjustmentReceipt();
    const fileInput = useRef<HTMLInputElement>(null);

    const [action, setAction] = useState<"CREDIT" | "DEBIT">("CREDIT");
    const [amount, setAmount] = useState("");
    const [reason, setReason] = useState("");
    const [reference, setReference] = useState("");
    const [receipt, setReceipt] = useState<{ name: string; url: string } | null>(null);
    const [comment, setComment] = useState("");
    const [touched, setTouched] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setAction("CREDIT");
            setAmount("");
            setReason("");
            setReference("");
            setReceipt(null);
            setComment("");
            setTouched(false);
        }
    }, [isOpen]);

    const amountOk = Number(amount) > 0;
    const reasonOk = reason.trim().length >= MIN_REASON;
    const hasProof = Boolean(reference.trim() || receipt);
    const canSubmit = amountOk && reasonOk && hasProof && !isUploading;
    const debit = action === "DEBIT";

    const handleFile = async (file: File | undefined) => {
        if (!file) return;
        if (!RECEIPT_TYPES.includes(file.type)) {
            toast.error("Upload a JPG, PNG, WEBP or PDF receipt.");
            return;
        }
        if (file.size > RECEIPT_MAX_BYTES) {
            toast.error("The receipt must be 10 MB or smaller.");
            return;
        }
        try {
            const url = await uploadReceipt(file);
            setReceipt({ name: file.name, url });
        } catch (err) {
            toast.error(getApiErrorMessage(err, "Could not upload the receipt"));
        } finally {
            if (fileInput.current) fileInput.current.value = "";
        }
    };

    const handleSave = () => {
        setTouched(true);
        if (!canSubmit) return;

        updateWallet(
            {
                walletId,
                payload: {
                    action,
                    amount,
                    reason: reason.trim(),
                    ...(reference.trim() ? { reference_number: reference.trim() } : {}),
                    ...(receipt ? { receipt_url: receipt.url } : {}),
                    ...(comment.trim() ? { comment: comment.trim() } : {}),
                },
            },
            {
                onSuccess: (data) => {
                    if (data?.applied) {
                        toast.success(
                            `${fmt(Number(amount), currency)} ${debit ? "debited" : "credited"}. Transaction recorded.`,
                        );
                    } else {
                        toast.success("Sent for approval. Nothing changes until an admin approves it.");
                    }
                    onSuccess?.();
                    onClose();
                },
                onError: (err) => {
                    toast.error(getApiErrorMessage(err, "Failed to adjust wallet"));
                },
            },
        );
    };

    const inputCls = (bad: boolean) =>
        `w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
            bad ? "border-red-400" : "border-gray-300"
        }`;

    const content = (
        <div className="space-y-4 text-left">
            <div className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                <span className="truncate">{userName ? `Wallet of ${userName}` : "Wallet"}</span>
                <span className="shrink-0">
                    Balance <span className="font-semibold tabular-nums">{fmt(Number(currentBalance), currency)}</span>
                </span>
            </div>

            {isApprover ? (
                <div className="flex gap-2 p-3 bg-sky-50 border border-sky-200 rounded-lg text-sm text-sky-900">
                    <Icon icon="solar:shield-check-linear" className="w-5 h-5 shrink-0" />
                    <span>You are an admin, so this applies straight away. A transaction and an audit record are created.</span>
                </div>
            ) : (
                <div className="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
                    <Icon icon="solar:hourglass-linear" className="w-5 h-5 shrink-0" />
                    <span>An admin or super admin must approve this before the balance changes. You will be notified of the decision.</span>
                </div>
            )}

            <div>
                <span className="block text-sm font-medium text-gray-700 mb-1">Action</span>
                <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-lg" role="group" aria-label="Action">
                    {(["CREDIT", "DEBIT"] as const).map((a) => (
                        <button
                            key={a}
                            type="button"
                            aria-pressed={action === a}
                            onClick={() => setAction(a)}
                            className={`flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors ${
                                action === a
                                    ? a === "CREDIT"
                                        ? "bg-white text-primary shadow-sm"
                                        : "bg-white text-red-600 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            <Icon icon={a === "CREDIT" ? "mdi:plus" : "mdi:minus"} className="w-4 h-4" />
                            {a === "CREDIT" ? "Credit" : "Debit"}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label htmlFor="adj-amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Amount ({currency}) <span className="text-red-500">*</span>
                </label>
                <input
                    id="adj-amount"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
                    className={`${inputCls(touched && !amountOk)} tabular-nums`}
                    placeholder="e.g. 45000"
                />
            </div>

            <div>
                <label htmlFor="adj-reason" className="block text-sm font-medium text-gray-700 mb-1">
                    Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                    id="adj-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={2}
                    className={`${inputCls(touched && !reasonOk)} resize-none`}
                    placeholder="What is this adjustment for? It is shown on the wallet holder's statement."
                />
                {touched && !reasonOk && (
                    <p className="mt-1 text-xs text-red-600">Give a reason of at least {MIN_REASON} characters.</p>
                )}
            </div>

            <div>
                <span className="block text-sm font-medium text-gray-700 mb-1">
                    Proof <span className="text-red-500">*</span>{" "}
                    <span className="text-xs font-normal text-gray-400">one of the two</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-2 sm:items-end">
                    <div>
                        <label htmlFor="adj-ref" className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                            <Icon icon="mdi:pound" className="w-3.5 h-3.5" /> Reference number
                        </label>
                        <input
                            id="adj-ref"
                            value={reference}
                            maxLength={120}
                            onChange={(e) => setReference(e.target.value)}
                            className={inputCls(false)}
                            placeholder="Transfer or POS reference"
                        />
                    </div>
                    <div className="text-center text-xs text-gray-400 sm:pb-2.5">or</div>
                    <div>
                        <span className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                            <Icon icon="solar:bill-list-linear" className="w-3.5 h-3.5" /> Receipt
                        </span>
                        <button
                            type="button"
                            onClick={() => fileInput.current?.click()}
                            disabled={isUploading}
                            className="w-full flex items-center gap-2 px-3 py-1.5 border border-dashed border-gray-300 rounded-lg text-left hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-60"
                        >
                            <span className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center shrink-0 text-gray-500">
                                <Icon
                                    icon={isUploading ? "mdi:loading" : receipt ? "mdi:check" : "mdi:tray-arrow-up"}
                                    className={`w-4 h-4 ${isUploading ? "animate-spin" : ""} ${receipt ? "text-primary" : ""}`}
                                />
                            </span>
                            <span className="min-w-0">
                                <span className="block text-sm text-gray-700 truncate">
                                    {isUploading ? "Uploading..." : receipt ? receipt.name : "Upload a receipt"}
                                </span>
                                <span className="block text-[11px] text-gray-400">
                                    {receipt ? "Click to replace" : "JPG, PNG or PDF, up to 10 MB"}
                                </span>
                            </span>
                        </button>
                        <input
                            ref={fileInput}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            hidden
                            onChange={(e) => handleFile(e.target.files?.[0])}
                        />
                    </div>
                </div>
                <p
                    className={`mt-1.5 flex items-center gap-1 text-xs ${
                        hasProof ? "text-primary" : touched ? "text-red-600" : "text-gray-400"
                    }`}
                >
                    {hasProof && <Icon icon="mdi:check" className="w-3.5 h-3.5" />}
                    {hasProof ? "Proof attached" : "Add the reference number or upload the receipt."}
                </p>
            </div>

            <div>
                <label htmlFor="adj-note" className="block text-sm font-medium text-gray-700 mb-1">
                    Internal note <span className="text-xs font-normal text-gray-400">optional</span>
                </label>
                <input
                    id="adj-note"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className={inputCls(false)}
                    placeholder="Only staff see this"
                />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isPending}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={isPending || isUploading}
                    aria-disabled={!canSubmit}
                    className={`px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                        canSubmit ? "" : "opacity-60"
                    } ${debit && isApprover ? "bg-red-600 hover:bg-red-700" : "bg-primary hover:bg-primary/90"}`}
                >
                    {isPending
                        ? "Processing..."
                        : isApprover
                            ? debit ? "Debit wallet" : "Credit wallet"
                            : "Submit for approval"}
                </button>
            </div>
        </div>
    );

    return <Modal isOpen={isOpen} onClose={onClose} title="Adjust wallet" content={content} />;
}

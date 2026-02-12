"use client";

import { useState } from "react";
import Modal from "../../modal/Modal";
import { ApproveRefund, ApproveRefundPayload } from "@/src/lib/request-handlers/financeMgt";
import { toast } from "react-hot-toast";
import axiosRequest from "@/src/lib/api";

interface ApproveRefundModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactionId: string;
    amount: string | number;
    currency: string;
}

export function ApproveRefundModal({ isOpen, onClose, transactionId, amount, currency }: ApproveRefundModalProps) {
    const [refundMethod, setRefundMethod] = useState<"WALLET" | "OFFLINE">("WALLET");
    const [notes, setNotes] = useState("");
    const [uploading, setUploading] = useState(false);
    const [refundProof, setRefundProof] = useState<string | null>(null);

    const approveRefund = ApproveRefund();

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await axiosRequest.post("/bookings/upload-payment-proof", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            setRefundProof(response.data.data.url);
            toast.success("Proof uploaded successfully");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to upload proof");
        } finally {
            setUploading(false);
        }
    };

    const handleApprove = () => {
        const payload: ApproveRefundPayload = {
            refund_method: refundMethod,
            notes,
            // @ts-ignore
            refund_proof: refundProof || undefined
        };
        approveRefund.mutate(
            {
                transactionId,
                payload
            },
            {
                onSuccess: () => {
                    toast.success("Refund approved successfully");
                    onClose();
                },
                onError: (err: any) => {
                    toast.error(err?.response?.data?.message || "Failed to approve refund");
                }
            }
        );
    };

    const content = (
        <div className="text-left space-y-6">
            <div className="text-sm text-gray-500">
                You are approving a refund of <span className="font-semibold text-gray-900">{currency} {amount}</span>.
            </div>

            <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 block">Refund Method</label>
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <input
                            type="radio"
                            id="wallet"
                            name="refundMethod"
                            value="WALLET"
                            checked={refundMethod === "WALLET"}
                            onChange={() => setRefundMethod("WALLET")}
                            className="h-4 w-4 border-gray-300 text-primary focus:ring-primary cursor-pointer"
                        />
                        <label htmlFor="wallet" className="text-sm font-normal text-gray-700 cursor-pointer">Credit User Wallet</label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <input
                            type="radio"
                            id="offline"
                            name="refundMethod"
                            value="OFFLINE"
                            checked={refundMethod === "OFFLINE"}
                            onChange={() => setRefundMethod("OFFLINE")}
                            className="h-4 w-4 border-gray-300 text-primary focus:ring-primary cursor-pointer"
                        />
                        <label htmlFor="offline" className="text-sm font-normal text-gray-700 cursor-pointer">Mark as Refunded Offline</label>
                    </div>
                </div>
            </div>

            <div className="space-y-1.5">
                <label htmlFor="notes" className="text-sm font-medium text-gray-700 block">Notes (Optional)</label>
                <textarea
                    id="notes"
                    placeholder="Add reason or offline refund details..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="flex w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
            </div>

            {refundMethod === "OFFLINE" && (
                <div className="space-y-1.5 border-t border-gray-100 pt-4">
                    <label htmlFor="proof" className="text-sm font-medium text-gray-700 block">
                        Upload Refund Proof (Image or PDF)
                    </label>
                    <input
                        type="file"
                        id="proof"
                        accept="image/*,application/pdf"
                        onChange={handleFileUpload}
                        className="flex w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                    />
                    {uploading && <p className="text-xs text-primary animate-pulse">Uploading proof...</p>}
                    {refundProof && (
                        <p className="text-xs text-green-600">
                            ✓ Proof uploaded: <a href={refundProof} target="_blank" rel="noopener noreferrer" className="underline font-medium">View File</a>
                        </p>
                    )}
                </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                    onClick={onClose}
                    disabled={approveRefund.isPending || uploading}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleApprove}
                    disabled={approveRefund.isPending || uploading || (refundMethod === "OFFLINE" && !refundProof)}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                    {approveRefund.isPending ? "Approving..." : "Approve Refund"}
                </button>
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Approve Refund"
            content={content}
        />
    );
}

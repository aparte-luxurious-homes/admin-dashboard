"use client";

import { useEffect, useState, FormEvent } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import CustomModal from "@/src/components/ui/CustomModal";
import { UploadKycOnBehalf } from "@/src/lib/request-handlers/userMgt";
import { KycDocumentType } from "@/src/lib/request-handlers/kycMgt";

interface KycUploadOnBehalfModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    userLabel?: string; // shown in the heading (e.g. "Jane Doe")
    onUploaded?: () => void;
}

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_BYTES = 10 * 1024 * 1024; // matches backend KYC_MAX_SIZE

const friendlyType = (t: string) => t.replace(/_/g, " ").toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());

const KycUploadOnBehalfModal = ({
    isOpen,
    onClose,
    userId,
    userLabel,
    onUploaded,
}: KycUploadOnBehalfModalProps) => {
    const [documentType, setDocumentType] = useState<string>(KycDocumentType.INTERNATIONAL_PASSPORT);
    const [file, setFile] = useState<File | null>(null);
    const [notes, setNotes] = useState("");

    const uploadMutation = UploadKycOnBehalf();

    // Reset whenever the modal re-opens so a stale selection from a prior open
    // doesn't bleed into a new upload.
    useEffect(() => {
        if (isOpen) {
            setDocumentType(KycDocumentType.INTERNATIONAL_PASSPORT);
            setFile(null);
            setNotes("");
        }
    }, [isOpen]);

    const fileError = (() => {
        if (!file) return "";
        if (!ALLOWED_MIME.includes(file.type)) return `Unsupported type "${file.type}". Allowed: JPG, PNG, WEBP, PDF.`;
        if (file.size > MAX_BYTES) return `File is ${(file.size / (1024 * 1024)).toFixed(1)}MB. Max 10MB.`;
        return "";
    })();

    const canSubmit = !!file && !fileError && !uploadMutation.isPending;

    const handleClose = () => {
        if (uploadMutation.isPending) return;
        onClose();
    };

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!canSubmit || !file) return;
        try {
            await uploadMutation.mutateAsync({
                userId,
                documentType,
                file,
                notes: notes.trim() || undefined,
            });
            toast.success(`Document uploaded for ${userLabel || "user"}`);
            onUploaded?.();
            onClose();
        } catch (err: any) {
            const detail = err?.response?.data?.detail;
            const msg =
                (typeof detail === "string" && detail) ||
                detail?.msg ||
                err?.response?.data?.message ||
                err?.message ||
                "Failed to upload document";
            toast.error(typeof msg === "string" ? msg : "Failed to upload document");
        }
    };

    return (
        <CustomModal
            isOpen={isOpen}
            onClose={handleClose}
            title={userLabel ? `Upload KYC for ${userLabel}` : "Upload KYC on behalf"}
        >
            <form onSubmit={onSubmit} className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <Icon icon="mdi:information" className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                    <div className="text-sm text-blue-900">
                        Use this for users who submitted documents offline. The file will be
                        attached to their KYC record as <span className="font-semibold">PENDING</span> —
                        review and verify on the same panel after upload.
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                        Document type
                    </label>
                    <select
                        value={documentType}
                        onChange={(e) => setDocumentType(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white"
                    >
                        {Object.values(KycDocumentType).map((t) => (
                            <option key={t} value={t}>{friendlyType(t)}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                        File <span className="text-gray-400">(JPG, PNG, WEBP, PDF — max 10MB)</span>
                    </label>
                    <input
                        type="file"
                        accept={ALLOWED_MIME.join(",")}
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-primary/10 file:text-primary file:font-medium hover:file:bg-primary/20"
                    />
                    {file && !fileError && (
                        <p className="mt-1 text-xs text-gray-500">
                            {file.name} · {(file.size / (1024 * 1024)).toFixed(2)}MB
                        </p>
                    )}
                    {fileError && (
                        <p className="mt-1 text-xs text-red-600">{fileError}</p>
                    )}
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                        Internal notes <span className="text-gray-400">(optional, audit-only)</span>
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        placeholder="e.g. Collected in person 2026-05-02 — original passport seen, scan attached."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none"
                    />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={uploadMutation.isPending}
                        className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm text-gray-700 font-medium disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!canSubmit}
                        className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {uploadMutation.isPending ? (
                            <><Icon icon="mdi:loading" className="animate-spin w-4 h-4" /> Uploading...</>
                        ) : (
                            <><Icon icon="mdi:cloud-upload-outline" className="w-4 h-4" /> Upload</>
                        )}
                    </button>
                </div>
            </form>
        </CustomModal>
    );
};

export default KycUploadOnBehalfModal;

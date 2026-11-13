"use client";

import { MESSAGES } from '@/src/lib/messages';
import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import axiosRequest from "@/src/lib/api";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import { KycStatus } from "@/src/lib/enums";

interface KycStatusEditorProps {
    userId: string | number;
    currentStatus: string;
    onUpdate?: () => void;
}

const STATUS_OPTIONS = [
    { value: KycStatus.PENDING, label: "Pending", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    { value: KycStatus.VERIFIED, label: "Verified", color: "bg-green-100 text-green-700 border-green-200" },
    { value: KycStatus.REJECTED, label: "Rejected", color: "bg-red-100 text-red-700 border-red-200" },
];

const KycStatusEditor: React.FC<KycStatusEditorProps> = ({ userId, currentStatus, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState(currentStatus || KycStatus.PENDING);
    const [rejectionReason, setRejectionReason] = useState("");
    const [saving, setSaving] = useState(false);

    const currentOption = STATUS_OPTIONS.find(o => o.value === currentStatus) || STATUS_OPTIONS[0];

    const handleSave = async () => {
        if (selectedStatus === currentStatus) {
            setIsEditing(false);
            return;
        }

        setSaving(true);
        try {
            await axiosRequest.patch(API_ROUTES.admin.users.updateKyc(userId), {
                status: selectedStatus,
                ...(selectedStatus === KycStatus.REJECTED && rejectionReason
                    ? { rejection_reason: rejectionReason }
                    : {}),
            });
            toast.success(MESSAGES.MSG_KYC_STATUS_UPDATED_SUCCESSFULLY);
            setIsEditing(false);
            setRejectionReason("");
            onUpdate?.();
        } catch (error: any) {
            toast.error(error?.response?.data?.detail || "Failed to update KYC status");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mt-6">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Icon icon="solar:shield-check-bold-duotone" width="20" />
                </div>
                <h4 className="text-lg font-bold text-gray-800">KYC Verification</h4>
            </div>
            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                {isEditing ? (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">KYC Status</label>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium bg-white"
                            >
                                {STATUS_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {selectedStatus === KycStatus.REJECTED && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Rejection Reason</label>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Provide a reason for rejection..."
                                    className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none min-h-[80px]"
                                />
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg flex items-center gap-2 disabled:opacity-50"
                            >
                                {saving ? (
                                    <><Icon icon="mdi:loading" className="animate-spin w-4 h-4" /> Saving...</>
                                ) : (
                                    <><Icon icon="mdi:content-save" className="w-4 h-4" /> Save</>
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setSelectedStatus(currentStatus || KycStatus.PENDING);
                                    setRejectionReason("");
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm text-gray-700 font-medium"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">KYC Status</p>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${currentOption.color}`}>
                                {currentOption.label}
                            </span>
                        </div>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm text-gray-700 font-medium flex items-center gap-2"
                        >
                            <Icon icon="mdi:pencil" className="w-4 h-4" />
                            Edit Status
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KycStatusEditor;

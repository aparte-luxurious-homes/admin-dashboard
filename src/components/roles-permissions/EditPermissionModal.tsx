"use client";

import { useEffect, useState, FormEvent } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import CustomModal from "@/src/components/ui/CustomModal";
import { UpdatePermission } from "@/src/lib/request-handlers/permissionsMgt";
import { Permission } from "@/src/lib/types/permissions";

interface EditPermissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    permission: Permission | null;
}

const EditPermissionModal = ({ isOpen, onClose, permission }: EditPermissionModalProps) => {
    const [description, setDescription] = useState("");
    const updateMutation = UpdatePermission();

    useEffect(() => {
        if (isOpen && permission) {
            setDescription(permission.description ?? "");
        }
    }, [isOpen, permission]);

    const handleClose = () => {
        if (updateMutation.isPending) return;
        onClose();
    };

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!permission || updateMutation.isPending) return;
        const trimmed = description.trim();
        if (trimmed === (permission.description ?? "")) {
            onClose();
            return;
        }
        try {
            await updateMutation.mutateAsync({
                permissionId: permission.id,
                payload: { description: trimmed || null },
            });
            toast.success(`Updated "${permission.name}"`);
            onClose();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to update permission");
        }
    };

    return (
        <CustomModal isOpen={isOpen} onClose={handleClose} title="Edit Permission">
            <form onSubmit={onSubmit} className="space-y-4">
                <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                        Permission
                    </label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-700">
                        {permission?.name ?? ""}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                        Resource and action cannot be changed. Create a new permission if you
                        need a different shape.
                    </p>
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                        Description
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={4}
                        placeholder="Describe what this permission grants"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none"
                        autoFocus
                    />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={updateMutation.isPending}
                        className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm text-gray-700 font-medium disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={updateMutation.isPending}
                        className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg flex items-center gap-2 disabled:opacity-50"
                    >
                        <Icon icon="mdi:content-save" className="w-4 h-4" />
                        <span>
                            {updateMutation.isPending ? "Saving..." : "Save Changes"}
                        </span>
                    </button>
                </div>
            </form>
        </CustomModal>
    );
};

export default EditPermissionModal;

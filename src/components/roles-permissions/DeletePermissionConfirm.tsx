"use client";

import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import CustomModal from "@/src/components/ui/CustomModal";
import { DeletePermission } from "@/src/lib/request-handlers/permissionsMgt";
import { Permission } from "@/src/lib/types/permissions";

interface DeletePermissionConfirmProps {
    isOpen: boolean;
    onClose: () => void;
    permission: Permission | null;
}

const DeletePermissionConfirm = ({
    isOpen,
    onClose,
    permission,
}: DeletePermissionConfirmProps) => {
    const deleteMutation = DeletePermission();

    const handleClose = () => {
        if (deleteMutation.isPending) return;
        onClose();
    };

    const onConfirm = async () => {
        if (!permission || deleteMutation.isPending) return;
        try {
            await deleteMutation.mutateAsync({ permissionId: permission.id });
            toast.success(`Deleted "${permission.name}"`);
            onClose();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to delete permission");
        }
    };

    return (
        <CustomModal isOpen={isOpen} onClose={handleClose} title="Delete Permission">
            <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <Icon
                        icon="mdi:alert-circle"
                        className="w-5 h-5 text-red-600 mt-0.5 shrink-0"
                    />
                    <div className="text-sm text-red-800">
                        <p className="font-medium">This cannot be undone.</p>
                        <p className="mt-1">
                            Deleting <span className="font-mono">{permission?.name}</span> will
                            also remove it from every role that currently has it. Any backend
                            endpoint guarded by this permission will fall back to the role-list
                            check until it is reseeded or recreated.
                        </p>
                    </div>
                </div>

                {permission?.description && (
                    <div className="text-sm text-gray-700">
                        <span className="font-medium">Description:</span>{" "}
                        {permission.description}
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={deleteMutation.isPending}
                        className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm text-gray-700 font-medium disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={deleteMutation.isPending}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 disabled:opacity-50"
                    >
                        <Icon icon="mdi:trash-can-outline" className="w-4 h-4" />
                        <span>
                            {deleteMutation.isPending ? "Deleting..." : "Delete Permission"}
                        </span>
                    </button>
                </div>
            </div>
        </CustomModal>
    );
};

export default DeletePermissionConfirm;

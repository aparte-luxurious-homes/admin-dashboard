"use client";

import { useState, useMemo, FormEvent } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import CustomModal from "@/src/components/ui/CustomModal";
import { CreatePermission } from "@/src/lib/request-handlers/permissionsMgt";

interface CreatePermissionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SLUG_PATTERN = /^[a-z][a-z0-9_]*$/;

const CreatePermissionModal = ({ isOpen, onClose }: CreatePermissionModalProps) => {
    const [resource, setResource] = useState("");
    const [action, setAction] = useState("");
    const [description, setDescription] = useState("");

    const createMutation = CreatePermission();

    const derivedName = useMemo(
        () => (resource && action ? `${resource}.${action}` : ""),
        [resource, action]
    );

    const resourceError =
        resource.length > 0 && !SLUG_PATTERN.test(resource)
            ? "lowercase letters, digits, underscore; must start with a letter"
            : "";
    const actionError =
        action.length > 0 && !SLUG_PATTERN.test(action)
            ? "lowercase letters, digits, underscore; must start with a letter"
            : "";

    const canSubmit =
        SLUG_PATTERN.test(resource) &&
        SLUG_PATTERN.test(action) &&
        !createMutation.isPending;

    const reset = () => {
        setResource("");
        setAction("");
        setDescription("");
    };

    const handleClose = () => {
        if (createMutation.isPending) return;
        reset();
        onClose();
    };

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        try {
            await createMutation.mutateAsync({
                name: derivedName,
                resource,
                action,
                description: description.trim() || null,
            });
            toast.success(`Permission "${derivedName}" created`);
            reset();
            onClose();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to create permission");
        }
    };

    return (
        <CustomModal isOpen={isOpen} onClose={handleClose} title="Create Permission">
            <form onSubmit={onSubmit} className="space-y-4">
                <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                        Resource
                    </label>
                    <input
                        type="text"
                        value={resource}
                        onChange={(e) => setResource(e.target.value.toLowerCase().trim())}
                        placeholder="e.g. properties"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                        autoFocus
                    />
                    {resourceError && (
                        <p className="mt-1 text-xs text-red-600">{resourceError}</p>
                    )}
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                        Action
                    </label>
                    <input
                        type="text"
                        value={action}
                        onChange={(e) => setAction(e.target.value.toLowerCase().trim())}
                        placeholder="e.g. archive"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    />
                    {actionError && (
                        <p className="mt-1 text-xs text-red-600">{actionError}</p>
                    )}
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                        Permission name
                    </label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-700 min-h-[38px] flex items-center">
                        {derivedName || (
                            <span className="text-gray-400">resource.action</span>
                        )}
                    </div>
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                        Description <span className="text-gray-400">(optional)</span>
                    </label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        placeholder="What does this permission grant?"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none"
                    />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={createMutation.isPending}
                        className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm text-gray-700 font-medium disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!canSubmit}
                        className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg flex items-center gap-2 disabled:opacity-50"
                    >
                        <Icon icon="mdi:plus" className="w-4 h-4" />
                        <span>
                            {createMutation.isPending ? "Creating..." : "Create Permission"}
                        </span>
                    </button>
                </div>
            </form>
        </CustomModal>
    );
};

export default CreatePermissionModal;

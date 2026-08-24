"use client"

import { Skeleton } from "@/src/components/ui/skeleton";
import { useState, useMemo, useEffect } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import { UserRole } from "@/src/lib/enums";
import { AssignableRole, Permission } from "@/src/lib/types/permissions";
import {
    GetAllPermissions,
    GetAssignableRoles,
    GetRolePermissions,
    AssignPermissionToRole,
    RemovePermissionFromRole,
    SeedPermissions,
} from "@/src/lib/request-handlers/permissionsMgt";
import { usePermissions } from "@/src/hooks/usePermissions";
import CreatePermissionModal from "./CreatePermissionModal";
import EditPermissionModal from "./EditPermissionModal";
import DeletePermissionConfirm from "./DeletePermissionConfirm";

const RolesPermissionsView = () => {
    const { isSuperAdmin } = usePermissions();

    const [selectedRole, setSelectedRole] = useState<string>(UserRole.ADMIN);
    const [searchValue, setSearchValue] = useState("");
    const [editMode, setEditMode] = useState(false);
    const [pendingChanges, setPendingChanges] = useState<{
        toAdd: string[];
        toRemove: string[];
    }>({ toAdd: [], toRemove: [] });
    const [saving, setSaving] = useState(false);

    const [createOpen, setCreateOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Permission | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Permission | null>(null);

    const allPermsQuery = GetAllPermissions(500);
    const rolesQuery = GetAssignableRoles();
    const roleQuery = GetRolePermissions(selectedRole);

    const assignableRoles: AssignableRole[] = useMemo(
        () => rolesQuery.data ?? [],
        [rolesQuery.data],
    );
    const identityRoles = useMemo(
        () => assignableRoles.filter((r) => r.kind === "identity"),
        [assignableRoles],
    );
    const standingRoles = useMemo(
        () => assignableRoles.filter((r) => r.kind === "standing"),
        [assignableRoles],
    );
    const activeRole = useMemo(
        () => assignableRoles.find((r) => r.key === selectedRole),
        [assignableRoles, selectedRole],
    );
    // A standing key can vanish from the catalogue mid-session — the Agent
    // Network kill switch removes all five. Fall back to the first identity
    // role rather than leaving the picker on a role the API no longer serves,
    // which would show an empty grid against a blank select.
    useEffect(() => {
        if (rolesQuery.isLoading || assignableRoles.length === 0) return;
        if (!assignableRoles.some((r) => r.key === selectedRole)) {
            setSelectedRole(identityRoles[0]?.key ?? assignableRoles[0].key);
        }
    }, [rolesQuery.isLoading, assignableRoles, identityRoles, selectedRole]);

    const seedMutation = SeedPermissions();
    const assignMutation = AssignPermissionToRole();
    const revokeMutation = RemovePermissionFromRole();

    const currentRolePermissions: Permission[] = roleQuery.data?.permissions ?? [];

    const groupedPermissions = useMemo(() => {
        const list: Permission[] = allPermsQuery.data ?? [];
        return list.reduce((acc, perm) => {
            if (!acc[perm.resource]) acc[perm.resource] = [];
            acc[perm.resource].push(perm);
            return acc;
        }, {} as Record<string, Permission[]>);
    }, [allPermsQuery.data]);

    const filteredResources = useMemo(() => {
        const q = searchValue.toLowerCase();
        if (!q) return Object.keys(groupedPermissions);
        return Object.keys(groupedPermissions).filter(
            (resource) =>
                resource.toLowerCase().includes(q) ||
                groupedPermissions[resource].some(
                    (p) =>
                        p.action.toLowerCase().includes(q) ||
                        p.name.toLowerCase().includes(q)
                )
        );
    }, [groupedPermissions, searchValue]);

    const hasPermissionForRole = (permissionId: string): boolean => {
        return (
            currentRolePermissions.some((p) => p.id === permissionId) ||
            pendingChanges.toAdd.includes(permissionId)
        );
    };

    const isPendingChange = (permissionId: string): boolean => {
        return (
            pendingChanges.toAdd.includes(permissionId) ||
            pendingChanges.toRemove.includes(permissionId)
        );
    };

    const togglePermission = (permissionId: string) => {
        if (!editMode) return;

        const currentlyHas = currentRolePermissions.some((p) => p.id === permissionId);
        const inToAdd = pendingChanges.toAdd.includes(permissionId);
        const inToRemove = pendingChanges.toRemove.includes(permissionId);

        setPendingChanges((prev) => {
            if (currentlyHas) {
                return inToRemove
                    ? { ...prev, toRemove: prev.toRemove.filter((id) => id !== permissionId) }
                    : { ...prev, toRemove: [...prev.toRemove, permissionId] };
            }
            return inToAdd
                ? { ...prev, toAdd: prev.toAdd.filter((id) => id !== permissionId) }
                : { ...prev, toAdd: [...prev.toAdd, permissionId] };
        });
    };

    const saveChanges = async () => {
        const totalChanges = pendingChanges.toAdd.length + pendingChanges.toRemove.length;
        if (totalChanges === 0) {
            toast.error("No changes to save");
            return;
        }

        setSaving(true);
        try {
            const addOps = pendingChanges.toAdd.map((id) =>
                assignMutation
                    .mutateAsync({ role: selectedRole, permissionId: id })
                    .then(() => ({ status: "ok" as const, op: "add" as const, id }))
                    .catch((err) => ({ status: "fail" as const, op: "add" as const, id, err }))
            );
            const removeOps = pendingChanges.toRemove.map((id) =>
                revokeMutation
                    .mutateAsync({ role: selectedRole, permissionId: id })
                    .then(() => ({ status: "ok" as const, op: "remove" as const, id }))
                    .catch((err) => ({ status: "fail" as const, op: "remove" as const, id, err }))
            );

            const results = await Promise.all([...addOps, ...removeOps]);

            const failedAdds = results
                .filter((r) => r.status === "fail" && r.op === "add")
                .map((r) => r.id);
            const failedRemoves = results
                .filter((r) => r.status === "fail" && r.op === "remove")
                .map((r) => r.id);
            const succeededCount = results.filter((r) => r.status === "ok").length;

            if (succeededCount > 0) {
                toast.success(`${succeededCount} permission change(s) saved`);
            }
            if (failedAdds.length || failedRemoves.length) {
                toast.error(
                    `${failedAdds.length + failedRemoves.length} change(s) failed; left in pending state for retry`
                );
                // Keep only the failed ones — successes are now reflected on the server.
                setPendingChanges({ toAdd: failedAdds, toRemove: failedRemoves });
            } else {
                setPendingChanges({ toAdd: [], toRemove: [] });
                setEditMode(false);
            }
        } finally {
            setSaving(false);
        }
    };

    const cancelChanges = () => {
        setPendingChanges({ toAdd: [], toRemove: [] });
        setEditMode(false);
    };

    const seedPermissions = async () => {
        try {
            const result = await seedMutation.mutateAsync();
            toast.success(result.message || "Permissions seeded successfully");
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to seed permissions");
        }
    };

    const loading = allPermsQuery.isLoading || roleQuery.isLoading;
    const seeding = seedMutation.isPending;

    return (
        <div className="p-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 bg-gray-50/50">
                    <div className="flex justify-between items-center gap-4 flex-wrap mb-6">
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">Roles & Permissions</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Manage role-based access control and permissions
                            </p>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            {!editMode ? (
                                <>
                                    <button
                                        onClick={() => setCreateOpen(true)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700 font-medium"
                                    >
                                        <Icon icon="mdi:plus" className="w-4 h-4" />
                                        <span>Create Permission</span>
                                    </button>
                                    <button
                                        onClick={() => setEditMode(true)}
                                        disabled={selectedRole === UserRole.SUPER_ADMIN}
                                        className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title={
                                            selectedRole === UserRole.SUPER_ADMIN
                                                ? "Super Admin permissions cannot be edited"
                                                : undefined
                                        }
                                    >
                                        <Icon icon="mdi:pencil" className="w-4 h-4" />
                                        <span>Edit Role</span>
                                    </button>
                                    <button
                                        onClick={seedPermissions}
                                        disabled={seeding}
                                        className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700 font-medium disabled:opacity-50"
                                    >
                                        <Icon icon="mdi:seed" className="w-4 h-4" />
                                        <span>{seeding ? "Seeding..." : "Seed Defaults"}</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={cancelChanges}
                                        disabled={saving}
                                        className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm text-gray-700 font-medium disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={saveChanges}
                                        disabled={
                                            saving ||
                                            (pendingChanges.toAdd.length === 0 &&
                                                pendingChanges.toRemove.length === 0)
                                        }
                                        className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <Icon icon="mdi:content-save" className="w-4 h-4" />
                                        <span>
                                            {saving
                                                ? "Saving..."
                                                : `Save Changes${pendingChanges.toAdd.length + pendingChanges.toRemove.length > 0
                                                    ? ` (${pendingChanges.toAdd.length + pendingChanges.toRemove.length})`
                                                    : ""
                                                }`}
                                        </span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Role Selector & Search */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex-1 max-w-md relative">
                            <input
                                type="text"
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                                placeholder="Search permissions or resources..."
                            />
                            <Icon icon="mdi:magnify" className="absolute top-[50%] -translate-y-1/2 left-3 w-5 h-5 text-gray-400" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 font-medium">Role:</span>
                            <select
                                value={selectedRole}
                                onChange={(e) => {
                                    setSelectedRole(e.target.value);
                                    setPendingChanges({ toAdd: [], toRemove: [] });
                                    setEditMode(false);
                                }}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium bg-white"
                            >
                                {rolesQuery.isLoading && <option value={selectedRole}>Loading…</option>}
                                {/* Without a fallback option the select renders blank on failure,
                                    which reads as a broken page rather than a failed fetch. */}
                                {!rolesQuery.isLoading && assignableRoles.length === 0 && (
                                    <option value={selectedRole}>
                                        {rolesQuery.isError ? "Could not load roles" : "No roles available"}
                                    </option>
                                )}
                                {identityRoles.length > 0 && (
                                    <optgroup label="Roles">
                                        {identityRoles.map((role) => (
                                            <option key={role.key} value={role.key}>{role.label}</option>
                                        ))}
                                    </optgroup>
                                )}
                                {standingRoles.length > 0 && (
                                    <optgroup label="Standing roles (earned)">
                                        {standingRoles.map((role) => (
                                            <option key={role.key} value={role.key}>{role.label}</option>
                                        ))}
                                    </optgroup>
                                )}
                            </select>
                        </div>
                        <div className="ml-auto bg-white px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 shadow-sm">
                            Total Permissions: <span className="text-primary">{currentRolePermissions.length}</span>
                        </div>
                    </div>
                </div>

                {/* Permissions Grid */}
                <div className="p-6">
                    {loading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-20 w-full" />
                        </div>
                    ) : filteredResources.length > 0 ? (
                        <div className="space-y-6">
                            {filteredResources.map((resource) => (
                                <div key={resource} className="border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                                            <Icon icon="mdi:folder" className="w-4 h-4 text-primary" />
                                            {resource}
                                        </h3>
                                    </div>
                                    <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                        {groupedPermissions[resource].map((permission) => {
                                            const checked = hasPermissionForRole(permission.id);
                                            const pending = isPendingChange(permission.id);
                                            const checkedActual =
                                                checked && !pendingChanges.toRemove.includes(permission.id);

                                            return (
                                                <div
                                                    key={permission.id}
                                                    className={`group relative flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${editMode ? "hover:border-primary/50 cursor-pointer" : ""
                                                        } ${checked
                                                            ? pending
                                                                ? "border-orange-300 bg-orange-50"
                                                                : "border-primary bg-primary/5"
                                                            : pending
                                                                ? "border-orange-300 bg-orange-50"
                                                                : "border-gray-200 bg-white"
                                                        }`}
                                                    onClick={() => togglePermission(permission.id)}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={checkedActual}
                                                        onChange={() => togglePermission(permission.id)}
                                                        disabled={!editMode || selectedRole === UserRole.SUPER_ADMIN}
                                                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary disabled:opacity-50"
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium text-gray-900 truncate">
                                                            {permission.action}
                                                        </div>
                                                        {pending && (
                                                            <div className="text-xs text-orange-600 font-medium">
                                                                {pendingChanges.toAdd.includes(permission.id)
                                                                    ? "To Add"
                                                                    : "To Remove"}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {!editMode && (
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditTarget(permission);
                                                                }}
                                                                title="Edit description"
                                                                className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                                                            >
                                                                <Icon icon="mdi:pencil" className="w-4 h-4" />
                                                            </button>
                                                            {isSuperAdmin && (
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setDeleteTarget(permission);
                                                                    }}
                                                                    title="Delete permission"
                                                                    className="p-1 rounded hover:bg-red-50 text-gray-500 hover:text-red-600"
                                                                >
                                                                    <Icon icon="mdi:trash-can-outline" className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                <Icon icon="mdi:shield-off" width="32" height="32" className="text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No permissions found</h3>
                            <p className="text-sm text-gray-500">Try adjusting your search or seed default permissions</p>
                        </div>
                    )}
                </div>

                {activeRole?.kind === "standing" && activeRole.derived_from && (
                    <div className="px-6 pb-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                            <Icon icon="mdi:information" className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-blue-900">
                                    {activeRole.label} is a standing role
                                </p>
                                <p className="text-sm text-blue-700 mt-1">
                                    {activeRole.derived_from} It cannot be assigned to a user directly — an
                                    agent holds it <span className="font-semibold">in addition to</span> their
                                    account role, and permissions granted here are added to whatever their
                                    account role already allows.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {selectedRole === UserRole.SUPER_ADMIN && (
                    <div className="px-6 pb-6">
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-start gap-3">
                            <Icon icon="mdi:information" className="w-5 h-5 text-purple-600 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-purple-900">Super Admin Access</p>
                                <p className="text-sm text-purple-700 mt-1">
                                    Super Admins automatically have all permissions and cannot be modified.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <CreatePermissionModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
            <EditPermissionModal
                isOpen={!!editTarget}
                onClose={() => setEditTarget(null)}
                permission={editTarget}
            />
            <DeletePermissionConfirm
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                permission={deleteTarget}
            />
        </div>
    );
};

export default RolesPermissionsView;

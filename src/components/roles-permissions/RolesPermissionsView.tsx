"use client"

import { Skeleton } from "@/src/components/ui/skeleton";
import { useState, useEffect, useCallback } from "react";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import axiosRequest from "@/src/lib/api";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import { UserRole } from "@/src/lib/enums";
import { Permission, RolePermissionsResponse } from "@/src/lib/types/permissions";

const ROLES = [
    { value: UserRole.SUPER_ADMIN, label: "Super Admin", color: "bg-purple-100 text-purple-700" },
    { value: UserRole.ADMIN, label: "Admin", color: "bg-blue-100 text-blue-700" },
    { value: UserRole.AGENT, label: "Agent", color: "bg-green-100 text-green-700" },
    { value: UserRole.OWNER, label: "Owner", color: "bg-orange-100 text-orange-700" },
    { value: UserRole.GUEST, label: "Guest", color: "bg-gray-100 text-gray-700" },
];

const RolesPermissionsView = () => {
    const [loading, setLoading] = useState(false);
    const [seeding, setSeeding] = useState(false);
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
    const [rolePermissions, setRolePermissions] = useState<Record<string, Permission[]>>({});
    const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.ADMIN);
    const [searchValue, setSearchValue] = useState("");
    const [editMode, setEditMode] = useState(false);
    const [pendingChanges, setPendingChanges] = useState<{
        toAdd: string[];
        toRemove: string[];
    }>({ toAdd: [], toRemove: [] });

    // Group permissions by resource
    const groupedPermissions = allPermissions.reduce((acc, perm) => {
        if (!acc[perm.resource]) {
            acc[perm.resource] = [];
        }
        acc[perm.resource].push(perm);
        return acc;
    }, {} as Record<string, Permission[]>);

    // Filter permissions by search
    const filteredResources = Object.keys(groupedPermissions).filter(resource =>
        resource.toLowerCase().includes(searchValue.toLowerCase()) ||
        groupedPermissions[resource].some(p =>
            p.action.toLowerCase().includes(searchValue.toLowerCase())
        )
    );

    const fetchAllPermissions = useCallback(async () => {
        try {
            const response = await axiosRequest.get(API_ROUTES.permissions.base, {
                params: { limit: 500 }
            });
            setAllPermissions(response.data.data || response.data);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to fetch permissions");
        }
    }, []);

    const fetchRolePermissions = useCallback(async (role: UserRole) => {
        try {
            const response = await axiosRequest.get(API_ROUTES.permissions.rolePermissions(role));
            const data: RolePermissionsResponse = response.data.data || response.data;
            setRolePermissions(prev => ({
                ...prev,
                [role]: data.permissions
            }));
        } catch (err: any) {
            toast.error(err.response?.data?.message || `Failed to fetch ${role} permissions`);
        }
    }, []);

    const fetchAllRolePermissions = useCallback(async () => {
        setLoading(true);
        try {
            await fetchAllPermissions();
            for (const role of ROLES) {
                await fetchRolePermissions(role.value);
            }
        } finally {
            setLoading(false);
        }
    }, [fetchAllPermissions, fetchRolePermissions]);

    useEffect(() => {
        fetchAllRolePermissions();
    }, [fetchAllRolePermissions]);

    const hasPermission = (permissionId: string): boolean => {
        const currentPerms = rolePermissions[selectedRole] || [];
        return currentPerms.some(p => p.id === permissionId) ||
            pendingChanges.toAdd.includes(permissionId);
    };

    const isPendingChange = (permissionId: string): boolean => {
        return pendingChanges.toAdd.includes(permissionId) ||
            pendingChanges.toRemove.includes(permissionId);
    };

    const togglePermission = (permissionId: string) => {
        if (!editMode) return;

        const currentlyHas = (rolePermissions[selectedRole] || []).some(p => p.id === permissionId);
        const inToAdd = pendingChanges.toAdd.includes(permissionId);
        const inToRemove = pendingChanges.toRemove.includes(permissionId);

        setPendingChanges(prev => {
            if (currentlyHas) {
                // Currently has permission
                if (inToRemove) {
                    // Cancel removal
                    return {
                        ...prev,
                        toRemove: prev.toRemove.filter(id => id !== permissionId)
                    };
                } else {
                    // Mark for removal
                    return {
                        ...prev,
                        toRemove: [...prev.toRemove, permissionId]
                    };
                }
            } else {
                // Currently doesn't have permission
                if (inToAdd) {
                    // Cancel addition
                    return {
                        ...prev,
                        toAdd: prev.toAdd.filter(id => id !== permissionId)
                    };
                } else {
                    // Mark for addition
                    return {
                        ...prev,
                        toAdd: [...prev.toAdd, permissionId]
                    };
                }
            }
        });
    };

    const saveChanges = async () => {
        if (pendingChanges.toAdd.length === 0 && pendingChanges.toRemove.length === 0) {
            toast.error("No changes to save");
            return;
        }

        setLoading(true);
        try {
            // Add permissions
            for (const permId of pendingChanges.toAdd) {
                await axiosRequest.post(
                    API_ROUTES.permissions.assignToRole(selectedRole, permId)
                );
            }

            // Remove permissions
            for (const permId of pendingChanges.toRemove) {
                await axiosRequest.delete(
                    API_ROUTES.permissions.removeFromRole(selectedRole, permId)
                );
            }

            toast.success("Permissions updated successfully");
            setPendingChanges({ toAdd: [], toRemove: [] });
            setEditMode(false);
            await fetchRolePermissions(selectedRole);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to update permissions");
        } finally {
            setLoading(false);
        }
    };

    const cancelChanges = () => {
        setPendingChanges({ toAdd: [], toRemove: [] });
        setEditMode(false);
    };

    const seedPermissions = async () => {
        setSeeding(true);
        try {
            const response = await axiosRequest.post(API_ROUTES.permissions.seed);
            toast.success(response.data.data?.message || "Permissions seeded successfully");
            await fetchAllRolePermissions();
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to seed permissions");
        } finally {
            setSeeding(false);
        }
    };

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
                        <div className="flex items-center gap-3">
                            {!editMode ? (
                                <>
                                    <button
                                        onClick={() => setEditMode(true)}
                                        className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg flex items-center gap-2"
                                    >
                                        <Icon icon="mdi:pencil" className="w-4 h-4" />
                                        <span>Edit Permissions</span>
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
                                        className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm text-gray-700 font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={saveChanges}
                                        disabled={loading || (pendingChanges.toAdd.length === 0 && pendingChanges.toRemove.length === 0)}
                                        className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <Icon icon="mdi:content-save" className="w-4 h-4" />
                                        <span>
                                            {loading ? "Saving..." : `Save Changes ${pendingChanges.toAdd.length + pendingChanges.toRemove.length > 0 ? `(${pendingChanges.toAdd.length + pendingChanges.toRemove.length})` : ""}`}
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
                                    setSelectedRole(e.target.value as UserRole);
                                    setPendingChanges({ toAdd: [], toRemove: [] });
                                    setEditMode(false);
                                }}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium bg-white"
                            >
                                {ROLES.map(role => (
                                    <option key={role.value} value={role.value}>
                                        {role.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="ml-auto bg-white px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 shadow-sm">
                            Total Permissions: <span className="text-primary">{(rolePermissions[selectedRole] || []).length}</span>
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
                            {filteredResources.map(resource => (
                                <div key={resource} className="border border-gray-200 rounded-lg overflow-hidden">
                                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                                            <Icon icon="mdi:folder" className="w-4 h-4 text-primary" />
                                            {resource}
                                        </h3>
                                    </div>
                                    <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                        {groupedPermissions[resource].map(permission => {
                                            const checked = hasPermission(permission.id);
                                            const pending = isPendingChange(permission.id);

                                            return (
                                                <label
                                                    key={permission.id}
                                                    className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all cursor-pointer ${editMode ? "hover:border-primary/50" : ""
                                                        } ${checked
                                                            ? pending
                                                                ? "border-orange-300 bg-orange-50"
                                                                : "border-primary bg-primary/5"
                                                            : pending
                                                                ? "border-orange-300 bg-orange-50"
                                                                : "border-gray-200 bg-white"
                                                        } ${!editMode ? "cursor-default" : ""}`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={checked && !pendingChanges.toRemove.includes(permission.id)}
                                                        onChange={() => togglePermission(permission.id)}
                                                        disabled={!editMode || selectedRole === UserRole.SUPER_ADMIN}
                                                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary disabled:opacity-50"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium text-gray-900 truncate">
                                                            {permission.action}
                                                        </div>
                                                        {pending && (
                                                            <div className="text-xs text-orange-600 font-medium">
                                                                {pendingChanges.toAdd.includes(permission.id) ? "To Add" : "To Remove"}
                                                            </div>
                                                        )}
                                                    </div>
                                                </label>
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
        </div>
    );
};

export default RolesPermissionsView;

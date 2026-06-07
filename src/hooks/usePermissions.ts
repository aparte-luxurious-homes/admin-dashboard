"use client";

import { useMemo } from "react";
import { UserRole } from "@/lib/enums";
import { useAuth } from "./useAuth";
import { GetRolePermissions } from "@/src/lib/request-handlers/permissionsMgt";
import { Permission } from "@/src/lib/types/permissions";

export const usePermissions = () => {
    const { user } = useAuth();
    const role = user?.role as UserRole | undefined;

    const isSuperAdmin = role === UserRole.SUPER_ADMIN;
    const isAdminRole = [
        UserRole.SUPER_ADMIN,
        UserRole.ADMIN,
        UserRole.OPERATIONS_ADMIN,
        UserRole.SUPPORT_ADMIN,
    ].includes(role as UserRole);
    const isAdmin = isAdminRole;
    const isAgent = role === UserRole.AGENT;
    const isOwner = role === UserRole.OWNER;
    const isStaff = isAdmin || isAgent || isOwner;

    // Module Access (synchronous, role-based — render nav links instantly without
    // waiting on a network round-trip)
    const canViewDashboard = isStaff;
    const canViewProperties = isStaff;
    const canViewBookings = isStaff;
    const canViewTransactions = isStaff;
    const canViewUsers = isAdmin;
    const canViewAuditLogs = isAdmin;
    const canViewSettings = isAdmin;
    const canViewReviews = isAdmin || isStaff;
    const canViewReferrals = isAdmin || isAgent;
    const canViewDisputes = isAdmin || isOwner || isAgent;
    const canViewRolesPermissions = isAdmin;

    // Specific Actions
    const canCreateProperty = isStaff;
    const canEditProperty = isStaff; // Specific ownership check happens on backend/detail view
    const canDeleteProperty = isSuperAdmin;
    const canDeleteUnit = isSuperAdmin;
    const canDeleteBooking = isSuperAdmin;
    const canDeleteUser = isSuperAdmin;
    const canVerifyProperty = isAdmin || isAgent;

    const canManageBookings = isStaff;
    const canCancelBooking = isAdmin || isOwner || isAgent;

    const canManageFinances = isAdmin; // Withdrawals etc.
    const canFlagReview = isAdmin;
    const canRemoveReview = isSuperAdmin; // Moderation purge restricted to SUPER_ADMIN
    const canManageDisputes = isAdmin; // Admin can resolve, update status etc.
    const canRaiseDispute = isOwner; // Owners can raise disputes after checkout

    // Granular permissions (async, DB-backed). Mirrors backend behavior at
    // services/permissions/service.py::user_has_permission — SUPER_ADMIN is
    // always allowed; everyone else must have the named permission assigned to
    // their role. Cached for 5 minutes to match the backend TTL cache.
    const rolePermsQuery = GetRolePermissions(role, !!role);
    const permissionsData = rolePermsQuery.data?.permissions;
    const permissionsLoading = rolePermsQuery.isLoading;

    const permissions: Permission[] = useMemo(
        () => permissionsData ?? [],
        [permissionsData]
    );
    const permissionNameSet = useMemo(
        () => new Set(permissions.map((p) => p.name)),
        [permissions]
    );

    const hasPermission = (name: string): boolean => {
        if (isSuperAdmin) return true;
        return permissionNameSet.has(name);
    };

    return {
        role,
        isSuperAdmin,
        isAdmin,
        isAgent,
        isOwner,
        isStaff,

        // Permission flags (synchronous, role-based)
        canViewDashboard,
        canViewProperties,
        canViewBookings,
        canViewTransactions,
        canViewUsers,
        canViewAuditLogs,
        canViewSettings,
        canViewReviews,
        canViewReferrals,
        canViewDisputes,
        canViewRolesPermissions,

        canCreateProperty,
        canEditProperty,
        canDeleteProperty,
        canDeleteUnit,
        canDeleteBooking,
        canDeleteUser,
        canVerifyProperty,

        canManageBookings,
        canCancelBooking,
        canManageFinances,
        canFlagReview,
        canRemoveReview,
        canManageDisputes,
        canRaiseDispute,

        // Granular (async, DB-backed)
        permissions,
        permissionsLoading,
        hasPermission,
    };
};

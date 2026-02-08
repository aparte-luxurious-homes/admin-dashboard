"use client";

import { UserRole } from "@/lib/enums";
import { useAuth } from "./useAuth";

export const usePermissions = () => {
    const { user } = useAuth();
    const role = user?.role as UserRole | undefined;

    const isSuperAdmin = role === UserRole.SUPER_ADMIN;
    const isAdmin = role === UserRole.ADMIN || isSuperAdmin;
    const isAgent = role === UserRole.AGENT;
    const isOwner = role === UserRole.OWNER;
    const isStaff = isAdmin || isAgent || isOwner;

    // Module Access
    const canViewDashboard = isStaff;
    const canViewProperties = isStaff;
    const canViewBookings = isStaff;
    const canViewTransactions = isStaff;
    const canViewUsers = isAdmin;
    const canViewAuditLogs = isAdmin;
    const canViewSettings = isAdmin;

    // Specific Actions
    const canCreateProperty = isStaff;
    const canEditProperty = isStaff; // Specific ownership check happens on backend/detail view
    const canDeleteProperty = isAdmin || isOwner;
    const canVerifyProperty = isAdmin || isAgent;

    const canManageBookings = isStaff;
    const canCancelBooking = isAdmin || isOwner || isAgent;

    const canManageFinances = isAdmin; // Withdrawals etc.

    return {
        role,
        isSuperAdmin,
        isAdmin,
        isAgent,
        isOwner,
        isStaff,

        // Permission flags
        canViewDashboard,
        canViewProperties,
        canViewBookings,
        canViewTransactions,
        canViewUsers,
        canViewAuditLogs,
        canViewSettings,

        canCreateProperty,
        canEditProperty,
        canDeleteProperty,
        canVerifyProperty,

        canManageBookings,
        canCancelBooking,
        canManageFinances
    };
};

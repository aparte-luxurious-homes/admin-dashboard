"use client";

import { UserRole } from "@/lib/enums";
import { useAuth } from "./useAuth";

export const usePermissions = () => {
    const { user } = useAuth();
    const role = user?.role as UserRole | undefined;

    const isSuperAdmin = role === UserRole.SUPER_ADMIN;
    const isAdmin = role === UserRole.ADMIN || isSuperAdmin;
    const isAgent = role === UserRole.AGENT || role === UserRole.AGENT_OWNER;
    const isOwner = role === UserRole.OWNER || role === UserRole.AGENT_OWNER;
    const isStaff = isAdmin || isAgent || isOwner;

    // Module Access
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

    // Specific Actions
    const canCreateProperty = isStaff;
    const canEditProperty = isStaff; // Specific ownership check happens on backend/detail view
    const canDeleteProperty = isAdmin || isOwner;
    const canVerifyProperty = isAdmin || isAgent;

    const canManageBookings = isStaff;
    const canCancelBooking = isAdmin || isOwner || isAgent;

    const canManageFinances = isAdmin; // Withdrawals etc.
    const canFlagReview = isAdmin;
    const canRemoveReview = isAdmin;
    const canManageDisputes = isAdmin; // Admin can resolve, update status etc.
    const canRaiseDispute = isOwner; // Owners can raise disputes after checkout

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
        canViewReviews,
        canViewReferrals,
        canViewDisputes,

        canCreateProperty,
        canEditProperty,
        canDeleteProperty,
        canVerifyProperty,

        canManageBookings,
        canCancelBooking,
        canManageFinances,
        canFlagReview,
        canRemoveReview,
        canManageDisputes,
        canRaiseDispute,
    };
};

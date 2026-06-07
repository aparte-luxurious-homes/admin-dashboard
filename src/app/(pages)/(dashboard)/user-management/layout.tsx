"use client";

import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { UserRole } from "@/lib/enums";

export default function UserManagementLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OPERATIONS_ADMIN, UserRole.SUPPORT_ADMIN]}>
            {children}
        </ProtectedRoute>
    );
}

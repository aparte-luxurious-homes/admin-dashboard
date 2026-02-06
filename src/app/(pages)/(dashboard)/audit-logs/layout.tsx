"use client";

import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { UserRole } from "@/lib/enums";

export default function AuditLogsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
            {children}
        </ProtectedRoute>
    );
}

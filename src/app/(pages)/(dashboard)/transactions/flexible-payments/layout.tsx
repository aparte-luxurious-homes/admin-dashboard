"use client";

import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { UserRole } from "@/lib/enums";

// Narrower than /transactions: agents and owners see their own payments there,
// but this is the platform-wide monitor.
export default function FlexiblePaymentsLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OPERATIONS_ADMIN]}>
            {children}
        </ProtectedRoute>
    );
}

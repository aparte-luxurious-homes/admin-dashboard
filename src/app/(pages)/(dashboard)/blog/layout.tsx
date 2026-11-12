"use client";

import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { UserRole } from "@/lib/enums";

/** Staff only. Owners and agents read the blog on the website instead. */
export default function BlogLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute
            allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OPERATIONS_ADMIN, UserRole.SUPPORT_ADMIN]}
        >
            {children}
        </ProtectedRoute>
    );
}

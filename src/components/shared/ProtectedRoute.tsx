"use client";

import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/lib/enums";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PAGE_ROUTES } from "@/lib/routes/page_routes";
import Loader from "@/components/loader";

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: UserRole[];
}

export const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
    const { user, isFetching } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isFetching && !user) {
            router.replace(PAGE_ROUTES.auth.login);
        } else if (!isFetching && user && allowedRoles && !allowedRoles.includes(user.role as UserRole)) {
            router.replace(PAGE_ROUTES.dashboard.base);
        }
    }, [user, isFetching, router, allowedRoles]);

    if (isFetching || !user) {
        return <Loader message="Verifying access..." />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role as UserRole)) {
        return null;
    }

    return <>{children}</>;
};

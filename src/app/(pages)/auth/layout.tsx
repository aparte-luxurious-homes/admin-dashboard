'use client'

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import { useSelector } from "react-redux";
import { RootState } from "@/src/lib/store";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const user = useSelector((state: RootState) => state.auth.user);

    useEffect(() => {
        // Only redirect if BOTH token AND user data exist (from Redux persistence)
        const token = Cookies.get("token");
        
        console.log('[AuthLayout] Checking auth:', { hasToken: !!token, hasUser: !!user, userId: user?.id });
        
        // Only redirect if we have valid user data (prevents loop)
        if (token && user && user.id) {
            console.log('[AuthLayout] Valid auth detected, redirecting to dashboard');
            router.replace(PAGE_ROUTES.dashboard.base);
        }
    }, [router, user]);

    return (
        <main>
            {children}
        </main>
    );
};
'use client'

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    useEffect(() => {
        // If user is already logged in (has token), redirect to dashboard
        const token = Cookies.get("token");
        if (token) {
            router.replace(PAGE_ROUTES.dashboard.base);
        }
    }, [router]);

    return (
        <main>
            {children}
        </main>
    );
};
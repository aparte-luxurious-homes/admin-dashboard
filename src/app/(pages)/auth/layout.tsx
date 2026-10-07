'use client'

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/src/lib/store";
import axiosRequest from "@/src/lib/api";
import { clearUser } from "@/src/lib/slices/authSlice";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const dispatch = useDispatch();
    const user = useSelector((state: RootState) => state.auth.user);

    useEffect(() => {
        if (!user?.id) return;

        // A persisted Redux user is not proof of a session: the HttpOnly cookie
        // may have expired, which is exactly why middleware.ts sent us here.
        // Redirecting on the Redux user alone would bounce straight back to the
        // dashboard, then back to login, forever. Ask the API instead.
        // validateStatus keeps a 401 away from the axios interceptor, which
        // would otherwise redirect away from password-reset pages.
        let cancelled = false;
        axiosRequest
            .get("/auth/me", { validateStatus: () => true })
            .then((res) => {
                if (cancelled) return;
                if (res.status === 200) {
                    router.replace(PAGE_ROUTES.dashboard.base);
                } else {
                    dispatch(clearUser());
                }
            })
            .catch(() => {
                // Network failure: stay on the auth page, which is always safe.
            });
        return () => {
            cancelled = true;
        };
    }, [router, user?.id, dispatch]);

    return (
        <main>
            {children}
        </main>
    );
};

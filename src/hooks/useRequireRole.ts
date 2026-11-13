"use client";

import { MESSAGES } from '@/src/lib/messages';
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { UserRole } from "@/src/lib/enums";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import { useAuth } from "./useAuth";

/**
 * Redirect to the dashboard root when the current user's role is not in
 * `allowedRoles`. Waits for auth to finish resolving before deciding, so a
 * page render while the user is being hydrated from the token does not flash
 * the access-denied path.
 */
export const useRequireRole = (allowedRoles: UserRole[]) => {
  const router = useRouter();
  const { user, isFetching } = useAuth();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (isFetching) return;
    if (!user) return;
    if (hasRedirected.current) return;

    const role = user.role as UserRole | undefined;
    if (!role || !allowedRoles.includes(role)) {
      hasRedirected.current = true;
      toast.error(MESSAGES.MSG_YOU_DON_T_HAVE_ACCESS_TO_THAT_PAGE);
      router.replace(PAGE_ROUTES.dashboard.base);
    }
  }, [user, isFetching, allowedRoles, router]);

  const role = user?.role as UserRole | undefined;
  const hasAccess = !!role && allowedRoles.includes(role);
  return { hasAccess, isChecking: isFetching || !user };
};

"use client";

import React, { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/src/hooks/useAuth";
import { UserRole } from "@/src/lib/enums";

/**
 * Wrap pages that require the OWNER/AGENT operator to have a complete
 * identity profile (phone + DOB + gender + first/last name). If they
 * are missing any of these, redirect to /settings/personal-info with a
 * toast prompt.
 *
 * - Admins (and any non-OWNER/AGENT role) pass through unconditionally.
 * - Backend exposes `missingProfileFields` / `missing_profile_fields` on
 *   `GET /profile` (HOST_REQUIRED_PROFILE_FIELDS set).
 * - The property-create page is also hard-gated by the backend
 *   (POST /properties returns 403 PROFILE_INCOMPLETE) — this wrapper is
 *   a client-side nudge so the user isn't forced into a round-trip.
 * - For booking-on-behalf this wrapper is the only enforcement point
 *   (backend permits agents-on-behalf with incomplete profiles).
 */
const RequireCompleteOwnerProfile: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const { user, isFetching } = useAuth();

  const isOwnerOrAgent = user?.role === UserRole.OWNER || user?.role === UserRole.AGENT;
  const missing = useMemo<string[]>(
    () => user?.missingProfileFields ?? user?.missing_profile_fields ?? [],
    [user],
  );
  const isIncomplete = isOwnerOrAgent && missing.length > 0;

  useEffect(() => {
    if (isIncomplete) {
      toast(
        "Please complete your profile (name, DOB, gender, phone) before continuing.",
        { icon: "⚠️" },
      );
      router.replace("/settings/personal-info?from=incomplete");
    }
  }, [isIncomplete, router]);

  // While we resolve auth / are about to redirect, render nothing.
  if (isFetching) return null;
  if (isIncomplete) return null;

  return <>{children}</>;
};

export default RequireCompleteOwnerProfile;

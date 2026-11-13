"use client";

import React, { useMemo } from "react";
import { useAuth } from "@/src/hooks/useAuth";
import { UserRole } from "@/src/lib/enums";
import IncompleteProfileDialog from "./IncompleteProfileDialog";

/**
 * Wrap pages that require the OWNER/AGENT operator to have a complete
 * identity profile (phone + DOB + gender + first/last name). If they
 * are missing any of these, render a blocking dialog with the missing
 * fields listed plus a "Go to Settings" CTA.
 *
 * - Admins (and any non-OWNER/AGENT role) pass through unconditionally.
 * - Backend exposes `missingProfileFields` / `missing_profile_fields` on
 *   `GET /profile` (HOST_REQUIRED_PROFILE_FIELDS set).
 * - The property-create page is also hard-gated by the backend
 *   (POST /properties returns 403 PROFILE_INCOMPLETE) — this wrapper is
 *   the proactive UX so the user isn't forced into a round-trip.
 * - For booking-on-behalf this wrapper is the only enforcement point
 *   (backend permits agents-on-behalf with incomplete profiles).
 */
const RequireCompleteOwnerProfile: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isFetching } = useAuth();

  const isOwnerOrAgent =
    user?.role === UserRole.OWNER || user?.role === UserRole.AGENT;
  const missing = useMemo<string[]>(
    () => user?.missingProfileFields ?? user?.missing_profile_fields ?? [],
    [user],
  );
  const isIncomplete = isOwnerOrAgent && missing.length > 0;

  if (isFetching) return null;

  return (
    <>
      {!isIncomplete && children}
      <IncompleteProfileDialog open={!!isIncomplete} missingFields={missing} />
    </>
  );
};

export default RequireCompleteOwnerProfile;

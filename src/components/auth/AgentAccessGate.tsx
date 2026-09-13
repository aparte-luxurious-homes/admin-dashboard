"use client";

import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { clearUser } from "@/src/lib/slices/authSlice";
import { UserRole } from "@/src/lib/enums";
import { isAgentDashboardAllowed } from "@/src/lib/agentApproval";
import {
  AGENT_KYC_REQUIRED_MESSAGE,
  clearAdminSessionCookies,
  redirectUnapprovedAgentToLanding,
} from "@/src/lib/agentAccessGuard";
import Loader from "@/components/loader";

/**
 * Hard-blocks unapproved agents from any dashboard shell. Primary gates live
 * in login/useAuth; this catches persisted sessions and deep links.
 */
export default function AgentAccessGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isFetching } = useAuth();
  const dispatch = useDispatch();

  const blocked =
    !!user &&
    user.role === UserRole.AGENT &&
    !isAgentDashboardAllowed(user);

  useEffect(() => {
    if (!blocked) return;
    toast.error(AGENT_KYC_REQUIRED_MESSAGE, { duration: 7000 });
    dispatch(clearUser());
    clearAdminSessionCookies();
    redirectUnapprovedAgentToLanding();
  }, [blocked, dispatch]);

  if (isFetching && !user) {
    return <Loader message="Verifying access..." />;
  }

  if (blocked) {
    return <Loader message="Redirecting to KYC verification..." />;
  }

  return <>{children}</>;
}

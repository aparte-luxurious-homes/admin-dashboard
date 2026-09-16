/**
 * Agent onboarding / dashboard-access status.
 * Prefer explicit agent_approval_status when the API adds it; otherwise derive
 * from profile KYC status + whether identity docs have been submitted.
 */

export enum AgentApprovalStatus {
  KYC_PENDING = "KYC_PENDING",
  PENDING_APPROVAL = "PENDING_APPROVAL",
  ACTIVE = "ACTIVE",
  REJECTED = "REJECTED",
}

export type AgentApprovalUserLike = {
  role?: string | null;
  agentApprovalStatus?: string | null;
  agent_approval_status?: string | null;
  kycStatus?: string | null;
  kyc_status?: string | null;
  profile?: {
    kycStatus?: string | null;
    kyc_status?: string | null;
  } | null;
  kycDocuments?: unknown[] | null;
  kyc_documents?: unknown[] | null;
  kyc?: unknown[] | null;
};

/**
 * The agent's approval status as the API reports it, or null for a non-agent.
 *
 * Only the explicit `agentApprovalStatus` counts. A missing value means ACTIVE,
 * exactly as the API treats a NULL `users.agent_approval_status`: an agent who
 * was onboarded by an admin or existed before the approval gate.
 *
 * This used to guess from profile `kycStatus` when the field was absent. That
 * guess is wrong for almost every working agent — `kycStatus` defaults to
 * PENDING, NIN checks rewrite it, and the login response does not carry it at
 * all — so verified agents were told their KYC was not approved and turned
 * away at the login form. The API enforces the real gate on every request
 * (403 AGENT_NOT_APPROVED), so trusting the server's answer loses nothing.
 */
export function getAgentApprovalStatus(
  user: AgentApprovalUserLike | null | undefined,
): AgentApprovalStatus | null {
  if (!user || user.role !== "AGENT") return null;

  const explicit = user.agentApprovalStatus || user.agent_approval_status || undefined;
  if (
    explicit &&
    Object.values(AgentApprovalStatus).includes(explicit as AgentApprovalStatus)
  ) {
    return explicit as AgentApprovalStatus;
  }
  return AgentApprovalStatus.ACTIVE;
}

/** Agents may use the admin dashboard only after KYC approval. */
export function isAgentDashboardAllowed(
  user: AgentApprovalUserLike | null | undefined,
): boolean {
  if (!user) return false;
  if (user.role !== "AGENT") return true;
  return getAgentApprovalStatus(user) === AgentApprovalStatus.ACTIVE;
}

export function getLandingAgentKycUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_LANDING_PAGE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://aparte.ng";
  return `${base.replace(/\/$/, "")}/agent/kyc`;
}

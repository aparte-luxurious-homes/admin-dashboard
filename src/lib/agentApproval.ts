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
  profile?: Record<string, unknown> | null;
  kycDocuments?: unknown[] | null;
  kyc_documents?: unknown[] | null;
  kyc?: unknown[] | null;
};

export function getAgentApprovalStatus(
  user: AgentApprovalUserLike | null | undefined,
  opts?: { hasKycDocuments?: boolean },
): AgentApprovalStatus | null {
  if (!user || user.role !== "AGENT") return null;

  const explicit =
    user.agentApprovalStatus || user.agent_approval_status || undefined;
  if (
    explicit &&
    Object.values(AgentApprovalStatus).includes(explicit as AgentApprovalStatus)
  ) {
    return explicit as AgentApprovalStatus;
  }

  const profile = user.profile || {};
  const kyc =
    (typeof profile.kycStatus === "string" ? profile.kycStatus : undefined) ||
    (typeof profile.kyc_status === "string" ? profile.kyc_status : undefined) ||
    user.kycStatus ||
    user.kyc_status ||
    "PENDING";

  if (kyc === "VERIFIED") return AgentApprovalStatus.ACTIVE;
  if (kyc === "REJECTED") return AgentApprovalStatus.REJECTED;

  const docs =
    user.kycDocuments || user.kyc_documents || user.kyc || undefined;
  const hasDocs =
    opts?.hasKycDocuments ?? (Array.isArray(docs) && docs.length > 0);

  if (hasDocs) return AgentApprovalStatus.PENDING_APPROVAL;
  return AgentApprovalStatus.KYC_PENDING;
}

/** Agents may use the admin dashboard only after KYC approval. */
export function isAgentDashboardAllowed(
  user: AgentApprovalUserLike | null | undefined,
  opts?: { hasKycDocuments?: boolean },
): boolean {
  if (!user) return false;
  if (user.role !== "AGENT") return true;
  return getAgentApprovalStatus(user, opts) === AgentApprovalStatus.ACTIVE;
}

export function getLandingAgentKycUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_LANDING_PAGE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://aparte.ng";
  return `${base.replace(/\/$/, "")}/agent/kyc`;
}

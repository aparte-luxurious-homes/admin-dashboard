import { AgentApprovalStatus, UserRole } from "./enums";
import type { IUser } from "./types";

/**
 * Agent approval gate — dashboard half.
 *
 * The API is the enforcement: every request from an unapproved agent outside
 * the KYC allowlist answers 403 AGENT_NOT_APPROVED. This module only decides
 * what to render so the agent sees an explanation instead of a wall of failed
 * requests.
 */

/** Fired by the axios interceptor when any request answers AGENT_NOT_APPROVED. */
export const AGENT_NOT_APPROVED_EVENT = "aparte:agent-not-approved";

export const AGENT_SUPPORT_EMAIL = "sales@aparte.ng";

/** Who may approve or reject. SUPPORT_ADMIN reviews the queue but does not decide. */
export const AGENT_APPROVAL_DECIDER_ROLES: ReadonlySet<string> = new Set([
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.OPERATIONS_ADMIN,
]);

export const AGENT_APPROVAL_STATUS_META: Record<AgentApprovalStatus, { label: string; className: string }> = {
  [AgentApprovalStatus.PENDING_APPROVAL]: {
    label: "Pending approval",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  [AgentApprovalStatus.KYC_PENDING]: {
    label: "KYC not submitted",
    className: "bg-gray-100 text-gray-700 border-gray-200",
  },
  [AgentApprovalStatus.REJECTED]: {
    label: "Rejected",
    className: "bg-red-100 text-red-700 border-red-200",
  },
  [AgentApprovalStatus.ACTIVE]: {
    label: "Active",
    className: "bg-green-100 text-green-700 border-green-200",
  },
};

/** Null for non-agents. A missing value is a pre-gate agent, which the API treats as ACTIVE. */
export function getAgentApprovalStatus(
  user: Pick<IUser, "role" | "agentApprovalStatus"> | null | undefined,
): AgentApprovalStatus | null {
  if (!user || user.role !== UserRole.AGENT) return null;
  return (user.agentApprovalStatus as AgentApprovalStatus) || AgentApprovalStatus.ACTIVE;
}

export function isAgentRestricted(user: Pick<IUser, "role" | "agentApprovalStatus"> | null | undefined): boolean {
  const status = getAgentApprovalStatus(user);
  return status !== null && status !== AgentApprovalStatus.ACTIVE;
}

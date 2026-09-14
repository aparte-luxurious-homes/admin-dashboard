"use client";

import React from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { AgentApprovalStatus } from "@/src/lib/enums";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import type { UserDetail } from "./user-detail.types";
import AgentApprovalActions from "./AgentApprovalActions";
import { ApprovalStatusPill } from "./AgentApprovalsView";

/** Approval standing on the agent detail page, with the same decide controls as the queue. */
const AgentApprovalCard: React.FC<{ user: UserDetail; onUpdate?: () => void }> = ({ user, onUpdate }) => {
  const status = user.agentApprovalStatus || AgentApprovalStatus.ACTIVE;

  return (
    <section className="mt-6 bg-gray-50/50 rounded-2xl border border-gray-100 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <Icon icon="mdi:shield-account-outline" className="w-5 h-5 text-primary" />
            Agent approval
          </h4>
          <p className="text-sm text-gray-500 mt-1">
            {status === AgentApprovalStatus.ACTIVE
              ? "This agent can use their dashboard."
              : "This agent cannot use their dashboard until they are approved."}
          </p>
        </div>
        <ApprovalStatusPill status={status} />
      </div>

      {user.agentKycSubmittedAt && (
        <p className="text-xs text-gray-500 mt-3">
          KYC submitted {new Date(user.agentKycSubmittedAt).toLocaleString("en-NG")}
        </p>
      )}
      {status === AgentApprovalStatus.REJECTED && user.agentApprovalRejectionReason && (
        <p className="mt-3 text-sm text-red-800 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          <span className="font-semibold">Rejection reason:</span> {user.agentApprovalRejectionReason}
        </p>
      )}

      {status !== AgentApprovalStatus.ACTIVE && (
        <div className="mt-4 space-y-3">
          <AgentApprovalActions userId={user.id} status={status} onDone={onUpdate} />
          <Link
            href={PAGE_ROUTES.dashboard.userManagement.agentApprovals.base}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Go to the approvals queue <Icon icon="mdi:chevron-right" className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </section>
  );
};

export default AgentApprovalCard;

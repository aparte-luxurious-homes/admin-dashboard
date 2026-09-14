"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";
import { AgentApprovalStatus } from "@/src/lib/enums";
import { AGENT_APPROVAL_DECIDER_ROLES } from "@/src/lib/agentApproval";
import { ApproveAgent, RejectAgent, apiErrorMessage } from "@/src/lib/request-handlers/userMgt";
import { RootState } from "@/src/lib/store";

interface Props {
  userId: string;
  status: string | null;
  onDone?: () => void;
}

/**
 * Approve / reject controls shared by the approvals queue and the agent detail
 * page. Hidden for an ACTIVE agent (the API refuses to re-decide one) and for
 * roles that may view the queue but not decide.
 */
const AgentApprovalActions: React.FC<Props> = ({ userId, status, onDone }) => {
  const role = useSelector((s: RootState) => s.auth.user?.role);
  const approve = ApproveAgent();
  const reject = RejectAgent();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  if (!status || status === AgentApprovalStatus.ACTIVE) return null;
  if (!role || !AGENT_APPROVAL_DECIDER_ROLES.has(role)) {
    return (
      <p className="text-xs text-gray-500">
        Only Super Admins, Admins and Operations Admins can approve or reject agents.
      </p>
    );
  }

  const busy = approve.isPending || reject.isPending;

  const handleApprove = () => {
    approve.mutate(
      { userId },
      {
        onSuccess: () => {
          toast.success("Agent approved. They have been emailed and can use the dashboard now.");
          onDone?.();
        },
        onError: (err) => toast.error(apiErrorMessage(err, "Could not approve this agent.")),
      },
    );
  };

  const handleReject = () => {
    if (!reason.trim()) {
      toast.error("Give the agent a reason so they know what to fix.");
      return;
    }
    reject.mutate(
      { userId, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success("Agent rejected. The reason has been emailed to them.");
          setRejecting(false);
          setReason("");
          onDone?.();
        },
        onError: (err) => toast.error(apiErrorMessage(err, "Could not reject this agent.")),
      },
    );
  };

  if (rejecting) {
    return (
      <div className="space-y-3">
        <label htmlFor={`reject-reason-${userId}`} className="block text-sm font-medium text-gray-700">
          Rejection reason <span className="text-red-600">*</span>
        </label>
        <textarea
          id={`reject-reason-${userId}`}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder="e.g. The name on the document does not match the name on the account."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <p className="text-xs text-gray-500">The agent receives this reason by email and on their KYC page.</p>
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => { setRejecting(false); setReason(""); }}
            disabled={busy}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleReject}
            disabled={busy || !reason.trim()}
            className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 inline-flex items-center gap-2"
          >
            {reject.isPending && <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />}
            Reject and send email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <button
        type="button"
        onClick={() => setRejecting(true)}
        disabled={busy}
        className="px-4 py-2 text-sm border border-red-300 text-red-700 rounded-lg bg-white hover:bg-red-50 disabled:opacity-50"
      >
        Reject
      </button>
      <button
        type="button"
        onClick={handleApprove}
        disabled={busy}
        className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-2"
      >
        {approve.isPending && <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />}
        Approve agent
      </button>
    </div>
  );
};

export default AgentApprovalActions;

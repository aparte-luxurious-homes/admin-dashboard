"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { GetVerificationHistory } from "@/src/lib/request-handlers/propertyMgt";

interface Props {
  propertyId: string;
  verificationId: string;
}

interface HistoryItem {
  id: string;
  previous_status: string | null;
  new_status: string;
  feedback: string | null;
  trigger: string;
  skip_checks_used: { kyc?: boolean; document?: boolean } | null;
  evidence_count: number | null;
  reward_tx_id: string | null;
  reward_amount: number | null;
  reward_reversed: boolean;
  performer_id: string | null;
  performer_role: string | null;
  performer_label: string | null;
  property_doc_id: string | null;
  created_at: string | null;
}

function statusColor(status: string): string {
  switch (status) {
    case "VERIFIED":
      return "text-green-700 bg-green-50 border-green-200";
    case "REJECTED":
      return "text-red-700 bg-red-50 border-red-200";
    case "PENDING":
      return "text-yellow-700 bg-yellow-50 border-yellow-200";
    default:
      return "text-gray-700 bg-gray-50 border-gray-200";
  }
}

function triggerIcon(trigger: string): string {
  switch (trigger) {
    case "ADMIN_REVIEW":
      return "mdi:account-tie";
    case "AGENT_DECISION":
      return "mdi:home-search";
    case "OWNER_RESUBMIT":
      return "mdi:refresh";
    case "DOC_UPLOAD":
      return "mdi:file-upload-outline";
    case "REWARD_REVERSED":
      return "mdi:cash-refund";
    case "BACKFILL":
      return "mdi:history";
    default:
      return "mdi:circle-medium";
  }
}

function triggerLabel(trigger: string): string {
  switch (trigger) {
    case "ADMIN_REVIEW":
      return "Admin review";
    case "AGENT_DECISION":
      return "Agent on-site decision";
    case "OWNER_RESUBMIT":
      return "Owner resubmission";
    case "DOC_UPLOAD":
      return "Document review";
    case "REWARD_REVERSED":
      return "Reward reversed";
    case "BACKFILL":
      return "Initial state";
    default:
      return trigger;
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const VerificationHistoryTimeline: React.FC<Props> = ({
  propertyId,
  verificationId,
}) => {
  const { data, isLoading } = GetVerificationHistory(
    propertyId,
    verificationId,
  );
  const items: HistoryItem[] = data?.data?.data?.items || [];

  return (
    <section className="my-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Icon icon="solar:history-3-bold-duotone" width="20" />
        </div>
        <h4 className="text-lg font-bold text-gray-800">
          Verification Activity
        </h4>
      </div>

      <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-5">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Icon icon="mdi:loading" className="animate-spin w-4 h-4" /> Loading
            activity...
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">
            No activity recorded yet.
          </p>
        ) : (
          <ol className="relative border-l-2 border-gray-200 ml-3 space-y-5">
            {items.map((it) => {
              const skip = it.skip_checks_used;
              const skipParts: string[] = [];
              if (skip?.kyc) skipParts.push("KYC");
              if (skip?.document) skipParts.push("document");

              return (
                <li key={it.id} className="ml-6">
                  <span className="absolute -left-[13px] flex items-center justify-center w-6 h-6 bg-white border-2 border-gray-200 rounded-full">
                    <Icon
                      icon={triggerIcon(it.trigger)}
                      className="w-3.5 h-3.5 text-gray-600"
                    />
                  </span>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {it.previous_status && (
                        <>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${statusColor(it.previous_status)}`}
                          >
                            {it.previous_status}
                          </span>
                          <Icon
                            icon="mdi:arrow-right"
                            className="w-4 h-4 text-gray-400"
                          />
                        </>
                      )}
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${statusColor(it.new_status)}`}
                      >
                        {it.new_status}
                      </span>
                      <span className="text-xs text-gray-500">
                        · {triggerLabel(it.trigger)}
                      </span>
                      {it.evidence_count !== null &&
                        it.evidence_count !== undefined &&
                        it.trigger === "AGENT_DECISION" && (
                          <span className="text-xs text-gray-500">
                            · {it.evidence_count} evidence
                          </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">
                        {it.performer_label || "System"}
                      </span>
                      {it.performer_role && (
                        <span className="text-gray-500">
                          {" "}
                          ({it.performer_role})
                        </span>
                      )}
                      <span className="text-gray-500">
                        {" "}
                        · {formatDate(it.created_at)}
                      </span>
                    </p>
                    {it.feedback && (
                      <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded px-2 py-1.5">
                        <span className="font-semibold">Feedback:</span>{" "}
                        {it.feedback}
                      </p>
                    )}
                    {skipParts.length > 0 && (
                      <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-100 rounded px-2 py-1.5 inline-flex items-center gap-1">
                        <Icon icon="mdi:alert" className="w-3.5 h-3.5" />
                        Skipped checks: {skipParts.join(", ")}
                      </p>
                    )}
                    {it.trigger === "REWARD_REVERSED" &&
                      it.reward_amount !== null && (
                        <p className="text-xs text-orange-700 bg-orange-50 border border-orange-100 rounded px-2 py-1.5">
                          Debited NGN{" "}
                          {Number(it.reward_amount).toLocaleString()} from the
                          agent who originally got credited.
                        </p>
                      )}
                    {it.trigger !== "REWARD_REVERSED" &&
                      it.reward_amount !== null &&
                      it.reward_amount !== undefined && (
                        <p className="text-xs text-green-700 bg-green-50 border border-green-100 rounded px-2 py-1.5">
                          Credited NGN{" "}
                          {Number(it.reward_amount).toLocaleString()} as
                          verification reward.
                        </p>
                      )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
};

export default VerificationHistoryTimeline;

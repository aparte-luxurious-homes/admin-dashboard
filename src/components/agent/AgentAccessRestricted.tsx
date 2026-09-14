"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { AgentApprovalStatus } from "@/src/lib/enums";
import type { IUser } from "@/src/lib/types";
import { AGENT_SUPPORT_EMAIL, getAgentApprovalStatus } from "@/src/lib/agentApproval";
import { GetMyKycDocuments } from "@/src/lib/request-handlers/kycMgt";
import AgentKycForm from "./AgentKycForm";

interface Props {
  user: IUser;
  onLogout: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

const COPY: Record<Exclude<AgentApprovalStatus, AgentApprovalStatus.ACTIVE>, {
  icon: string;
  tone: string;
  title: string;
  body: string;
}> = {
  [AgentApprovalStatus.PENDING_APPROVAL]: {
    icon: "mdi:account-clock-outline",
    tone: "text-amber-600 bg-amber-50",
    title: "Agent Access Restricted Pending Approval",
    body:
      "Your account and KYC submission are currently under review by our admin team. You will gain access to your agent dashboard once your account has been approved.",
  },
  [AgentApprovalStatus.KYC_PENDING]: {
    icon: "mdi:card-account-details-outline",
    tone: "text-primary bg-primary/10",
    title: "Complete your KYC verification",
    body:
      "Your agent account is not active yet. Submit your KYC details and identification document below so our admin team can review your account.",
  },
  [AgentApprovalStatus.REJECTED]: {
    icon: "mdi:account-cancel-outline",
    tone: "text-red-600 bg-red-50",
    title: "KYC Verification Unsuccessful",
    body: "Your KYC verification could not be approved at this time. Correct your information and resubmit your KYC below.",
  },
};

/**
 * What an agent sees in place of the dashboard until an admin approves them:
 * the explanation, and the KYC form itself, so the whole flow happens here.
 * The API enforces the restriction; this screen only explains it.
 */
const AgentAccessRestricted: React.FC<Props> = ({ user, onLogout, onRefresh, isRefreshing }) => {
  const status = getAgentApprovalStatus(user);
  const [editingPending, setEditingPending] = useState(false);
  const { data: kyc } = GetMyKycDocuments();

  if (!status || status === AgentApprovalStatus.ACTIVE) return null;
  const copy = COPY[status];
  const docs = kyc?.items ?? [];
  const showForm = status !== AgentApprovalStatus.PENDING_APPROVAL || editingPending;

  return (
    <main className="min-h-screen bg-[#F7F8F8] flex flex-col">
      <header className="bg-primary px-6 py-4 flex items-center justify-between">
        <Image src="/svg/logo_text_white.svg" alt="Aparte" height={120} width={120} />
        <button type="button" onClick={onLogout}
          className="inline-flex items-center gap-2 text-sm text-white/90 hover:text-white">
          <Icon icon="ic:baseline-logout" width="18" height="18" />
          Logout
        </button>
      </header>

      <div className="flex-1 flex justify-center px-4 py-8 sm:py-12">
        <section data-testid="agent-access-restricted" className="w-full max-w-3xl space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8 text-center">
            <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center ${copy.tone}`}>
              <Icon icon={copy.icon} className="w-8 h-8" />
            </div>
            <h1 className="mt-5 text-xl sm:text-2xl font-semibold text-gray-900">{copy.title}</h1>
            <p className="mt-3 text-sm text-gray-600 leading-relaxed">{copy.body}</p>

            {status === AgentApprovalStatus.PENDING_APPROVAL && (
              <p className="mt-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <span className="font-semibold">KYC Submitted Successfully.</span> Your KYC has been
                submitted and is currently pending verification.
              </p>
            )}

            {status === AgentApprovalStatus.REJECTED && user.agentApprovalRejectionReason && (
              <p className="mt-4 text-sm text-left text-red-800 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                <span className="font-semibold">Reason:</span> {user.agentApprovalRejectionReason}
              </p>
            )}

            <p className="mt-4 text-sm text-gray-600">
              For further enquiries, contact{" "}
              <a href={`mailto:${AGENT_SUPPORT_EMAIL}`} className="text-primary font-semibold hover:underline">
                {AGENT_SUPPORT_EMAIL}
              </a>
              .
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              {status === AgentApprovalStatus.PENDING_APPROVAL && !editingPending && (
                <button type="button" onClick={() => setEditingPending(true)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50">
                  <Icon icon="mdi:pencil-outline" className="w-4 h-4" />
                  Update your submission
                </button>
              )}
              <button type="button" onClick={onRefresh} disabled={isRefreshing}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
                <Icon icon={isRefreshing ? "mdi:loading" : "mdi:refresh"}
                  className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Check approval status
              </button>
            </div>
          </div>

          {showForm && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sm:p-8">
              <h2 className="text-base font-semibold text-gray-900 mb-1">KYC verification</h2>
              <p className="text-sm text-gray-500 mb-6">All fields are required.</p>
              <AgentKycForm
                user={user}
                onSubmitted={() => setEditingPending(false)}
                onCancel={status === AgentApprovalStatus.PENDING_APPROVAL ? () => setEditingPending(false) : undefined}
              />
            </div>
          )}

          {docs.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Your submitted documents</h2>
              <ul className="divide-y divide-gray-100">
                {docs.map((d) => (
                  <li key={d.id} className="py-2 flex items-center justify-between gap-3 text-sm">
                    <span className="text-gray-800">{d.document_type.replace(/_/g, " ")}</span>
                    <span className="text-gray-500">{new Date(d.created_at).toLocaleDateString("en-NG")}</span>
                    <a href={d.document_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                      View
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default AgentAccessRestricted;

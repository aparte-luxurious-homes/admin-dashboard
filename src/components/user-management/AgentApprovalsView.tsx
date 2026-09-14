"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import BreadCrumb from "@/src/components/breadcrumb";
import { useTableState } from "@/src/hooks/useTableState";
import { AgentApprovalStatus } from "@/src/lib/enums";
import { AGENT_APPROVAL_STATUS_META } from "@/src/lib/agentApproval";
import { AgentApprovalRow, GetAgentApprovals } from "@/src/lib/request-handlers/userMgt";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import { DocumentCard } from "./KycReviewPanel";
import AgentApprovalActions from "./AgentApprovalActions";

const PAGE_SIZE = 20;
const DEFAULT_STATUS = AgentApprovalStatus.PENDING_APPROVAL;

const STATUS_TABS: { value: string; label: string }[] = [
  { value: AgentApprovalStatus.PENDING_APPROVAL, label: "Pending approval" },
  { value: AgentApprovalStatus.KYC_PENDING, label: "KYC not submitted" },
  { value: AgentApprovalStatus.REJECTED, label: "Rejected" },
  { value: AgentApprovalStatus.ACTIVE, label: "Active" },
  { value: "ALL", label: "All" },
];

const SORT_OPTIONS = [
  { value: "submitted_asc", label: "Oldest submission first" },
  { value: "submitted_desc", label: "Newest submission first" },
  { value: "newest", label: "Newest sign-up first" },
];

function fullName(row: AgentApprovalRow): string {
  return [row.first_name, row.last_name].filter(Boolean).join(" ") || "(no name)";
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export function ApprovalStatusPill({ status }: { status: string | null }) {
  if (!status) return null;
  const meta = AGENT_APPROVAL_STATUS_META[status as AgentApprovalStatus];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
        meta?.className ?? "bg-gray-100 text-gray-700 border-gray-200"
      }`}
    >
      {meta?.label ?? status}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</dt>
      <dd className="text-sm text-gray-900 mt-0.5 break-words">{value || "—"}</dd>
    </div>
  );
}

function ReviewDrawer({ row, onClose }: { row: AgentApprovalRow; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Review agent">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-2xl h-full bg-white shadow-xl overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 truncate">{fullName(row)}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <ApprovalStatusPill status={row.approval_status} />
              <Link
                href={PAGE_ROUTES.dashboard.userManagement.agents.details(row.user_id as any)}
                className="text-xs text-primary hover:underline"
              >
                Open full profile
              </Link>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-lg hover:bg-gray-100">
            <Icon icon="mdi:close" className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-6">
          {row.approval_status === AgentApprovalStatus.REJECTED && row.rejection_reason && (
            <p className="text-sm text-red-800 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <span className="font-semibold">Rejected{row.decided_by_label ? ` by ${row.decided_by_label}` : ""}:</span>{" "}
              {row.rejection_reason}
            </p>
          )}

          <section>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Registration</h4>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailRow label="Email" value={row.email} />
              <DetailRow label="Phone" value={row.phone} />
              <DetailRow label="Signed up" value={formatDate(row.created_at)} />
              <DetailRow label="Sign-up channel" value={row.signup_source} />
              <DetailRow label="OTP verified" value={row.is_verified ? "Yes" : "No"} />
              <DetailRow label="KYC submitted" value={formatDate(row.kyc_submitted_at)} />
            </dl>
          </section>

          <section>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Personal information</h4>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailRow label="First name" value={row.first_name} />
              <DetailRow label="Last name" value={row.last_name} />
              <DetailRow label="Date of birth" value={row.dob} />
              <DetailRow label="Gender" value={row.gender} />
            </dl>
          </section>

          <section>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Location</h4>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <DetailRow label="Address" value={row.address} />
              </div>
              <DetailRow label="City / Town" value={row.city} />
              <DetailRow label="State / Region" value={row.state} />
              <DetailRow label="Country" value={row.country} />
            </dl>
          </section>

          <section>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Identification ({row.documents.length})
            </h4>
            {row.documents.length === 0 ? (
              <p className="text-sm text-gray-500">No documents uploaded yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {row.documents.map((d) => (
                  <DocumentCard
                    key={d.id}
                    doc={{
                      id: d.id,
                      documentType: d.document_type,
                      documentUrl: d.document_url,
                      status: d.status,
                      rejectionReason: d.rejection_reason,
                      lastResubmittedAt: null,
                      createdAt: d.created_at,
                      updatedAt: d.updated_at,
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        {row.approval_status !== AgentApprovalStatus.ACTIVE && (
          <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-4">
            <AgentApprovalActions userId={row.user_id} status={row.approval_status} onDone={onClose} />
          </div>
        )}
      </div>
    </div>
  );
}

const AgentApprovalsView: React.FC = () => {
  const table = useTableState({ filterKeys: ["status"], defaultSort: "submitted_asc" });
  const status = table.filters.status || DEFAULT_STATUS;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, isFetching, refetch } = GetAgentApprovals({
    page: table.page,
    size: PAGE_SIZE,
    status,
    search: table.debouncedSearch,
    sort_by: table.sort,
  });

  const payload = data?.data?.data || {};
  const items: AgentApprovalRow[] = useMemo(() => data?.data?.data?.items ?? [], [data]);
  const total: number = payload.total || 0;
  const kpis: Record<string, number> = payload.kpis || {};
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  // Look the row up by id so the drawer reflects a refetch rather than a stale copy.
  const selected = useMemo(() => items.find((i) => i.user_id === selectedId) ?? null, [items, selectedId]);

  return (
    <div className="p-[20px] mr-5 ml-5 mt-5 mb-100 border border-[#D9D9D9] rounded-[15px] bg-white shadow-md min-h-[calc(100vh-150px)]">
      <BreadCrumb
        description=""
        active="Agent Approvals"
        link_one="/user-management/agents"
        link_one_name="User Management"
      />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 mt-2">
        <div>
          <h3 className="font-semibold text-lg">Agent Approvals</h3>
          <p className="text-sm text-gray-500">
            New agents cannot use their dashboard until you approve their KYC.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50 flex items-center gap-2"
          disabled={isFetching}
        >
          <Icon icon={isFetching ? "mdi:loading" : "mdi:refresh"} className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STATUS_TABS.filter((t) => t.value !== "ALL").map((t) => {
          const active = status === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => table.setFilter("status", t.value === DEFAULT_STATUS ? "" : t.value)}
              className={`text-left rounded-2xl p-4 border transition-colors ${
                active ? "bg-primary/5 border-primary/40" : "bg-gray-50/50 border-gray-100 hover:border-gray-300"
              }`}
            >
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{kpis[t.value] ?? 0}</p>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Icon icon="mdi:magnify" className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={table.search}
            onChange={(e) => table.setSearch(e.target.value)}
            placeholder="Search name, email or phone"
            aria-label="Search agents"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          />
        </div>
        <select
          value={status}
          onChange={(e) => table.setFilter("status", e.target.value === DEFAULT_STATUS ? "" : e.target.value)}
          aria-label="Filter by status"
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
        >
          {STATUS_TABS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <select
          value={table.sort}
          onChange={(e) => table.setSort(e.target.value)}
          aria-label="Sort"
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="border border-gray-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left font-semibold px-4 py-3">Agent</th>
                <th className="text-left font-semibold px-4 py-3">Email</th>
                <th className="text-left font-semibold px-4 py-3">Location</th>
                <th className="text-left font-semibold px-4 py-3">Submitted</th>
                <th className="text-left font-semibold px-4 py-3">Status</th>
                <th className="text-right font-semibold px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                  <Icon icon="mdi:check-circle-outline" className="w-10 h-10 mx-auto text-green-500 mb-2" />
                  {status === DEFAULT_STATUS && !table.debouncedSearch
                    ? "No agents are waiting for approval."
                    : "No agents match these filters."}
                </td></tr>
              ) : items.map((row) => (
                <tr key={row.user_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{fullName(row)}</p>
                    {row.phone && <p className="text-xs text-gray-500">{row.phone}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{row.email || "—"}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {[row.city, row.state].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{formatDate(row.kyc_submitted_at)}</td>
                  <td className="px-4 py-3"><ApprovalStatusPill status={row.approval_status} /></td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedId(row.user_id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary border border-primary/30 rounded-lg hover:bg-primary/5"
                    >
                      Review <Icon icon="mdi:chevron-right" className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500">Page {table.page} of {totalPages} ({total} total)</p>
            <div className="flex gap-2">
              <button
                disabled={table.page <= 1}
                onClick={() => table.setPage(table.page - 1)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50"
              >Previous</button>
              <button
                disabled={table.page >= totalPages}
                onClick={() => table.setPage(table.page + 1)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50"
              >Next</button>
            </div>
          </div>
        )}
      </div>

      {selected && <ReviewDrawer row={selected} onClose={() => setSelectedId(null)} />}
    </div>
  );
};

export default AgentApprovalsView;

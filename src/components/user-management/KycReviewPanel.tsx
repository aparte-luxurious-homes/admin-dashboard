"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import { KycStatus, UserRole } from "@/src/lib/enums";
import { UpdateUserKyc } from "@/src/lib/request-handlers/userMgt";
import { usePermissions } from "@/src/hooks/usePermissions";
import type { KycDocument, UserDetail } from "./user-detail.types";
import KycUploadOnBehalfModal from "./KycUploadOnBehalfModal";

// Roles that can upload KYC documents on behalf of a user. Mirrors the backend
// gate at /admin/users/{id}/kyc/documents (services/users/router.py). SUPPORT_ADMIN
// is intentionally excluded — they decide on submitted docs, they don't submit.
const KYC_UPLOAD_ROLES = new Set<string>([
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.OPERATIONS_ADMIN,
]);

interface Props {
  user: UserDetail;
  onUpdate?: () => void;
}

const STATUS_OPTIONS = [
  {
    value: KycStatus.PENDING,
    label: "Pending",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  {
    value: KycStatus.VERIFIED,
    label: "Verified",
    color: "bg-green-100 text-green-700 border-green-200",
  },
  {
    value: KycStatus.REJECTED,
    label: "Rejected",
    color: "bg-red-100 text-red-700 border-red-200",
  },
];

function statusPill(status: string) {
  const opt = STATUS_OPTIONS.find((o) => o.value === status) || {
    value: status,
    label: status,
    color: "bg-gray-100 text-gray-700 border-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${opt.color}`}
    >
      {opt.label}
    </span>
  );
}

function isImage(url: string): boolean {
  return /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(url);
}

function isPdf(url: string): boolean {
  return /\.pdf(\?|$)/i.test(url);
}

const DocumentCard: React.FC<{ doc: KycDocument }> = ({ doc }) => {
  const url = doc.documentUrl;
  const friendlyType = doc.documentType.replace(/_/g, " ");
  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
      <div className="bg-gray-100 h-40 flex items-center justify-center overflow-hidden">
        {url && isImage(url) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={friendlyType}
            className="w-full h-full object-cover"
          />
        ) : url && isPdf(url) ? (
          <div className="flex flex-col items-center text-gray-500 gap-1">
            <Icon icon="mdi:file-pdf-box" className="w-12 h-12 text-red-500" />
            <span className="text-xs">PDF Document</span>
          </div>
        ) : (
          <Icon
            icon="mdi:file-document-outline"
            className="w-12 h-12 text-gray-400"
          />
        )}
      </div>
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p
              className="text-sm font-semibold text-gray-800 truncate"
              title={friendlyType}
            >
              {friendlyType}
            </p>
            {doc.createdAt && (
              <p className="text-xs text-gray-500 mt-0.5">
                Uploaded{" "}
                {new Date(doc.createdAt).toLocaleDateString("en-NG", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
          {statusPill(doc.status)}
        </div>
        {doc.rejectionReason && (
          <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded px-2 py-1.5">
            <span className="font-semibold">Rejection reason:</span>{" "}
            {doc.rejectionReason}
          </p>
        )}
        {doc.lastResubmittedAt && (
          <p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded px-2 py-1.5">
            Superseded by a resubmission on{" "}
            {new Date(doc.lastResubmittedAt).toLocaleDateString()}
          </p>
        )}
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <Icon icon="mdi:open-in-new" className="w-4 h-4" /> Open document
          </a>
        )}
      </div>
    </div>
  );
};

const KycReviewPanel: React.FC<Props> = ({ user, onUpdate }) => {
  const docs = user.kycDocuments || [];
  const profile = user.profile;
  const currentStatus = profile.kycStatus || KycStatus.PENDING;

  const [isEditing, setIsEditing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>(currentStatus);
  const [reason, setReason] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);

  const { role } = usePermissions();
  const canUploadOnBehalf = !!role && KYC_UPLOAD_ROLES.has(role);

  const updateMutation = UpdateUserKyc();

  const reasonRequired = selectedStatus === KycStatus.REJECTED;
  const reasonValid = !reasonRequired || reason.trim().length > 0;
  const submitDisabled =
    updateMutation.isPending ||
    !reasonValid ||
    (selectedStatus === currentStatus && !reasonRequired);

  const onSubmit = () => {
    if (!reasonValid) {
      toast.error("Please provide a rejection reason");
      return;
    }
    updateMutation.mutate(
      {
        userId: user.id,
        payload: {
          status: selectedStatus as "PENDING" | "VERIFIED" | "REJECTED",
          ...(selectedStatus === KycStatus.REJECTED
            ? { rejection_reason: reason.trim() }
            : {}),
        },
      },
      {
        onSuccess: () => {
          toast.success("KYC status updated");
          setIsEditing(false);
          setReason("");
          onUpdate?.();
        },
        onError: (err: any) => {
          const detail = err?.response?.data?.detail;
          if (Array.isArray(detail) && detail.length) {
            toast.error(detail[0]?.msg || "Failed to update KYC status");
          } else {
            toast.error(
              typeof detail === "string"
                ? detail
                : "Failed to update KYC status",
            );
          }
        },
      },
    );
  };

  return (
    <section className="mt-6 space-y-6">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Icon icon="solar:shield-check-bold-duotone" width="20" />
        </div>
        <h4 className="text-lg font-bold text-gray-800">KYC Review</h4>
      </div>

      {/* Profile + status header */}
      <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Current status
              </span>
              {statusPill(currentStatus)}
              {profile.kycProvider && currentStatus === KycStatus.VERIFIED && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  <Icon icon="mdi:robot" className="w-3.5 h-3.5" />
                  Auto-verified by {profile.kycProvider}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-600">
              {profile.nin && (
                <span>
                  <span className="font-semibold">NIN:</span>{" "}
                  {maskId(profile.nin)}
                </span>
              )}
              {profile.bvn && (
                <span>
                  <span className="font-semibold">BVN:</span>{" "}
                  {maskId(profile.bvn)}
                </span>
              )}
              {profile.dob && (
                <span>
                  <span className="font-semibold">DOB:</span> {profile.dob}
                </span>
              )}
            </div>
          </div>
          {!isEditing && (
            <div className="flex items-center gap-2">
              {canUploadOnBehalf && (
                <button
                  onClick={() => setUploadOpen(true)}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm text-gray-700 font-medium flex items-center gap-2"
                  title="Upload KYC document on behalf of this user"
                >
                  <Icon icon="mdi:cloud-upload-outline" className="w-4 h-4" />
                  Upload on behalf
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedStatus(currentStatus);
                  setReason("");
                  setIsEditing(true);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm text-gray-700 font-medium flex items-center gap-2"
              >
                <Icon icon="mdi:pencil" className="w-4 h-4" /> Update status
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Uploaded documents */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Uploaded documents ({docs.length})
        </p>
        {docs.length === 0 ? (
          <div className="text-sm text-gray-500 bg-gray-50/50 border border-dashed border-gray-200 rounded-xl px-4 py-8 text-center">
            No KYC documents uploaded yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {docs.map((d) => (
              <DocumentCard key={d.id} doc={d} />
            ))}
          </div>
        )}
      </div>

      {/* Decision panel */}
      {isEditing && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              New status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium bg-white"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          {reasonRequired && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Rejection reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Tell the user what to fix so they can resubmit..."
                className={`w-full max-w-md px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none min-h-[80px] ${reason.trim() ? "border-gray-300" : "border-red-200 bg-red-50/50"}`}
              />
              {!reason.trim() && (
                <p className="text-xs text-red-600">Required when rejecting.</p>
              )}
            </div>
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={onSubmit}
              disabled={submitDisabled}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateMutation.isPending ? (
                <>
                  <Icon icon="mdi:loading" className="animate-spin w-4 h-4" />{" "}
                  Saving...
                </>
              ) : (
                <>
                  <Icon icon="mdi:content-save" className="w-4 h-4" /> Save
                  decision
                </>
              )}
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setSelectedStatus(currentStatus);
                setReason("");
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm text-gray-700 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {canUploadOnBehalf && (
        <KycUploadOnBehalfModal
          isOpen={uploadOpen}
          onClose={() => setUploadOpen(false)}
          userId={user.id}
          userLabel={
            [profile.firstName, profile.lastName]
              .filter(Boolean)
              .join(" ")
              .trim() ||
            user.email ||
            undefined
          }
          onUploaded={onUpdate}
        />
      )}
    </section>
  );
};

function maskId(value: string): string {
  if (!value) return "";
  if (value.length <= 4) return value;
  return (
    value.slice(0, 2) +
    "•".repeat(Math.max(0, value.length - 4)) +
    value.slice(-2)
  );
}

export default KycReviewPanel;

"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { UserDetail } from "./user-detail.types";
import { useAuth } from "@/src/hooks/useAuth";
import { canFixEmailFor, canViewEmailHealth } from "@/src/lib/request-handlers/emailHealthMgt";
import FixEmailDialog from "./email-health/FixEmailDialog";
import { formatBounceDate } from "./email-health/EmailHealthChip";

interface UserDetailsPanelProps {
  user: UserDetail;
  /** Refetch the user after an in-place change (e.g. a fixed email). */
  onUpdated?: () => void;
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value || "--/--"}</p>
    </div>
  );
}

/**
 * The email field, plus — for staff, when our emails are bouncing off it —
 * why and since when. The "Fix email" button is narrower than the badge:
 * SUPPORT_ADMIN sees the problem but cannot change the address, and only a
 * SUPER_ADMIN may change a staff account's address (canFixEmailFor).
 */
function EmailField({ user, onUpdated }: { user: UserDetail; onUpdated?: () => void }) {
  const { user: viewer } = useAuth();
  const [isFixOpen, setIsFixOpen] = useState(false);
  const mayFix = canFixEmailFor(viewer?.role, user.role);
  const bouncing =
    canViewEmailHealth(viewer?.role) &&
    (user.emailStatus === "BOUNCING" || user.emailStatus === "UNDELIVERABLE");

  if (!bouncing) return <Field label="Email Address" value={user.email} />;

  const undeliverable = user.emailStatus === "UNDELIVERABLE";
  const since = formatBounceDate(user.emailBouncedAt);
  const fullName =
    [user.profile.firstName, user.profile.lastName].filter(Boolean).join(" ") || null;

  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email Address</p>
      <div className="flex flex-wrap items-center gap-2">
        <p className={`text-sm font-medium break-all ${undeliverable ? "text-red-700" : "text-amber-700"}`}>
          {user.email || "--/--"}
        </p>
        {mayFix && (
          <button
            type="button"
            onClick={() => setIsFixOpen(true)}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5"
          >
            <Icon icon="mdi:email-edit-outline" className="w-3.5 h-3.5" />
            Fix email
          </button>
        )}
      </div>
      <p className="text-xs text-gray-600">
        Emails to this address aren&apos;t arriving.
        {user.emailBounceReason ? ` ${user.emailBounceReason}` : ""}
        {since ? ` Since ${since}.` : ""}
      </p>
      {user.emailSuggestion && (
        <p className="text-xs text-amber-700">Did they mean {user.emailSuggestion}?</p>
      )}
      {mayFix && (
        <FixEmailDialog
          isOpen={isFixOpen}
          onClose={() => setIsFixOpen(false)}
          userId={user.id}
          userLabel={fullName}
          currentEmail={user.email}
          suggestion={user.emailSuggestion}
          reason={user.emailBounceReason}
          onFixed={onUpdated}
        />
      )}
    </div>
  );
}

const UserDetailsPanel: React.FC<UserDetailsPanelProps> = ({ user, onUpdated }) => {
  const p = user.profile;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Personal Information */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Icon icon="solar:user-bold-duotone" width="20" />
          </div>
          <h4 className="text-lg font-bold text-gray-800">Personal Information</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
          <Field label="First Name" value={p.firstName} />
          <Field label="Last Name" value={p.lastName} />
          <Field label="Gender" value={p.gender} />
          <Field
            label="Date of Birth"
            value={
              p.dob
                ? new Date(p.dob).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : null
            }
          />
          <div className="sm:col-span-2">
            <Field label="Bio" value={p.bio} />
          </div>
        </div>
      </div>

      {/* Account & Contact */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Icon icon="solar:settings-bold-duotone" width="20" />
          </div>
          <h4 className="text-lg font-bold text-gray-800">Account & Contact</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
          <div className="sm:col-span-2">
            <EmailField user={user} onUpdated={onUpdated} />
          </div>
          <div className="sm:col-span-2">
            <Field label="Phone Number" value={user.phone} />
          </div>
          <Field label="Address" value={p.address} />
          <Field label="City" value={p.city} />
          <Field label="State" value={p.state} />
          <Field label="Country" value={p.country} />
        </div>
      </div>
    </div>
  );
};

export default UserDetailsPanel;

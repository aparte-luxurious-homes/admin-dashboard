"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { UserDetail } from "./user-detail.types";

interface UserDetailsPanelProps {
  user: UserDetail;
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value || "--/--"}</p>
    </div>
  );
}

const UserDetailsPanel: React.FC<UserDetailsPanelProps> = ({ user }) => {
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
            <Field label="Email Address" value={user.email} />
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

"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import { UpdateUser } from "@/src/lib/request-handlers/userMgt";
import { useAuth } from "@/src/hooks/useAuth";
import { UserRole } from "@/src/lib/enums";

interface Props {
  userId: string;
  currentValue: boolean;
  onUpdate?: () => void;
}

/**
 * Per-user "allow magic OTP" toggle.
 *
 * Used by support to unblock specific stuck users (typically agents who
 * can't receive SMS or email OTPs). When enabled, the user can verify
 * with the global TEST_OTP_CODE without flipping TEST_OTP_ENABLED for
 * the entire system. Toggle should be turned off again once the user
 * is unblocked — every flip is audit-logged via the admin user-update.
 */
const AllowMagicOtpToggle: React.FC<Props> = ({ userId, currentValue, onUpdate }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN;
  const [pending, setPending] = useState(currentValue);
  const updateMutation = UpdateUser();

  if (!isAdmin) return null;

  const dirty = pending !== currentValue;

  const handleSave = () => {
    const action = pending ? "ENABLE" : "DISABLE";
    const confirmed = window.confirm(
      `${action} the magic OTP override for this user?\n\n` +
      (pending
        ? "They'll be able to verify with the test code (000000) until you turn this off. Use only for stuck users."
        : "They'll lose magic-OTP access immediately."),
    );
    if (!confirmed) return;

    updateMutation.mutate(
      { userId, payload: { allow_magic_otp: pending } },
      {
        onSuccess: () => {
          toast.success(
            `Magic OTP override ${pending ? "enabled" : "disabled"} for this user.`,
          );
          onUpdate?.();
        },
        onError: (error: any) => {
          toast.error(
            error?.response?.data?.message ?? "Failed to update magic OTP override.",
          );
          setPending(currentValue);
        },
      },
    );
  };

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
          <Icon icon="solar:key-bold-duotone" width="20" />
        </div>
        <h4 className="text-lg font-bold text-gray-800">Magic OTP Override</h4>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
          Support tool
        </span>
      </div>
      <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1 max-w-xl">
            <p className="text-sm text-gray-700">
              Lets this user verify with the staging test code{" "}
              <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">000000</code>{" "}
              when SMS and email OTPs aren't reaching them. Turn off again once
              they're unblocked.
            </p>
            <p className="text-xs text-gray-400">
              Every change is audit-logged.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`text-sm font-medium ${pending ? "text-amber-600" : "text-gray-500"}`}
            >
              {pending ? "Enabled" : "Disabled"}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={pending}
              onClick={() => setPending(!pending)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                pending ? "bg-amber-500" : "bg-gray-200"
              }`}
            >
              <span
                className={`${
                  pending ? "translate-x-6" : "translate-x-1"
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </button>
          </div>
        </div>

        {dirty && (
          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              {updateMutation.isPending ? (
                <><Icon icon="mdi:loading" className="animate-spin w-4 h-4" /> Saving…</>
              ) : (
                <><Icon icon="mdi:content-save" className="w-4 h-4" /> Save</>
              )}
            </button>
            <button
              onClick={() => setPending(currentValue)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm text-gray-700 font-medium"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllowMagicOtpToggle;

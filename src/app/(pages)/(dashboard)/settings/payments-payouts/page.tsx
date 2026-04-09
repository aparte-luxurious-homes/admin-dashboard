"use client";

import BreadCrumb from "@/src/components/breadcrumb";
import Button from "@/src/components/button";
import { Icon } from "@iconify/react";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  GetIntegrationConfigs,
  UpdateIntegrationConfig,
} from "@/src/lib/request-handlers/integrationsMgt";

const DISBURSEMENT_KEY = "DISBURSEMENT_PROVIDER";
const REWARD_ENABLED_KEY = "PROPERTY_VERIFICATION_REWARD_ENABLED";
const REWARD_AMOUNT_KEY = "PROPERTY_VERIFICATION_REWARD_AMOUNT";

interface ProviderOption {
  value: string;
  label: string;
  description: string;
  icon: string;
}

const providerOptions: ProviderOption[] = [
  {
    value: "MONNIFY",
    label: "Monnify",
    description: "Bank transfer disbursements",
    icon: "mdi:bank-transfer",
  },
  {
    value: "PAYSTACK",
    label: "Paystack",
    description: "Card & bank disbursements",
    icon: "mdi:credit-card-check",
  },
  {
    value: "FLUTTERWAVE",
    label: "Flutterwave",
    description: "Multi-channel disbursements",
    icon: "mdi:wave",
  },
];

const toastStyle = {
  duration: 3000,
  style: { maxWidth: "500px", width: "max-content" as const },
};

const PaymentPayout = () => {
  const { data, isLoading, isError } = GetIntegrationConfigs();
  const mutation = UpdateIntegrationConfig();
  const rewardMutation = UpdateIntegrationConfig();

  const configs = data?.data?.data ?? data?.data ?? [];

  // --- Disbursement provider state ---
  const disbursementConfig = configs.find(
    (c: { key: string }) => c.key === DISBURSEMENT_KEY
  );
  const currentProvider: string = disbursementConfig?.value ?? "";
  const updatedAt: string | undefined = disbursementConfig?.updated_at;

  const [userSelected, setUserSelected] = useState<string | null>(null);
  const selectedProvider = userSelected ?? currentProvider;
  const hasChanges = userSelected !== null && userSelected !== currentProvider;

  useEffect(() => {
    if (userSelected && userSelected === currentProvider) {
      setUserSelected(null);
    }
  }, [currentProvider, userSelected]);

  // --- Reward feature state ---
  const rewardEnabledConfig = configs.find(
    (c: { key: string }) => c.key === REWARD_ENABLED_KEY
  );
  const rewardAmountConfig = configs.find(
    (c: { key: string }) => c.key === REWARD_AMOUNT_KEY
  );
  const currentRewardEnabled =
    rewardEnabledConfig?.value?.toLowerCase() === "true";
  const currentRewardAmount: string = rewardAmountConfig?.value ?? "500.00";

  const [pendingRewardEnabled, setPendingRewardEnabled] = useState<
    boolean | null
  >(null);
  const [pendingRewardAmount, setPendingRewardAmount] = useState<string | null>(
    null
  );

  const rewardEnabled = pendingRewardEnabled ?? currentRewardEnabled;
  const rewardAmount = pendingRewardAmount ?? currentRewardAmount;
  const hasRewardChanges =
    (pendingRewardEnabled !== null &&
      pendingRewardEnabled !== currentRewardEnabled) ||
    (pendingRewardAmount !== null && pendingRewardAmount !== currentRewardAmount);

  useEffect(() => {
    if (
      pendingRewardEnabled !== null &&
      pendingRewardEnabled === currentRewardEnabled
    ) {
      setPendingRewardEnabled(null);
    }
    if (
      pendingRewardAmount !== null &&
      pendingRewardAmount === currentRewardAmount
    ) {
      setPendingRewardAmount(null);
    }
  }, [
    currentRewardEnabled,
    currentRewardAmount,
    pendingRewardEnabled,
    pendingRewardAmount,
  ]);

  // --- Handlers ---
  const handleSave = () => {
    if (!hasChanges) return;

    const providerLabel =
      providerOptions.find((p) => p.value === selectedProvider)?.label ??
      selectedProvider;

    const confirmed = window.confirm(
      `Are you sure you want to switch the disbursement provider to ${providerLabel}? This will affect all future withdrawal disbursements.`
    );
    if (!confirmed) return;

    mutation.mutate(
      { key: DISBURSEMENT_KEY, payload: { value: selectedProvider } },
      {
        onSuccess: (res) => {
          toast.success(
            res?.data?.message ?? "Disbursement provider updated successfully.",
            toastStyle
          );
        },
        onError: (error: any) => {
          toast.error(
            error?.response?.data?.message ??
              "Failed to update disbursement provider.",
            toastStyle
          );
        },
      }
    );
  };

  const handleRewardSave = () => {
    if (!hasRewardChanges) return;

    const enabledChanged =
      pendingRewardEnabled !== null &&
      pendingRewardEnabled !== currentRewardEnabled;
    const amountChanged =
      pendingRewardAmount !== null && pendingRewardAmount !== currentRewardAmount;

    const parsedAmount = parseFloat(rewardAmount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      toast.error("Please enter a valid reward amount.", toastStyle);
      return;
    }

    const saveAmount = (afterEnabledSave?: boolean) => {
      if (!amountChanged && !afterEnabledSave) return;
      rewardMutation.mutate(
        {
          key: REWARD_AMOUNT_KEY,
          payload: { value: String(parsedAmount.toFixed(2)) },
        },
        {
          onSuccess: () => {
            if (!enabledChanged) {
              toast.success("Reward settings saved.", toastStyle);
            }
          },
          onError: (error: any) => {
            toast.error(
              error?.response?.data?.message ?? "Failed to save reward amount.",
              toastStyle
            );
          },
        }
      );
    };

    if (enabledChanged) {
      rewardMutation.mutate(
        {
          key: REWARD_ENABLED_KEY,
          payload: { value: String(rewardEnabled) },
        },
        {
          onSuccess: (res) => {
            if (amountChanged) {
              saveAmount(true);
            } else {
              toast.success(
                res?.data?.message ?? "Reward settings saved.",
                toastStyle
              );
            }
          },
          onError: (error: any) => {
            toast.error(
              error?.response?.data?.message ??
                "Failed to save reward settings.",
              toastStyle
            );
          },
        }
      );
    } else if (amountChanged) {
      saveAmount();
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("en-NG", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return iso;
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="p-[30px] mt-10 mb-100 border border-[#D9D9D9] rounded-[15px] bg-white shadow-md min-h-[calc(100vh-150px)]">
        <BreadCrumb
          description=""
          active="Payments & Payouts"
          link_one="/settings"
          link_one_name="Settings"
        />
        <div className="mt-8 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-72 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-96 mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 bg-gray-100 rounded-xl border border-gray-200"
              />
            ))}
          </div>
          <div className="h-40 bg-gray-100 rounded-xl border border-gray-200 mt-8" />
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="p-[30px] mt-10 mb-100 border border-[#D9D9D9] rounded-[15px] bg-white shadow-md min-h-[calc(100vh-150px)]">
        <BreadCrumb
          description=""
          active="Payments & Payouts"
          link_one="/settings"
          link_one_name="Settings"
        />
        <div className="mt-8 flex flex-col items-center justify-center py-20">
          <Icon
            icon="mdi:alert-circle-outline"
            width="48"
            height="48"
            className="text-red-400 mb-4"
          />
          <p className="text-gray-600 text-lg font-medium">
            Failed to load integration configurations.
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Please refresh the page or try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-[30px] mt-10 mb-100 border border-[#D9D9D9] rounded-[15px] bg-white shadow-md min-h-[calc(100vh-150px)]">
      <BreadCrumb
        description=""
        active="Payments & Payouts"
        link_one="/settings"
        link_one_name="Settings"
      />

      <div className="mt-8">
        <h3 className="text-xl font-semibold text-gray-900">
          Payments & Payouts Configuration
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Manage payment gateway settings for the platform.
        </p>
      </div>

      {/* Disbursement Provider Card */}
      <div className="mt-8 p-6 border border-[#E4E7EC] rounded-xl bg-white">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h4 className="text-lg font-semibold text-gray-800">
              Disbursement Provider
            </h4>
            <p className="text-sm text-gray-500 mt-1">
              Select which payment gateway processes withdrawal disbursements.
            </p>
          </div>
          {currentProvider && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Active: {currentProvider}
            </span>
          )}
        </div>

        {/* Provider Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          {providerOptions.map((provider) => {
            const isSelected = selectedProvider === provider.value;
            const isCurrent = currentProvider === provider.value;

            return (
              <button
                key={provider.value}
                type="button"
                onClick={() => setUserSelected(provider.value)}
                className={`
                  relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all cursor-pointer text-center
                  ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-[#E4E7EC] bg-white hover:border-gray-300 hover:bg-gray-50"
                  }
                `}
              >
                {/* Selection indicator */}
                <div
                  className={`
                    absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                    ${
                      isSelected
                        ? "border-primary bg-primary"
                        : "border-gray-300 bg-white"
                    }
                  `}
                >
                  {isSelected && (
                    <Icon
                      icon="mdi:check"
                      width="14"
                      height="14"
                      className="text-white"
                    />
                  )}
                </div>

                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center transition-colors
                    ${isSelected ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-500"}
                  `}
                >
                  <Icon icon={provider.icon} width="28" height="28" />
                </div>

                <div>
                  <p className="font-semibold text-gray-800">{provider.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {provider.description}
                  </p>
                </div>

                {isCurrent && (
                  <span className="text-[10px] font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    Current
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Last updated timestamp */}
        {updatedAt && (
          <p className="text-xs text-gray-400 mt-4">
            Last updated: {formatDate(updatedAt)}
          </p>
        )}

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <div className="w-full sm:w-auto">
            <Button
              variant="primaryoutline"
              buttonSize="medium"
              color="btnfontprimary"
              buttonName="Save Changes"
              disabled={!hasChanges || mutation.isPending}
              isLoading={mutation.isPending}
              onClick={handleSave}
            />
          </div>
        </div>
      </div>

      {/* Property Verification Reward Card */}
      <div className="mt-6 p-6 border border-[#E4E7EC] rounded-xl bg-white">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-lg font-semibold text-gray-800">
                Property Verification Reward
              </h4>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                Marketing
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Credit the assigned agent&apos;s wallet when a property is
              verified. Toggle off to disable at any time.
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              currentRewardEnabled
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-gray-50 text-gray-500 border-gray-200"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${currentRewardEnabled ? "bg-green-500" : "bg-gray-400"}`}
            />
            {currentRewardEnabled ? "Enabled" : "Disabled"}
          </span>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row sm:items-start gap-6">
          {/* Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPendingRewardEnabled(!rewardEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none ${
                rewardEnabled ? "bg-primary" : "bg-gray-200"
              }`}
              aria-label="Toggle property verification reward"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  rewardEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-sm font-medium text-gray-700">
              {rewardEnabled ? "On" : "Off"}
            </span>
          </div>

          {/* Amount input */}
          <div className="flex-1 max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reward Amount (₦)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 text-sm pointer-events-none">
                ₦
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={rewardAmount}
                onChange={(e) => setPendingRewardAmount(e.target.value)}
                disabled={!rewardEnabled}
                className="w-full h-[46px] pl-7 pr-3 border border-[#d1d5db] rounded-lg bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Amount credited to agent&apos;s NGN wallet per verified property.
            </p>
          </div>
        </div>

        {/* Last updated */}
        {rewardEnabledConfig?.updated_at && (
          <p className="text-xs text-gray-400 mt-4">
            Last updated: {formatDate(rewardEnabledConfig.updated_at)}
          </p>
        )}

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <div className="w-full sm:w-auto">
            <Button
              variant="primaryoutline"
              buttonSize="medium"
              color="btnfontprimary"
              buttonName="Save Reward Settings"
              disabled={!hasRewardChanges || rewardMutation.isPending}
              isLoading={rewardMutation.isPending}
              onClick={handleRewardSave}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPayout;

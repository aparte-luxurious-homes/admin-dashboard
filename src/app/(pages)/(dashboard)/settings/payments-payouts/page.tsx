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

  const configs = data?.data?.data ?? data?.data ?? [];
  const disbursementConfig = configs.find(
    (c: { key: string }) => c.key === DISBURSEMENT_KEY
  );
  const currentProvider: string = disbursementConfig?.value ?? "";
  const updatedAt: string | undefined = disbursementConfig?.updated_at;

  const [userSelected, setUserSelected] = useState<string | null>(null);
  const selectedProvider = userSelected ?? currentProvider;
  const hasChanges = userSelected !== null && userSelected !== currentProvider;

  // Reset user selection when API data updates (after save)
  useEffect(() => {
    if (userSelected && userSelected === currentProvider) {
      setUserSelected(null);
    }
  }, [currentProvider, userSelected]);

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
    </div>
  );
};

export default PaymentPayout;

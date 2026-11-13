"use client";

import React from "react";
import { Icon } from "@iconify/react";

interface GatewayBalance {
  isAvailable: boolean;
  available?: number;
  currency?: string;
  error?: string;
}

interface GatewayBalancesCardProps {
  paystack: GatewayBalance;
  monnify: GatewayBalance;
  isLoading?: boolean;
}

const formatCurrency = (amount: number, currency: string = "NGN") => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
  }).format(amount);
};

const GatewaySection: React.FC<{
  name: string;
  icon: string;
  balance: GatewayBalance;
}> = ({ name, icon, balance }) => {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-3">
        <Icon icon={icon} className="text-[#028090] text-lg flex-shrink-0" />
        <span className="text-sm font-medium text-gray-700 truncate">{name}</span>
        <span
          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
            balance.isAvailable ? "bg-green-500" : "bg-red-500"
          }`}
        />
      </div>
      {balance.isAvailable ? (
        <p className="text-xl sm:text-2xl font-bold text-gray-900">
          {formatCurrency(balance.available ?? 0, balance.currency)}
        </p>
      ) : (
        <div>
          <p className="text-sm font-semibold text-red-500">Unavailable</p>
          {balance.error && (
            <p className="text-xs text-red-400 mt-1 truncate" title={balance.error}>
              {balance.error}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

const SkeletonSection: React.FC = () => (
  <div className="flex-1 min-w-0">
    <div className="flex items-center gap-2 mb-3">
      <div className="w-5 h-5 rounded bg-gray-200 animate-pulse" />
      <div className="w-20 h-4 rounded bg-gray-200 animate-pulse" />
      <div className="w-2.5 h-2.5 rounded-full bg-gray-200 animate-pulse" />
    </div>
    <div className="w-36 h-7 rounded bg-gray-200 animate-pulse" />
  </div>
);

const GatewayBalancesCard: React.FC<GatewayBalancesCardProps> = ({
  paystack,
  monnify,
  isLoading,
}) => {
  return (
    <div className="border border-[#D9D9D9] rounded-[15px] p-4 sm:p-5 bg-white shadow-md">
      <div className="flex items-center gap-2 mb-4">
        <Icon icon="mdi:bank" className="text-[#028090] text-xl" />
        <h3 className="text-sm font-semibold text-gray-800">Payment Gateway Balances</h3>
      </div>
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        {isLoading ? (
          <>
            <SkeletonSection />
            <div className="hidden sm:block w-px bg-gray-200" />
            <hr className="sm:hidden border-gray-200" />
            <SkeletonSection />
          </>
        ) : (
          <>
            <GatewaySection
              name="Paystack"
              icon="mdi:credit-card-outline"
              balance={paystack}
            />
            <div className="hidden sm:block w-px bg-gray-200" />
            <hr className="sm:hidden border-gray-200" />
            <GatewaySection
              name="Monnify"
              icon="mdi:bank-outline"
              balance={monnify}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default GatewayBalancesCard;

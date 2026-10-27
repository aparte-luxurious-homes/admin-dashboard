"use client";

import React from "react";
import { Icon } from "@iconify/react";

/**
 * The platform's wallet liability, read beside the gateway balances for
 * reconciliation. Data: GET /stats/wallet-totals.
 *
 * The API counts REAL wallets only. Soft-deleted accounts and the seeded test
 * accounts are left out (and listed under "Excluded" so nothing disappears),
 * and admin adjustments are shown on their own line: that money never passed
 * through Paystack or Monnify, so the figure to compare with the gateways is
 * the gateway-backed one, plus withdrawals still in flight.
 */
interface CurrencyTotal {
  currency: string;
  total_balance: string;
  wallets: number;
}

interface RoleTotal extends CurrencyTotal {
  role: string;
}

interface InFlight {
  currency: string;
  total_amount: string;
  total_fee: string;
  count: number;
}

interface Adjustment {
  currency: string;
  total_amount: string;
}

interface Excluded extends CurrencyTotal {
  reason: "SOFT_DELETED" | "TEST_ACCOUNT" | string;
}

export interface WalletTotals {
  generated_at?: string;
  by_currency: CurrencyTotal[];
  by_role: RoleTotal[];
  user_wallets: CurrencyTotal[];
  platform_wallets: CurrencyTotal[];
  in_flight_withdrawals: InFlight[];
  negative_balance_wallets: number;
  // Present from the reconciliation update onwards; older API responses omit
  // them and the card falls back to the plain wallet total.
  net_adjustments?: Adjustment[];
  gateway_backed?: Omit<CurrencyTotal, "wallets">[];
  excluded?: Excluded[];
  all_wallets?: CurrencyTotal[];
}

interface WalletTotalsCardProps {
  totals?: WalletTotals | null;
  isLoading?: boolean;
  error?: string | null;
}

const formatMoney = (amount: string | number, currency: string = "NGN") => {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return new Intl.NumberFormat("en-NG", { style: "currency", currency }).format(
    Number.isFinite(value) ? value : 0,
  );
};

const ROLE_LABEL: Record<string, string> = {
  GUEST: "Guests",
  OWNER: "Owners",
  AGENT: "Agents",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super admin",
  OPERATIONS_ADMIN: "Operations",
  SUPPORT_ADMIN: "Support",
  ANALYST: "Analyst",
};

const EXCLUDED_LABEL: Record<string, string> = {
  SOFT_DELETED: "deleted accounts",
  TEST_ACCOUNT: "test accounts",
};

const Figure: React.FC<{
  label: string;
  value: string;
  hint?: string;
  emphasis?: boolean;
}> = ({ label, value, hint, emphasis = false }) => (
  <div className="flex-1 min-w-0">
    <p className={`text-xs font-medium truncate ${emphasis ? "text-[#028090]" : "text-gray-500"}`}>
      {label}
    </p>
    <p className={`font-bold ${emphasis ? "text-2xl sm:text-[28px] text-gray-900" : "text-xl sm:text-2xl text-gray-900"}`}>
      {value}
    </p>
    {hint && <p className="text-[11px] text-gray-400 mt-0.5">{hint}</p>}
  </div>
);

const SkeletonFigure: React.FC = () => (
  <div className="flex-1 min-w-0">
    <div className="w-24 h-3 rounded bg-gray-200 animate-pulse mb-2" />
    <div className="w-36 h-7 rounded bg-gray-200 animate-pulse" />
  </div>
);

const Divider = () => (
  <>
    <div className="hidden sm:block w-px bg-gray-200" />
    <hr className="sm:hidden border-gray-200" />
  </>
);

const WalletTotalsCard: React.FC<WalletTotalsCardProps> = ({ totals, isLoading, error }) => {
  // One currency at a time keeps the card readable; NGN is the platform's
  // currency. Other currencies, if any, are listed underneath.
  const currencies = Array.from(new Set((totals?.by_currency ?? []).map((c) => c.currency)));
  const primary = currencies.includes("NGN") ? "NGN" : currencies[0] ?? "NGN";
  const pick = <T extends { currency: string }>(rows: T[] | undefined) =>
    rows?.find((r) => r.currency === primary);

  const real = pick(totals?.by_currency);
  const users = pick(totals?.user_wallets);
  const platform = pick(totals?.platform_wallets);
  const flight = pick(totals?.in_flight_withdrawals);
  const adjustments = pick(totals?.net_adjustments);
  const gatewayBacked = pick(totals?.gateway_backed);
  const roles = (totals?.by_role ?? []).filter((r) => r.currency === primary);
  const excluded = (totals?.excluded ?? []).filter((r) => r.currency === primary);
  const negatives = totals?.negative_balance_wallets ?? 0;

  const headline = gatewayBacked?.total_balance ?? real?.total_balance ?? 0;
  const adjustmentValue = Number(adjustments?.total_amount ?? 0);

  return (
    <div className="border border-[#D9D9D9] rounded-[15px] p-4 sm:p-5 bg-white shadow-md">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Icon icon="mdi:wallet-outline" className="text-[#028090] text-xl" />
          <h3 className="text-sm font-semibold text-gray-800">Wallet Totals</h3>
        </div>
        {totals?.generated_at && (
          <span className="text-[11px] text-gray-400">
            as at{" "}
            {new Date(totals.generated_at).toLocaleString("en-NG", { timeZone: "Africa/Lagos" })} WAT
          </span>
        )}
      </div>

      {error ? (
        <p className="text-sm font-semibold text-red-500">
          Unavailable <span className="font-normal text-red-400">{error}</span>
        </p>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            {isLoading ? (
              <>
                <SkeletonFigure />
                <Divider />
                <SkeletonFigure />
                <Divider />
                <SkeletonFigure />
                <Divider />
                <SkeletonFigure />
              </>
            ) : (
              <>
                <Figure
                  emphasis
                  label="Gateway-backed balance"
                  value={formatMoney(headline, primary)}
                  hint={
                    gatewayBacked
                      ? "Real wallets less admin adjustments"
                      : "All wallets (update the API for the reconciliation view)"
                  }
                />
                <Divider />
                <Figure
                  label="Owed to wallet holders"
                  value={formatMoney(users?.total_balance ?? 0, primary)}
                  hint={`${users?.wallets ?? 0} guest, owner and agent wallets`}
                />
                <Divider />
                <Figure
                  label="Platform (staff) wallets"
                  value={formatMoney(platform?.total_balance ?? 0, primary)}
                  hint="Where the platform fee is credited"
                />
                <Divider />
                <Figure
                  label="Withdrawals in flight"
                  value={formatMoney(flight?.total_amount ?? 0, primary)}
                  hint={
                    flight
                      ? `${flight.count} awaiting settlement · fees ${formatMoney(flight.total_fee, primary)}`
                      : "Debited from wallets, not yet paid by the bank"
                  }
                />
              </>
            )}
          </div>

          {!isLoading && (
            <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                <span className="font-medium text-gray-700">
                  Real wallets: {formatMoney(real?.total_balance ?? 0, primary)} across {real?.wallets ?? 0}
                </span>
                {adjustments && (
                  <span className="inline-flex items-center gap-1">
                    <span className="text-gray-400">Admin adjustments (not gateway money)</span>
                    <span className={`font-medium ${adjustmentValue < 0 ? "text-amber-600" : ""}`}>
                      {adjustmentValue > 0 ? "−" : adjustmentValue < 0 ? "+" : ""}
                      {formatMoney(Math.abs(adjustmentValue), primary)}
                    </span>
                  </span>
                )}
                {negatives > 0 && (
                  <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                    <Icon icon="mdi:alert-outline" />
                    {negatives} wallet{negatives === 1 ? "" : "s"} below zero
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                {roles.map((r) => (
                  <span key={r.role} className="inline-flex items-center gap-1">
                    <span className="text-gray-400">{ROLE_LABEL[r.role] ?? r.role}</span>
                    <span className="font-medium">{formatMoney(r.total_balance, primary)}</span>
                  </span>
                ))}
              </div>

              {excluded.length > 0 && (
                <p className="text-[11px] text-gray-400">
                  Excluded:{" "}
                  {excluded
                    .map(
                      (e) =>
                        `${EXCLUDED_LABEL[e.reason] ?? e.reason.toLowerCase()} ${formatMoney(e.total_balance, primary)} (${e.wallets})`,
                    )
                    .join(" · ")}
                </p>
              )}

              {currencies.length > 1 && (
                <p className="text-[11px] text-gray-400">
                  Other currencies:{" "}
                  {(totals?.by_currency ?? [])
                    .filter((c) => c.currency !== primary)
                    .map((c) => `${formatMoney(c.total_balance, c.currency)} (${c.wallets})`)
                    .join(" · ")}
                </p>
              )}

              <p className="text-[11px] text-gray-400">
                Reconcile: gateway balances ≈ gateway-backed balance + withdrawals in flight + money
                held for confirmed stays not yet checked in.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WalletTotalsCard;

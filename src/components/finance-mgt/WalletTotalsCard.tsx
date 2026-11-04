"use client";

import React from "react";
import { Icon } from "@iconify/react";

/**
 * What Aparte holds in wallets, in plain words. Data: GET /stats/wallet-totals.
 *
 * The headline figures answer the everyday questions: what customers can
 * withdraw, what Aparte has earned, what is on its way to banks. The check
 * against Paystack/Monnify sits in its own collapsible section because its
 * "should have come through" figure is an estimate. It subtracts every admin
 * adjustment ever made, including bank-transfer top-ups (real money in our bank
 * account, not a gateway) and adjusted money that has since been spent, so it
 * can read low or below zero without any money being missing.
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

  const adjustmentValue = Number(adjustments?.total_amount ?? 0);
  const expected = Number(gatewayBacked?.total_balance ?? 0);

  return (
    <div className="border border-[#D9D9D9] rounded-[15px] p-4 sm:p-5 bg-white shadow-md">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Icon icon="mdi:wallet-outline" className="text-[#028090] text-xl" />
          <h3 className="text-sm font-semibold text-gray-800">Money in wallets</h3>
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
              </>
            ) : (
              <>
                <Figure
                  emphasis
                  label="Customers can withdraw"
                  value={formatMoney(users?.total_balance ?? 0, primary)}
                  hint={`In ${(users?.wallets ?? 0).toLocaleString()} guest, owner and agent wallets`}
                />
                <Divider />
                <Figure
                  label="Aparte's earnings"
                  value={formatMoney(platform?.total_balance ?? 0, primary)}
                  hint="Platform fees, held in staff wallets"
                />
                <Divider />
                <Figure
                  label="Payouts on the way to banks"
                  value={formatMoney(flight?.total_amount ?? 0, primary)}
                  hint={
                    flight
                      ? `${flight.count} payout${flight.count === 1 ? "" : "s"} · bank fees ${formatMoney(flight.total_fee, primary)}`
                      : "Taken from wallets, not yet received by the bank"
                  }
                />
              </>
            )}
          </div>

          {!isLoading && (
            <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                <span className="font-medium text-gray-700">
                  Total in all wallets: {formatMoney(real?.total_balance ?? 0, primary)} (
                  {(real?.wallets ?? 0).toLocaleString()} wallets)
                </span>
                {negatives > 0 && (
                  <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                    <Icon icon="mdi:alert-outline" />
                    {negatives} wallet{negatives === 1 ? "" : "s"} below zero
                  </span>
                )}
              </div>

              {roles.length > 0 && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                  <span className="text-gray-400">By account type:</span>
                  {roles.map((r) => (
                    <span key={r.role} className="inline-flex items-center gap-1">
                      <span className="text-gray-400">{ROLE_LABEL[r.role] ?? r.role}</span>
                      <span className="font-medium">{formatMoney(r.total_balance, primary)}</span>
                    </span>
                  ))}
                </div>
              )}

              {excluded.length > 0 && (
                <p className="text-[11px] text-gray-400">
                  Not counted:{" "}
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

              {gatewayBacked && (
                <details className="group pt-2">
                  <summary className="cursor-pointer list-none inline-flex items-center gap-1 text-xs font-medium text-[#028090]">
                    <Icon icon="mdi:chevron-right" className="transition-transform group-open:rotate-90" />
                    Check against Paystack / Monnify
                  </summary>
                  <div className="mt-2 rounded-lg bg-gray-50 border border-gray-100 p-3 text-xs text-gray-600 space-y-1.5">
                    <div className="flex justify-between gap-4">
                      <span>Total in all wallets</span>
                      <span className="font-medium tabular-nums whitespace-nowrap">
                        {formatMoney(real?.total_balance ?? 0, primary)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span>
                        Added by hand by admins, all time
                        <span className="block text-[11px] text-gray-400">
                          Credits, rewards and bank-transfer top-ups. None of it came through Paystack
                          or Monnify.
                        </span>
                      </span>
                      <span className="font-medium tabular-nums whitespace-nowrap">
                        {adjustmentValue > 0 ? "−" : adjustmentValue < 0 ? "+" : ""}
                        {formatMoney(Math.abs(adjustmentValue), primary)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4 pt-1.5 border-t border-gray-200 font-semibold text-gray-800">
                      <span>Should have come through Paystack / Monnify</span>
                      <span className={`tabular-nums whitespace-nowrap ${expected < 0 ? "text-amber-600" : ""}`}>
                        {formatMoney(expected, primary)}
                      </span>
                    </div>
                    {expected < 0 && (
                      <p className="text-[11px] text-amber-700">
                        Below zero does not mean money is missing. Much of the money added by hand has
                        since been withdrawn or spent, and bank-transfer top-ups sit in our bank account
                        rather than a gateway, so this estimate reads low.
                      </p>
                    )}
                    <p className="text-[11px] text-gray-400 pt-1">
                      Paystack and Monnify together should hold roughly this figure, plus payouts on
                      the way to banks, plus money paid for confirmed stays that haven&apos;t checked in
                      yet.
                    </p>
                  </div>
                </details>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WalletTotalsCard;

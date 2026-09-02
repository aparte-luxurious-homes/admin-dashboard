"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import axiosRequest from "@/src/lib/api";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import { usePermissions } from "@/src/hooks/usePermissions";

/**
 * Runs the disbursement reconciliation sweep on demand.
 *
 * Settlement is asynchronous: approving a withdrawal only marks it in-flight,
 * and it reaches SUCCESSFUL when the provider confirms — via the disbursement
 * webhook or this sweep. When either is misconfigured, payouts accumulate in
 * PENDING with nothing an operator can do about it, which is precisely when a
 * manual trigger is needed. The endpoint accepts an admin session as well as
 * the cron's bearer token for that reason.
 */
export default function RunSettlementSweepButton({ onDone }: { onDone?: () => void }) {
    const [isRunning, setIsRunning] = useState(false);
    const { canManageFinances } = usePermissions();

    if (!canManageFinances) return null;

    const run = async () => {
        setIsRunning(true);
        try {
            const res = await axiosRequest.post(API_ROUTES.wallet.reconcileDisbursementsJob);
            const d = res?.data?.data ?? {};
            const settled = d.settled ?? 0;
            const reversed = d.reversed ?? 0;
            const stillPending = d.still_pending ?? 0;

            if (settled || reversed) {
                toast.success(
                    `Sweep complete — ${settled} settled, ${reversed} refunded, ${stillPending} still in flight`,
                );
            } else if (d.processed) {
                // Nothing changed, but the provider was reached. Say so rather
                // than showing a bare success, so nobody reaches for Reverse on
                // a payout that is simply still travelling.
                toast(`Checked ${d.processed} payout(s) — all still in flight at the provider`);
            } else {
                toast("No stuck payouts to reconcile");
            }
            onDone?.();
        } catch (err: any) {
            toast.error(
                err?.response?.data?.detail ||
                err?.response?.data?.message ||
                "Could not run the settlement sweep",
            );
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <button
            onClick={run}
            disabled={isRunning}
            title="Re-query the provider for every stuck payout and apply the result"
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-60 flex items-center gap-2 text-sm text-gray-700 font-medium"
        >
            <Icon
                icon={isRunning ? "mdi:loading" : "mdi:sync"}
                className={`w-4 h-4 ${isRunning ? "animate-spin" : ""}`}
            />
            <span>{isRunning ? "Running..." : "Run settlement sweep"}</span>
        </button>
    );
}

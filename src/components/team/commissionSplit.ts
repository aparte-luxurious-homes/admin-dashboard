/**
 * How the commission-split card reads `/bookings/{id}/commission-split`.
 * Kept free of React so it can be unit-tested.
 *
 * Offline bookings (cash, POS, bank transfer to the host) are never split
 * and Aparte charges them no fee, so the API marks them `offline: true` and
 * every position `paid: false`. The card must then say so rather than print
 * amounts nobody received. Both flags are newer than the endpoint, so a
 * payload without them is read as an ordinary online split: a missing
 * `offline` is false, and a missing `paid` earns no "not paid" mark — the
 * opposite default would flag every booking made before the field existed.
 */

export interface CommissionSplitPosition {
    pool?: string;
    level?: number;
    role?: string;
    agent?: { id?: string; name?: string; email?: string } | null;
    tier?: string | null;
    percentage?: number;
    amount?: number;
    status?: string;
    reason?: string | null;
    /** False once the API says this share was not (or not yet) credited. */
    paid?: boolean;
}

export interface CommissionSplitData {
    booking_id?: string;
    locked?: boolean;
    offline?: boolean;
    splitting_base?: number;
    pools?: {
        listing?: { amount?: number; percentage?: number };
        referral?: { amount?: number; percentage?: number };
        platform_fixed?: { amount?: number; percentage?: number };
    };
    positions?: CommissionSplitPosition[];
    unclaimed_to_platform?: { amount?: number; percentage?: number };
}

export type CommissionSplitState = "offline" | "unlocked" | "split";

export const OFFLINE_SPLIT_TITLE = "No commission — paid offline";
export const OFFLINE_SPLIT_BODY =
    "This booking was paid directly to the host, so Aparte charged no fee and no agent share was credited.";

/** A missing flag reads as false: only an explicit `true` is offline. */
export const isOfflineSplit = (data: CommissionSplitData | null | undefined): boolean =>
    data?.offline === true;

/** A missing flag reads as paid: only an explicit `false` earns a "not paid" mark. */
export const positionWasPaid = (position: CommissionSplitPosition): boolean => position.paid !== false;

/**
 * Offline wins over everything else: an offline booking made before shares
 * were locked is still "paid offline", not "split the older way".
 */
export function commissionSplitState(data: CommissionSplitData): CommissionSplitState {
    if (isOfflineSplit(data)) return "offline";
    if (!data.locked) return "unlocked";
    return "split";
}

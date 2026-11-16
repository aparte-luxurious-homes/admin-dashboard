/**
 * Pure helpers for flexible payments — no DOM, no network — so they can be
 * unit-tested with Node's built-in runner (`yarn test:unit`).
 *
 * Money here is integer kobo. Splits must add up to the total EXACTLY (PRD
 * acceptance criteria), so everything below uses integer arithmetic and hands
 * any leftover kobo to a definite share rather than rounding it away.
 */
import {
    ContributorStatus,
    FlexPaymentKind,
    FlexPaymentStatus,
    IContributor,
    IInstalmentConfig,
    IInviteFriendsConfig,
} from "./types/flexPayments";

/**
 * Flip to true once the payments API exists. While false, listing config is
 * kept in the form (and the wizard draft) but NOT sent to the API, the admin
 * "Flexible payments" nav entry is hidden, and the config UI says so — so no
 * one believes a setting was saved when nothing received it.
 */
export const FLEX_PAYMENTS_API_CONNECTED = false;

/* ---- Platform limits (PROVISIONAL — see OQ-5; confirm with Product) ------ */
export const INITIAL_PERCENT_PRESETS = [50, 60, 70] as const;
export const INITIAL_PERCENT_MIN = 10;
export const INITIAL_PERCENT_MAX = 90;
export const MAX_DEADLINE_DAYS_BEFORE_CHECKIN = 30;
export const CONTRIBUTORS_MIN_ALLOWED = 2;
export const CONTRIBUTORS_MAX_ALLOWED = 10;
/** PRD 5.2 / OQ-11. Shown read-only until Product says it is configurable. */
export const FUNDING_WINDOW_HOURS = 24;

export const DEFAULT_INSTALMENT_CONFIG: IInstalmentConfig = {
    enabled: true,
    initial_percentage: 60,
    balance_deadline_days_before_checkin: 3,
};

export const DEFAULT_INVITE_FRIENDS_CONFIG: IInviteFriendsConfig = {
    enabled: true,
    min_contributors: 2,
    max_contributors: 10,
    allow_equal_split: true,
    allow_custom_split: true,
};

/* ---- Units -------------------------------------------------------------- */

/** Naira (the dashboard's unit; may be a string like "200000.00") to integer kobo. */
export function nairaToKobo(naira: number | string): number {
    const n = typeof naira === "string" ? Number(naira.replace(/,/g, "")) : naira;
    return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export function koboToNaira(kobo: number): number {
    return kobo / 100;
}

/* ---- Instalment maths --------------------------------------------------- */

export function splitInstalment(
    totalKobo: number,
    initialPercentage: number,
): { initialKobo: number; balanceKobo: number } {
    const initialKobo = Math.round((totalKobo * initialPercentage) / 100);
    // The balance is the remainder, so the two can never drift apart.
    return { initialKobo, balanceKobo: totalKobo - initialKobo };
}

export function balanceDeadline(checkIn: Date | string, daysBeforeCheckin: number): Date {
    const d = new Date(checkIn);
    d.setUTCDate(d.getUTCDate() - daysBeforeCheckin);
    return d;
}

/**
 * A booking only qualifies when the balance deadline is still in the future,
 * otherwise "pay the rest later" would already be overdue at checkout (OQ-5).
 */
export function isInstalmentEligible(
    checkIn: Date | string,
    daysBeforeCheckin: number,
    now: Date = new Date(),
): boolean {
    return balanceDeadline(checkIn, daysBeforeCheckin).getTime() > now.getTime();
}

export type InstalmentConfigErrors = Partial<
    Record<"initial_percentage" | "balance_deadline_days_before_checkin", string>
>;

export function validateInstalmentConfig(cfg: IInstalmentConfig): InstalmentConfigErrors {
    const errors: InstalmentConfigErrors = {};
    const p = cfg.initial_percentage;
    if (!Number.isInteger(p) || p < INITIAL_PERCENT_MIN || p > INITIAL_PERCENT_MAX) {
        errors.initial_percentage = `Enter a whole number from ${INITIAL_PERCENT_MIN} to ${INITIAL_PERCENT_MAX}`;
    }
    const d = cfg.balance_deadline_days_before_checkin;
    if (!Number.isInteger(d) || d < 0 || d > MAX_DEADLINE_DAYS_BEFORE_CHECKIN) {
        errors.balance_deadline_days_before_checkin = `Enter 0 (at check-in) to ${MAX_DEADLINE_DAYS_BEFORE_CHECKIN} days before`;
    }
    return errors;
}

/* ---- Invite Friends maths ---------------------------------------------- */

/** Equal shares that sum exactly: the first `remainder` shares carry one extra kobo. */
export function equalShares(totalKobo: number, count: number): number[] {
    if (!Number.isInteger(count) || count < 1) return [];
    const base = Math.floor(totalKobo / count);
    const remainder = totalKobo - base * count;
    return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0));
}

/** Null when the custom shares are acceptable, otherwise a message. */
export function validateCustomShares(totalKobo: number, sharesKobo: number[]): string | null {
    if (sharesKobo.length === 0) return "Add at least one share";
    if (sharesKobo.some((s) => !Number.isInteger(s) || s <= 0)) {
        return "Every share must be more than zero";
    }
    const sum = sharesKobo.reduce((a, b) => a + b, 0);
    if (sum === totalKobo) return null;
    const diff = Math.abs(totalKobo - sum);
    return sum < totalKobo
        ? `Shares are ₦${(diff / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })} short of the total`
        : `Shares are ₦${(diff / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })} over the total`;
}

export type InviteFriendsConfigErrors = Partial<
    Record<"min_contributors" | "max_contributors" | "split", string>
>;

export function validateInviteFriendsConfig(cfg: IInviteFriendsConfig): InviteFriendsConfigErrors {
    const errors: InviteFriendsConfigErrors = {};
    const { min_contributors: min, max_contributors: max } = cfg;
    if (!Number.isInteger(min) || min < CONTRIBUTORS_MIN_ALLOWED || min > CONTRIBUTORS_MAX_ALLOWED) {
        errors.min_contributors = `Minimum is ${CONTRIBUTORS_MIN_ALLOWED} to ${CONTRIBUTORS_MAX_ALLOWED}`;
    }
    if (!Number.isInteger(max) || max < CONTRIBUTORS_MIN_ALLOWED || max > CONTRIBUTORS_MAX_ALLOWED) {
        errors.max_contributors = `Maximum is ${CONTRIBUTORS_MIN_ALLOWED} to ${CONTRIBUTORS_MAX_ALLOWED}`;
    } else if (!errors.min_contributors && max < min) {
        errors.max_contributors = "Maximum can't be lower than the minimum";
    }
    if (!cfg.allow_equal_split && !cfg.allow_custom_split) {
        errors.split = "Allow at least one way to split the cost";
    }
    return errors;
}

/** Progress across a booking's contributors (paid shares only count once verified). */
export function summariseContributors(
    contributors: Pick<IContributor, "shareKobo" | "status">[],
    totalKobo: number,
): { paidKobo: number; outstandingKobo: number; paidCount: number; percentPaid: number } {
    const paid = contributors.filter((c) => c.status === "PAID");
    const paidKobo = paid.reduce((sum, c) => sum + c.shareKobo, 0);
    return {
        paidKobo,
        outstandingKobo: Math.max(0, totalKobo - paidKobo),
        paidCount: paid.length,
        percentPaid: totalKobo > 0 ? Math.min(100, Math.floor((paidKobo / totalKobo) * 100)) : 0,
    };
}

/* ---- Statuses (PRD 6.1 / 6.2) ------------------------------------------- */

const S = FlexPaymentStatus;

/**
 * The PRD's transition table. The server is the authority and rejects illegal
 * moves; this exists so the UI only offers actions that could succeed.
 */
const TRANSITIONS: Record<FlexPaymentStatus, FlexPaymentStatus[]> = {
    [S.PENDING]: [S.PROCESSING, S.EXPIRED],
    [S.PROCESSING]: [S.PARTIALLY_PAID, S.FULLY_PAID, S.FAILED],
    [S.PARTIALLY_PAID]: [S.PROCESSING, S.FULLY_PAID, S.EXPIRED, S.REFUNDED],
    [S.FULLY_PAID]: [S.REFUNDED],
    [S.FAILED]: [S.PROCESSING, S.PENDING, S.PARTIALLY_PAID],
    [S.EXPIRED]: [S.REFUNDED],
    [S.REFUNDED]: [],
};

export function canTransitionPayment(from: FlexPaymentStatus, to: FlexPaymentStatus): boolean {
    return TRANSITIONS[from].includes(to);
}

/** Money is still expected from someone. */
export function isOpenPayment(status: FlexPaymentStatus): boolean {
    return status === S.PENDING || status === S.PROCESSING || status === S.PARTIALLY_PAID || status === S.FAILED;
}

/** A refund could apply: money was received and the plan ended or was cancelled. */
export function canRefund(status: FlexPaymentStatus): boolean {
    return canTransitionPayment(status, S.REFUNDED);
}

export const FLEX_STATUS_LABEL: Record<FlexPaymentStatus, string> = {
    [S.PENDING]: "Pending",
    [S.PROCESSING]: "Processing",
    [S.PARTIALLY_PAID]: "Partially paid",
    [S.FULLY_PAID]: "Fully paid",
    [S.FAILED]: "Failed",
    [S.EXPIRED]: "Expired",
    [S.REFUNDED]: "Refunded",
};

export const FLEX_KIND_LABEL: Record<FlexPaymentKind, string> = {
    [FlexPaymentKind.INSTALMENT]: "Instalment",
    [FlexPaymentKind.INVITE_FRIENDS]: "Invite friends",
};

export const CONTRIBUTOR_STATUS_LABEL: Record<ContributorStatus, string> = {
    PENDING: "Awaiting payment",
    PROCESSING: "Processing",
    PAID: "Paid",
    FAILED: "Failed",
    EXPIRED: "Expired",
    REFUNDED: "Refunded",
};

/** Hours until `dueAt`, negative when past; null when there is no deadline. */
export function hoursUntil(dueAt: string | null, now: Date = new Date()): number | null {
    if (!dueAt) return null;
    const t = new Date(dueAt).getTime();
    return Number.isNaN(t) ? null : (t - now.getTime()) / 3_600_000;
}

/* ---- CSV export ---------------------------------------------------------- */

/**
 * Spreadsheet apps run a cell that starts with = + - @ as a formula. Guest
 * names and property names are user-supplied, so neutralise those with a
 * leading apostrophe before quoting.
 */
export function csvCell(value: string | number): string {
    let text = String(value);
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
}

export function plansToCsv(
    rows: Array<{
        bookingRef: string;
        kind: FlexPaymentKind;
        status: FlexPaymentStatus;
        guestName: string;
        propertyName: string;
        totalKobo: number;
        paidKobo: number;
        dueAt: string | null;
    }>,
): string {
    const header = ["Booking", "Type", "Status", "Guest", "Property", "Total (NGN)", "Paid (NGN)", "Outstanding (NGN)", "Due"];
    const naira = (kobo: number) => koboToNaira(kobo).toFixed(2);
    const lines = rows.map((r) =>
        [
            r.bookingRef,
            FLEX_KIND_LABEL[r.kind],
            FLEX_STATUS_LABEL[r.status],
            r.guestName,
            r.propertyName,
            naira(r.totalKobo),
            naira(r.paidKobo),
            naira(Math.max(0, r.totalKobo - r.paidKobo)),
            r.dueAt ?? "",
        ]
            .map(csvCell)
            .join(","),
    );
    return [header.map(csvCell).join(","), ...lines].join("\r\n");
}

/**
 * Flexible payment types: Instalment Payment and Invite Friends to Pay.
 *
 * Amounts are integer KOBO (PRD assumption A-6). The rest of the dashboard
 * works in naira (`formatMoney(naira)`), so convert at the edge with
 * `koboToNaira` / `nairaToKobo` from `lib/flexPayments.ts` and never mix the
 * two units in one expression.
 *
 * The backend contract for payment plans has not been agreed. These shapes are
 * the dashboard's working model; everything that would hit the network goes
 * through `lib/flexPaymentsApi.ts`.
 */

export enum FlexPaymentKind {
    INSTALMENT = "INSTALMENT",
    INVITE_FRIENDS = "INVITE_FRIENDS",
}

/** PRD section 6.1. Separate from the booking's own status. */
export enum FlexPaymentStatus {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    PARTIALLY_PAID = "PARTIALLY_PAID",
    FULLY_PAID = "FULLY_PAID",
    FAILED = "FAILED",
    EXPIRED = "EXPIRED",
    REFUNDED = "REFUNDED",
}

/* ---- Listing configuration (PRD 4.2, 5.2) ------------------------------ */

export interface IInstalmentConfig {
    enabled: boolean;
    initial_percentage: number;
    balance_deadline_days_before_checkin: number;
}

export interface IInviteFriendsConfig {
    enabled: boolean;
    min_contributors: number;
    max_contributors: number;
    allow_equal_split: boolean;
    allow_custom_split: boolean;
}

/* ---- Booking-side data (read model) ------------------------------------ */

export type PlanPaymentStatus = "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" | "REFUNDED";

export interface IPlanPayment {
    id: string;
    reference: string;
    /** "Initial payment", "Balance", or a contributor's name. */
    label: string;
    amountKobo: number;
    status: PlanPaymentStatus;
    paidAt: string | null;
}

export type ContributorStatus = "PENDING" | "PROCESSING" | "PAID" | "FAILED" | "EXPIRED" | "REFUNDED";

export interface IContributor {
    id: string;
    /** Name when known, otherwise the masked contact. */
    displayName: string;
    /** Masked email or phone, e.g. "a***@gmail.com". */
    contact: string;
    isInitiator: boolean;
    shareKobo: number;
    status: ContributorStatus;
    paidAt: string | null;
    lastInvitedAt: string | null;
}

export interface IPaymentPlan {
    id: string;
    bookingId: string;
    kind: FlexPaymentKind;
    status: FlexPaymentStatus;
    totalKobo: number;
    /** Verified money received so far. */
    paidKobo: number;
    /** Instalment only. */
    initialKobo?: number;
    balanceKobo?: number;
    /** Balance deadline (instalment) or funding-window expiry (invite friends). */
    dueAt: string | null;
    payments: IPlanPayment[];
    contributors?: IContributor[];
}

/** One row of the admin monitoring list. */
export interface IFlexPaymentRow {
    planId: string;
    bookingId: string;
    bookingRef: string;
    kind: FlexPaymentKind;
    status: FlexPaymentStatus;
    guestName: string;
    propertyName: string;
    totalKobo: number;
    paidKobo: number;
    dueAt: string | null;
    updatedAt: string;
}

export interface FlexPaymentListParams {
    page: number;
    limit: number;
    search?: string;
    kind?: FlexPaymentKind | "ALL";
    status?: FlexPaymentStatus | "ALL";
    /** Narrow the queue to what needs attention. */
    attention?: "EXPIRING_SOON" | "NONE";
}

export interface FlexPaymentListResult {
    items: IFlexPaymentRow[];
    total: number;
}

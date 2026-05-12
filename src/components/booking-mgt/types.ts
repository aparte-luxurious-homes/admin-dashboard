import { IUser } from "@/src/lib/types";
import { IPropertyUnit } from "../properties-mgt/types";


export enum BookingStatus {
    APPROVAL_PENDING = 'APPROVAL_PENDING',
    PENDING = 'PENDING',
    PENDING_PAYMENT = 'PENDING_PAYMENT',
    CONFIRMED = 'CONFIRMED',
    CHECKED_IN = 'CHECKED_IN',
    CHECKED_OUT = 'CHECKED_OUT',
    CANCEL_REQUESTED = 'CANCEL_REQUESTED',
    CANCELLED = 'CANCELLED',
    COMPLETED = 'COMPLETED',
}

export type BookingBageProps = {
    status: BookingStatus | string;
    textColour?: string;
    backgroundColour?: string;
    classNames?: string;
}


export interface IAvailability {
    id: string | number
    unitId: string | number
    date: string
    count: number
    isBlackout: boolean
    pricing?: number | null
}


export interface IBooking {
    id: string | number
    bookingId: string
    booking_id?: string
    userId: string | number
    user_id?: string | number
    unitId: string | number
    unit_id?: string | number
    transactionId: string
    transaction_id?: string
    transactionRef: string | null
    transaction_ref?: string | null
    startDate: string
    start_date?: string
    endDate: string
    end_date?: string
    guestsCount: number
    guests_count?: number
    unitCount: number
    unit_count?: number
    totalPrice: number
    total_price?: number
    cautionFee?: number
    caution_fee?: number
    isCautionRefunded?: boolean
    is_caution_refunded?: boolean
    cautionRefundNotes?: string
    caution_refund_notes?: string
    cautionRefundActionBy?: string
    caution_refund_action_by?: string
    checkoutVerifiedAt?: string
    checkout_verified_at?: string
    status: BookingStatus
    cancellationReason: string
    cancellation_reason?: string
    verificationDate: string
    verification_date?: string
    createdAt: string
    created_at?: string
    updatedAt: string
    updated_at?: string
    user: IUser
    unit: IPropertyUnit
    paymentMethod?: string
    payment_method?: string
    paymentProofUrl?: string
    payment_proof_url?: string
    paymentNotes?: string
    payment_notes?: string
    rejectionReason?: string
    rejection_reason?: string
    revenueSplit?: RevenueSplit;
    revenue_split?: RevenueSplit;
    // Attribution — the caller who actually submitted the booking. Differs
    // from userId when an agent/admin books on behalf of a guest.
    bookedBy?: string | number | null
    booked_by?: string | number | null
    referrerId?: string | number | null
    referrer_id?: string | number | null
    referralCodeUsed?: string | null
    referral_code_used?: string | null
    // List-endpoint convenience flags computed server-side against the caller.
    isMyBooking?: boolean
    is_my_booking?: boolean
    isMyReferral?: boolean
    is_my_referral?: boolean
    isMyManagement?: boolean
    is_my_management?: boolean
}

export interface RevenueSplit {
    splitting_base?: number;
    owner_amount: number;
    agent_amount: number;
    referrer_amount?: number;
    platform_amount: number;
    percentages: {
        owner: number;
        agent: number;
        referrer?: number;
        platform: number;
    };
    stages?: {
        on_confirmation: {
            owner: number;
            agent: number;
            referrer?: number;
            platform: number;
        };
        on_check_in: { owner: number };
    };
    has_referrer?: boolean;
    has_agent?: boolean;
}
export interface ICreateBooking {
    user_id?: string | number
    unit_id: string | number
    start_date: string
    end_date: string
    guests_count: number
    unit_count: number
    status?: BookingStatus
    total_price: number
    caution_fee?: number
    payment_method?: string
    payment_proof_url?: string
    payment_notes?: string
    mark_as_paid?: boolean
    send_payment_link?: boolean
    referral_code?: string

    // Quick Guest Onboarding
    guest_first_name?: string
    guest_last_name?: string
    guest_email?: string
    guest_phone?: string
}

export interface IUpdateBooking {
    unit_id: string | number
    start_date: string
    end_date: string
    guests_count: number
    unit_count: number
    status?: BookingStatus
    total_price?: number
    payment_method?: string
    payment_proof_url?: string
    payment_notes?: string
    mark_as_paid?: boolean
}


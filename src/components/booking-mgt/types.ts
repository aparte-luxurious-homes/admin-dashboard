import { IUser } from "@/src/lib/types";
import { IPropertyUnit } from "../properties-mgt/types";


export enum BookingStatus {
    PENDING = 'PENDING',
    PENDING_PAYMENT = 'PENDING_PAYMENT',
    CONFIRMED = 'CONFIRMED',
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
}
export interface ICreateBooking {
    user_id: string | number
    unit_id: string | number
    start_date: string
    end_date: string
    guests_count: number
    unit_count: number
    status?: BookingStatus
}

export interface IUpdateBooking {
    unit_id: string | number
    start_date: string
    end_date: string
    guests_count: number
    unit_count: number
    status?: BookingStatus
}


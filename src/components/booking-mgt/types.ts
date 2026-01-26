import { IUser } from "@/src/lib/types";
import { IPropertyUnit } from "../properties-mgt/types";


export enum BookingStatus {
    PENDING = 'PENDING',
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
    userId: string | number
    unitId: string | number
    transactionId: string
    transactionRef: string | null
    startDate: string
    endDate: string
    guestsCount: number
    unitCount: number
    totalPrice: number
    status: BookingStatus
    cancellationReason: string
    verificationDate: string
    createdAt: string
    updatedAt: string
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


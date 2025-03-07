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
  

export enum IAvailability {

}


export interface IBooking {
   id: number
   bookingId: string
   userId: number
   unitId: number
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
//    transaction: >
}


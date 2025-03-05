

export enum BookingStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    CANCELLED = 'CANCELLED',
    COMPLETED = 'COMPLETED',
}

export type BookingBageProps = {
    status: BookingStatus;
    textColour?: string;
    backgroundColour?: string;
    classNames?: string;
}
  

export enum IAvailability {

}


export enum IBooking {
    
}


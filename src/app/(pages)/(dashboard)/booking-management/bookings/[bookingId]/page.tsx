"use client";

import BookingDetailView from "@/src/components/booking-mgt/bookings/BookingDetailView";
import { useParams } from "next/navigation";

export default function BookingDetail({}) {
    const params = useParams();
    const bookingId = typeof params?.bookingId === 'string' 
        ? params.bookingId 
        : Array.isArray(params?.bookingId) 
            ? params.bookingId[0] 
            : '';

    return(
        <div className="w-full">
            <BookingDetailView bookingId={bookingId} />
        </div>
    );
}
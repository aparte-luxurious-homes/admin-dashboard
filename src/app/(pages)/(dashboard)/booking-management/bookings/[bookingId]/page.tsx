"use client";

import BookingDetailView from "@/src/components/booking-mgt/bookings/BookingDetailView";
import { useParams } from "next/navigation";

export default function BookingDetail({}) {
    const params = useParams();

    return(
        <div className="w-full">
            <BookingDetailView
                bookingId={Number(params?.bookingId)}
            />
        </div>
    );
}
'use client'

import BookingsTable from "@/src/components/booking-mgt/tables/bookings";
import { useParams } from "next/navigation";

export default function UnitBookings() {
    const params = useParams();
    return(
        <div className="w-full">
            <BookingsTable
                unitId={Number(params.unitId)}
            />
        </div>
    );
};
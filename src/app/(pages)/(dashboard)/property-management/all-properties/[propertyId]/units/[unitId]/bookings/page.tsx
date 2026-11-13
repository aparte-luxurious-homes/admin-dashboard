'use client'

import { Suspense } from "react";
import BookingsTable from "@/src/components/booking-mgt/tables/bookings";
import Loader from "@/src/components/loader";
import { useParams } from "next/navigation";

// Suspense boundary required: the table reads URL state via useSearchParams.
// See booking-management/bookings/page.tsx for the full note.
export default function UnitBookings() {
    const params = useParams();
    return (
        <div className="w-full">
            <Suspense fallback={<Loader />}>
                <BookingsTable
                    unitId={params.unitId as string}
                />
            </Suspense>
        </div>
    );
};
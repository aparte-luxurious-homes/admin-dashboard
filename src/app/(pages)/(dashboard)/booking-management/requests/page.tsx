import { Suspense } from "react";
import BookingsTable from "@/src/components/booking-mgt/tables/bookings";
import Loader from "@/src/components/loader";

// Suspense boundary required: the table reads URL state via useSearchParams,
// which cannot be evaluated during the static prerender. See the sibling
// bookings/page.tsx for the full note.
export default function BookingRequestsPage() {
    return (
        <div className="w-full">
            <Suspense fallback={<Loader />}>
                <BookingsTable mode="requests" />
            </Suspense>
        </div>
    );
}

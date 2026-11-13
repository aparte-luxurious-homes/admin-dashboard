import { Suspense } from "react";
import BookingsTable from "@/src/components/booking-mgt/tables/bookings";
import Loader from "@/src/components/loader";

/**
 * The table reads its search/filter/sort/page state from the URL via
 * `useSearchParams`, which Next 15 cannot evaluate while prerendering the
 * static shell. Without this boundary the production build fails outright
 * ("useSearchParams() should be wrapped in a suspense boundary"); with it,
 * the shell still prerenders and only the table waits for the URL.
 */
export default function Bookings() {
    return (
        <div className="w-full">
            <Suspense fallback={<Loader />}>
                <BookingsTable />
            </Suspense>
        </div>
    );
}

"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";

import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import type { BookingsCard as BookingsCardData } from "@/src/lib/request-handlers/ownerHomeMgt";

/**
 * "What is happening in my places."
 *
 * Stays arriving in the next 30 days, not a lifetime total: a cumulative
 * counter only goes up and answers nothing (spec D10). With no arrivals the
 * figure becomes the nights still open over the same window, so the card never
 * headlines a zero.
 */
export default function BookingsCard({
    bookings,
    onShare,
}: {
    bookings: BookingsCardData;
    onShare: () => void;
}) {
    const arrivals = bookings.arrivals_30d;
    const next = bookings.next_arrival;

    return (
        <section className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col min-h-[168px]">
            <h2 className="text-sm font-semibold text-gray-600">Bookings</h2>

            {arrivals > 0 ? (
                <>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 tabular-nums">
                        {arrivals} {arrivals === 1 ? "stay" : "stays"}
                    </p>
                    <p className="mt-1.5 text-sm text-gray-600 max-w-[36ch]">
                        Coming in the next 30 days.
                        {next && (
                            <>
                                {" "}
                                <b className="text-gray-900">{next.guest_name}</b> checks into{" "}
                                {next.unit_name} on {format(parseISO(next.check_in), "d MMMM")}.
                            </>
                        )}
                    </p>
                </>
            ) : bookings.open_nights_30d > 0 ? (
                <>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 tabular-nums">
                        {bookings.open_nights_30d} nights
                    </p>
                    <p className="mt-1.5 text-sm text-gray-600 max-w-[36ch]">
                        Open over the next 30 days. Guests who come through your own page
                        book more often than people browsing.
                    </p>
                </>
            ) : (
                // No arrivals and no open nights: the month ahead is taken,
                // with everyone already in. Never headline that as "0 nights".
                <>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
                        Fully booked
                    </p>
                    <p className="mt-1.5 text-sm text-gray-600 max-w-[36ch]">
                        Nothing is open over the next 30 days.
                    </p>
                </>
            )}

            <div className="mt-auto pt-4 flex items-center gap-5 text-sm font-semibold text-[#028090]">
                {arrivals > 0 ? (
                    <>
                        <Link
                            href={PAGE_ROUTES.dashboard.bookingManagement.bookings.base}
                            className="hover:underline"
                        >
                            See all bookings
                        </Link>
                        {bookings.in_house > 0 && (
                            <Link
                                href={`${PAGE_ROUTES.dashboard.bookingManagement.bookings.base}?status=CHECKED_IN`}
                                className="hover:underline"
                            >
                                Who is in right now ({bookings.in_house})
                            </Link>
                        )}
                    </>
                ) : (
                    // Nothing coming up: the useful next act is sending the page,
                    // not reading an empty bookings table.
                    <button type="button" onClick={onShare} className="hover:underline">
                        Share my page
                    </button>
                )}
            </div>
        </section>
    );
}

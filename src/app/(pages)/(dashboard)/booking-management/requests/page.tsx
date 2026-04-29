import BookingsTable from "@/src/components/booking-mgt/tables/bookings";

export default function BookingRequestsPage() {
    return (
        <div className="w-full">
            <BookingsTable mode="requests" />
        </div>
    );
}

import CreateBookingView from "@/src/components/booking-mgt/bookings/CreateBookingView";
import RequireCompleteOwnerProfile from "@/src/components/shared/RequireCompleteOwnerProfile";

export default function CreateProperty(){
    return (
        <RequireCompleteOwnerProfile>
            <div className="w-full">
                <CreateBookingView />
            </div>
        </RequireCompleteOwnerProfile>
    )
}

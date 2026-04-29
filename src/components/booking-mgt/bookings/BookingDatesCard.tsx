import { FaCalendarAlt, FaClock } from "react-icons/fa";
import { formatDate } from "@/src/lib/utils";
import { BookingBadge } from "../../badge";
import { NormalizedBooking, getStatusColors } from "./utils";

interface BookingDatesCardProps {
  booking: NormalizedBooking;
}

export default function BookingDatesCard({ booking }: BookingDatesCardProps) {
  const colors = getStatusColors(booking.status);

  return (
    <div className="border border-zinc-200 rounded-xl overflow-hidden">
      <div className={`px-4 sm:px-5 py-3 ${colors.bg} ${colors.border} border-b`}>
        <h2 className={`text-sm sm:text-base font-semibold ${colors.text} flex items-center gap-2`}>
          <FaCalendarAlt />
          Booking Details
        </h2>
      </div>
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <p className="text-xs text-zinc-500 flex items-center gap-1 mb-0.5">
              <FaCalendarAlt className="text-[10px]" />
              Check-in
            </p>
            <p className="text-sm sm:text-base font-semibold text-zinc-800">
              {booking.startDate ? formatDate(booking.startDate) : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 flex items-center gap-1 mb-0.5">
              <FaCalendarAlt className="text-[10px]" />
              Check-out
            </p>
            <p className="text-sm sm:text-base font-semibold text-zinc-800">
              {booking.endDate ? formatDate(booking.endDate) : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 flex items-center gap-1 mb-0.5">
              <FaClock className="text-[10px]" />
              Duration
            </p>
            <p className="text-sm sm:text-base font-semibold text-zinc-800">
              {booking.nights} {booking.nights === 1 ? "Night" : "Nights"}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-zinc-200">
          <div>
            <p className="text-xs text-zinc-500">Guests</p>
            <p className="text-sm sm:text-base font-semibold text-zinc-800">
              {booking.guestsCount || 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Units</p>
            <p className="text-sm sm:text-base font-semibold text-zinc-800">
              {booking.unitCount}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1">Status</p>
            <div className="w-[90px]">
              <BookingBadge status={booking.status} />
            </div>
          </div>
          {booking.verificationDate && (
            <div>
              <p className="text-xs text-zinc-500">Verified On</p>
              <p className="text-xs font-medium text-zinc-700">
                {formatDate(booking.verificationDate)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { IBooking } from "./types";
import { useRouter } from "next/navigation";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import { formatDate, formatMoney } from "@/src/lib/utils";
import { LuEye, LuTrash2 } from "react-icons/lu";
import { HiOutlinePencilAlt } from "react-icons/hi";
import BookingAttributionChip from "./bookings/AttributionChip";

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: "bg-green-100 text-green-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  PENDING_PAYMENT: "bg-yellow-100 text-yellow-800",
  CANCELLED: "bg-red-100 text-red-800",
  COMPLETED: "bg-blue-100 text-blue-800",
  CHECKED_IN: "bg-teal-100 text-teal-800",
  CHECKED_OUT: "bg-indigo-100 text-indigo-800",
  CANCEL_REQUESTED: "bg-orange-100 text-orange-800",
  APPROVAL_PENDING: "bg-purple-100 text-purple-800",
};

interface BookingCardProps {
  booking: IBooking;
  onDelete: (booking: IBooking) => void;
}

export default function BookingCard({ booking, onDelete }: BookingCardProps) {
  const router = useRouter();
  const b = booking as any;
  const status = b?.status ?? "";
  const guestName = [
    booking?.user?.profile?.first_name || (booking?.user as any)?.firstName,
    booking?.user?.profile?.last_name || (booking?.user as any)?.lastName,
  ]
    .filter(Boolean)
    .join(" ") || b?.user_id || "--";

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 p-4 active:bg-gray-50 transition-colors"
      onClick={() =>
        router.push(PAGE_ROUTES.dashboard.bookingManagement.bookings.details(String(b?.id)))
      }
    >
      {/* Top row: booking ID + status (+ attribution chip) */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-mono text-gray-500 truncate">
          {b?.booking_id ?? "--"}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          <BookingAttributionChip booking={booking as any} size="sm" />
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
              STATUS_STYLES[status] ?? "bg-gray-100 text-gray-800"
            }`}
          >
            {status.replace(/_/g, " ") || "--"}
          </span>
        </div>
      </div>

      {/* Guest + price */}
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-medium text-gray-900 truncate">{guestName}</p>
        <p className="text-sm font-semibold text-gray-900 flex-shrink-0">
          {formatMoney(Number(b?.total_price ?? 0))}
        </p>
      </div>

      {/* Date */}
      <p className="text-xs text-gray-500 mb-3">
        {formatDate(b?.created_at)}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-1 border-t border-gray-100 pt-2 -mx-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(
              PAGE_ROUTES.dashboard.bookingManagement.bookings.details(String(b?.id))
            );
          }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-gray-600 hover:bg-gray-50 rounded-lg"
        >
          <LuEye size={14} /> View
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(
              `${PAGE_ROUTES.dashboard.bookingManagement.bookings.details(String(b?.id))}?edit=true`
            );
          }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-gray-600 hover:bg-gray-50 rounded-lg"
        >
          <HiOutlinePencilAlt size={14} /> Edit
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(booking);
          }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-red-500 hover:bg-red-50 rounded-lg"
        >
          <LuTrash2 size={14} /> Delete
        </button>
      </div>
    </div>
  );
}

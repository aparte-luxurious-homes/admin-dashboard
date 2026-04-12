"use client";

import { useState } from "react";
import { MdEdit, MdCopyAll, MdCheck } from "react-icons/md";
import { LiaPrintSolid } from "react-icons/lia";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import { formatDate } from "@/src/lib/utils";
import { BookingBadge } from "../../badge";
import { BookingStatus } from "../types";
import { NormalizedBooking } from "./utils";

interface BookingHeaderProps {
  booking: NormalizedBooking;
  isOwner: boolean;
  onEdit: () => void;
  onPrint: () => void;
  onRaiseDispute: () => void;
}

export default function BookingHeader({
  booking,
  isOwner,
  onEdit,
  onPrint,
  onRaiseDispute,
}: BookingHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyId = async () => {
    const idToCopy = booking.bookingId || `#${booking.id}`;
    try {
      await navigator.clipboard.writeText(idToCopy);
      setCopied(true);
      toast.success("Copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-start gap-3 mb-6">
      <div className="flex-1 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-zinc-800">
            Booking for{" "}
            {booking.user?.profile?.firstName ||
              booking.user?.email ||
              "Guest"}
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-zinc-500 mb-2">
          {booking.startDate && booking.endDate
            ? `${formatDate(booking.startDate)} - ${formatDate(booking.endDate)}`
            : ""}{" "}
          • {booking.guestsCount} {booking.guestsCount === 1 ? "Guest" : "Guests"}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-zinc-50 px-2 py-1 rounded-md border border-zinc-200">
            <span className="text-xs sm:text-sm text-zinc-600 font-mono">
              {booking.bookingId || `#${booking.id}`}
            </span>
            <button
              onClick={handleCopyId}
              className="p-1 text-zinc-400 hover:text-primary transition-colors"
            >
              {copied ? (
                <MdCheck className="text-green-500 text-sm" />
              ) : (
                <MdCopyAll className="text-sm" />
              )}
            </button>
          </div>
          <div className="w-[100px] sm:w-[120px]">
            <BookingBadge status={booking.status} />
          </div>
        </div>
      </div>

      <div className="flex gap-2 w-full sm:w-auto mt-2 md:mt-0">
        {isOwner && (
          <button
            onClick={onRaiseDispute}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 border border-amber-300 text-amber-700 bg-amber-50 rounded-lg text-xs sm:text-sm hover:bg-amber-100 transition-colors font-medium"
          >
            <Icon icon="solar:danger-bold-duotone" className="text-sm sm:text-base text-amber-600" />
            <span>Raise Dispute</span>
          </button>
        )}
        <button
          onClick={onEdit}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 border border-zinc-300 text-zinc-700 rounded-lg text-xs sm:text-sm hover:bg-zinc-50 transition-colors"
        >
          <MdEdit className="text-sm sm:text-base" />
          <span>Edit</span>
        </button>
        <button
          onClick={onPrint}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-primary text-white rounded-lg text-xs sm:text-sm hover:bg-primary/90 transition-colors"
        >
          <LiaPrintSolid className="text-sm sm:text-base" />
          <span>Print</span>
        </button>
      </div>
    </div>
  );
}

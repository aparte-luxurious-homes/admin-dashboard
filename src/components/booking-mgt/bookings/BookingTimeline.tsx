import { Icon } from "@iconify/react";
import { formatDate } from "@/src/lib/utils";
import { BookingStatus } from "../types";
import { NormalizedBooking } from "./utils";

interface TimelineStep {
  label: string;
  icon: string;
  status: "completed" | "current" | "upcoming" | "skipped";
  timestamp?: string;
}

interface BookingTimelineProps {
  booking: NormalizedBooking;
}

/**
 * Derive the booking's journey from its current status + timestamps.
 * Shows a vertical step indicator: Created > Approved > Paid > Confirmed > Checked In > Checked Out > Completed
 */
function buildTimeline(booking: NormalizedBooking): TimelineStep[] {
  const s = booking.status;

  // Define the full lifecycle in order
  const lifecycle: { key: string; label: string; icon: string }[] = [
    { key: "created", label: "Booking Created", icon: "solar:document-add-bold" },
    { key: "approved", label: "Request Approved", icon: "solar:check-circle-bold" },
    { key: "paid", label: "Payment Received", icon: "solar:wallet-money-bold" },
    { key: "confirmed", label: "Confirmed", icon: "solar:verified-check-bold" },
    { key: "checked_in", label: "Checked In", icon: "solar:login-3-bold" },
    { key: "checked_out", label: "Checked Out", icon: "solar:logout-3-bold" },
    { key: "completed", label: "Completed", icon: "solar:star-bold" },
  ];

  // Map status to the lifecycle index it represents
  const statusToIndex: Record<string, number> = {
    [BookingStatus.APPROVAL_PENDING]: 0,
    [BookingStatus.PENDING]: 2, // skips approved for instant bookings
    [BookingStatus.PENDING_PAYMENT]: 2,
    [BookingStatus.CONFIRMED]: 3,
    [BookingStatus.CHECKED_IN]: 4,
    [BookingStatus.CHECKED_OUT]: 5,
    [BookingStatus.COMPLETED]: 6,
    [BookingStatus.CANCEL_REQUESTED]: 3, // was confirmed when cancel was requested
    [BookingStatus.CANCELLED]: -1, // special
  };

  const currentIdx = statusToIndex[s] ?? 0;
  const isRequestToBook = s === BookingStatus.APPROVAL_PENDING || booking.verificationDate;
  const isCancelled = s === BookingStatus.CANCELLED || s === BookingStatus.CANCEL_REQUESTED;

  // Assign timestamps where we can infer them
  const timestamps: Record<string, string> = {};
  if (booking.createdAt) timestamps["created"] = booking.createdAt;
  if (booking.verificationDate) timestamps["approved"] = booking.verificationDate;
  if (booking.checkoutVerifiedAt) timestamps["checked_out"] = booking.checkoutVerifiedAt;

  const steps: TimelineStep[] = lifecycle
    .filter((step) => {
      // Hide "Request Approved" step for instant bookings
      if (step.key === "approved" && !isRequestToBook) return false;
      return true;
    })
    .map((step) => {
      const idx = lifecycle.indexOf(step);
      let stepStatus: TimelineStep["status"];

      if (isCancelled) {
        // For cancelled bookings: everything before the cancellation point is completed
        const cancelIdx = s === BookingStatus.CANCEL_REQUESTED ? 3 : currentIdx;
        if (idx < cancelIdx && cancelIdx >= 0) stepStatus = "completed";
        else if (idx === cancelIdx && cancelIdx >= 0) stepStatus = "current";
        else stepStatus = "skipped";
      } else if (idx < currentIdx) {
        stepStatus = "completed";
      } else if (idx === currentIdx) {
        stepStatus = "current";
      } else {
        stepStatus = "upcoming";
      }

      return {
        label: step.label,
        icon: step.icon,
        status: stepStatus,
        timestamp: timestamps[step.key],
      };
    });

  // Add cancellation step at the end if applicable
  if (s === BookingStatus.CANCEL_REQUESTED) {
    steps.push({
      label: "Cancellation Requested",
      icon: "solar:close-circle-bold",
      status: "current",
    });
  } else if (s === BookingStatus.CANCELLED) {
    steps.push({
      label: "Cancelled",
      icon: "solar:close-circle-bold",
      status: "current",
    });
  }

  return steps;
}

const stepStyles: Record<TimelineStep["status"], { dot: string; line: string; text: string; iconColor: string }> = {
  completed: {
    dot: "bg-green-500 border-green-200",
    line: "bg-green-300",
    text: "text-zinc-700",
    iconColor: "text-white",
  },
  current: {
    dot: "bg-primary border-primary/20 ring-4 ring-primary/10",
    line: "bg-zinc-200",
    text: "text-zinc-900 font-semibold",
    iconColor: "text-white",
  },
  upcoming: {
    dot: "bg-zinc-100 border-zinc-200",
    line: "bg-zinc-200",
    text: "text-zinc-400",
    iconColor: "text-zinc-400",
  },
  skipped: {
    dot: "bg-zinc-100 border-zinc-200 opacity-50",
    line: "bg-zinc-100",
    text: "text-zinc-300 line-through",
    iconColor: "text-zinc-300",
  },
};

export default function BookingTimeline({ booking }: BookingTimelineProps) {
  const steps = buildTimeline(booking);

  return (
    <div className="border border-zinc-200 rounded-xl overflow-hidden">
      <div className="px-4 sm:px-5 py-3 bg-zinc-50 border-b border-zinc-200">
        <h2 className="text-sm sm:text-base font-semibold text-zinc-800 flex items-center gap-2">
          <Icon icon="solar:timeline-up-bold" className="text-base" />
          Booking Timeline
        </h2>
      </div>
      <div className="p-4 sm:p-5">
        <div className="relative">
          {steps.map((step, i) => {
            const style = stepStyles[step.status];
            const isLast = i === steps.length - 1;
            const isCancelStep = step.label.includes("Cancel");

            return (
              <div key={i} className="flex gap-3 relative">
                {/* Vertical line + dot */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      isCancelStep ? "bg-red-500 border-red-200" : style.dot
                    }`}
                  >
                    <Icon
                      icon={step.icon}
                      className={`text-sm ${isCancelStep ? "text-white" : style.iconColor}`}
                    />
                  </div>
                  {!isLast && (
                    <div className={`w-0.5 flex-1 min-h-[24px] ${style.line}`} />
                  )}
                </div>

                {/* Content */}
                <div className={`pb-5 ${isLast ? "pb-0" : ""}`}>
                  <p className={`text-xs sm:text-sm leading-tight ${isCancelStep ? "text-red-600 font-semibold" : style.text}`}>
                    {step.label}
                  </p>
                  {step.timestamp && (
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      {formatDate(step.timestamp)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

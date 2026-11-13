import { Icon } from "@iconify/react";
import { BookingStatus } from "../types";
import { NormalizedBooking } from "./utils";

interface BookingStatusBannerProps {
  booking: NormalizedBooking;
}

export default function BookingStatusBanner({ booking }: BookingStatusBannerProps) {
  const banners: React.ReactNode[] = [];

  // Approval pending notice
  if (booking.status === BookingStatus.APPROVAL_PENDING) {
    banners.push(
      <div key="approval" className="border border-orange-200 bg-orange-50 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-orange-800 mb-1">Awaiting Owner Approval</h3>
        <p className="text-xs text-orange-700">
          The guest has submitted a booking request. The dates are held pending your decision.
        </p>
      </div>,
    );
  }

  // Cancellation reason
  if (booking.status === BookingStatus.CANCELLED && booking.cancellationReason) {
    banners.push(
      <div key="cancel" className="border border-red-200 bg-red-50 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-red-800 mb-1">Cancellation Reason</h3>
        <p className="text-xs text-red-700">{booking.cancellationReason}</p>
      </div>,
    );
  }

  // Rejection reason
  if (booking.status === BookingStatus.CANCELLED && booking.rejectionReason) {
    banners.push(
      <div key="reject" className="border border-orange-200 bg-orange-50 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-orange-800 mb-1">Request Rejected</h3>
        <p className="text-xs text-orange-700">{booking.rejectionReason}</p>
      </div>,
    );
  }

  // Caution deposit status
  if (!booking.isCautionRefunded) {
    banners.push(
      <div key="caution-pending" className="p-3 bg-amber-50 rounded-lg border border-amber-100">
        <div className="flex items-start gap-2">
          <Icon icon="solar:info-circle-bold-duotone" className="text-amber-500 text-lg shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            Caution deposit will be refunded to the guest after check-out, subject to property inspection.
          </p>
        </div>
      </div>,
    );
  } else {
    banners.push(
      <div key="caution-done" className="p-3 bg-green-50 rounded-lg border border-green-100">
        <div className="flex items-start gap-2">
          <Icon icon="solar:check-read-circle-bold-duotone" className="text-green-500 text-lg shrink-0 mt-0.5" />
          <div className="text-xs text-green-700">
            <p>Caution deposit has been successfully refunded to the guest.</p>
            {booking.cautionRefundNotes && (
              <p className="mt-1 italic text-green-600">Note: {booking.cautionRefundNotes}</p>
            )}
          </div>
        </div>
      </div>,
    );
  }

  if (banners.length === 0) return null;

  return <div className="space-y-3">{banners}</div>;
}

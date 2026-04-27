"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { formatDate, formatMoney } from "@/src/lib/utils";
import { BookingStatus } from "../types";
import { NormalizedBooking } from "./utils";
import Modal from "../../modal/Modal";
import DeleteBookingDialog from "../dialogs/DeleteBookingDialog";
import { CautionRefundModal } from "../modals/CautionRefundModal";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import {
  CheckInBooking,
  CheckOutBooking,
  RefundCautionFee,
  DeleteBooking,
  RequestCancellation,
  ApproveCancellation,
  ApproveBookingRequest,
  RejectBookingRequest,
} from "@/src/lib/request-handlers/bookingMgt";
import { usePermissions } from "@/src/hooks/usePermissions";

interface BookingActionBarProps {
  booking: NormalizedBooking;
  onStatusChange: (status: BookingStatus) => void;
}

export default function BookingActionBar({ booking, onStatusChange }: BookingActionBarProps) {
  const router = useRouter();
  const status = booking.status;
  const {
    isSuperAdmin,
    isAdmin,
    isOwner,
    isStaff,
    canManageFinances,
    canCancelBooking,
  } = usePermissions();

  // Mutations
  const { mutate: checkIn, isPending: isCheckingIn } = CheckInBooking();
  const { mutate: checkOut, isPending: isCheckingOut } = CheckOutBooking();
  const { mutate: refundCaution, isPending: isRefunding } = RefundCautionFee();
  const { mutate: deleteBooking, isPending: isDeleting } = DeleteBooking();
  const { mutate: requestCancellation, isPending: isCancelling } = RequestCancellation();
  const { mutate: approveCancellation, isPending: isApproving } = ApproveCancellation();
  const { mutate: approveRequest, isPending: isApprovingRequest } = ApproveBookingRequest();
  const { mutate: rejectRequest, isPending: isRejectingRequest } = RejectBookingRequest();

  // Modal state
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Handlers
  const handleCheckIn = () => {
    checkIn(
      { bookingId: booking.id },
      {
        onSuccess: () => {
          toast.success("Booking marked as checked in");
          onStatusChange(BookingStatus.CHECKED_IN);
        },
        onError: (err: any) =>
          toast.error(err?.response?.data?.detail || "Failed to check in"),
      },
    );
  };

  const handleCheckOut = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const scheduledEnd = new Date(booking.endDate);
    scheduledEnd.setHours(0, 0, 0, 0);

    if (today < scheduledEnd) {
      setShowCheckoutConfirm(true);
    } else {
      performCheckOut();
    }
  };

  const performCheckOut = () => {
    setShowCheckoutConfirm(false);
    checkOut(
      { bookingId: booking.id },
      {
        onSuccess: () => {
          toast.success("Booking marked as checked out");
          onStatusChange(BookingStatus.CHECKED_OUT);
        },
        onError: (err: any) =>
          toast.error(err?.response?.data?.detail || "Failed to check out"),
      },
    );
  };

  const handleApproveRequest = () => {
    approveRequest(
      { bookingId: booking.id },
      {
        onSuccess: () => {
          toast.success("Booking request approved — guest can now pay");
          onStatusChange(BookingStatus.PENDING);
        },
        onError: (err: any) =>
          toast.error(err?.response?.data?.detail || "Failed to approve request"),
      },
    );
  };

  const handleRejectRequest = () => {
    rejectRequest(
      { bookingId: booking.id, reason: rejectReason || undefined },
      {
        onSuccess: () => {
          toast.success("Booking request rejected");
          setShowRejectModal(false);
          setRejectReason("");
          onStatusChange(BookingStatus.CANCELLED);
        },
        onError: (err: any) =>
          toast.error(err?.response?.data?.detail || "Failed to reject request"),
      },
    );
  };

  const handleApproveCancellation = () => {
    approveCancellation(
      { bookingId: booking.id },
      {
        onSuccess: () => {
          toast.success("Cancellation approved");
          onStatusChange(BookingStatus.CANCELLED);
        },
        onError: (err: any) =>
          toast.error(err?.response?.data?.detail || "Failed to approve cancellation"),
      },
    );
  };

  // Determine which actions to show, grouped by intent
  const primaryAction = getPrimaryAction();
  const secondaryActions = getSecondaryActions();
  const destructiveActions = getDestructiveActions();

  function getPrimaryAction() {
    switch (status) {
      case BookingStatus.CONFIRMED:
        if (!isStaff) return null;
        return (
          <button
            onClick={handleCheckIn}
            disabled={isCheckingIn}
            className="px-5 py-2.5 bg-teal-600 text-white rounded-lg text-xs sm:text-sm hover:bg-teal-700 transition-colors font-semibold disabled:opacity-50 shadow-sm"
          >
            {isCheckingIn ? "Processing..." : "Check In"}
          </button>
        );
      case BookingStatus.CHECKED_IN:
        if (!isStaff) return null;
        return (
          <button
            onClick={handleCheckOut}
            disabled={isCheckingOut}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-xs sm:text-sm hover:bg-indigo-700 transition-colors font-semibold disabled:opacity-50 shadow-sm"
          >
            {isCheckingOut ? "Processing..." : "Check Out"}
          </button>
        );
      case BookingStatus.CHECKED_OUT:
        if (!booking.isCautionRefunded && canManageFinances) {
          return (
            <button
              onClick={() => setShowRefundModal(true)}
              disabled={isRefunding}
              className="px-5 py-2.5 bg-green-600 text-white rounded-lg text-xs sm:text-sm hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 shadow-sm"
            >
              {isRefunding ? "Processing..." : "Refund Caution"}
            </button>
          );
        }
        return null;
      case BookingStatus.APPROVAL_PENDING:
        if (!(isAdmin || isOwner)) return null;
        return (
          <button
            onClick={handleApproveRequest}
            disabled={isApprovingRequest}
            className="px-5 py-2.5 bg-teal-600 text-white rounded-lg text-xs sm:text-sm hover:bg-teal-700 transition-colors font-semibold disabled:opacity-50 shadow-sm"
          >
            {isApprovingRequest ? "Approving..." : "Approve Request"}
          </button>
        );
      case BookingStatus.CANCEL_REQUESTED:
        if (!canManageFinances) return null;
        return (
          <div className="flex flex-col items-end gap-1">
            <p className="text-[10px] text-amber-700 text-right max-w-xs">
              20% booking fee non-refundable. Guest receives{" "}
              <strong>
                {formatMoney((Number(booking.totalPrice) - booking.cautionFee) * 0.8)}
              </strong>
            </p>
            <button
              onClick={handleApproveCancellation}
              disabled={isApproving}
              className="px-5 py-2.5 bg-green-600 text-white rounded-lg text-xs sm:text-sm hover:bg-green-700 transition-colors font-semibold disabled:opacity-50 shadow-sm"
            >
              {isApproving ? "Approving..." : "Approve Cancellation"}
            </button>
          </div>
        );
      default:
        return null;
    }
  }

  function getSecondaryActions() {
    const actions: React.ReactNode[] = [];

    // Reject button for approval pending — owner or admin
    if (status === BookingStatus.APPROVAL_PENDING && (isAdmin || isOwner)) {
      actions.push(
        <button
          key="reject"
          onClick={() => setShowRejectModal(true)}
          disabled={isRejectingRequest}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg text-xs sm:text-sm hover:bg-orange-700 transition-colors font-medium disabled:opacity-50"
        >
          Reject
        </button>,
      );
    }

    return actions;
  }

  function getDestructiveActions() {
    const actions: React.ReactNode[] = [];

    // Cancel button — admin/owner/agent, and not for terminal/pre-pay statuses
    const hideCancelFor = [
      BookingStatus.CANCELLED,
      BookingStatus.COMPLETED,
      BookingStatus.CANCEL_REQUESTED,
      BookingStatus.APPROVAL_PENDING,
    ];
    if (canCancelBooking && !hideCancelFor.includes(status)) {
      actions.push(
        <button
          key="cancel"
          onClick={() => setShowCancelConfirm(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs sm:text-sm hover:bg-red-700 transition-colors font-medium"
        >
          Cancel Booking
        </button>,
      );
    }

    // Delete — SUPER_ADMIN only
    if (isSuperAdmin) {
      actions.push(
        <button
          key="delete"
          onClick={() => setShowDeleteConfirm(true)}
          className="px-4 py-2 bg-zinc-800 text-white rounded-lg text-xs sm:text-sm hover:bg-zinc-950 transition-colors font-medium"
        >
          Delete
        </button>,
      );
    }

    return actions;
  }

  const propertyName = booking.property?.name || booking.unit?.name;

  return (
    <>
      <div className="fixed bottom-16 left-0 right-0 z-30 bg-white border-t border-zinc-200 px-4 py-3 md:relative md:bottom-auto md:left-auto md:right-auto md:z-auto md:bg-transparent md:border-t-0 md:px-5 lg:px-10 md:pb-8">
        <div className="flex flex-row items-center gap-2 overflow-x-auto md:flex-wrap md:overflow-visible md:pt-4 md:border-t md:border-zinc-200">
          {/* Back button — always left */}
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border border-zinc-300 text-zinc-700 rounded-lg text-xs sm:text-sm hover:bg-zinc-50 transition-colors font-medium flex-shrink-0"
          >
            Go Back
          </button>

          {/* Spacer to push actions right */}
          <div className="flex-1" />

          {/* Destructive actions */}
          {destructiveActions.length > 0 && (
            <div className="flex gap-2 flex-shrink-0">
              {destructiveActions}
            </div>
          )}

          {/* Secondary actions */}
          {secondaryActions.length > 0 && (
            <div className="flex gap-2 flex-shrink-0">
              {secondaryActions}
            </div>
          )}

          {/* Primary action — rightmost, most prominent */}
          {primaryAction && <div className="flex-shrink-0">{primaryAction}</div>}
        </div>
      </div>

      {/* ---- Modals ---- */}

      {/* Early checkout confirmation */}
      <Modal
        isOpen={showCheckoutConfirm}
        onClose={() => setShowCheckoutConfirm(false)}
        title="Early Check-Out Confirmation"
        content={
          <div className="text-xs sm:text-sm text-zinc-600">
            <p>
              This booking is scheduled to end on{" "}
              <span className="font-semibold">
                {booking.endDate ? formatDate(booking.endDate) : "the scheduled date"}
              </span>.
            </p>
            <p className="mt-2">
              Are you sure you want to mark this guest as checked out early?
            </p>
          </div>
        }
        footer={
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setShowCheckoutConfirm(false)}
              className="px-4 py-1.5 border border-zinc-300 rounded-lg text-xs hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={performCheckOut}
              className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs hover:bg-indigo-700 transition-colors"
            >
              Confirm
            </button>
          </div>
        }
      />

      {/* Cancel booking dialog — calls request-cancellation, which the
          backend short-circuits to CANCELLED for unpaid bookings and routes
          to CANCEL_REQUESTED (admin approval + refund) for paid ones. */}
      <DeleteBookingDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        bookingId={booking.id}
        propertyName={propertyName}
        isPending={isCancelling}
        onConfirm={(reason) => {
          requestCancellation(
            { bookingId: booking.id, cancellationReason: reason },
            {
              onSuccess: (resp: any) => {
                const newStatus = resp?.data?.data?.status as BookingStatus | undefined;
                setShowCancelConfirm(false);
                if (newStatus === BookingStatus.CANCEL_REQUESTED) {
                  toast.success("Cancellation requested — awaiting admin approval");
                } else {
                  toast.success("Booking cancelled");
                }
                onStatusChange(newStatus ?? BookingStatus.CANCELLED);
              },
              onError: (err: any) => {
                toast.error(err?.response?.data?.detail || "Failed to cancel booking");
              },
            },
          );
        }}
      />

      {/* Delete booking dialog */}
      <DeleteBookingDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        bookingId={booking.id}
        isPending={isDeleting}
        propertyName={booking.unit?.name}
        title="Delete Booking Record?"
        description={`Are you sure you want to permanently delete booking ${booking.bookingId}?`}
        confirmText="Delete Permanently"
        onConfirm={(reason) => {
          deleteBooking(
            { bookingId: booking.id, cancellationReason: reason || "Deleted by admin" },
            {
              onSuccess: () => {
                toast.success("Booking record deleted");
                router.push(PAGE_ROUTES.dashboard.bookingManagement.bookings.base);
              },
              onError: (err: any) => {
                toast.error(err?.response?.data?.detail || "Failed to delete booking");
              },
            },
          );
        }}
      />

      {/* Caution refund modal */}
      <CautionRefundModal
        isOpen={showRefundModal}
        onClose={() => setShowRefundModal(false)}
        isPending={isRefunding}
        onConfirm={(shouldRefund, notes) => {
          refundCaution(
            { bookingId: booking.id, payload: { should_refund: shouldRefund, notes } },
            {
              onSuccess: () => {
                toast.success(shouldRefund ? "Refund approved" : "Caution fee withheld");
                setShowRefundModal(false);
              },
              onError: (err: any) => {
                toast.error(err?.response?.data?.detail || "Failed to process caution fee");
              },
            },
          );
        }}
      />

      {/* Reject request modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setRejectReason("");
        }}
        title="Reject Booking Request"
        content={
          <div className="space-y-3">
            <p className="text-xs sm:text-sm text-zinc-600">
              The guest will be notified that their request was rejected.
            </p>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                Reason (optional)
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Property not available"
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 resize-none"
              />
            </div>
          </div>
        }
        footer={
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                setShowRejectModal(false);
                setRejectReason("");
              }}
              className="px-3 py-1.5 border border-zinc-300 rounded-lg text-xs hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleRejectRequest}
              disabled={isRejectingRequest}
              className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs hover:bg-orange-700 transition-colors font-medium disabled:opacity-50"
            >
              {isRejectingRequest ? "Rejecting..." : "Confirm"}
            </button>
          </div>
        }
      />
    </>
  );
}

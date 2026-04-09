import { FaMoneyBillWave } from "react-icons/fa";
import { MdRefresh } from "react-icons/md";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import { formatMoney } from "@/src/lib/utils";
import { BookingStatus } from "../types";
import CollapsibleSection from "../../mobile/CollapsibleSection";
import { RetryBookingPayment } from "@/src/lib/request-handlers/bookingMgt";
import { NormalizedBooking, getStatusColors } from "./utils";

interface BookingPaymentCardProps {
  booking: NormalizedBooking;
}

export default function BookingPaymentCard({ booking }: BookingPaymentCardProps) {
  const colors = getStatusColors(booking.status);
  const { mutate: retryPayment, isPending: isRetrying } = RetryBookingPayment();

  const canRetry =
    (booking.status === BookingStatus.PENDING ||
      booking.status === BookingStatus.PENDING_PAYMENT) &&
    booking.transactionRef;

  const handleRetry = () => {
    retryPayment(
      { bookingId: booking.id },
      {
        onSuccess: (response) => {
          const result = response?.data?.data;
          if (result?.success) {
            toast.success(result.message || "Payment verified successfully!");
          } else {
            toast.error(result?.message || "Payment verification failed");
          }
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.detail || "Failed to verify payment");
        },
      },
    );
  };

  return (
    <CollapsibleSection title="Payment Information" icon="solar:wallet-money-bold" colorClass={colors.bg}>
      <div className="border border-zinc-200 rounded-xl overflow-hidden">
        <div className={`px-4 sm:px-5 py-3 ${colors.bg} ${colors.border} border-b`}>
          <h2 className={`text-sm sm:text-base font-semibold ${colors.text} flex items-center gap-2`}>
            <FaMoneyBillWave />
            Payment
          </h2>
        </div>
        <div className="p-4 sm:p-5">
          <div className="space-y-2">
            <div className="flex justify-between items-center py-1 text-xs sm:text-sm">
              <span className="text-zinc-600">Price per night</span>
              <span className="font-medium text-zinc-800">{formatMoney(booking.pricePerNight)}</span>
            </div>
            <div className="flex justify-between items-center py-1 text-xs sm:text-sm">
              <span className="text-zinc-600">Nights</span>
              <span className="font-medium text-zinc-800">×{booking.nights}</span>
            </div>
            <div className="flex justify-between items-center py-1 text-xs sm:text-sm">
              <span className="text-zinc-600">Units</span>
              <span className="font-medium text-zinc-800">×{booking.unitCount}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-t border-zinc-200 mt-1 pt-2 text-xs sm:text-sm">
              <span className="text-zinc-600">Subtotal</span>
              <span className="font-medium text-zinc-800">{formatMoney(booking.subtotal)}</span>
            </div>
            <div className="flex justify-between items-center py-1 text-xs sm:text-sm">
              <span className="text-zinc-600">Caution fee</span>
              <span className="font-medium text-zinc-800">{formatMoney(booking.cautionFee)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-t-2 border-zinc-300 mt-2 text-sm sm:text-base">
              <span className="font-semibold text-zinc-800">Total</span>
              <span className="text-lg sm:text-xl font-bold text-primary">
                {formatMoney(booking.totalPrice)}
              </span>
            </div>

            {/* Payment method */}
            {booking.paymentMethod && (
              <div className="mt-3 pt-3 border-t border-zinc-200">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Payment Method</span>
                  <span className="font-medium text-zinc-700 capitalize">
                    {booking.paymentMethod.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            )}

            {/* Transaction reference */}
            {booking.transactionRef && (
              <div className={`${!booking.paymentMethod ? "mt-3 pt-3 border-t border-zinc-200" : ""}`}>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Transaction Ref</span>
                  <span className="font-mono text-zinc-700">{booking.transactionRef}</span>
                </div>
              </div>
            )}

            {/* Payment proof */}
            {booking.paymentProofUrl && (
              <div className="mt-3 pt-3 border-t border-zinc-200">
                <p className="text-xs text-zinc-500 mb-2">Payment Proof</p>
                <a
                  href={booking.paymentProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-primary hover:bg-zinc-100 transition-colors"
                >
                  <Icon icon="solar:document-bold" className="text-base" />
                  View Payment Proof
                </a>
                {booking.paymentNotes && (
                  <p className="text-xs text-zinc-600 mt-2 italic">
                    Note: {booking.paymentNotes}
                  </p>
                )}
              </div>
            )}

            {/* Retry payment */}
            {canRetry && (
              <div className="mt-4 pt-4 border-t border-zinc-200">
                <button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-xs sm:text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <MdRefresh className={`text-sm ${isRetrying ? "animate-spin" : ""}`} />
                  <span>{isRetrying ? "Verifying..." : "Retry Payment"}</span>
                </button>
                <p className="text-[10px] sm:text-xs text-zinc-500 mt-1.5 text-center">
                  Click to manually verify payment status
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}

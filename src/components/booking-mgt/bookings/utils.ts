import { IBooking, BookingStatus } from "../types";
import { getDayDifference } from "@/src/lib/utils";

/**
 * Normalized booking data — resolves snake_case vs camelCase API inconsistencies
 * into a single consistent camelCase interface. Use this at the top of any component
 * that consumes booking data instead of scattering `(bookingDetails as any)` casts.
 */
export interface NormalizedBooking {
  id: string | number;
  bookingId: string;
  userId: string | number;
  unitId: string | number;
  transactionId: string;
  transactionRef: string | null;
  startDate: string;
  endDate: string;
  guestsCount: number;
  unitCount: number;
  totalPrice: number;
  cautionFee: number;
  isCautionRefunded: boolean;
  cautionRefundNotes: string;
  cautionRefundActionBy: string;
  checkoutVerifiedAt: string;
  status: BookingStatus;
  cancellationReason: string;
  rejectionReason: string;
  verificationDate: string;
  createdAt: string;
  updatedAt: string;
  paymentMethod: string;
  paymentProofUrl: string;
  paymentNotes: string;
  referralCodeUsed: string;
  referrerId: string;
  user: IBooking["user"];
  unit: IBooking["unit"];
  revenueSplit: IBooking["revenueSplit"] | null;
  // Fee breakdown — gateway_fee is added on top of total_price; total_payable
  // is what the guest actually pays at checkout.
  gatewayFee: number;
  totalPayable: number;
  // Computed fields
  nights: number;
  pricePerNight: number;
  subtotal: number;
  property: IBooking["unit"]["property"];
}

/** Map raw API booking (mixed naming) into a clean camelCase object */
export function normalizeBooking(raw: IBooking): NormalizedBooking {
  const r = raw as any;

  const startDate = raw.startDate || r.start_date || "";
  const endDate = raw.endDate || r.end_date || "";
  const nights = startDate && endDate ? getDayDifference(endDate, startDate) : 0;
  const pricePerNight = Number(raw.unit?.pricePerNight || r.unit?.price_per_night || 0);
  const unitCount = raw.unitCount || r.unit_count || 1;

  return {
    id: raw.id,
    bookingId: raw.bookingId || r.booking_id || "",
    userId: raw.userId || r.user_id || "",
    unitId: raw.unitId || r.unit_id || "",
    transactionId: raw.transactionId || r.transaction_id || "",
    transactionRef: raw.transactionRef || r.transaction_ref || null,
    startDate,
    endDate,
    guestsCount: raw.guestsCount || r.guests_count || 0,
    unitCount,
    totalPrice: Number(raw.totalPrice || r.total_price || 0),
    cautionFee: Number(raw.cautionFee || r.caution_fee || 0),
    gatewayFee: Number((raw as any).gatewayFee ?? r.gateway_fee ?? 0),
    totalPayable: Number((raw as any).totalPayable ?? r.total_payable ?? (Number(raw.totalPrice || r.total_price || 0) + Number((raw as any).gatewayFee ?? r.gateway_fee ?? 0))),
    isCautionRefunded: raw.isCautionRefunded ?? r.is_caution_refunded ?? false,
    cautionRefundNotes: raw.cautionRefundNotes || r.caution_refund_notes || "",
    cautionRefundActionBy: raw.cautionRefundActionBy || r.caution_refund_action_by || "",
    checkoutVerifiedAt: raw.checkoutVerifiedAt || r.checkout_verified_at || "",
    status: raw.status,
    cancellationReason: raw.cancellationReason || r.cancellation_reason || "",
    rejectionReason: raw.rejectionReason || r.rejection_reason || "",
    verificationDate: raw.verificationDate || r.verification_date || "",
    createdAt: raw.createdAt || r.created_at || "",
    updatedAt: raw.updatedAt || r.updated_at || "",
    paymentMethod: raw.paymentMethod || r.payment_method || "",
    paymentProofUrl: raw.paymentProofUrl || r.payment_proof_url || "",
    paymentNotes: raw.paymentNotes || r.payment_notes || "",
    referralCodeUsed: r.referral_code_used || "",
    referrerId: r.referrer_id || "",
    user: raw.user,
    unit: raw.unit,
    revenueSplit: raw.revenueSplit || raw.revenue_split || null,
    // Computed
    nights,
    pricePerNight,
    subtotal: pricePerNight * nights * unitCount,
    property: r.property || raw.unit?.property || null,
  };
}

/** Status-aware color palette */
export function getStatusColors(status: BookingStatus) {
  switch (status) {
    case BookingStatus.CANCELLED:
      return { text: "text-red-600", bg: "bg-red-50", border: "border-red-200", icon: "#dc2626" };
    case BookingStatus.COMPLETED:
      return { text: "text-zinc-600", bg: "bg-zinc-50", border: "border-zinc-200", icon: "#52525b" };
    case BookingStatus.APPROVAL_PENDING:
      return { text: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200", icon: "#ea580c" };
    case BookingStatus.PENDING:
    case BookingStatus.PENDING_PAYMENT:
      return { text: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200", icon: "#FFAE00" };
    case BookingStatus.CONFIRMED:
      return { text: "text-teal-600", bg: "bg-teal-50", border: "border-teal-200", icon: "#028090" };
    case BookingStatus.CHECKED_IN:
      return { text: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", icon: "#2563eb" };
    case BookingStatus.CHECKED_OUT:
      return { text: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200", icon: "#4f46e5" };
    default:
      return { text: "text-zinc-600", bg: "bg-zinc-50", border: "border-zinc-200", icon: "#191919" };
  }
}

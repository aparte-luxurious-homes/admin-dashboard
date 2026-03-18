"use client";

import { IoLocationOutline } from "react-icons/io5";
import { LiaPrintSolid } from "react-icons/lia";
import { MdEdit } from "react-icons/md";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaClock,
  FaUsers,
  FaHome,
  FaBed,
  FaMoneyBillWave,
  FaChartPie,
} from "react-icons/fa";
import { Icon } from "@iconify/react";
import { useEffect, useRef, useState } from "react";
import {
  downloadScreenAsPDF,
  formatDate,
  formatMoney,
  getDayDifference,
} from "@/src/lib/utils";
import EditBookingDetails from "./EditBookingDetails";
import { BookingBadge } from "../../badge";
import { BookingStatus, IBooking } from "../types";
import { GetBookingDetails } from "@/src/lib/request-handlers/bookingMgt";
import Loader from "../../loader";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import Image from "next/image";
import { MdRefresh, MdCopyAll, MdCheck } from "react-icons/md";
import Modal from "../../modal/Modal";
// import PDFContent from "./component/pdf";
import DeleteBookingDialog from "../dialogs/DeleteBookingDialog";
import {
  RetryBookingPayment,
  CheckInBooking,
  CheckOutBooking,
  RefundCautionFee,
  DeleteBooking,
  ApproveCancellation,
  ApproveBookingRequest,
  RejectBookingRequest,
} from "@/src/lib/request-handlers/bookingMgt";
import { toast } from "react-hot-toast";
import { CautionRefundModal } from "../modals/CautionRefundModal";

export default function BookingDetailView({
  bookingId,
}: {
  bookingId: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const targetRef = useRef<HTMLDivElement>(null);
  const [editMode, setEditMode] = useState<boolean>(
    Boolean(searchParams.get("edit")),
  );
  const [copied, setCopied] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [status, setStatus] = useState(BookingStatus.PENDING);
  const { data: bookingData, isLoading, error } = GetBookingDetails(bookingId);
  const [bookingDetails, setBookingDetails] = useState<IBooking | null>(null);
  const { mutate: retryPayment, isPending: isRetrying } = RetryBookingPayment();
  const { mutate: checkIn, isPending: isCheckingIn } = CheckInBooking();
  const { mutate: checkOut, isPending: isCheckingOut } = CheckOutBooking();
  const { mutate: refundCaution, isPending: isRefunding } = RefundCautionFee();
  const { mutate: deleteBooking, isPending: isDeleting } = DeleteBooking();
  const { mutate: approveCancellation, isPending: isApproving } =
    ApproveCancellation();
  const { mutate: approveRequest, isPending: isApprovingRequest } =
    ApproveBookingRequest();
  const { mutate: rejectRequest, isPending: isRejectingRequest } =
    RejectBookingRequest();
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    if (bookingData?.data?.data) {
      setBookingDetails(bookingData.data.data);
      setStatus(bookingData.data.data.status);
    }
  }, [bookingData]);

  const setQueryParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleCopyId = async () => {
    if (!bookingDetails) return;
    const idToCopy = bookingDetails.bookingId || `#${bookingDetails.id}`;
    try {
      await navigator.clipboard.writeText(idToCopy);
      setCopied(true);
      toast.success("Copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Copy failed");
    }
  };

  const getStatusColors = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.CANCELLED:
        return {
          text: "text-red-600",
          bg: "bg-red-50",
          border: "border-red-200",
          icon: "#dc2626",
        };
      case BookingStatus.COMPLETED:
        return {
          text: "text-zinc-600",
          bg: "bg-zinc-50",
          border: "border-zinc-200",
          icon: "#52525b",
        };
      case BookingStatus.APPROVAL_PENDING:
        return {
          text: "text-orange-600",
          bg: "bg-orange-50",
          border: "border-orange-200",
          icon: "#ea580c",
        };
      case BookingStatus.PENDING:
        return {
          text: "text-yellow-600",
          bg: "bg-yellow-50",
          border: "border-yellow-200",
          icon: "#FFAE00",
        };
      case BookingStatus.PENDING_PAYMENT:
        return {
          text: "text-yellow-600",
          bg: "bg-yellow-50",
          border: "border-yellow-200",
          icon: "#FFAE00",
        };
      case BookingStatus.CONFIRMED:
        return {
          text: "text-teal-600",
          bg: "bg-teal-50",
          border: "border-teal-200",
          icon: "#028090",
        };
      case BookingStatus.CHECKED_IN:
        return {
          text: "text-blue-600",
          bg: "bg-blue-50",
          border: "border-blue-200",
          icon: "#2563eb",
        };
      case BookingStatus.CHECKED_OUT:
        return {
          text: "text-indigo-600",
          bg: "bg-indigo-50",
          border: "border-indigo-200",
          icon: "#4f46e5",
        };
      default:
        return {
          text: "text-zinc-600",
          bg: "bg-zinc-50",
          border: "border-zinc-200",
          icon: "#191919",
        };
    }
  };

  const colors = getStatusColors(status);
  const startDate =
    bookingDetails?.startDate || (bookingDetails as any)?.start_date;
  const endDate = bookingDetails?.endDate || (bookingDetails as any)?.end_date;
  const nights =
    startDate && endDate ? getDayDifference(endDate, startDate) : 0;
  const unitPrice =
    bookingDetails?.unit?.pricePerNight ||
    (bookingDetails?.unit as any)?.price_per_night ||
    0;
  const pricePerNight = Number(unitPrice);
  const cautionFee = Number(
    bookingDetails?.caution_fee || (bookingDetails as any)?.caution_fee || 0,
  );
  const unitCount =
    bookingDetails?.unitCount || (bookingDetails as any)?.unit_count || 1;
  const guestsCount =
    bookingDetails?.guestsCount || (bookingDetails as any)?.guests_count || 0;
  const totalPrice =
    bookingDetails?.totalPrice || (bookingDetails as any)?.total_price || 0;
  const transactionRef =
    bookingDetails?.transactionRef || (bookingDetails as any)?.transaction_ref;

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-10 w-full max-w-[1600px] mx-auto">
      <div className="w-full bg-white rounded-xl shadow-sm min-h-[50vh]">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <Loader />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
            <p className="text-red-600 text-base sm:text-lg mb-3">Failed to load booking details</p>
            <p className="text-zinc-500 text-xs sm:text-sm mb-5 max-w-md">Please try again or contact support if the issue persists</p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : !bookingDetails ? (
          <div className="flex items-center justify-center min-h-[50vh] p-6">
            <div className="text-center">
              <p className="text-zinc-600 text-base sm:text-lg mb-1">No booking found</p>
              <p className="text-zinc-400 text-xs sm:text-sm">The booking you're looking for doesn't exist or has been removed</p>
            </div>
          </div>
        ) : (
          <>
            <div ref={targetRef} className="p-4 sm:p-5 md:p-8 lg:p-10">
              {/* Header Section */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-start gap-3 mb-6">
                <div className="flex-1 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                    <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-zinc-800">
                      Booking for{" "}
                      {bookingDetails.user?.profile?.firstName ||
                        bookingDetails.user?.email ||
                        "Guest"}
                    </h1>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-500 mb-2">
                    {startDate && endDate
                      ? `${formatDate(startDate)} - ${formatDate(endDate)}`
                      : ""}{" "}
                    • {guestsCount} {guestsCount === 1 ? 'Guest' : 'Guests'}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 bg-zinc-50 px-2 py-1 rounded-md border border-zinc-200">
                      <span className="text-xs sm:text-sm text-zinc-600 font-mono">
                        {bookingDetails.bookingId || `#${bookingDetails.id}`}
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
                      <BookingBadge status={status} />
                    </div>
                  </div>
                </div>

                {!editMode && (
                  <div className="flex gap-2 w-full sm:w-auto mt-2 md:mt-0">
                    <button
                      onClick={() => {
                        setEditMode(true);
                        setQueryParam("edit", "true");
                      }}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 border border-zinc-300 text-zinc-700 rounded-lg text-xs sm:text-sm hover:bg-zinc-50 transition-colors"
                    >
                      <MdEdit className="text-sm sm:text-base" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() =>
                        downloadScreenAsPDF({
                          name: `booking-${bookingDetails.bookingId}.pdf`,
                          element: targetRef,
                        })
                      }
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-primary text-white rounded-lg text-xs sm:text-sm hover:bg-primary/90 transition-colors"
                    >
                      <LiaPrintSolid className="text-sm sm:text-base" />
                      <span>Print</span>
                    </button>
                  </div>
                )}
              </div>

              {editMode ? (
                <EditBookingDetails
                  bookingId={bookingId}
                  bookingData={bookingDetails}
                  handleEditMode={setEditMode}
                />
              ) : (
                <div className="space-y-4 sm:space-y-5 md:space-y-6">
                  {/* Property & Unit Info Card */}
                  <div className="border border-zinc-200 rounded-xl overflow-hidden">
                    <div
                      className={`px-4 sm:px-5 py-3 ${colors.bg} ${colors.border} border-b`}
                    >
                      <h2
                        className={`text-sm sm:text-base font-semibold ${colors.text} flex items-center gap-2`}
                      >
                        <FaHome className="text-sm sm:text-base" />
                        Property & Unit
                      </h2>
                    </div>
                    <div className="p-4 sm:p-5">
                      {((bookingDetails as any).property ||
                        bookingDetails.unit?.property) && (
                        <div className="flex flex-col lg:flex-row gap-4 sm:gap-5">
                          <div className="flex-1">
                            <h3 className="text-base sm:text-lg font-semibold text-zinc-800 mb-1">
                              {(bookingDetails as any).property?.name ||
                                bookingDetails.unit?.property?.name ||
                                "Property Name Not Available"}
                            </h3>
                            <div className="flex items-start gap-1.5 text-zinc-600 mb-3">
                              <IoLocationOutline className="text-sm sm:text-base mt-0.5 flex-shrink-0" />
                              <p className="text-xs sm:text-sm">
                                {(bookingDetails as any).property?.address ||
                                  bookingDetails.unit?.property?.address ||
                                  "Address not available"}
                                {((bookingDetails as any).property?.city ||
                                  bookingDetails.unit?.property?.city) &&
                                  `, ${(bookingDetails as any).property?.city || bookingDetails.unit?.property?.city}`}
                                {((bookingDetails as any).property?.state ||
                                  bookingDetails.unit?.property?.state) &&
                                  `, ${(bookingDetails as any).property?.state || bookingDetails.unit?.property?.state}`}
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-zinc-500">Type:</span>
                                <span className="font-medium text-zinc-700">
                                  {(bookingDetails as any).property
                                    ?.propertyType ||
                                    (bookingDetails as any).property
                                      ?.property_type ||
                                    bookingDetails.unit?.property
                                      ?.propertyType ||
                                    "N/A"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-zinc-500">Verified:</span>
                                <span
                                  className={`font-medium ${(bookingDetails as any).property?.isVerified || (bookingDetails as any).property?.is_verified || bookingDetails.unit?.property?.isVerified ? "text-green-600" : "text-red-600"}`}
                                >
                                  {(bookingDetails as any).property
                                    ?.isVerified ||
                                  (bookingDetails as any).property
                                    ?.is_verified ||
                                  bookingDetails.unit?.property?.isVerified
                                    ? "Yes"
                                    : "No"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="lg:border-l lg:border-zinc-200 lg:pl-5">
                            <h4 className="text-sm sm:text-base font-semibold text-zinc-800 mb-2">
                              Unit:{" "}
                              {bookingDetails.unit.name ||
                                "Unit Name Not Available"}
                            </h4>
                            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                              <div className="flex items-center gap-1.5">
                                <FaBed className="text-zinc-400 text-xs" />
                                <span className="text-zinc-600">
                                  {(bookingDetails.unit as any)
                                    ?.bedroom_count ||
                                    bookingDetails.unit.bedroomCount ||
                                    0}{" "}
                                  Bed
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <FaUsers className="text-zinc-400 text-xs" />
                                <span className="text-zinc-600">
                                  Max{" "}
                                  {(bookingDetails.unit as any)?.max_guests ||
                                    bookingDetails.unit.maxGuests ||
                                    0}
                                </span>
                              </div>
                              <div className="text-zinc-600">
                                {(bookingDetails.unit as any)
                                  ?.living_room_count ||
                                  bookingDetails.unit.livingRoomCount ||
                                  0}{" "}
                                Living
                              </div>
                              <div className="text-zinc-600">
                                {(bookingDetails.unit as any)?.bathroom_count ||
                                  bookingDetails.unit.bathroomCount ||
                                  0}{" "}
                                Bath
                              </div>
                              <div className="text-zinc-600">
                                {(bookingDetails.unit as any)?.kitchen_count ||
                                  bookingDetails.unit.kitchenCount ||
                                  0}{" "}
                                Kitchen
                              </div>
                              <div
                                className={`font-medium ${bookingDetails.unit.isVerified || (bookingDetails.unit as any).is_verified ? "text-green-600" : "text-red-600"}`}
                              >
                                {bookingDetails.unit.isVerified ||
                                (bookingDetails.unit as any).is_verified
                                  ? "Verified"
                                  : "Not Verified"}
                              </div>
                            </div>
                            {bookingDetails.unit.description && (
                              <p className="text-xs text-zinc-600 mt-2 line-clamp-2">
                                {bookingDetails.unit.description}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Guest Information Card */}
                  <div className="border border-zinc-200 rounded-xl overflow-hidden">
                    <div
                      className={`px-4 sm:px-5 py-3 ${colors.bg} ${colors.border} border-b`}
                    >
                      <h2
                        className={`text-sm sm:text-base font-semibold ${colors.text} flex items-center gap-2`}
                      >
                        <FaUser />
                        Guest
                      </h2>
                    </div>
                    <div className="p-4 sm:p-5">
                      {bookingDetails.user && (
                        <div className="flex flex-col sm:flex-row gap-4">
                          <div className="flex-shrink-0">
                            {bookingDetails.user.profile?.profileImage ? (
                              <Image
                                src={bookingDetails.user.profile.profileImage}
                                alt={`${bookingDetails.user.profile.firstName} ${bookingDetails.user.profile.lastName}`}
                                width={80}
                                height={80}
                                className="rounded-lg object-cover w-16 h-16 sm:w-20 sm:h-20"
                              />
                            ) : (
                              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-zinc-200 rounded-lg flex items-center justify-center">
                                <FaUser className="text-2xl sm:text-3xl text-zinc-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div>
                              <h3 className="text-base sm:text-lg font-semibold text-zinc-800">
                                {bookingDetails.user.profile?.firstName ||
                                  (bookingDetails.user as any)?.firstName ||
                                  "N/A"}{" "}
                                {bookingDetails.user.profile?.lastName ||
                                  (bookingDetails.user as any)?.lastName ||
                                  ""}
                              </h3>
                              <p className="text-xs text-zinc-500">
                                ID: {bookingDetails.user.id}
                              </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              <div className="flex items-center gap-1.5">
                                <FaEnvelope className="text-zinc-400 text-xs" />
                                <span className="text-zinc-700 truncate">
                                  {bookingDetails.user.email || "Not provided"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <FaPhone className="text-zinc-400 text-xs" />
                                <span className="text-zinc-700">
                                  {bookingDetails.user.phone || "Not provided"}
                                </span>
                              </div>
                              {bookingDetails.user.profile?.city && (
                                <div className="flex items-center gap-1.5 sm:col-span-2">
                                  <IoLocationOutline className="text-zinc-400 text-xs" />
                                  <span className="text-zinc-700 text-xs">
                                    {bookingDetails.user.profile.city}
                                    {bookingDetails.user.profile.state &&
                                      `, ${bookingDetails.user.profile.state}`}
                                  </span>
                                </div>
                              )}
                            </div>
                            <Link
                              href={PAGE_ROUTES.dashboard.userManagement.guests.details(
                                bookingDetails.user.id,
                              )}
                              className="inline-flex items-center gap-1 text-primary hover:underline text-xs font-medium mt-1"
                            >
                              View Profile →
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Booking Details Card */}
                  <div className="border border-zinc-200 rounded-xl overflow-hidden">
                    <div
                      className={`px-4 sm:px-5 py-3 ${colors.bg} ${colors.border} border-b`}
                    >
                      <h2
                        className={`text-sm sm:text-base font-semibold ${colors.text} flex items-center gap-2`}
                      >
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
                            {startDate ? formatDate(startDate) : "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500 flex items-center gap-1 mb-0.5">
                            <FaCalendarAlt className="text-[10px]" />
                            Check-out
                          </p>
                          <p className="text-sm sm:text-base font-semibold text-zinc-800">
                            {endDate ? formatDate(endDate) : "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500 flex items-center gap-1 mb-0.5">
                            <FaClock className="text-[10px]" />
                            Duration
                          </p>
                          <p className="text-sm sm:text-base font-semibold text-zinc-800">
                            {nights} {nights === 1 ? "Night" : "Nights"}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-zinc-200">
                        <div>
                          <p className="text-xs text-zinc-500">Guests</p>
                          <p className="text-sm sm:text-base font-semibold text-zinc-800">
                            {guestsCount || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500">Units</p>
                          <p className="text-sm sm:text-base font-semibold text-zinc-800">
                            {unitCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500 mb-1">Status</p>
                          <div className="w-[90px]">
                            <BookingBadge status={status} />
                          </div>
                        </div>
                        {bookingDetails.verificationDate && (
                          <div>
                            <p className="text-xs text-zinc-500">Verified On</p>
                            <p className="text-xs font-medium text-zinc-700">
                              {formatDate(bookingDetails.verificationDate)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment Information Card */}
                  <div className="border border-zinc-200 rounded-xl overflow-hidden">
                    <div
                      className={`px-4 sm:px-5 py-3 ${colors.bg} ${colors.border} border-b`}
                    >
                      <h2
                        className={`text-sm sm:text-base font-semibold ${colors.text} flex items-center gap-2`}
                      >
                        <FaMoneyBillWave />
                        Payment
                      </h2>
                    </div>
                    <div className="p-4 sm:p-5">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center py-1 text-xs sm:text-sm">
                          <span className="text-zinc-600">Price per night</span>
                          <span className="font-medium text-zinc-800">
                            {formatMoney(pricePerNight)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1 text-xs sm:text-sm">
                          <span className="text-zinc-600">Nights</span>
                          <span className="font-medium text-zinc-800">
                            ×{nights}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1 text-xs sm:text-sm">
                          <span className="text-zinc-600">Units</span>
                          <span className="font-medium text-zinc-800">
                            ×{unitCount}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-t border-zinc-200 mt-1 pt-2 text-xs sm:text-sm">
                          <span className="text-zinc-600">Subtotal</span>
                          <span className="font-medium text-zinc-800">
                            {formatMoney(pricePerNight * nights * unitCount)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1 text-xs sm:text-sm">
                          <span className="text-zinc-600">Caution fee</span>
                          <span className="font-medium text-zinc-800">
                            {formatMoney(cautionFee)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-t-2 border-zinc-300 mt-2 text-sm sm:text-base">
                          <span className="font-semibold text-zinc-800">Total</span>
                          <span className="text-lg sm:text-xl font-bold text-primary">
                            {formatMoney(totalPrice)}
                          </span>
                        </div>
                        {transactionRef && (
                          <div className="mt-3 pt-3 border-t border-zinc-200">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-zinc-500">Transaction Ref</span>
                              <span className="font-mono text-zinc-700">
                                {transactionRef}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Retry Payment Button */}
                        {(status === BookingStatus.PENDING ||
                          status === BookingStatus.PENDING_PAYMENT) &&
                          transactionRef && (
                            <div className="mt-4 pt-4 border-t border-zinc-200">
                              <button
                                onClick={() => {
                                  retryPayment(
                                    { bookingId: bookingDetails.id },
                                    {
                                      onSuccess: (response) => {
                                        const result = response?.data?.data;
                                        if (result?.success) {
                                          toast.success(
                                            result.message ||
                                              "Payment verified successfully!",
                                          );
                                        } else {
                                          toast.error(
                                            result?.message ||
                                              "Payment verification failed",
                                          );
                                        }
                                      },
                                      onError: (error: any) => {
                                        toast.error(
                                          error?.response?.data?.detail ||
                                            "Failed to verify payment",
                                        );
                                      },
                                    },
                                  );
                                }}
                                disabled={isRetrying}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-xs sm:text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                              >
                                <MdRefresh
                                  className={`text-sm ${isRetrying ? "animate-spin" : ""}`}
                                />
                                <span>
                                  {isRetrying
                                    ? "Verifying..."
                                    : "Retry Payment"}
                                </span>
                              </button>
                              <p className="text-[10px] sm:text-xs text-zinc-500 mt-1.5 text-center">
                                Click to manually verify payment status
                              </p>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>

                  {/* Referral Information Card */}
                  {(bookingDetails as any).referral_code_used && (
                    <div className="border border-violet-200 rounded-xl overflow-hidden">
                      <div className="px-4 sm:px-5 py-3 bg-violet-50 border-b border-violet-100">
                        <h2 className="text-sm sm:text-base font-semibold text-violet-800">
                          Referral Applied
                        </h2>
                      </div>
                      <div className="p-4 sm:p-5">
                        <div className="flex justify-between items-center py-1 text-xs sm:text-sm">
                          <span className="text-zinc-600">Referral Code</span>
                          <span className="font-mono font-semibold text-zinc-800 tracking-widest">
                            {(bookingDetails as any).referral_code_used}
                          </span>
                        </div>
                        {(bookingDetails as any).referrer_id && (
                          <div className="flex justify-between items-center py-1 border-t border-zinc-100 mt-1 pt-2 text-xs sm:text-sm">
                            <span className="text-zinc-600">Referrer ID</span>
                            <span className="font-mono text-zinc-500">
                              {(bookingDetails as any).referrer_id}
                            </span>
                          </div>
                        )}
                        <div className="mt-3 p-2 bg-violet-50 rounded-lg border border-violet-100 text-[10px] sm:text-xs text-violet-700 italic">
                          Agent commission reduced to 3%; referrer credited 2%
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Revenue Distribution Card (Staff Only) */}
                  {bookingDetails.revenue_split && (
                    <div className="border border-zinc-200 rounded-xl overflow-hidden">
                      <div className="px-4 sm:px-5 py-3 bg-emerald-50 border-b border-emerald-100">
                        <h2 className="text-sm sm:text-base font-semibold text-emerald-800 flex items-center gap-2">
                          <FaChartPie />
                          Revenue Split
                        </h2>
                      </div>
                      <div className="p-4 sm:p-5">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center py-1 text-xs sm:text-sm">
                            <div>
                              <span className="text-zinc-600 block">Owner</span>
                              <span className="text-[10px] text-zinc-400">
                                ({bookingDetails.revenue_split.percentages.owner}%)
                              </span>
                            </div>
                            <span className="font-medium text-zinc-800">
                              {formatMoney(bookingDetails.revenue_split.owner_amount)}
                            </span>
                          </div>
                          {bookingDetails.revenue_split.agent_amount > 0 && (
                            <div className="flex justify-between items-center py-1 text-xs sm:text-sm">
                              <div>
                                <span className="text-zinc-600 block">Agent</span>
                                <span className="text-[10px] text-zinc-400">
                                  ({bookingDetails.revenue_split.percentages.agent}%)
                                </span>
                              </div>
                              <span className="font-medium text-zinc-800">
                                {formatMoney(bookingDetails.revenue_split.agent_amount)}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between items-center py-1 text-xs sm:text-sm">
                            <div>
                              <span className="text-zinc-600 block">Platform</span>
                              <span className="text-[10px] text-zinc-400">
                                ({bookingDetails.revenue_split.agent_amount > 0
                                  ? bookingDetails.revenue_split.percentages.platform
                                  : bookingDetails.revenue_split.percentages.platform +
                                    bookingDetails.revenue_split.percentages.agent}%)
                              </span>
                            </div>
                            <span className="font-medium text-zinc-800">
                              {formatMoney(bookingDetails.revenue_split.platform_amount)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-t border-zinc-200 mt-2 text-sm">
                            <span className="font-semibold text-zinc-800">Total</span>
                            <span className="font-bold text-emerald-600">
                              {formatMoney(totalPrice)}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 p-2 bg-zinc-50 rounded-lg border border-zinc-100 italic text-[10px] text-zinc-500">
                          Auto-calculated and credited upon confirmation
                        </div>
                      </div>
                    </div>
                  )}

                  {!bookingDetails.is_caution_refunded && (
                    <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                      <div className="flex items-start gap-2">
                        <Icon icon="solar:info-circle-bold-duotone" className="text-amber-500 text-lg shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700">
                          Caution deposit will be refunded to the guest after check-out, subject to property inspection.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {bookingDetails.is_caution_refunded && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-100">
                      <div className="flex items-start gap-2">
                        <Icon icon="solar:check-read-circle-bold-duotone" className="text-green-500 text-lg shrink-0 mt-0.5" />
                        <p className="text-xs text-green-700">
                          Caution deposit has been successfully refunded to the guest.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Owner & Agent Info Card */}
                  {(bookingDetails.unit?.property?.owner ||
                    bookingDetails.unit?.property?.agent) && (
                    <div className="border border-zinc-200 rounded-xl overflow-hidden">
                      <div className="px-4 sm:px-5 py-3 bg-zinc-50 border-b border-zinc-200">
                        <h2 className="text-sm sm:text-base font-semibold text-zinc-800 flex items-center gap-2">
                          <FaUsers />
                          Owner & Agent
                        </h2>
                      </div>
                      <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200">
                        {/* Owner */}
                        {bookingDetails.unit.property.owner && (
                          <div className="pb-3 sm:pb-0 sm:pr-4">
                            <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-2">Owner</h3>
                            <div className="space-y-1.5">
                              <p className="font-semibold text-zinc-800 text-sm">
                                {bookingDetails.unit.property.owner.profile
                                  ?.firstName
                                  ? `${bookingDetails.unit.property.owner.profile.firstName} ${bookingDetails.unit.property.owner.profile?.lastName || ""}`
                                  : bookingDetails.unit.property.owner.email ||
                                    "N/A"}
                              </p>
                              <p className="text-xs text-zinc-600 flex items-center gap-1.5">
                                <FaEnvelope className="text-[10px]" />
                                <span className="truncate">{bookingDetails.unit.property.owner.email || "Not provided"}</span>
                              </p>
                              <p className="text-xs text-zinc-600 flex items-center gap-1.5">
                                <FaPhone className="text-[10px]" />
                                {bookingDetails.unit.property.owner.phone || "Not provided"}
                              </p>
                              <Link
                                href={PAGE_ROUTES.dashboard.userManagement.owners.details(
                                  bookingDetails.unit.property.owner.id,
                                )}
                                className="inline-flex items-center gap-1 text-primary hover:underline text-xs font-medium mt-1"
                              >
                                View Profile →
                              </Link>
                            </div>
                          </div>
                        )}

                        {/* Agent */}
                        {bookingDetails.unit.property.agent && (
                          <div className="pt-3 sm:pt-0 sm:pl-4">
                            <h3 className="text-xs font-semibold text-zinc-500 uppercase mb-2">Agent</h3>
                            <div className="space-y-1.5">
                              <p className="font-semibold text-zinc-800 text-sm">
                                {bookingDetails.unit.property.agent.profile
                                  ?.firstName
                                  ? `${bookingDetails.unit.property.agent.profile.firstName} ${bookingDetails.unit.property.agent.profile?.lastName || ""}`
                                  : bookingDetails.unit.property.agent.email ||
                                    "N/A"}
                              </p>
                              <p className="text-xs text-zinc-600 flex items-center gap-1.5">
                                <FaEnvelope className="text-[10px]" />
                                <span className="truncate">{bookingDetails.unit.property.agent.email || "Not provided"}</span>
                              </p>
                              <p className="text-xs text-zinc-600 flex items-center gap-1.5">
                                <FaPhone className="text-[10px]" />
                                {bookingDetails.unit.property.agent.phone || "Not provided"}
                              </p>
                              <Link
                                href={PAGE_ROUTES.dashboard.userManagement.agents.details(
                                  bookingDetails.unit.property.agent.id,
                                )}
                                className="inline-flex items-center gap-1 text-primary hover:underline text-xs font-medium mt-1"
                              >
                                View Profile →
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Cancellation Info (if cancelled) */}
                  {status === BookingStatus.CANCELLED &&
                    bookingDetails.cancellationReason && (
                      <div className="border border-red-200 bg-red-50 rounded-xl p-4">
                        <h3 className="text-sm font-semibold text-red-800 mb-1">Cancellation Reason</h3>
                        <p className="text-xs text-red-700">{bookingDetails.cancellationReason}</p>
                      </div>
                    )}

                  {/* Rejection reason (if rejected booking request) */}
                  {status === BookingStatus.CANCELLED &&
                    ((bookingDetails as any).rejection_reason ||
                      (bookingDetails as any).rejectionReason) && (
                      <div className="border border-orange-200 bg-orange-50 rounded-xl p-4">
                        <h3 className="text-sm font-semibold text-orange-800 mb-1">Request Rejected</h3>
                        <p className="text-xs text-orange-700">
                          {(bookingDetails as any).rejection_reason ||
                            (bookingDetails as any).rejectionReason}
                        </p>
                      </div>
                    )}

                  {/* Approval Pending notice */}
                  {status === BookingStatus.APPROVAL_PENDING && (
                    <div className="border border-orange-200 bg-orange-50 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-orange-800 mb-1">Awaiting Owner Approval</h3>
                      <p className="text-xs text-orange-700">
                        The guest has submitted a booking request. The dates are held pending your decision.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {!editMode && (
              <div className="px-4 sm:px-5 md:px-8 lg:px-10 pb-6 sm:pb-8">
                <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t border-zinc-200">
                  <button
                    onClick={() => router.back()}
                    className="px-4 py-2 border border-zinc-300 text-zinc-700 rounded-lg text-xs sm:text-sm hover:bg-zinc-50 transition-colors font-medium"
                  >
                    Go Back
                  </button>
                  {status === BookingStatus.CONFIRMED && (
                    <button
                      onClick={() => {
                        checkIn(
                          { bookingId: bookingDetails.id },
                          {
                            onSuccess: () =>
                              toast.success("Booking marked as checked in"),
                            onError: (err: any) =>
                              toast.error(
                                err?.response?.data?.detail ||
                                  "Failed to check in",
                              ),
                          },
                        );
                      }}
                      disabled={isCheckingIn}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg text-xs sm:text-sm hover:bg-teal-700 transition-colors font-medium disabled:opacity-50"
                    >
                      {isCheckingIn ? "Processing..." : "Check In"}
                    </button>
                  )}
                  {status === BookingStatus.CHECKED_IN && (
                    <button
                      onClick={() => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const scheduledEnd = new Date(endDate);
                        scheduledEnd.setHours(0, 0, 0, 0);

                        if (today < scheduledEnd) {
                          setShowCheckoutConfirm(true);
                        } else {
                          checkOut(
                            { bookingId: bookingDetails.id },
                            {
                              onSuccess: () =>
                                toast.success("Booking marked as checked out"),
                              onError: (err: any) =>
                                toast.error(
                                  err?.response?.data?.detail ||
                                    "Failed to check out",
                                ),
                            },
                          );
                        }
                      }}
                      disabled={isCheckingOut}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs sm:text-sm hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
                    >
                      {isCheckingOut ? "Processing..." : "Check Out"}
                    </button>
                  )}
                  {status === BookingStatus.CHECKED_OUT &&
                    !bookingDetails.isCautionRefunded && (
                      <button
                        onClick={() => setShowRefundModal(true)}
                        disabled={isRefunding}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs sm:text-sm hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                      >
                        {isRefunding ? "Processing..." : "Refund Caution"}
                      </button>
                    )}
                  {status === BookingStatus.CANCEL_REQUESTED &&
                    (() => {
                      const basePrice = Number(totalPrice) - cautionFee;
                      const refundAmount = basePrice * 0.8;
                      return (
                        <div className="flex flex-col items-end gap-1 w-full sm:w-auto">
                          <p className="text-[10px] text-amber-700 text-right max-w-xs">
                            20% booking fee non-refundable. Guest receives{" "}
                            <strong>
                              ₦
                              {refundAmount.toLocaleString("en-NG", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </strong>
                          </p>
                          <button
                            onClick={() => {
                              approveCancellation(
                                { bookingId: bookingDetails.id },
                                {
                                  onSuccess: () => {
                                    toast.success("Cancellation approved");
                                    setStatus(BookingStatus.CANCELLED);
                                  },
                                  onError: (err: any) =>
                                    toast.error(
                                      err?.response?.data?.detail ||
                                        "Failed to approve cancellation",
                                    ),
                                },
                              );
                            }}
                            disabled={isApproving}
                            className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg text-xs sm:text-sm hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                          >
                            {isApproving ? "Approving..." : "Approve Cancellation"}
                          </button>
                        </div>
                      );
                    })()}
                  {/* Approve / Reject for APPROVAL_PENDING bookings */}
                  {status === BookingStatus.APPROVAL_PENDING && (
                    <>
                      <button
                        onClick={() => {
                          approveRequest(
                            { bookingId: bookingDetails.id },
                            {
                              onSuccess: () => {
                                toast.success(
                                  "Booking request approved — guest can now pay",
                                );
                                setStatus(BookingStatus.PENDING);
                              },
                              onError: (err: any) =>
                                toast.error(
                                  err?.response?.data?.detail ||
                                    "Failed to approve request",
                                ),
                            },
                          );
                        }}
                        disabled={isApprovingRequest}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg text-xs sm:text-sm hover:bg-teal-700 transition-colors font-medium disabled:opacity-50"
                      >
                        {isApprovingRequest ? "Approving..." : "Approve"}
                      </button>
                      <button
                        onClick={() => setShowRejectModal(true)}
                        disabled={isRejectingRequest}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg text-xs sm:text-sm hover:bg-orange-700 transition-colors font-medium disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {status !== BookingStatus.CANCELLED &&
                    status !== BookingStatus.COMPLETED &&
                    status !== BookingStatus.CANCEL_REQUESTED &&
                    status !== BookingStatus.APPROVAL_PENDING && (
                      <button
                        onClick={() => setShowCancelConfirm(true)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs sm:text-sm hover:bg-red-700 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                    )}
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 bg-zinc-800 text-white rounded-lg text-xs sm:text-sm hover:bg-zinc-950 transition-colors font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}

            <Modal
              isOpen={showCheckoutConfirm}
              onClose={() => setShowCheckoutConfirm(false)}
              title="Early Check-Out Confirmation"
              content={
                <div className="text-xs sm:text-sm text-zinc-600">
                  <p>
                    This booking is scheduled to end on{" "}
                    <span className="font-semibold">
                      {endDate ? formatDate(endDate) : "the scheduled date"}
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
                    onClick={() => {
                      setShowCheckoutConfirm(false);
                      checkOut(
                        { bookingId: bookingDetails.id },
                        {
                          onSuccess: () =>
                            toast.success("Booking marked as checked out"),
                          onError: (err: any) =>
                            toast.error(
                              err?.response?.data?.detail ||
                                "Failed to check out",
                            ),
                        },
                      );
                    }}
                    className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs hover:bg-indigo-700 transition-colors"
                  >
                    Confirm
                  </button>
                </div>
              }
            />

            <DeleteBookingDialog
              isOpen={showCancelConfirm}
              onClose={() => setShowCancelConfirm(false)}
              bookingId={bookingDetails.id}
              isPending={isDeleting}
              onConfirm={(reason) => {
                deleteBooking(
                  {
                    bookingId: bookingDetails.id,
                    cancellationReason: reason,
                  },
                  {
                    onSuccess: () => {
                      toast.success("Booking cancelled successfully");
                      setShowCancelConfirm(false);
                      setStatus(BookingStatus.CANCELLED);
                    },
                    onError: (err: any) => {
                      toast.error(
                        err?.response?.data?.detail ||
                          "Failed to cancel booking",
                      );
                    },
                  },
                );
              }}
            />

            <DeleteBookingDialog
              isOpen={showDeleteConfirm}
              onClose={() => setShowDeleteConfirm(false)}
              bookingId={bookingDetails.id}
              isPending={isDeleting}
              title="Delete Booking Record?"
              description={`Are you sure you want to permanently delete booking ${bookingDetails.booking_id}?`}
              confirmText="Delete Permanently"
              onConfirm={(reason) => {
                deleteBooking(
                  {
                    bookingId: bookingDetails.id,
                    cancellationReason: reason || "Deleted by admin",
                  },
                  {
                    onSuccess: () => {
                      toast.success("Booking record deleted");
                      router.push(
                        PAGE_ROUTES.dashboard.bookingManagement.bookings.base,
                      );
                    },
                    onError: (err: any) => {
                      toast.error(
                        err?.response?.data?.detail ||
                          "Failed to delete booking",
                      );
                    },
                  },
                );
              }}
            />

            <CautionRefundModal
              isOpen={showRefundModal}
              onClose={() => setShowRefundModal(false)}
              isPending={isRefunding}
              onConfirm={(shouldRefund, notes) => {
                refundCaution(
                  {
                    bookingId: bookingDetails.id,
                    payload: { should_refund: shouldRefund, notes },
                  },
                  {
                    onSuccess: () => {
                      toast.success(
                        shouldRefund
                          ? "Refund approved"
                          : "Caution fee withheld",
                      );
                      setShowRefundModal(false);
                    },
                    onError: (err: any) => {
                      toast.error(
                        err?.response?.data?.detail ||
                          "Failed to process caution fee",
                      );
                    },
                  },
                );
              }}
            />

            {/* Reject Request Modal */}
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
                    onClick={() => {
                      rejectRequest(
                        {
                          bookingId: bookingDetails.id,
                          reason: rejectReason || undefined,
                        },
                        {
                          onSuccess: () => {
                            toast.success("Booking request rejected");
                            setShowRejectModal(false);
                            setRejectReason("");
                            setStatus(BookingStatus.CANCELLED);
                          },
                          onError: (err: any) =>
                            toast.error(
                              err?.response?.data?.detail ||
                                "Failed to reject request",
                            ),
                        },
                      );
                    }}
                    disabled={isRejectingRequest}
                    className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs hover:bg-orange-700 transition-colors font-medium disabled:opacity-50"
                  >
                    {isRejectingRequest ? "Rejecting..." : "Confirm"}
                  </button>
                </div>
              }
            />
          </>
        )}
      </div>
    </div>
  );
}
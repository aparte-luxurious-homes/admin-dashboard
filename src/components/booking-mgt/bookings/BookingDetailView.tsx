"use client";

import { IoLocationOutline } from "react-icons/io5";
import { LiaPrintSolid } from "react-icons/lia";
import { MdEdit } from "react-icons/md";
import { FaUser, FaEnvelope, FaPhone, FaCalendarAlt, FaClock, FaUsers, FaHome, FaBed, FaMoneyBillWave } from "react-icons/fa";
import { useEffect, useRef, useState } from "react";
import { downloadScreenAsPDF, formatDate, formatMoney, getDayDifference } from "@/src/lib/utils";
import EditBookingDetails from "./EditBookingDetails";
import { BookingBadge } from "../../badge";
import { BookingStatus, IBooking } from "../types";
import { GetBookingDetails } from "@/src/lib/request-handlers/bookingMgt";
import Loader from "../../loader";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import Image from "next/image";
import { MdRefresh } from "react-icons/md";
import Modal from "../../modal/Modal";
import DeleteBookingDialog from "../dialogs/DeleteBookingDialog";
import {
    RetryBookingPayment,
    CheckInBooking,
    CheckOutBooking,
    RefundCautionFee,
    DeleteBooking,
    ApproveCancellation
} from "@/src/lib/request-handlers/bookingMgt";
import { toast } from "react-hot-toast";

export default function BookingDetailView({ bookingId }: { bookingId: string }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();
    const targetRef = useRef<HTMLDivElement>(null);
    const [editMode, setEditMode] = useState<boolean>(Boolean(searchParams.get('edit')));
    const [status, setStatus] = useState(BookingStatus.PENDING)
    const { data: bookingData, isLoading, error } = GetBookingDetails(bookingId);
    const [bookingDetails, setBookingDetails] = useState<IBooking | null>(null);
    const { mutate: retryPayment, isPending: isRetrying } = RetryBookingPayment();
    const { mutate: checkIn, isPending: isCheckingIn } = CheckInBooking();
    const { mutate: checkOut, isPending: isCheckingOut } = CheckOutBooking();
    const { mutate: refundCaution, isPending: isRefunding } = RefundCautionFee();
    const { mutate: deleteBooking, isPending: isDeleting } = DeleteBooking();
    const { mutate: approveCancellation, isPending: isApproving } = ApproveCancellation();
    const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (bookingData?.data?.data) {
            setBookingDetails(bookingData.data.data);
            setStatus(bookingData.data.data.status);
        }
    }, [bookingData])

    const setQueryParam = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set(key, value);
        router.push(`${pathname}?${params.toString()}`);
    };

    const getStatusColors = (status: BookingStatus) => {
        switch (status) {
            case BookingStatus.CANCELLED:
                return { text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: '#dc2626' };
            case BookingStatus.COMPLETED:
                return { text: 'text-zinc-600', bg: 'bg-zinc-50', border: 'border-zinc-200', icon: '#52525b' };
            case BookingStatus.PENDING:
                return { text: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', icon: '#FFAE00' };
            case BookingStatus.PENDING_PAYMENT:
                return { text: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', icon: '#FFAE00' };
            case BookingStatus.CONFIRMED:
                return { text: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200', icon: '#028090' };
            case BookingStatus.CHECKED_IN:
                return { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: '#2563eb' };
            case BookingStatus.CHECKED_OUT:
                return { text: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', icon: '#4f46e5' };
            default:
                return { text: 'text-zinc-600', bg: 'bg-zinc-50', border: 'border-zinc-200', icon: '#191919' };
        }
    };

    const colors = getStatusColors(status);
    const startDate = bookingDetails?.startDate || (bookingDetails as any)?.start_date;
    const endDate = bookingDetails?.endDate || (bookingDetails as any)?.end_date;
    const nights = (startDate && endDate) ? getDayDifference(endDate, startDate) : 0;
    const unitPrice = bookingDetails?.unit?.pricePerNight || (bookingDetails?.unit as any)?.price_per_night || 0;
    const pricePerNight = Number(unitPrice);
    const cautionFee = Number(bookingDetails?.caution_fee || (bookingDetails as any)?.caution_fee || 0);
    const unitCount = bookingDetails?.unitCount || (bookingDetails as any)?.unit_count || 1;
    const guestsCount = bookingDetails?.guestsCount || (bookingDetails as any)?.guests_count || 0;
    const totalPrice = bookingDetails?.totalPrice || (bookingDetails as any)?.total_price || 0;
    const transactionRef = bookingDetails?.transactionRef || (bookingDetails as any)?.transaction_ref;

    return (
        <div className="p-4 md:p-10 w-full">
            <div className="w-full bg-white rounded-xl min-h-[50vh]">
                {
                    isLoading ?
                        <div className="flex items-center justify-center min-h-[50vh]">
                            <Loader />
                        </div>
                        : error ?
                            <div className="flex flex-col items-center justify-center min-h-[50vh] p-10">
                                <p className="text-red-600 text-xl mb-4">Failed to load booking details</p>
                                <p className="text-zinc-500 text-sm mb-6">Please try again or contact support if the issue persists</p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                    Retry
                                </button>
                            </div>
                            : !bookingDetails ?
                                <div className="flex items-center justify-center min-h-[50vh]">
                                    <div className="text-center">
                                        <p className="text-zinc-600 text-xl mb-2">No booking found</p>
                                        <p className="text-zinc-400 text-sm">The booking you're looking for doesn't exist or has been removed</p>
                                    </div>
                                </div>
                                :
                                <>
                                    <div ref={targetRef} className="p-6 md:p-10">
                                        {/* Header Section */}
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h1 className="text-2xl md:text-3xl font-semibold text-zinc-800">
                                                        {bookingDetails.bookingId || `Booking #${bookingDetails.id}`}
                                                    </h1>
                                                    <BookingBadge status={status} />
                                                </div>
                                                <p className="text-zinc-500 text-sm">
                                                    Created on {formatDate(bookingDetails.createdAt || (bookingDetails as any).created_at)}
                                                </p>
                                            </div>

                                            {!editMode && (
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => { setEditMode(true); setQueryParam('edit', 'true') }}
                                                        className="flex items-center gap-2 px-4 py-2.5 border-2 border-zinc-300 text-zinc-700 rounded-lg hover:bg-zinc-50 transition-colors"
                                                    >
                                                        <MdEdit className="text-lg" />
                                                        <span className="hidden md:inline">Edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => downloadScreenAsPDF({ name: `booking-${bookingDetails.bookingId}.pdf`, element: targetRef })}
                                                        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                                                    >
                                                        <LiaPrintSolid className="text-xl" />
                                                        <span className="hidden md:inline">Print</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {editMode ? (
                                            <EditBookingDetails
                                                bookingId={Number(bookingId)}
                                                bookingData={bookingDetails}
                                                handleEditMode={setEditMode}
                                            />
                                        ) : (
                                            <div className="space-y-6">
                                                {/* Property & Unit Info Card */}
                                                <div className="border border-zinc-200 rounded-xl overflow-hidden">
                                                    <div className={`px-6 py-4 ${colors.bg} ${colors.border} border-b`}>
                                                        <h2 className={`text-lg font-semibold ${colors.text} flex items-center gap-2`}>
                                                            <FaHome />
                                                            Property & Unit Information
                                                        </h2>
                                                    </div>
                                                    <div className="p-6">
                                                        {((bookingDetails as any).property || bookingDetails.unit?.property) && (
                                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                                                <div>
                                                                    <h3 className="text-xl font-semibold text-zinc-800 mb-2">
                                                                        {(bookingDetails as any).property?.name || bookingDetails.unit?.property?.name || 'Property Name Not Available'}
                                                                    </h3>
                                                                    <div className="flex items-start gap-2 text-zinc-600 mb-4">
                                                                        <IoLocationOutline className="text-xl mt-0.5 flex-shrink-0" />
                                                                        <p className="text-sm">
                                                                            {(bookingDetails as any).property?.address || bookingDetails.unit?.property?.address || 'Address not available'}
                                                                            {((bookingDetails as any).property?.city || bookingDetails.unit?.property?.city) && `, ${(bookingDetails as any).property?.city || bookingDetails.unit?.property?.city}`}
                                                                            {((bookingDetails as any).property?.state || bookingDetails.unit?.property?.state) && `, ${(bookingDetails as any).property?.state || bookingDetails.unit?.property?.state}`}
                                                                        </p>
                                                                    </div>
                                                                    <div className="space-y-2 text-sm">
                                                                        <div className="flex justify-between">
                                                                            <span className="text-zinc-500">Property Type:</span>
                                                                            <span className="font-medium text-zinc-700">{(bookingDetails as any).property?.propertyType || (bookingDetails as any).property?.property_type || bookingDetails.unit?.property?.propertyType || 'N/A'}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span className="text-zinc-500">Property ID:</span>
                                                                            <span className="font-medium text-zinc-700">APRT-{String((bookingDetails as any).property?.id || bookingDetails.unit?.property?.id || '').substring(0, 8)}</span>
                                                                        </div>
                                                                        <div className="flex justify-between">
                                                                            <span className="text-zinc-500">Verified:</span>
                                                                            <span className={`font-medium ${((bookingDetails as any).property?.isVerified || (bookingDetails as any).property?.is_verified || bookingDetails.unit?.property?.isVerified) ? 'text-green-600' : 'text-red-600'}`}>
                                                                                {((bookingDetails as any).property?.isVerified || (bookingDetails as any).property?.is_verified || bookingDetails.unit?.property?.isVerified) ? 'Yes' : 'No'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="border-l border-zinc-200 pl-6">
                                                                    <h4 className="text-lg font-semibold text-zinc-800 mb-3">Unit: {bookingDetails.unit.name || 'Unit Name Not Available'}</h4>
                                                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                                                        <div className="flex items-center gap-2">
                                                                            <FaBed className="text-zinc-400" />
                                                                            <span className="text-zinc-600">{(bookingDetails.unit as any)?.bedroom_count || bookingDetails.unit.bedroomCount || 0} Bedroom(s)</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <FaUsers className="text-zinc-400" />
                                                                            <span className="text-zinc-600">Max {(bookingDetails.unit as any)?.max_guests || bookingDetails.unit.maxGuests || 0} Guests</span>
                                                                        </div>
                                                                        <div className="text-zinc-600">
                                                                            {(bookingDetails.unit as any)?.living_room_count || bookingDetails.unit.livingRoomCount || 0} Living Room(s)
                                                                        </div>
                                                                        <div className="text-zinc-600">
                                                                            {(bookingDetails.unit as any)?.bathroom_count || bookingDetails.unit.bathroomCount || 0} Bathroom(s)
                                                                        </div>
                                                                        <div className="text-zinc-600">
                                                                            {(bookingDetails.unit as any)?.kitchen_count || bookingDetails.unit.kitchenCount || 0} Kitchen(s)
                                                                        </div>
                                                                        <div className={`font-medium ${(bookingDetails.unit.isVerified || (bookingDetails.unit as any).is_verified) ? 'text-green-600' : 'text-red-600'}`}>
                                                                            {(bookingDetails.unit.isVerified || (bookingDetails.unit as any).is_verified) ? 'Verified' : 'Not Verified'}
                                                                        </div>
                                                                    </div>
                                                                    {bookingDetails.unit.description && (
                                                                        <p className="text-sm text-zinc-600 mt-3 line-clamp-2">
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
                                                    <div className={`px-6 py-4 ${colors.bg} ${colors.border} border-b`}>
                                                        <h2 className={`text-lg font-semibold ${colors.text} flex items-center gap-2`}>
                                                            <FaUser />
                                                            Guest Information
                                                        </h2>
                                                    </div>
                                                    <div className="p-6">
                                                        {bookingDetails.user && (
                                                            <div className="flex flex-col md:flex-row gap-6">
                                                                <div className="flex-shrink-0">
                                                                    {bookingDetails.user.profile?.profileImage ? (
                                                                        <Image
                                                                            src={bookingDetails.user.profile.profileImage}
                                                                            alt={`${bookingDetails.user.profile.firstName} ${bookingDetails.user.profile.lastName}`}
                                                                            width={120}
                                                                            height={120}
                                                                            className="rounded-lg object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-24 h-24 md:w-28 md:h-28 bg-zinc-200 rounded-lg flex items-center justify-center">
                                                                            <FaUser className="text-4xl text-zinc-400" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 space-y-3">
                                                                    <div>
                                                                        <h3 className="text-xl font-semibold text-zinc-800 mb-1">
                                                                            {bookingDetails.user.profile?.firstName || (bookingDetails.user as any)?.firstName || 'N/A'} {bookingDetails.user.profile?.lastName || (bookingDetails.user as any)?.lastName || ''}
                                                                        </h3>
                                                                        <p className="text-sm text-zinc-500">Guest ID: {bookingDetails.user.id}</p>
                                                                    </div>
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                                                        <div className="flex items-center gap-2">
                                                                            <FaEnvelope className="text-zinc-400" />
                                                                            <span className="text-zinc-700">{bookingDetails.user.email || 'Not provided'}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <FaPhone className="text-zinc-400" />
                                                                            <span className="text-zinc-700">{bookingDetails.user.phone || 'Not provided'}</span>
                                                                        </div>
                                                                        {bookingDetails.user.profile?.city && (
                                                                            <div className="flex items-center gap-2">
                                                                                <IoLocationOutline className="text-zinc-400" />
                                                                                <span className="text-zinc-700">
                                                                                    {bookingDetails.user.profile.city}
                                                                                    {bookingDetails.user.profile.state && `, ${bookingDetails.user.profile.state}`}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <Link
                                                                        href={PAGE_ROUTES.dashboard.userManagement.guests.details(bookingDetails.user.id)}
                                                                        className="inline-flex items-center gap-2 text-primary hover:underline text-sm font-medium mt-2"
                                                                    >
                                                                        View Full Profile →
                                                                    </Link>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Booking Details Card */}
                                                <div className="border border-zinc-200 rounded-xl overflow-hidden">
                                                    <div className={`px-6 py-4 ${colors.bg} ${colors.border} border-b`}>
                                                        <h2 className={`text-lg font-semibold ${colors.text} flex items-center gap-2`}>
                                                            <FaCalendarAlt />
                                                            Booking Details
                                                        </h2>
                                                    </div>
                                                    <div className="p-6">
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                            <div className="space-y-1">
                                                                <p className="text-sm text-zinc-500 flex items-center gap-2">
                                                                    <FaCalendarAlt className="text-xs" />
                                                                    Check-in
                                                                </p>
                                                                <p className="text-lg font-semibold text-zinc-800">
                                                                    {startDate ? formatDate(startDate) : 'N/A'}
                                                                </p>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-sm text-zinc-500 flex items-center gap-2">
                                                                    <FaCalendarAlt className="text-xs" />
                                                                    Check-out
                                                                </p>
                                                                <p className="text-lg font-semibold text-zinc-800">
                                                                    {endDate ? formatDate(endDate) : 'N/A'}
                                                                </p>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-sm text-zinc-500 flex items-center gap-2">
                                                                    <FaClock className="text-xs" />
                                                                    Duration
                                                                </p>
                                                                <p className="text-lg font-semibold text-zinc-800">
                                                                    {nights} {nights === 1 ? 'Night' : 'Nights'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-zinc-200">
                                                            <div className="space-y-1">
                                                                <p className="text-sm text-zinc-500">Guests</p>
                                                                <p className="text-lg font-semibold text-zinc-800">{guestsCount || 0}</p>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-sm text-zinc-500">Units</p>
                                                                <p className="text-lg font-semibold text-zinc-800">{unitCount}</p>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-sm text-zinc-500">Booking Status</p>
                                                                <BookingBadge status={status} />
                                                            </div>
                                                            {bookingDetails.verificationDate && (
                                                                <div className="space-y-1">
                                                                    <p className="text-sm text-zinc-500">Verified On</p>
                                                                    <p className="text-sm font-medium text-zinc-700">{formatDate(bookingDetails.verificationDate)}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Payment Information Card */}
                                                <div className="border border-zinc-200 rounded-xl overflow-hidden">
                                                    <div className={`px-6 py-4 ${colors.bg} ${colors.border} border-b`}>
                                                        <h2 className={`text-lg font-semibold ${colors.text} flex items-center gap-2`}>
                                                            <FaMoneyBillWave />
                                                            Payment Information
                                                        </h2>
                                                    </div>
                                                    <div className="p-6">
                                                        <div className="space-y-4">
                                                            <div className="flex justify-between items-center py-2">
                                                                <span className="text-zinc-600">Price per night</span>
                                                                <span className="font-medium text-zinc-800">{formatMoney(pricePerNight)}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center py-2">
                                                                <span className="text-zinc-600">Number of nights</span>
                                                                <span className="font-medium text-zinc-800">×{nights}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center py-2">
                                                                <span className="text-zinc-600">Number of units</span>
                                                                <span className="font-medium text-zinc-800">×{unitCount}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center py-2 border-t border-zinc-200">
                                                                <span className="text-zinc-600">Subtotal</span>
                                                                <span className="font-medium text-zinc-800">{formatMoney(pricePerNight * nights * unitCount)}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center py-2">
                                                                <span className="text-zinc-600">Caution fee</span>
                                                                <span className="font-medium text-zinc-800">{formatMoney(cautionFee)}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center py-3 border-t-2 border-zinc-300 mt-2">
                                                                <span className="text-lg font-semibold text-zinc-800">Total Amount</span>
                                                                <span className="text-2xl font-bold text-primary">{formatMoney(totalPrice)}</span>
                                                            </div>
                                                            {transactionRef && (
                                                                <div className="mt-4 pt-4 border-t border-zinc-200">
                                                                    <div className="flex justify-between items-center text-sm">
                                                                        <span className="text-zinc-500">Transaction Reference</span>
                                                                        <span className="font-mono text-zinc-700">{transactionRef}</span>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Retry Payment Button */}
                                                            {(status === BookingStatus.PENDING || status === BookingStatus.PENDING_PAYMENT) && transactionRef && (
                                                                <div className="mt-4 pt-4 border-t border-zinc-200">
                                                                    <button
                                                                        onClick={() => {
                                                                            retryPayment(
                                                                                { bookingId: bookingDetails.id },
                                                                                {
                                                                                    onSuccess: (response) => {
                                                                                        const result = response?.data?.data;
                                                                                        if (result?.success) {
                                                                                            toast.success(result.message || 'Payment verified successfully!');
                                                                                        } else {
                                                                                            toast.error(result?.message || 'Payment verification failed');
                                                                                        }
                                                                                    },
                                                                                    onError: (error: any) => {
                                                                                        toast.error(error?.response?.data?.detail || 'Failed to verify payment');
                                                                                    }
                                                                                }
                                                                            );
                                                                        }}
                                                                        disabled={isRetrying}
                                                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                                    >
                                                                        <MdRefresh className={`text-lg ${isRetrying ? 'animate-spin' : ''}`} />
                                                                        <span>{isRetrying ? 'Verifying Payment...' : 'Retry Payment Verification'}</span>
                                                                    </button>
                                                                    <p className="text-xs text-zinc-500 mt-2 text-center">
                                                                        Click to manually verify payment status with the payment gateway
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Owner & Agent Info Card */}
                                                {(bookingDetails.unit?.property?.owner || bookingDetails.unit?.property?.agent) && (
                                                    <div className="border border-zinc-200 rounded-xl overflow-hidden">
                                                        <div className="px-6 py-4 bg-zinc-50 border-b border-zinc-200">
                                                            <h2 className="text-lg font-semibold text-zinc-800 flex items-center gap-2">
                                                                <FaUsers />
                                                                Owner & Agent Information
                                                            </h2>
                                                        </div>
                                                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 divide-y md:divide-y-0 md:divide-x divide-zinc-200">
                                                            {/* Owner */}
                                                            {bookingDetails.unit.property.owner && (
                                                                <div className="pb-6 md:pb-0 md:pr-6">
                                                                    <h3 className="text-sm font-semibold text-zinc-500 uppercase mb-3">Property Owner</h3>
                                                                    <div className="space-y-2">
                                                                        <p className="font-semibold text-zinc-800 text-lg">
                                                                            {bookingDetails.unit.property.owner.profile?.firstName ? `${bookingDetails.unit.property.owner.profile.firstName} ${bookingDetails.unit.property.owner.profile?.lastName || ''}` : bookingDetails.unit.property.owner.email || 'N/A'}
                                                                        </p>
                                                                        <p className="text-sm text-zinc-600 flex items-center gap-2">
                                                                            <FaEnvelope className="text-xs" />
                                                                            {bookingDetails.unit.property.owner.email || 'Not provided'}
                                                                        </p>
                                                                        <p className="text-sm text-zinc-600 flex items-center gap-2">
                                                                            <FaPhone className="text-xs" />
                                                                            {bookingDetails.unit.property.owner.phone || 'Not provided'}
                                                                        </p>
                                                                        <Link
                                                                            href={PAGE_ROUTES.dashboard.userManagement.owners.details(bookingDetails.unit.property.owner.id)}
                                                                            className="inline-flex items-center gap-2 text-primary hover:underline text-sm font-medium mt-2"
                                                                        >
                                                                            View Owner Profile →
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Agent */}
                                                            {bookingDetails.unit.property.agent && (
                                                                <div className="pt-6 md:pt-0 md:pl-6">
                                                                    <h3 className="text-sm font-semibold text-zinc-500 uppercase mb-3">Assigned Agent</h3>
                                                                    <div className="space-y-2">
                                                                        <p className="font-semibold text-zinc-800 text-lg">
                                                                            {bookingDetails.unit.property.agent.profile?.firstName ? `${bookingDetails.unit.property.agent.profile.firstName} ${bookingDetails.unit.property.agent.profile?.lastName || ''}` : bookingDetails.unit.property.agent.email || 'N/A'}
                                                                        </p>
                                                                        <p className="text-sm text-zinc-600 flex items-center gap-2">
                                                                            <FaEnvelope className="text-xs" />
                                                                            {bookingDetails.unit.property.agent.email || 'Not provided'}
                                                                        </p>
                                                                        <p className="text-sm text-zinc-600 flex items-center gap-2">
                                                                            <FaPhone className="text-xs" />
                                                                            {bookingDetails.unit.property.agent.phone || 'Not provided'}
                                                                        </p>
                                                                        <Link
                                                                            href={PAGE_ROUTES.dashboard.userManagement.agents.details(bookingDetails.unit.property.agent.id)}
                                                                            className="inline-flex items-center gap-2 text-primary hover:underline text-sm font-medium mt-2"
                                                                        >
                                                                            View Agent Profile →
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Cancellation Info (if cancelled) */}
                                                {status === BookingStatus.CANCELLED && bookingDetails.cancellationReason && (
                                                    <div className="border border-red-200 bg-red-50 rounded-xl p-6">
                                                        <h3 className="text-lg font-semibold text-red-800 mb-2">Cancellation Reason</h3>
                                                        <p className="text-red-700">{bookingDetails.cancellationReason}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    {!editMode && (
                                        <div className="px-6 md:px-10 pb-10">
                                            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-zinc-200">
                                                <button
                                                    onClick={() => router.back()}
                                                    className="px-6 py-2.5 border-2 border-zinc-300 text-zinc-700 rounded-lg hover:bg-zinc-50 transition-colors font-medium"
                                                >
                                                    Go Back
                                                </button>
                                                {status === BookingStatus.CONFIRMED && (
                                                    <button
                                                        onClick={() => {
                                                            checkIn(
                                                                { bookingId: bookingDetails.id },
                                                                {
                                                                    onSuccess: () => toast.success('Booking marked as checked in'),
                                                                    onError: (err: any) => toast.error(err?.response?.data?.detail || 'Failed to check in')
                                                                }
                                                            );
                                                        }}
                                                        disabled={isCheckingIn}
                                                        className="px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium disabled:opacity-50"
                                                    >
                                                        {isCheckingIn ? 'Processing...' : 'Mark as Checked In'}
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
                                                                        onSuccess: () => toast.success('Booking marked as checked out'),
                                                                        onError: (err: any) => toast.error(err?.response?.data?.detail || 'Failed to check out')
                                                                    }
                                                                );
                                                            }
                                                        }}
                                                        disabled={isCheckingOut}
                                                        className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
                                                    >
                                                        {isCheckingOut ? 'Processing...' : 'Mark as Checked Out'}
                                                    </button>
                                                )}
                                                {status === BookingStatus.CHECKED_OUT && !bookingDetails.isCautionRefunded && (
                                                    <button
                                                        onClick={() => {
                                                            refundCaution(
                                                                { bookingId: bookingDetails.id },
                                                                {
                                                                    onSuccess: () => toast.success('Caution fee refunded and booking completed'),
                                                                    onError: (err: any) => toast.error(err?.response?.data?.detail || 'Failed to refund caution fee')
                                                                }
                                                            );
                                                        }}
                                                        disabled={isRefunding}
                                                        className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                                                    >
                                                        {isRefunding ? 'Processing...' : 'Refund Caution Fee'}
                                                    </button>
                                                )}
                                                {status === BookingStatus.CANCEL_REQUESTED && (
                                                    <button
                                                        onClick={() => {
                                                            approveCancellation(
                                                                { bookingId: bookingDetails.id },
                                                                {
                                                                    onSuccess: () => {
                                                                        toast.success('Cancellation approved');
                                                                        setStatus(BookingStatus.CANCELLED);
                                                                    },
                                                                    onError: (err: any) => toast.error(err?.response?.data?.detail || 'Failed to approve cancellation')
                                                                }
                                                            );
                                                        }}
                                                        disabled={isApproving}
                                                        className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                                                    >
                                                        {isApproving ? 'Approving...' : 'Approve Cancellation'}
                                                    </button>
                                                )}
                                                {status !== BookingStatus.CANCELLED && status !== BookingStatus.COMPLETED && status !== BookingStatus.CANCEL_REQUESTED && (
                                                    <button
                                                        onClick={() => setShowCancelConfirm(true)}
                                                        className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                                                    >
                                                        Cancel Booking
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setShowDeleteConfirm(true)}
                                                    className="px-6 py-2.5 bg-zinc-800 text-white rounded-lg hover:bg-zinc-950 transition-colors font-medium"
                                                >
                                                    Delete Record
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <Modal
                                        isOpen={showCheckoutConfirm}
                                        onClose={() => setShowCheckoutConfirm(false)}
                                        title="Early Check-Out Confirmation"
                                        content={
                                            <div className="text-zinc-600">
                                                <p>This booking is scheduled to end on <span className="font-semibold">{endDate ? formatDate(endDate) : 'the scheduled date'}</span>.</p>
                                                <p className="mt-2">Are you sure you want to mark this guest as checked out early? This action will finalize the stay period.</p>
                                            </div>
                                        }
                                        footer={
                                            <div className="flex gap-3 justify-center">
                                                <button
                                                    onClick={() => setShowCheckoutConfirm(false)}
                                                    className="px-6 py-2 border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShowCheckoutConfirm(false);
                                                        checkOut(
                                                            { bookingId: bookingDetails.id },
                                                            {
                                                                onSuccess: () => toast.success('Booking marked as checked out'),
                                                                onError: (err: any) => toast.error(err?.response?.data?.detail || 'Failed to check out')
                                                            }
                                                        );
                                                    }}
                                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                                >
                                                    Confirm Check-Out
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
                                            // This is direct cancellation by admin
                                            deleteBooking(
                                                {
                                                    bookingId: bookingDetails.id,
                                                    cancellationReason: reason
                                                },
                                                {
                                                    onSuccess: () => {
                                                        toast.success('Booking cancelled successfully');
                                                        setShowCancelConfirm(false);
                                                        setStatus(BookingStatus.CANCELLED);
                                                    },
                                                    onError: (err: any) => {
                                                        toast.error(err?.response?.data?.detail || 'Failed to cancel booking');
                                                    }
                                                }
                                            );
                                        }}
                                    />

                                    <DeleteBookingDialog
                                        isOpen={showDeleteConfirm}
                                        onClose={() => setShowDeleteConfirm(false)}
                                        bookingId={bookingDetails.id}
                                        isPending={isDeleting}
                                        title="Delete Booking Record?"
                                        description={`Are you sure you want to permanently delete booking ${bookingDetails.booking_id}? This will remove it from all views.`}
                                        confirmText="Delete Permanently"
                                        onConfirm={(reason) => {
                                            deleteBooking(
                                                {
                                                    bookingId: bookingDetails.id,
                                                    cancellationReason: reason || 'Deleted by admin'
                                                },
                                                {
                                                    onSuccess: () => {
                                                        toast.success('Booking record deleted');
                                                        router.push(PAGE_ROUTES.dashboard.bookingManagement.bookings.base);
                                                    },
                                                    onError: (err: any) => {
                                                        toast.error(err?.response?.data?.detail || 'Failed to delete booking');
                                                    }
                                                }
                                            );
                                        }}
                                    />
                                </>
                }
            </div>
        </div>
    );
}
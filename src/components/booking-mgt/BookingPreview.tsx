// BookingPrintView.tsx
import React, { forwardRef } from "react";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaHome,
  FaMoneyBillWave,
  FaChartPie,
} from "react-icons/fa";
import { IoLocationOutline } from "react-icons/io5";
import { formatDate, formatMoney } from "@/src/lib/utils";
import { BookingStatus, IBooking } from "./types";
import { normalizeBooking } from "./bookings/utils";
import Image from "next/image";

interface BookingPrintViewProps {
  bookingDetails: IBooking;
}

const BookingPrintView = forwardRef<HTMLDivElement, BookingPrintViewProps>(
  ({ bookingDetails }, ref) => {
    const b = normalizeBooking(bookingDetails);
    const property = b.property;

    const getStatusBadge = (status: BookingStatus) => {
      const styles: Record<string, string> = {
        [BookingStatus.CONFIRMED]: "bg-green-100 text-green-800 border-green-200",
        [BookingStatus.PENDING]: "bg-yellow-100 text-yellow-800 border-yellow-200",
        [BookingStatus.PENDING_PAYMENT]: "bg-yellow-100 text-yellow-800 border-yellow-200",
        [BookingStatus.CHECKED_IN]: "bg-blue-100 text-blue-800 border-blue-200",
        [BookingStatus.CHECKED_OUT]: "bg-indigo-100 text-indigo-800 border-indigo-200",
        [BookingStatus.CANCELLED]: "bg-red-100 text-red-800 border-red-200",
        [BookingStatus.COMPLETED]: "bg-gray-100 text-gray-800 border-gray-200",
        [BookingStatus.APPROVAL_PENDING]: "bg-orange-100 text-orange-800 border-orange-200",
        [BookingStatus.CANCEL_REQUESTED]: "bg-purple-100 text-purple-800 border-purple-200",
      };
      return styles[status] || "bg-gray-100 text-gray-800 border-gray-200";
    };

    const bedroomCount = (b.unit as any)?.bedroom_count || b.unit?.bedroomCount || 0;
    const bathroomCount = (b.unit as any)?.bathroom_count || b.unit?.bathroomCount || 0;
    const livingRoomCount = (b.unit as any)?.living_room_count || b.unit?.livingRoomCount || 0;
    const maxGuests = (b.unit as any)?.max_guests || b.unit?.maxGuests || 0;

    return (
      <div ref={ref} className="booking-print-content" style={{ padding: "20px", background: "white", width: "100%" }}>
        {/* Header */}
        <div className="text-center mb-8 pb-6 border-b-2 border-gray-200">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Booking Confirmation</h1>
          <p className="text-gray-500 text-sm">Booking ID: {b.bookingId || `#${b.id}`}</p>
          <div className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium border">
            <span className={getStatusBadge(b.status)}>Status: {b.status?.replace(/_/g, " ")}</span>
          </div>
        </div>

        {/* Property & Unit Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <FaHome className="text-primary text-lg" />
            <h2 className="text-xl font-semibold text-gray-800">Property & Unit Details</h2>
          </div>
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {property?.name || "Property Name"}
            </h3>
            <div className="flex items-start gap-2 text-gray-600 mb-3">
              <IoLocationOutline className="mt-0.5 flex-shrink-0" />
              <p className="text-sm">
                {property?.address || "Address not available"}
                {property?.city && `, ${property.city}`}
                {property?.state && `, ${property.state}`}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Property Type:</span>
                <span className="ml-2 font-medium text-gray-700">
                  {(property as any)?.propertyType || (property as any)?.property_type || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Unit:</span>
                <span className="ml-2 font-medium text-gray-700">{b.unit?.name || "Unit Name"}</span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3 mt-3 pt-3 border-t border-gray-200 text-sm">
              <div>
                <span className="text-gray-500 block text-xs">Bedrooms</span>
                <span className="font-medium text-gray-700">{bedroomCount}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Bathrooms</span>
                <span className="font-medium text-gray-700">{bathroomCount}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Living Rooms</span>
                <span className="font-medium text-gray-700">{livingRoomCount}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs">Max Guests</span>
                <span className="font-medium text-gray-700">{maxGuests}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Guest Information */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <FaUser className="text-primary text-lg" />
            <h2 className="text-xl font-semibold text-gray-800">Guest Information</h2>
          </div>
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
            <div className="flex gap-4">
              {b.user?.profile?.profileImage ? (
                <Image
                  src={b.user.profile.profileImage}
                  alt="Guest"
                  width={64}
                  height={64}
                  className="rounded-lg object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                  <FaUser className="text-2xl text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800">
                  {b.user?.profile?.firstName || "Guest"}{" "}
                  {b.user?.profile?.lastName || ""}
                </h3>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  <div className="flex items-center gap-2">
                    <FaEnvelope className="text-gray-400" />
                    <span className="text-gray-600">{b.user?.email || "Not provided"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaPhone className="text-gray-400" />
                    <span className="text-gray-600">{b.user?.phone || "Not provided"}</span>
                  </div>
                </div>
                {b.user?.profile?.city && (
                  <div className="flex items-center gap-2 mt-2 text-sm">
                    <IoLocationOutline className="text-gray-400" />
                    <span className="text-gray-600">
                      {b.user.profile.city}
                      {b.user.profile.state && `, ${b.user.profile.state}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Booking Details */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <FaCalendarAlt className="text-primary text-lg" />
            <h2 className="text-xl font-semibold text-gray-800">Booking Details</h2>
          </div>
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
            <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-200">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Check-in</p>
                <p className="text-base font-semibold text-gray-800">
                  {b.startDate ? formatDate(b.startDate) : "N/A"}
                </p>
                <p className="text-xs text-gray-500">From 2:00 PM</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Check-out</p>
                <p className="text-base font-semibold text-gray-800">
                  {b.endDate ? formatDate(b.endDate) : "N/A"}
                </p>
                <p className="text-xs text-gray-500">Until 11:00 AM</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Duration</p>
                <p className="text-base font-semibold text-gray-800">
                  {b.nights} {b.nights === 1 ? "Night" : "Nights"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Guests</p>
                <p className="text-base font-semibold text-gray-800">{b.guestsCount || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Units</p>
                <p className="text-base font-semibold text-gray-800">{b.unitCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <FaMoneyBillWave className="text-primary text-lg" />
            <h2 className="text-xl font-semibold text-gray-800">Payment Summary</h2>
          </div>
          <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Price per night</span>
                <span className="font-medium text-gray-800">{formatMoney(b.pricePerNight)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Nights</span>
                <span className="font-medium text-gray-800">× {b.nights}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Units</span>
                <span className="font-medium text-gray-800">× {b.unitCount}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium text-gray-800">{formatMoney(b.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Caution fee (refundable)</span>
                <span className="font-medium text-gray-800">{formatMoney(b.cautionFee)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t-2 border-gray-300">
                <span className="text-base font-bold text-gray-800">Total Paid</span>
                <span className="text-xl font-bold text-primary">{formatMoney(b.totalPrice)}</span>
              </div>
              {b.transactionRef && (
                <div className="mt-3 pt-3 border-t border-gray-200 text-xs">
                  <span className="text-gray-500">Transaction Reference:</span>
                  <span className="ml-2 font-mono text-gray-600">{b.transactionRef}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Revenue Split (if available) */}
        {b.revenueSplit && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <FaChartPie className="text-primary text-lg" />
              <h2 className="text-xl font-semibold text-gray-800">Revenue Distribution</h2>
            </div>
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Owner ({b.revenueSplit.percentages.owner}%)</span>
                  <span className="font-medium text-gray-800">
                    {formatMoney(b.revenueSplit.owner_amount)}
                  </span>
                </div>
                {b.revenueSplit.agent_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Agent ({b.revenueSplit.percentages.agent}%)</span>
                    <span className="font-medium text-gray-800">
                      {formatMoney(b.revenueSplit.agent_amount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Platform Fee</span>
                  <span className="font-medium text-gray-800">
                    {formatMoney(b.revenueSplit.platform_amount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t-2 border-gray-200 text-center text-xs text-gray-500">
          <p>This is a computer-generated document. No signature is required.</p>
          <p className="mt-1">Generated on {new Date().toLocaleString()}</p>
        </div>
      </div>
    );
  },
);

BookingPrintView.displayName = "BookingPrintView";

export default BookingPrintView;

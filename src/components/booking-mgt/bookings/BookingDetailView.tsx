"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { LiaPrintSolid } from "react-icons/lia";
import html2canvas from "html2canvas";

import { BookingStatus, IBooking } from "../types";
import { normalizeBooking, NormalizedBooking } from "./utils";
import { GetBookingDetails } from "@/src/lib/request-handlers/bookingMgt";
import { usePermissions } from "@/src/hooks/usePermissions";

import Loader from "../../loader";
import EditBookingDetails from "./EditBookingDetails";
import BookingPrintView from "../BookingPreview";
import RaiseDisputeModal from "../../disputes/RaiseDisputeModal";
import CollapsibleSection from "../../mobile/CollapsibleSection";

// Sub-components
import BookingHeader from "./BookingHeader";
import BookingPropertyCard from "./BookingPropertyCard";
import BookingGuestCard from "./BookingGuestCard";
import BookingDatesCard from "./BookingDatesCard";
import BookingPaymentCard from "./BookingPaymentCard";
import BookingRevenueSplit from "./BookingRevenueSplit";
import BookingStatusBanner from "./BookingStatusBanner";
import BookingOwnerAgentCard from "./BookingOwnerAgentCard";
import BookingTimeline from "./BookingTimeline";
import BookingActionBar from "./BookingActionBar";
import BookingExtensions from "./BookingExtensions";
import FreshPaymentLinkCard from "./FreshPaymentLinkCard";

export default function BookingDetailView({ bookingId }: { bookingId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isOwner } = usePermissions();

  const printContentRef = useRef<HTMLDivElement>(null);
  const [editMode, setEditMode] = useState(Boolean(searchParams.get("edit")));
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);

  // Data
  const { data: bookingData, isLoading, error } = GetBookingDetails(bookingId);
  const [booking, setBooking] = useState<NormalizedBooking | null>(null);
  const [rawBooking, setRawBooking] = useState<IBooking | null>(null);

  useEffect(() => {
    if (bookingData?.data?.data) {
      const raw = bookingData.data.data as IBooking;
      setRawBooking(raw);
      setBooking(normalizeBooking(raw));
    }
  }, [bookingData]);

  // Edit mode query param sync
  const setQueryParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleEdit = () => {
    setEditMode(true);
    setQueryParam("edit", "true");
  };

  // Status change callback from ActionBar
  const handleStatusChange = (newStatus: BookingStatus) => {
    if (booking) {
      setBooking({ ...booking, status: newStatus });
    }
  };

  // PDF generation
  const handleGeneratePDF = async () => {
    if (!printContentRef.current) return;
    setIsGeneratingPDF(true);
    try {
      const images = printContentRef.current.querySelectorAll("img");
      await Promise.all(
        Array.from(images).map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        }),
      );

      const canvas = await html2canvas(printContentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: printContentRef.current.scrollWidth,
        windowHeight: printContentRef.current.scrollHeight,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new (await import("jspdf")).jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`booking-${booking?.bookingId || booking?.id}.pdf`);
      setShowPrintPreview(false);
    } catch {
      toast.error("Failed to generate PDF");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Render states
  if (isLoading) {
    return (
      <div className="p-3 sm:p-4 md:p-6 lg:p-10 w-full max-w-[1600px] mx-auto">
        <div className="w-full bg-white rounded-xl shadow-sm min-h-[50vh] flex items-center justify-center">
          <Loader />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 sm:p-4 md:p-6 lg:p-10 w-full max-w-[1600px] mx-auto">
        <div className="w-full bg-white rounded-xl shadow-sm min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
          <p className="text-red-600 text-base sm:text-lg mb-3">Failed to load booking details</p>
          <p className="text-zinc-500 text-xs sm:text-sm mb-5 max-w-md">
            Please try again or contact support if the issue persists
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!booking || !rawBooking) {
    return (
      <div className="p-3 sm:p-4 md:p-6 lg:p-10 w-full max-w-[1600px] mx-auto">
        <div className="w-full bg-white rounded-xl shadow-sm min-h-[50vh] flex items-center justify-center p-6">
          <div className="text-center">
            <p className="text-zinc-600 text-base sm:text-lg mb-1">No booking found</p>
            <p className="text-zinc-400 text-xs sm:text-sm">
              The booking you&apos;re looking for doesn&apos;t exist or has been removed
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-10 w-full max-w-[1600px] mx-auto">
      <FreshPaymentLinkCard bookingUuid={String(booking.id)} />
      <div className="w-full bg-white rounded-xl shadow-sm min-h-[50vh]">
        <div className="p-4 sm:p-5 md:p-8 lg:p-10">
          {/* Header */}
          {!editMode && (
            <BookingHeader
              booking={booking}
              isOwner={isOwner}
              onEdit={handleEdit}
              onPrint={() => setShowPrintPreview(true)}
              onRaiseDispute={() => setIsDisputeModalOpen(true)}
            />
          )}

          {editMode ? (
            <EditBookingDetails
              bookingId={bookingId}
              bookingData={rawBooking}
              handleEditMode={setEditMode}
            />
          ) : (
            <div className="space-y-4 sm:space-y-5 md:space-y-6">
              {/* Two-column layout: main content + timeline sidebar */}
              <div className="flex flex-col lg:flex-row gap-5">
                {/* Main content */}
                <div className="flex-1 space-y-4 sm:space-y-5 md:space-y-6 min-w-0">
                  <BookingPropertyCard booking={booking} />
                  <BookingDatesCard booking={booking} />
                  <BookingGuestCard booking={booking} />
                  <BookingPaymentCard booking={booking} />

                  {/* Referral & on-behalf attribution */}
                  {(() => {
                    const onBehalf =
                      booking.bookedBy && String(booking.bookedBy) !== String(booking.userId);
                    if (!booking.referralCodeUsed && !onBehalf) return null;
                    const bookerName = booking.booker
                      ? [booking.booker.profile?.firstName, booking.booker.profile?.lastName]
                          .filter(Boolean)
                          .join(" ") || booking.booker.email || booking.bookedBy
                      : booking.bookedBy;
                    return (
                      <div className="border border-violet-200 rounded-xl overflow-hidden">
                        <div className="px-4 sm:px-5 py-3 bg-violet-50 border-b border-violet-100">
                          <h2 className="text-sm sm:text-base font-semibold text-violet-800">
                            {onBehalf && !booking.referralCodeUsed
                              ? "Booked on behalf"
                              : "Referral Applied"}
                          </h2>
                        </div>
                        <div className="p-4 sm:p-5">
                          {booking.referralCodeUsed && (
                            <div className="flex justify-between items-center py-1 text-xs sm:text-sm">
                              <span className="text-zinc-600">Referral Code</span>
                              <span className="font-mono font-semibold text-zinc-800 tracking-widest">
                                {booking.referralCodeUsed}
                              </span>
                            </div>
                          )}
                          {booking.referrerId && (
                            <div className="flex justify-between items-center py-1 border-t border-zinc-100 mt-1 pt-2 text-xs sm:text-sm">
                              <span className="text-zinc-600">Referrer ID</span>
                              <span className="font-mono text-zinc-500">{booking.referrerId}</span>
                            </div>
                          )}
                          {onBehalf && (
                            <div className="flex justify-between items-center py-1 border-t border-zinc-100 mt-1 pt-2 text-xs sm:text-sm">
                              <span className="text-zinc-600">Booked by</span>
                              <span className="text-zinc-800 font-medium truncate ml-3">
                                {bookerName}
                              </span>
                            </div>
                          )}
                          {booking.referralCodeUsed && (
                            <div className="mt-3 p-2 bg-violet-50 rounded-lg border border-violet-100 text-[10px] sm:text-xs text-violet-700 italic">
                              Agent commission reduced to 3%; referrer credited 2%
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  <BookingRevenueSplit booking={booking} />
                  <BookingStatusBanner booking={booking} />
                  <BookingOwnerAgentCard booking={booking} />

                  {/* Stay Extensions */}
                  <CollapsibleSection title="Stay Extensions" icon="solar:calendar-add-bold">
                    <BookingExtensions
                      bookingId={bookingId}
                      currentEndDate={booking.endDate}
                      bookingStatus={booking.status}
                    />
                  </CollapsibleSection>
                </div>

                {/* Timeline sidebar */}
                <div className="lg:w-[280px] flex-shrink-0">
                  <div className="lg:sticky lg:top-6">
                    <BookingTimeline booking={booking} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action bar */}
        {!editMode && (
          <BookingActionBar booking={booking} onStatusChange={handleStatusChange} />
        )}

        {/* Dispute modal */}
        <RaiseDisputeModal
          isOpen={isDisputeModalOpen}
          onClose={() => setIsDisputeModalOpen(false)}
          bookingId={bookingId}
        />

        {/* Print preview modal */}
        {showPrintPreview && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-auto relative">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center z-10">
                <h3 className="text-lg font-semibold text-gray-800">Print Preview</h3>
                <button
                  onClick={() => setShowPrintPreview(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 overflow-visible">
                <BookingPrintView ref={printContentRef} bookingDetails={rawBooking} />
              </div>
              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex justify-center gap-3 z-10">
                <button
                  onClick={handleGeneratePDF}
                  disabled={isGeneratingPDF}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingPDF ? (
                    <>
                      <svg className="animate-spin inline w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <LiaPrintSolid className="inline mr-2" />
                      Download PDF
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowPrintPreview(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { usePermissions } from "@/src/hooks/usePermissions";
import { useAuth } from "@/src/hooks/useAuth";

type BookingLike = {
    bookedBy?: string | number | null;
    booked_by?: string | number | null;
    userId?: string | number | null;
    user_id?: string | number | null;
    referrerId?: string | number | null;
    referrer_id?: string | number | null;
    isMyBooking?: boolean;
    is_my_booking?: boolean;
    isMyReferral?: boolean;
    is_my_referral?: boolean;
};

/**
 * Renders a "Booked by you" or "Referred by you" chip when the current AGENT/OWNER
 * is the booking's on-behalf creator or referrer. Hidden for ADMIN/SUPER_ADMIN/etc.
 * because staff-tier viewers see every booking and the chip would just be noise.
 *
 * Booked-by takes priority — if the agent both booked on behalf AND is the
 * referrer (the auto-fallback path), one chip is enough.
 */
export default function BookingAttributionChip({
    booking,
    size = "md",
}: {
    booking: BookingLike;
    size?: "sm" | "md";
}) {
    const { user } = useAuth();
    const { isAgent, isOwner } = usePermissions();

    if (!user || !(isAgent || isOwner)) return null;

    const myId = String(user.id);
    const bookedBy = booking.bookedBy ?? booking.booked_by;
    const userId = booking.userId ?? booking.user_id;
    const referrerId = booking.referrerId ?? booking.referrer_id;

    const onBehalfFlag = booking.isMyBooking ?? booking.is_my_booking;
    const referralFlag = booking.isMyReferral ?? booking.is_my_referral;

    const isOnBehalfCreator =
        onBehalfFlag ??
        (bookedBy != null && String(bookedBy) === myId && String(bookedBy) !== String(userId));
    const isReferrer =
        referralFlag ??
        (referrerId != null && String(referrerId) === myId);

    const base =
        size === "sm"
            ? "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
            : "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";

    if (isOnBehalfCreator) {
        return (
            <span className={`${base} bg-indigo-100 text-indigo-800`} title="You created this booking on behalf of the guest">
                Booked by you
            </span>
        );
    }
    if (isReferrer) {
        return (
            <span className={`${base} bg-amber-100 text-amber-800`} title="This booking used your referral code">
                Referred by you
            </span>
        );
    }
    return null;
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { addDays, format, parseISO } from "date-fns";
import { toast } from "react-hot-toast";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/src/components/ui/dialog";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import { formatNgn } from "@/src/lib/utils";
import { trackEvent } from "@/src/lib/analytics";
import {
    CloseNights,
    ReopenNights,
    type BlockReason,
} from "@/src/lib/request-handlers/ownerHomeMgt";
import type { CalendarSelection } from "./OwnerCalendar";

const MAX_NIGHTS = 30;

/**
 * Everything a day cell opens: the stay on it, the run of nights the owner
 * closed, or the form to close nights.
 *
 * Below 520px it renders as a bottom sheet. Focus is trapped, Escape and the
 * scrim close it and focus returns to the cell, all from the Radix dialog.
 */
export default function NightSheet({
    selection,
    onClose,
}: {
    selection: CalendarSelection | null;
    onClose: () => void;
}) {
    const open = selection !== null;
    return (
        <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
            {/* max-h in dvh where supported: with iOS Safari's URL bar shown,
                92vh on a bottom-anchored sheet pushes its title off screen. */}
            <DialogContent className="max-h-[92vh] supports-[height:100dvh]:max-h-[92dvh] overflow-auto max-[520px]:bottom-0 max-[520px]:top-auto max-[520px]:max-w-none max-[520px]:translate-y-0 max-[520px]:rounded-b-none max-[520px]:rounded-t-2xl max-[520px]:pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
                {selection && <SheetBody selection={selection} onClose={onClose} />}
            </DialogContent>
        </Dialog>
    );
}

function SheetBody({
    selection,
    onClose,
}: {
    selection: CalendarSelection;
    onClose: () => void;
}) {
    const { night, unit, booking } = selection;

    if (booking) return <StayDetail selection={selection} onClose={onClose} />;
    if (night.state === "OWNER_HOLD" || night.state === "OFFLINE") {
        return <ClosedDetail selection={selection} onClose={onClose} />;
    }
    // A night with several bookings on it carries no single booking id, and a
    // multi-room night is read only here. Both used to fall through to the
    // close form, which offered to close a night that is already sold.
    if (night.state === "BOOKED" || night.state === "PARTIAL") {
        return <RoomsDetail selection={selection} />;
    }
    if (night.state === "CLOSED" || night.state === "UNAVAILABLE") {
        return (
            <>
                <DialogHeader>
                    <DialogTitle className="text-left">
                        {night.state === "UNAVAILABLE" ? "Not available" : "Closed"}
                    </DialogTitle>
                    <DialogDescription className="text-left">
                        {format(parseISO(night.date), "EEEE, d MMMM")}, {unit.unit_name}
                    </DialogDescription>
                </DialogHeader>
                <p className="text-sm text-gray-600">
                    {night.note ??
                        "This night was closed from the listing's own calendar. Reopen it there."}
                </p>
                <UnitCalendarLink unit={unit} />
            </>
        );
    }
    if (night.state === "EXTERNAL") {
        return (
            <>
                <DialogHeader>
                    <DialogTitle className="text-left">Blocked by a connected calendar</DialogTitle>
                    <DialogDescription className="text-left">
                        {format(parseISO(night.date), "EEEE, d MMMM")}, {unit.unit_name}
                    </DialogDescription>
                </DialogHeader>
                <p className="text-sm text-gray-600">
                    {night.note
                        ? `"${night.note}" came from a calendar you connected.`
                        : "This night came from a calendar you connected."}{" "}
                    It reopens here when it reopens there.
                </p>
            </>
        );
    }
    if (night.state === "OPEN" && night.writable) {
        return <CloseForm selection={selection} onClose={onClose} />;
    }
    // Open, but not ours to close from here (a past night, or a multi-room
    // unit). Never offer a write the server would refuse.
    return <RoomsDetail selection={selection} />;
}

function UnitCalendarLink({ unit }: { unit: CalendarSelection["unit"] }) {
    return (
        <Link
            href={PAGE_ROUTES.dashboard.propertyManagement.allProperties.units.details(
                unit.property_id,
                unit.unit_id
            )}
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-center text-sm font-semibold text-[#028090] hover:bg-[#028090]/5"
        >
            Open this listing&apos;s calendar
        </Link>
    );
}

/**
 * A night on a multi-room unit, or one carrying more than one booking: how
 * many rooms are taken, and where to go to change it. Read only (spec D15).
 */
function RoomsDetail({ selection }: { selection: CalendarSelection }) {
    const { night, unit } = selection;
    const free = Math.max(0, night.rooms_total - night.rooms_booked);
    return (
        <>
            <DialogHeader>
                <DialogTitle className="text-left">
                    {night.rooms_booked} of {night.rooms_total} rooms booked
                </DialogTitle>
                <DialogDescription className="text-left">
                    {format(parseISO(night.date), "EEEE, d MMMM")}, {unit.unit_name}
                </DialogDescription>
            </DialogHeader>
            <p className="text-sm text-gray-600">
                {free === 0
                    ? "Every room is taken for this night."
                    : `${free} ${free === 1 ? "room is" : "rooms are"} still open.`}{" "}
                Rooms are managed on the listing&apos;s own calendar.
            </p>
            <UnitCalendarLink unit={unit} />
        </>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center gap-3 border-t border-gray-100 py-2.5 text-sm">
            <span className="text-gray-600">{label}</span>
            <span className="ml-auto text-right font-semibold tabular-nums text-gray-900">
                {value}
            </span>
        </div>
    );
}

function StayDetail({
    selection,
    onClose,
}: {
    selection: CalendarSelection;
    onClose: () => void;
}) {
    const { booking, unit } = selection;

    useEffect(() => {
        trackEvent("owner_stay_opened", { surface: "tap" });
    }, []);

    if (!booking) return null;

    return (
        <>
            <DialogHeader>
                <DialogTitle className="text-left">{booking.guest_name}</DialogTitle>
                <DialogDescription className="text-left">
                    {unit.unit_name} &middot; {format(parseISO(booking.check_in), "d MMM")} to{" "}
                    {format(parseISO(booking.check_out), "d MMM")} &middot; {booking.nights}{" "}
                    {booking.nights === 1 ? "night" : "nights"}
                </DialogDescription>
            </DialogHeader>

            <div>
                <Row label="Guest paid" value={formatNgn(booking.guest_paid)} />
                <Row label="Platform fee" value={formatNgn(booking.platform_fee)} />
                <Row label="Your share" value={formatNgn(booking.your_share)} />
                {booking.agent_name && <Row label="Agent" value={booking.agent_name} />}
                <Row label="Reference" value={booking.reference} />
            </div>

            <div className="flex gap-2.5">
                <Link
                    href={PAGE_ROUTES.dashboard.bookingManagement.bookings.details(booking.id)}
                    className="flex-1 rounded-lg bg-[#028090] px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-[#016171]"
                >
                    View booking
                </Link>
                <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                    Close
                </button>
            </div>
        </>
    );
}

function ClosedDetail({
    selection,
    onClose,
}: {
    selection: CalendarSelection;
    onClose: () => void;
}) {
    const { night, unit } = selection;
    const reopen = ReopenNights();

    const reason =
        night.state === "OFFLINE" ? "Booked another way" : "Kept for yourself";

    const onReopen = async () => {
        if (!night.block_group_id) return;
        try {
            const response = await reopen.mutateAsync(night.block_group_id);
            const count =
                (response as { data?: { data?: { nights_reopened?: number } } })?.data?.data
                    ?.nights_reopened ?? 0;
            toast.success(
                count === 1 ? "1 night is open again" : `${count} nights are open again`
            );
            trackEvent("owner_night_reopened", {
                nights: count,
                source: night.state === "OFFLINE" ? "OFFLINE_BOOKING" : "OWNER_HOLD",
            });
            onClose();
        } catch (error) {
            const detail =
                (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
            toast.error(detail ?? "Could not reopen these nights");
        }
    };

    return (
        <>
            <DialogHeader>
                <DialogTitle className="text-left">{reason}</DialogTitle>
                <DialogDescription className="text-left">
                    {format(parseISO(night.date), "EEEE, d MMMM")}, {unit.unit_name}
                </DialogDescription>
            </DialogHeader>

            {night.note && <p className="text-sm text-gray-600">&ldquo;{night.note}&rdquo;</p>}

            {night.reopenable ? (
                <div className="flex gap-2.5">
                    <button
                        type="button"
                        disabled={reopen.isPending}
                        onClick={onReopen}
                        className="flex-1 rounded-lg bg-[#028090] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#016171] disabled:opacity-60"
                    >
                        {reopen.isPending ? "Reopening..." : "Open these nights again"}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Leave it closed
                    </button>
                </div>
            ) : (
                <p className="text-sm text-gray-500">
                    These nights were closed from the listing&apos;s own calendar. Reopen them
                    there.
                </p>
            )}
        </>
    );
}

function CloseForm({
    selection,
    onClose,
}: {
    selection: CalendarSelection;
    onClose: () => void;
}) {
    const { night, unit } = selection;
    const [reason, setReason] = useState<BlockReason>("OWNER_HOLD");
    const [nights, setNights] = useState(1);
    const [note, setNote] = useState("");
    const close = CloseNights();

    const start = parseISO(night.date);
    const freeAgain = addDays(start, nights);

    const submit = async () => {
        try {
            await close.mutateAsync({
                unit_id: unit.unit_id,
                start_date: night.date,
                nights,
                source: reason,
                note: note.trim() || undefined,
            });
            toast.success(nights === 1 ? "1 night closed" : `${nights} nights closed`);
            trackEvent("owner_night_closed", { nights, source: reason });
            onClose();
        } catch (error) {
            const detail =
                (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
            toast.error(detail ?? "Could not close these nights");
        }
    };

    return (
        <>
            <DialogHeader>
                <DialogTitle className="text-left">Close these nights</DialogTitle>
                <DialogDescription className="text-left">
                    {unit.unit_name}, from {format(start, "EEEE, d MMMM")}
                </DialogDescription>
            </DialogHeader>

            <div className="grid gap-2.5">
                {(
                    [
                        [
                            "OWNER_HOLD",
                            "I am keeping it for myself",
                            "Repairs, family, or your own stay.",
                        ],
                        [
                            "OFFLINE_BOOKING",
                            "Someone booked it another way",
                            "A direct guest, a returning guest, or another platform.",
                        ],
                    ] as [BlockReason, string, string][]
                ).map(([value, title, detail]) => (
                    <label
                        key={value}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${
                            reason === value ? "border-[#028090] bg-[#028090]/5" : "border-gray-200"
                        }`}
                    >
                        <input
                            type="radio"
                            name="close-reason"
                            className="mt-1 accent-[#028090]"
                            checked={reason === value}
                            onChange={() => setReason(value)}
                        />
                        <span>
                            <b className="block text-sm font-semibold text-gray-900">{title}</b>
                            <span className="mt-0.5 block text-xs text-gray-600">{detail}</span>
                        </span>
                    </label>
                ))}
            </div>

            <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">How many nights?</span>
                <div className="ml-auto flex items-center gap-2">
                    <button
                        type="button"
                        aria-label="One night fewer"
                        onClick={() => setNights((n) => Math.max(1, n - 1))}
                        className="h-11 w-11 rounded-lg border border-gray-200 text-lg leading-none text-gray-600 hover:border-[#028090] hover:text-[#028090]"
                    >
                        &minus;
                    </button>
                    <span className="min-w-[3.5ch] text-center font-bold tabular-nums">{nights}</span>
                    <button
                        type="button"
                        aria-label="One night more"
                        onClick={() => setNights((n) => Math.min(MAX_NIGHTS, n + 1))}
                        className="h-11 w-11 rounded-lg border border-gray-200 text-lg leading-none text-gray-600 hover:border-[#028090] hover:text-[#028090]"
                    >
                        +
                    </button>
                </div>
            </div>

            <label className="block">
                <span className="text-sm text-gray-600">A note, just for you (optional)</span>
                <input
                    value={note}
                    maxLength={200}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Plumbing repair"
                    className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
            </label>

            {/* Off-by-one on the checkout day is the mistake owners make, so the
                day the unit is free again is stated in words. */}
            <p className="rounded-lg bg-gray-50 px-3 py-2.5 text-[13px] text-gray-700">
                Closing {nights === 1 ? "the night of" : `${nights} nights from`}{" "}
                <b>{format(start, "d MMMM")}</b>. The listing is free again on{" "}
                <b>{format(freeAgain, "d MMMM")}</b>. No amount is recorded.
            </p>

            <div className="flex gap-2.5">
                <button
                    type="button"
                    disabled={close.isPending}
                    onClick={submit}
                    className="flex-1 rounded-lg bg-[#028090] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#016171] disabled:opacity-60"
                >
                    {close.isPending ? "Closing..." : "Close these nights"}
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                    Cancel
                </button>
            </div>
        </>
    );
}

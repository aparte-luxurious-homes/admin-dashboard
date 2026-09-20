"use client";

import { useMemo, type KeyboardEvent } from "react";
import { addDays, format, isSameMonth, parseISO } from "date-fns";
import { Icon } from "@iconify/react";

import type {
    CalendarBooking,
    CalendarNight,
    CalendarUnit,
    OwnerCalendar as OwnerCalendarData,
} from "@/src/lib/request-handlers/ownerHomeMgt";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Above this share of open nights, the calendar asks the owner to share their page. */
export const SHARE_PROMPT_THRESHOLD = 0.6;

export interface CalendarSelection {
    night: CalendarNight;
    unit: CalendarUnit;
    booking?: CalendarBooking;
}

/**
 * The calendar is the main object on the page (spec D4): it answers "what is
 * happening in my places" and it is the only surface here that takes a write.
 *
 * Tapping is the interaction, not hovering (spec D5): owners are on phones,
 * and nothing lives behind a tooltip alone. Tab behaviour scales with the
 * number of units: none for one, tabs up to five, a select beyond that.
 */
export default function OwnerCalendar({
    data,
    isLoading,
    hasFailed = false,
    onRetry,
    month,
    onMonthChange,
    activeUnitId,
    onUnitChange,
    onSelect,
    onShare,
}: {
    data?: OwnerCalendarData;
    isLoading: boolean;
    hasFailed?: boolean;
    onRetry?: () => void;
    month: Date;
    onMonthChange: (next: Date) => void;
    activeUnitId: string;
    onUnitChange: (unitId: string) => void;
    onSelect: (selection: CalendarSelection) => void;
    onShare: () => void;
}) {
    const units = data?.units ?? [];
    // The API's "today" (Lagos), memoised so it is not a new Date object on
    // every render and does not re-run the month's occupancy sum each time.
    const today = useMemo(
        () => (data?.today ? parseISO(data.today) : new Date()),
        [data?.today]
    );
    const multi = units.length > 1;
    const showAll = multi && activeUnitId === "all";
    // With one listing there is no tab bar, so "all" means that listing. Doing
    // this here rather than waiting for state to catch up avoids a frame where
    // the grid filters against a unit id that matches nothing.
    const selectedUnitId = multi ? activeUnitId : (units[0]?.unit_id ?? activeUnitId);

    const bookingsById = useMemo(
        () => new Map((data?.bookings ?? []).map((b) => [b.id, b])),
        [data?.bookings]
    );

    const nightsByDate = useMemo(() => {
        const map = new Map<string, CalendarNight[]>();
        for (const night of data?.nights ?? []) {
            if (!showAll && night.unit_id !== selectedUnitId) continue;
            const list = map.get(night.date) ?? [];
            list.push(night);
            map.set(night.date, list);
        }
        return map;
    }, [data?.nights, showAll, selectedUnitId]);

    // Days of the visible month, padded to whole weeks.
    const days = useMemo(() => {
        const first = new Date(month.getFullYear(), month.getMonth(), 1);
        const cells: (Date | null)[] = Array(first.getDay()).fill(null);
        for (let d = new Date(first); isSameMonth(d, first); d = addDays(d, 1)) {
            cells.push(new Date(d));
        }
        return cells;
    }, [month]);

    // Room-nights still sellable this month, for the hint and the share
    // prompt. Nights that have passed are not inventory: counting them told an
    // owner whose remaining month was fully booked that it was mostly open.
    const { openNights, totalNights } = useMemo(() => {
        const todayKey = format(today, "yyyy-MM-dd");
        let open = 0;
        let total = 0;
        for (const [dateKey, list] of nightsByDate) {
            if (dateKey < todayKey) continue;
            for (const night of list) {
                total += night.rooms_total;
                if (night.state === "OPEN") open += night.rooms_total;
                else if (night.state === "PARTIAL") open += night.rooms_total - night.rooms_booked;
            }
        }
        return { openNights: open, totalNights: total };
    }, [nightsByDate, today]);

    const openShare = totalNights > 0 ? openNights / totalNights : 0;
    const activeUnit = units.find((u) => u.unit_id === selectedUnitId);

    /**
     * Arrow keys walk the grid (spec section 10). Without this a keyboard user
     * tabs through up to 31 day buttons one at a time to reach the end of a
     * month. Moves by one day sideways and by a week vertically, over the
     * cells that are actually focusable.
     */
    const onGridKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        const step =
            event.key === "ArrowRight" ? 1
            : event.key === "ArrowLeft" ? -1
            : event.key === "ArrowDown" ? 7
            : event.key === "ArrowUp" ? -7
            : 0;
        if (step === 0) return;
        const cells = Array.from(
            event.currentTarget.querySelectorAll<HTMLButtonElement>("button[data-day]")
        );
        const here = cells.indexOf(document.activeElement as HTMLButtonElement);
        if (here === -1) return;
        event.preventDefault();
        const next = cells[Math.min(cells.length - 1, Math.max(0, here + step))];
        next?.focus();
    };

    return (
        <section className="bg-white border border-gray-200 rounded-xl">
            <header className="flex flex-wrap items-center gap-3 px-5 pt-4 pb-3">
                <h2 className="text-[15px] font-semibold text-gray-900">Your calendar</h2>
                {totalNights > 0 && (
                    <span className="ml-auto text-xs tabular-nums text-gray-500">
                        {openNights} of {totalNights} nights open
                    </span>
                )}
            </header>

            {/* One unit needs no tab bar; six or more would scroll one off the
                edge, so they get a select instead. */}
            {multi && units.length <= 5 && (
                <div
                    role="tablist"
                    aria-label="Your listings"
                    className="flex gap-1 overflow-x-auto border-b border-gray-100 px-5"
                >
                    {[{ unit_id: "all", unit_name: "All listings" }, ...units].map((unit) => (
                        <button
                            key={unit.unit_id}
                            type="button"
                            role="tab"
                            aria-controls="owner-calendar-grid"
                            aria-selected={activeUnitId === unit.unit_id}
                            onClick={() => onUnitChange(unit.unit_id)}
                            className={`-mb-px whitespace-nowrap border-b-2 px-3 pb-2.5 pt-2 text-[13.5px] font-semibold ${
                                activeUnitId === unit.unit_id
                                    ? "border-[#028090] text-gray-900"
                                    : "border-transparent text-gray-500 hover:text-gray-900"
                            }`}
                        >
                            {unit.unit_name}
                        </button>
                    ))}
                </div>
            )}
            {multi && units.length > 5 && (
                <div className="px-5 pt-3">
                    <select
                        aria-label="Choose a listing"
                        value={activeUnitId}
                        onChange={(e) => onUnitChange(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    >
                        <option value="all">All listings</option>
                        {units.map((unit) => (
                            <option key={unit.unit_id} value={unit.unit_id}>
                                {unit.property_name}, {unit.unit_name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div className="flex items-center gap-2.5 px-5 pt-3.5 pb-1">
                <button
                    type="button"
                    aria-label="Previous month"
                    onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                    className="grid h-11 w-11 place-items-center rounded-lg border border-gray-200 text-gray-600 hover:border-[#028090] hover:text-[#028090] sm:h-8 sm:w-8"
                >
                    <Icon icon="mdi:chevron-left" width={18} />
                </button>
                <h3 className="min-w-[9.5ch] text-[15px] font-semibold text-gray-900">
                    {format(month, "MMMM yyyy")}
                </h3>
                <button
                    type="button"
                    aria-label="Next month"
                    onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                    className="grid h-11 w-11 place-items-center rounded-lg border border-gray-200 text-gray-600 hover:border-[#028090] hover:text-[#028090] sm:h-8 sm:w-8"
                >
                    <Icon icon="mdi:chevron-right" width={18} />
                </button>
            </div>

            {/* Tight gutters below 640px so seven cells still clear the 44px
                touch target on a 320px screen. */}
            <div className="grid grid-cols-7 gap-px px-0.5 pb-1 pt-1.5 text-[11px] font-semibold text-gray-500 sm:gap-1 sm:px-5">
                {DOW.map((d) => (
                    <span key={d} className="text-center">
                        {d}
                    </span>
                ))}
            </div>

            {isLoading ? (
                <div className="grid grid-cols-7 gap-px px-0.5 pb-4 sm:gap-1 sm:px-5">
                    {Array.from({ length: 35 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-[56px] rounded-lg bg-gray-100 motion-safe:animate-pulse sm:h-[68px]"
                        />
                    ))}
                </div>
            ) : hasFailed ? (
                // Not "you have no listings": an owner with six of them would
                // be told they have none.
                <div className="px-5 pb-8 pt-4 text-center">
                    <p className="text-sm text-gray-700">Your calendar could not be loaded.</p>
                    <button
                        type="button"
                        onClick={onRetry}
                        className="mt-3 rounded-lg border border-gray-200 px-3.5 py-2 text-[13px] font-semibold text-[#028090] hover:bg-[#028090]/5"
                    >
                        Try again
                    </button>
                </div>
            ) : units.length === 0 ? (
                <p className="px-5 pb-8 pt-4 text-center text-sm text-gray-500">
                    Your calendar appears here once you have a listing.
                </p>
            ) : (
                <div
                    id="owner-calendar-grid"
                    role="tabpanel"
                    onKeyDown={onGridKeyDown}
                    className="grid grid-cols-7 gap-px px-0.5 pb-3 sm:gap-1 sm:px-5"
                >
                    {days.map((day, index) => {
                        if (!day) return <div key={`pad-${index}`} aria-hidden />;
                        const key = format(day, "yyyy-MM-dd");
                        const list = nightsByDate.get(key) ?? [];
                        const isPast = key < format(today, "yyyy-MM-dd");
                        return (
                            <DayCell
                                key={key}
                                day={day}
                                nights={list}
                                units={units}
                                bookingsById={bookingsById}
                                showAll={showAll}
                                isPast={isPast}
                                isToday={key === format(today, "yyyy-MM-dd")}
                                onSelect={onSelect}
                            />
                        );
                    })}
                </div>
            )}

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-gray-100 px-5 py-3 text-xs text-gray-600">
                <Legend className="bg-[#028090]" label="Booked on Aparte" />
                <Legend className="bg-slate-500" label="Booked elsewhere" />
                <Legend className="border border-gray-300 bg-[repeating-linear-gradient(45deg,#e5e7eb,#e5e7eb_3px,transparent_3px,transparent_6px)]" label="You closed it" />
                <span className="ml-auto text-gray-500">
                    {showAll
                        ? "Pick a listing to close a night"
                        : activeUnit && !activeUnit.writable
                          ? `${activeUnit.unit_name} has ${activeUnit.rooms} rooms. Close rooms from the unit's own calendar.`
                          : "Tap any open day to close it"}
                </span>
            </div>

            {openShare > SHARE_PROMPT_THRESHOLD && totalNights > 0 && (
                <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 bg-[#028090]/5 px-5 py-3.5">
                    <p className="max-w-[52ch] text-[13.5px] text-gray-900">
                        Most of this month is still open. Guests who come through your own
                        page book more often than people browsing.
                    </p>
                    <button
                        type="button"
                        onClick={onShare}
                        className="ml-auto rounded-lg bg-[#028090] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#016171] max-sm:w-full"
                    >
                        Copy my link
                    </button>
                </div>
            )}
        </section>
    );
}

function Legend({ className, label }: { className: string; label: string }) {
    return (
        <span className="inline-flex items-center gap-1.5">
            <i className={`inline-block h-3 w-3 rounded-[3px] ${className}`} />
            {label}
        </span>
    );
}

const STATE_STYLES: Record<string, string> = {
    BOOKED: "bg-[#028090] border-[#028090] text-white",
    OFFLINE: "bg-slate-500 border-slate-500 text-white",
    OWNER_HOLD:
        "border-gray-300 bg-[repeating-linear-gradient(45deg,#e5e7eb,#e5e7eb_3px,transparent_3px,transparent_6px)] text-gray-700",
    EXTERNAL:
        "border-gray-300 bg-[repeating-linear-gradient(45deg,#e5e7eb,#e5e7eb_3px,transparent_3px,transparent_6px)] text-gray-700",
    CLOSED: "border-gray-200 bg-gray-100 text-gray-600",
    UNAVAILABLE: "border-gray-200 bg-gray-100 text-gray-600",
    PARTIAL: "border-[#028090]/40 bg-[#028090]/10 text-gray-800",
    OPEN: "border-gray-200 hover:border-[#028090] hover:bg-[#028090]/5",
};

const STATE_WORDS: Record<string, string> = {
    BOOKED: "booked on Aparte",
    OFFLINE: "booked elsewhere",
    OWNER_HOLD: "closed by you",
    EXTERNAL: "blocked by a connected calendar",
    CLOSED: "closed",
    UNAVAILABLE: "not available",
    PARTIAL: "partly booked",
    OPEN: "open",
};

function DayCell({
    day,
    nights,
    units,
    bookingsById,
    showAll,
    isPast,
    isToday,
    onSelect,
}: {
    day: Date;
    nights: CalendarNight[];
    units: CalendarUnit[];
    bookingsById: Map<string, CalendarBooking>;
    showAll: boolean;
    isPast: boolean;
    isToday: boolean;
    onSelect: (selection: CalendarSelection) => void;
}) {
    const label = format(day, "d MMMM");

    // The all-listings view is read only: it answers "is anything happening
    // anywhere", and changing a night needs a listing picked first.
    if (showAll) {
        return (
            <div
                role="img"
                aria-label={`${label}: ${nights.filter((n) => n.state !== "OPEN").length} of ${
                    nights.length
                } listings taken`}
                className={`flex min-h-[56px] flex-col gap-1 rounded-lg border border-gray-100 p-1.5 sm:min-h-[68px] ${
                    isPast ? "bg-gray-50 opacity-60" : ""
                } ${isToday ? "ring-2 ring-[#028090] ring-inset" : ""}`}
            >
                <span className="text-[11px] font-semibold tabular-nums text-gray-600">
                    {format(day, "d")}
                </span>
                <span className="mt-auto flex gap-0.5">
                    {nights.map((night) => (
                        <i
                            key={night.unit_id}
                            title={units.find((u) => u.unit_id === night.unit_id)?.unit_name}
                            className={`h-1.5 flex-1 rounded-sm ${
                                night.state === "BOOKED"
                                    ? "bg-[#028090]"
                                    : night.state === "OFFLINE"
                                      ? "bg-slate-500"
                                      : night.state === "OPEN"
                                        ? "bg-gray-200"
                                        : night.state === "PARTIAL"
                                          ? "bg-[#028090]/40"
                                          : "bg-gray-300"
                            }`}
                        />
                    ))}
                </span>
            </div>
        );
    }

    const night = nights[0];
    if (!night) {
        // No row for this unit and date. Still print the number, or the owner
        // gets a grid of blank squares with no way to tell which day is which.
        return (
            <div
                role="img"
                aria-label={`${label}: no information`}
                className="min-h-[56px] rounded-lg border border-gray-100 p-1.5 sm:min-h-[68px]"
            >
                <span className="text-[11px] font-semibold tabular-nums text-gray-400">
                    {format(day, "d")}
                </span>
            </div>
        );
    }

    const booking = night.booking_id ? bookingsById.get(night.booking_id) : undefined;
    const unit = units.find((u) => u.unit_id === night.unit_id)!;
    const interactive = !isPast && (night.writable || night.state !== "OPEN");
    const styles = STATE_STYLES[night.state] ?? STATE_STYLES.OPEN;

    const content = (
        <>
            <span
                className={`text-[11px] font-semibold tabular-nums ${
                    night.state === "BOOKED" || night.state === "OFFLINE"
                        ? "text-white/80"
                        : "text-gray-600"
                }`}
            >
                {format(day, "d")}
            </span>
            {booking && (
                <span className="truncate text-[11px] font-semibold leading-tight">
                    {booking.guest_name}
                </span>
            )}
            {!booking && night.state === "OFFLINE" && (
                <span className="truncate text-[11px] font-semibold leading-tight">Elsewhere</span>
            )}
            {!booking && (night.state === "OWNER_HOLD" || night.state === "EXTERNAL") && (
                <span className="truncate text-[11px] font-semibold leading-tight">Closed</span>
            )}
            {night.state === "PARTIAL" && (
                <span className="text-[11px] font-semibold tabular-nums">
                    {night.rooms_booked} of {night.rooms_total}
                </span>
            )}
        </>
    );

    const className = `flex min-h-[56px] flex-col gap-0.5 overflow-hidden rounded-lg border p-1.5 text-left sm:min-h-[68px] ${styles} ${
        isPast ? "opacity-60" : ""
    } ${isToday ? "ring-2 ring-[#028090] ring-inset" : ""}`;

    if (!interactive) {
        return (
            <div
                role="img"
                aria-label={`${label}: ${STATE_WORDS[night.state]}`}
                className={className}
            >
                {content}
            </div>
        );
    }

    return (
        <button
            type="button"
            data-day={format(day, "yyyy-MM-dd")}
            aria-label={`${label}: ${STATE_WORDS[night.state]}${
                booking ? `, ${booking.guest_name}` : ""
            }`}
            onClick={() => onSelect({ night, unit, booking })}
            className={`${className} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#028090]`}
        >
            {content}
        </button>
    );
}

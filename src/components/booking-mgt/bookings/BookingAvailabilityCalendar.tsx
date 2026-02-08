'use client'

import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths, isSameDay, startOfWeek, endOfWeek, isBefore, startOfToday, isWithinInterval } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from "lucide-react";
import toast from "react-hot-toast";
import { Drawer } from "@mui/material";

interface BookingAvailabilityCalendarProps {
    checkInDate: Date | null;
    checkOutDate: Date | null;
    onCheckInDateSelect: (date: Date | null) => void;
    onCheckOutDateSelect: (date: Date | null) => void;
    blockedDates?: { date: string }[];
    isMobileView?: boolean;
    className?: string;
}

export default function BookingAvailabilityCalendar({
    checkInDate,
    checkOutDate,
    onCheckInDateSelect,
    onCheckOutDateSelect,
    blockedDates = [],
    isMobileView = false,
    className = ""
}: BookingAvailabilityCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [showCalendar, setShowCalendar] = useState(false);
    const today = startOfToday();

    // Convert blocked dates to string set for faster lookup
    const blockedDateSet = useMemo(() => {
        return new Set(blockedDates.map(d => format(new Date(d.date), 'yyyy-MM-dd')));
    }, [blockedDates]);

    // Generate calendar days
    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const calendarStart = startOfWeek(monthStart);
        const calendarEnd = endOfWeek(monthEnd);

        return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    }, [currentMonth]);

    const isDateDisabled = (date: Date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        // Disable past dates
        if (isBefore(date, today)) return true;

        // Disable explicitly blocked dates
        if (blockedDateSet.has(dateStr)) return true;

        return false;
    };

    const handleDateClick = (date: Date) => {
        if (isDateDisabled(date)) return;

        if (!checkInDate || (checkInDate && checkOutDate)) {
            // Start new selection
            onCheckInDateSelect(date);
            onCheckOutDateSelect(null);
        } else {
            // Complete selection
            if (isBefore(date, checkInDate)) {
                // If clicked date is before check-in, treat as new check-in
                onCheckInDateSelect(date);
                onCheckOutDateSelect(null);
            } else {
                // Validate range availability
                const daysInterval = eachDayOfInterval({ start: checkInDate, end: date });
                const isRangeAvailable = daysInterval.every(d => !isDateDisabled(d));

                if (!isRangeAvailable) {
                    toast.error("Some dates in this range are unavailable");
                    return;
                }

                onCheckOutDateSelect(date);
                if (isMobileView) setShowCalendar(false); // Close drawer on selection complete
            }
        }
    };

    // Navigate months
    const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    const renderCalendarContent = () => (
        <div className={`w-full bg-white rounded-xl border border-zinc-200 p-6 shadow-sm ${className} ${isMobileView ? 'border-none shadow-none' : ''}`}>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex flex-col">
                    <span className="text-sm font-semibold text-zinc-900">Select Dates</span>
                    <span className="text-xs text-zinc-500">
                        {checkInDate && checkOutDate
                            ? `${format(checkInDate, 'MMM d')} - ${format(checkOutDate, 'MMM d, yyyy')}`
                            : checkInDate
                                ? `${format(checkInDate, 'MMM d')} - Select Check-out`
                                : 'Select Check-in'}
                    </span>
                </div>
                {/* Mobile Close Button */}
                {isMobileView && (
                    <button onClick={() => setShowCalendar(false)} className="p-2 -mr-2 text-zinc-400">
                        <X size={20} />
                    </button>
                )}

                {!isMobileView && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={previousMonth}
                            disabled={isBefore(subMonths(currentMonth, 0), startOfMonth(today))} // Prevent going back too far if needed
                            className="p-2 hover:bg-zinc-100 rounded-lg transition disabled:opacity-30 disabled:hover:bg-transparent"
                            type="button"
                        >
                            <ChevronLeft className="w-5 h-5 text-zinc-600" />
                        </button>
                        <span className="text-sm font-semibold min-w-[100px] text-center text-zinc-700">
                            {format(currentMonth, 'MMMM yyyy')}
                        </span>
                        <button
                            onClick={nextMonth}
                            className="p-2 hover:bg-zinc-100 rounded-lg transition"
                            type="button"
                        >
                            <ChevronRight className="w-5 h-5 text-zinc-600" />
                        </button>
                    </div>
                )}
            </div>

            {/* Mobile Month Navigation (Centered) */}
            {isMobileView && (
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={previousMonth}
                        disabled={isBefore(subMonths(currentMonth, 0), startOfMonth(today))}
                        className="p-2 hover:bg-zinc-100 rounded-lg transition disabled:opacity-30"
                        type="button"
                    >
                        <ChevronLeft className="w-5 h-5 text-zinc-600" />
                    </button>
                    <span className="text-sm font-semibold text-zinc-900">
                        {format(currentMonth, 'MMMM yyyy')}
                    </span>
                    <button
                        onClick={nextMonth}
                        className="p-2 hover:bg-zinc-100 rounded-lg transition"
                        type="button"
                    >
                        <ChevronRight className="w-5 h-5 text-zinc-600" />
                    </button>
                </div>
            )}

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs font-medium text-zinc-400 py-2 uppercase tracking-wide">
                        {day}
                    </div>
                ))}

                {/* Calendar days */}
                {calendarDays.map((day, idx) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isDisabled = isDateDisabled(day);
                    const isToday = isSameDay(day, today);

                    const isCheckIn = checkInDate && isSameDay(day, checkInDate);
                    const isCheckOut = checkOutDate && isSameDay(day, checkOutDate);
                    const isInRange = checkInDate && checkOutDate && isWithinInterval(day, { start: checkInDate, end: checkOutDate });
                    const isSelectionStart = isCheckIn;
                    const isSelectionEnd = isCheckOut;

                    return (
                        <button
                            key={idx}
                            onClick={() => isCurrentMonth && handleDateClick(day)}
                            disabled={!isCurrentMonth || isDisabled}
                            type="button"
                            className={`
                                relative aspect-square p-1 rounded-lg transition-all flex items-center justify-center text-sm font-medium
                                ${!isCurrentMonth ? 'invisible' : ''}
                                ${isDisabled && isCurrentMonth ? 'text-zinc-300 cursor-not-allowed bg-zinc-50' : ''}
                                ${!isDisabled && isCurrentMonth ? 'hover:bg-primary/10 hover:text-primary cursor-pointer text-zinc-700' : ''}
                                ${isInRange && !isSelectionStart && !isSelectionEnd ? 'bg-primary/10 text-primary rounded-none' : ''}
                                ${isSelectionStart ? 'bg-primary text-white hover:bg-primary hover:text-white rounded-r-none' : ''}
                                ${isSelectionEnd ? 'bg-primary text-white hover:bg-primary hover:text-white rounded-l-none' : ''}
                                ${isSelectionStart && isSelectionEnd ? 'rounded-lg' : ''} 
                            `}
                        >
                            <span className={`relative z-10 ${isToday && !isInRange && !isCheckIn ? 'text-primary font-bold' : ''}`}>
                                {format(day, 'd')}
                            </span>
                            {isToday && !isInRange && !isCheckIn && (
                                <div className="absolute bottom-1.5 w-1 h-1 bg-primary rounded-full"></div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Legend/Info */}
            <div className="mt-4 pt-4 border-t border-zinc-100 flex gap-4 text-xs text-zinc-500">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-white border border-zinc-300 rounded"></div>
                    <span>Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-zinc-100 text-zinc-300 rounded flex items-center justify-center text-[8px]">×</div>
                    <span>Unavailable</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-primary rounded"></div>
                    <span>Selected</span>
                </div>
            </div>
        </div>
    );

    if (isMobileView) {
        return (
            <>
                <div className="flex gap-3">
                    <div onClick={() => setShowCalendar(true)} className="flex-1 bg-white border border-zinc-300 rounded-lg p-3 flex items-center gap-3 cursor-pointer hover:border-primary transition-colors h-14">
                        <CalendarIcon className="w-5 h-5 text-zinc-400" />
                        <div className="flex flex-col">
                            <span className="text-[10px] text-zinc-500 uppercase font-medium tracking-wide">Check-in</span>
                            <span className={`text-sm font-medium ${checkInDate ? 'text-zinc-900' : 'text-zinc-400'}`}>
                                {checkInDate ? format(checkInDate, 'MMM d, yyyy') : 'Select Date'}
                            </span>
                        </div>
                    </div>
                    <div onClick={() => setShowCalendar(true)} className="flex-1 bg-white border border-zinc-300 rounded-lg p-3 flex items-center gap-3 cursor-pointer hover:border-primary transition-colors h-14">
                        <CalendarIcon className="w-5 h-5 text-zinc-400" />
                        <div className="flex flex-col">
                            <span className="text-[10px] text-zinc-500 uppercase font-medium tracking-wide">Check-out</span>
                            <span className={`text-sm font-medium ${checkOutDate ? 'text-zinc-900' : 'text-zinc-400'}`}>
                                {checkOutDate ? format(checkOutDate, 'MMM d, yyyy') : 'Select Date'}
                            </span>
                        </div>
                    </div>
                </div>

                <Drawer
                    anchor="bottom"
                    open={showCalendar}
                    onClose={() => setShowCalendar(false)}
                    PaperProps={{
                        sx: {
                            borderTopLeftRadius: 16,
                            borderTopRightRadius: 16,
                            maxHeight: '85vh',
                            padding: 0
                        }
                    }}
                >
                    {renderCalendarContent()}
                </Drawer>
            </>
        )
    }

    return renderCalendarContent();
}

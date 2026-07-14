'use client'

import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths, isSameDay, startOfWeek, endOfWeek, isBefore, startOfDay } from "date-fns";
import { IAvailability, ICreateAvailability } from "../types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

interface AvailabilityCalendarProps {
    propertyId: string | number;
    unitId: string | number;
    availability: IAvailability[];
    externalBookings?: any[];
    onSave: (dates: ICreateAvailability[]) => void;
    isSaving?: boolean;
    defaultCount?: number;
    hideHeader?: boolean;
    minimal?: boolean;
}

export default function AvailabilityCalendar({
    availability,
    externalBookings = [],
    onSave,
    isSaving = false,
    defaultCount = 1,
    hideHeader = false,
    minimal = false
}: AvailabilityCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDates, setSelectedDates] = useState<Map<string, ICreateAvailability>>(new Map());
    const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

    // Get today's date at start of day for comparison
    const today = startOfDay(new Date());

    // Generate calendar days
    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const calendarStart = startOfWeek(monthStart);
        const calendarEnd = endOfWeek(monthEnd);

        return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    }, [currentMonth]);

    // Get availability for a specific date
    const getAvailabilityForDate = (date: Date): IAvailability | undefined => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return availability.find(a => a.date === dateStr);
    };

    // Get pending changes for a date
    const getPendingChange = (date: Date): ICreateAvailability | undefined => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return selectedDates.get(dateStr);
    };

    // Check if date is available for booking
    const isDateAvailable = (date: Date): boolean => {
        const avail = getAvailabilityForDate(date);
        return avail ? !avail.is_blackout && avail.count > 0 : true;
    };

    // Check if date is in the past (before today)
    const isPastDate = (date: Date): boolean => {
        return isBefore(startOfDay(date), today);
    };

    // Check if date is selectable
    const isDateSelectable = (date: Date): boolean => {
        if (!isSameMonth(date, currentMonth)) return false;
        if (isPastDate(date)) return false;
        
        const avail = getAvailabilityForDate(date);
        if (avail?.is_blackout) return false;
        if (avail && avail.count === 0) return false;
        
        return true;
    };

    // Toggle date selection
    const toggleDate = (date: Date) => {
        if (!isDateSelectable(date)) return;

        const dateStr = format(date, 'yyyy-MM-dd');
        const newSelected = new Map(selectedDates);

        if (newSelected.has(dateStr)) {
            newSelected.delete(dateStr);
        } else {
            const existing = getAvailabilityForDate(date);
            newSelected.set(dateStr, {
                date: dateStr,
                count: existing?.count ?? defaultCount,
                is_blackout: existing?.is_blackout ?? false,
                pricing: existing?.pricing ?? undefined
            });
        }

        setSelectedDates(newSelected);
    };

    // Update selected dates
    const updateSelectedDates = (field: keyof ICreateAvailability, value: any) => {
        if (selectedDates.size === 0) {
            toast.error("Please select dates first");
            return;
        }

        const newSelected = new Map(selectedDates);
        newSelected.forEach((avail, key) => {
            newSelected.set(key, { ...avail, [field]: value });
        });
        setSelectedDates(newSelected);
    };

    // Handle save
    const handleSave = () => {
        if (selectedDates.size === 0) {
            toast.error("No dates selected");
            return;
        }

        const datesToSave = Array.from(selectedDates.values());
        onSave(datesToSave);
        setSelectedDates(new Map());
    };

    // Navigate months
    const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    // Get tooltip content for hover
    const getTooltipContent = (date: Date): string => {
        if (isPastDate(date)) {
            return 'Past date - Cannot be modified';
        }

        const avail = getAvailabilityForDate(date);
        const pending = getPendingChange(date);
        
        if (pending) {
            return pending.is_blackout ? 'Marked as blackout (pending)' : `${pending.count} units available (pending)`;
        }
        
        if (avail) {
            if (avail.is_blackout) {
                return 'Blackout date - Not available for booking';
            }
            return avail.count > 0 
                ? `${avail.count} unit${avail.count > 1 ? 's' : ''} available` 
                : 'Fully booked - Cannot be selected';
        }
        
        return `${defaultCount} unit${defaultCount > 1 ? 's' : ''} available (default)`;
    };

    // Get disabled reason for styling/tooltip
    const getDisabledReason = (date: Date): string | null => {
        if (!isSameMonth(date, currentMonth)) return 'Outside current month';
        if (isPastDate(date)) return 'Past date';
        
        const avail = getAvailabilityForDate(date);
        if (avail?.is_blackout) return 'Blackout date';
        if (avail && avail.count === 0) return 'Fully booked';
        
        return null;
    };

    return (
        <div className={`w-full ${minimal ? 'bg-transparent p-0 border-none' : 'bg-white rounded-lg border border-zinc-200 p-4 sm:p-6'}`}>
            {/* Header */}
            <div className={`flex justify-between items-center mb-4 sm:mb-6 ${hideHeader ? 'justify-center' : ''}`}>
                <div className="flex items-center gap-2 sm:gap-4">
                    <button
                        onClick={previousMonth}
                        className="p-1.5 sm:p-2 hover:bg-zinc-100 rounded-lg transition touch-manipulation disabled:opacity-30 disabled:cursor-not-allowed"
                        aria-label="Previous month"
                        disabled={isBefore(startOfMonth(subMonths(new Date(), 1)), startOfMonth(today))}
                    >
                        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <span className="text-xs sm:text-sm font-semibold min-w-[100px] sm:min-w-[120px] text-center uppercase tracking-tight text-zinc-600">
                        {format(currentMonth, 'MMMM yyyy')}
                    </span>
                    <button
                        onClick={nextMonth}
                        className="p-1.5 sm:p-2 hover:bg-zinc-100 rounded-lg transition touch-manipulation"
                        aria-label="Next month"
                    >
                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-4 sm:mb-6">
                {/* Day headers */}
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                    <div key={index} className="text-center text-xs sm:text-sm font-medium text-zinc-600 py-1 sm:py-2">
                        <span className="hidden sm:inline">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index]}</span>
                        <span className="sm:hidden">{day}</span>
                    </div>
                ))}

                {/* Calendar days */}
                {calendarDays.map((day, idx) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const avail = getAvailabilityForDate(day);
                    const pending = getPendingChange(day);
                    const isSelected = selectedDates.has(dateStr);
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isToday = isSameDay(day, new Date());
                    const isAvailable = isDateAvailable(day);
                    const isHovered = hoveredDate && isSameDay(day, hoveredDate);
                    const selectable = isDateSelectable(day);
                    const disabledReason = getDisabledReason(day);

                    // Determine border color based on availability
                    const getBorderClass = () => {
                        if (!isCurrentMonth) return 'border-zinc-200 opacity-40';
                        if (!selectable) return 'border-zinc-200';
                        if (isSelected) return 'border-primary';
                        if (avail?.is_blackout) return 'border-red-300';
                        if (isAvailable) return 'border-green-300 hover:border-green-500';
                        return 'border-zinc-200';
                    };

                    // Determine background color
                    const getBackgroundClass = () => {
                        if (!isCurrentMonth) return 'bg-zinc-50';
                        if (!selectable) return 'bg-zinc-50 cursor-not-allowed opacity-60';
                        if (avail?.is_blackout) return 'bg-red-50';
                        if (isSelected) return 'bg-primary/5';
                        if (isAvailable) return 'hover:bg-green-50';
                        return '';
                    };

                    // Determine cursor style
                    const getCursorClass = () => {
                        return selectable ? 'cursor-pointer hover:shadow-md' : 'cursor-not-allowed';
                    };

                    return (
                        <div
                            key={idx}
                            className="relative"
                            onMouseEnter={() => setHoveredDate(day)}
                            onMouseLeave={() => setHoveredDate(null)}
                        >
                            <button
                                onClick={() => toggleDate(day)}
                                disabled={!selectable}
                                className={`
                                    relative w-full aspect-square p-1 sm:p-2 rounded-lg border transition-all duration-200
                                    ${getCursorClass()}
                                    ${getBorderClass()}
                                    ${getBackgroundClass()}
                                    ${isToday && selectable ? 'ring-2 ring-primary/30' : ''}
                                    ${isToday && !selectable ? 'ring-2 ring-zinc-300' : ''}
                                `}
                                aria-label={`${format(day, 'MMMM d, yyyy')} - ${getTooltipContent(day)}`}
                                aria-disabled={!selectable}
                            >
                                {/* Date number */}
                                <div className={`
                                    text-xs sm:text-sm font-medium
                                    ${!isCurrentMonth ? 'text-zinc-400' : selectable ? 'text-zinc-800' : 'text-zinc-400'}
                                    ${avail?.is_blackout ? 'text-red-600' : ''}
                                `}>
                                    {format(day, 'd')}
                                </div>
                                
                                {/* Availability indicator number */}
                                {isCurrentMonth && !avail?.is_blackout && selectable && (
                                    <div className="absolute top-[1px] right-[4px] text-[9px] sm:text-[8px] font-medium text-[#124452]">
                                        {avail?.count ?? defaultCount}
                                    </div>
                                )}

                                {/* Blackout indicator */}
                                {avail?.is_blackout && (
                                    <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 text-[10px] sm:text-xs">
                                        🚫
                                    </div>
                                )}

                                {/* Pending changes indicator */}
                                {pending && selectable && (
                                    <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1">
                                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full animate-pulse"></div>
                                    </div>
                                )}
                            </button>

                            {/* Hover tooltip */}
                            {isHovered && isCurrentMonth && (
                                <div className="absolute z-[9999] bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 sm:px-3 sm:py-2 bg-zinc-800 text-white text-[10px] sm:text-xs rounded-lg shadow-xl whitespace-nowrap pointer-events-none border border-zinc-700">
                                    {getTooltipContent(day)}
                                    {disabledReason && (
                                        <span className="block text-[8px] sm:text-[10px] text-zinc-400 mt-0.5">
                                            ⚠️ {disabledReason}
                                        </span>
                                    )}
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-zinc-800"></div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Controls */}
            {selectedDates.size > 0 && (
                <div className="border-t border-zinc-200 pt-4 sm:pt-6 space-y-3 sm:space-y-4">
                    <p className="text-xs sm:text-sm text-zinc-600">
                        {selectedDates.size} date{selectedDates.size > 1 ? 's' : ''} selected
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-zinc-700 mb-1 sm:mb-2">
                                Available Count
                            </label>
                            <input
                                type="number"
                                min="0"
                                defaultValue={defaultCount}
                                onChange={(e) => updateSelectedDates('count', parseInt(e.target.value))}
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>

                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-zinc-700 mb-1 sm:mb-2">
                                Custom Price (optional)
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Leave empty"
                                onChange={(e) => updateSelectedDates('pricing', e.target.value ? parseFloat(e.target.value) : undefined)}
                                className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-sm border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>

                        <div className="flex items-end">
                            <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    onChange={(e) => updateSelectedDates('is_blackout', e.target.checked)}
                                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary border-zinc-300 rounded focus:ring-primary"
                                />
                                <span className="text-xs sm:text-sm font-medium text-zinc-700">Blackout Date</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                        <button
                            onClick={() => setSelectedDates(new Map())}
                            disabled={isSaving}
                            className="px-3 sm:px-4 py-1.5 sm:py-2 border border-zinc-300 rounded-lg text-xs sm:text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 touch-manipulation"
                        >
                            Clear Selection
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-primary text-white rounded-lg text-xs sm:text-sm hover:bg-primary/90 disabled:opacity-50 touch-manipulation"
                        >
                            {isSaving ? 'Saving...' : 'Save Availability'}
                        </button>
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-zinc-200 flex flex-wrap gap-3 sm:gap-6 text-[10px] sm:text-sm text-zinc-600">
                <div className="flex items-center gap-1 sm:gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-primary bg-primary/5 rounded"></div>
                    <span>Selected</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-50 border border-red-300 rounded"></div>
                    <span>Blackout</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-green-300 rounded"></div>
                    <span>Available</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-zinc-50 border border-zinc-200 rounded"></div>
                    <span>Unavailable/Past</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 ring-2 ring-primary/30 rounded"></div>
                    <span>Today</span>
                </div>
            </div>
        </div>
    );
}
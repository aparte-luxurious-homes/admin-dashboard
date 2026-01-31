'use client'

import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths, isSameDay, startOfWeek, endOfWeek } from "date-fns";
import { IAvailability, ICreateAvailability } from "../types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

interface AvailabilityCalendarProps {
    propertyId: string | number;
    unitId: string | number;
    availability: IAvailability[];
    onSave: (dates: ICreateAvailability[]) => void;
    isSaving?: boolean;
    defaultCount?: number;
    hideHeader?: boolean;
    minimal?: boolean;
}

export default function AvailabilityCalendar({
    availability,
    onSave,
    isSaving = false,
    defaultCount = 1,
    hideHeader = false,
    minimal = false
}: AvailabilityCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDates, setSelectedDates] = useState<Map<string, ICreateAvailability>>(new Map());

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

    // Toggle date selection
    const toggleDate = (date: Date) => {
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

    return (
        <div className={`w-full ${minimal ? 'bg-transparent p-0 border-none' : 'bg-white rounded-lg border border-zinc-200 p-6'}`}>
            {/* Header */}
            <div className={`flex justify-between items-center mb-6 ${hideHeader ? 'justify-center' : ''}`}>
                {/* {!hideHeader && <h3 className="text-xl font-semibold text-zinc-800">Manage Availability</h3>} */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={previousMonth}
                        className="p-2 hover:bg-zinc-100 rounded-lg transition"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-semibold min-w-[120px] text-center uppercase tracking-tight text-zinc-600">
                        {format(currentMonth, 'MMMM yyyy')}
                    </span>
                    <button
                        onClick={nextMonth}
                        className="p-2 hover:bg-zinc-100 rounded-lg transition"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 mb-6">
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-sm font-medium text-zinc-600 py-2">
                        {day}
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

                    return (
                        <button
                            key={idx}
                            onClick={() => isCurrentMonth && toggleDate(day)}
                            disabled={!isCurrentMonth}
                            className={`
                                relative aspect-square p-2 rounded-lg border transition-all
                                ${!isCurrentMonth ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                                ${isSelected ? 'border-primary bg-primary/10' : 'border-zinc-200 hover:border-primary/50'}
                                ${isToday ? 'ring-2 ring-primary/30' : ''}
                                ${avail?.is_blackout ? 'bg-red-50 border-red-300' : ''}
                            `}
                        >
                            <div className="text-sm font-medium text-zinc-800">
                                {format(day, 'd')}
                            </div>
                            {isCurrentMonth && avail && (
                                <div className="text-xs text-zinc-500 mt-1">
                                    {avail.is_blackout ? '🚫' : `${avail.count} avail`}
                                </div>
                            )}
                            {pending && (
                                <div className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Controls */}
            {selectedDates.size > 0 && (
                <div className="border-t border-zinc-200 pt-6 space-y-4">
                    <p className="text-sm text-zinc-600">
                        {selectedDates.size} date{selectedDates.size > 1 ? 's' : ''} selected
                    </p>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-2">
                                Available Count
                            </label>
                            <input
                                type="number"
                                min="0"
                                defaultValue={defaultCount}
                                onChange={(e) => updateSelectedDates('count', parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-2">
                                Custom Price (optional)
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Leave empty for default"
                                onChange={(e) => updateSelectedDates('pricing', e.target.value ? parseFloat(e.target.value) : undefined)}
                                className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>

                        <div className="flex items-end">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    onChange={(e) => updateSelectedDates('is_blackout', e.target.checked)}
                                    className="w-4 h-4 text-primary border-zinc-300 rounded focus:ring-primary"
                                />
                                <span className="text-sm font-medium text-zinc-700">Blackout Date</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setSelectedDates(new Map())}
                            disabled={isSaving}
                            className="px-4 py-2 border border-zinc-300 rounded-lg text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                        >
                            Clear Selection
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                        >
                            {isSaving ? 'Saving...' : 'Save Availability'}
                        </button>
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="mt-6 pt-6 border-t border-zinc-200 flex gap-6 text-sm text-zinc-600">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary bg-primary/10 rounded"></div>
                    <span>Selected</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-50 border border-red-300 rounded"></div>
                    <span>Blackout</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 ring-2 ring-primary/30 rounded"></div>
                    <span>Today</span>
                </div>
            </div>
        </div>
    );
}

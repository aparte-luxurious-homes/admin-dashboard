"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { GetUpcomingBookings } from "@/src/lib/request-handlers/dashboardMgt";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";

const formatDayMonth = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return iso;
  }
};

const daysUntil = (iso: string): number => {
  try {
    const target = new Date(iso);
    target.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round(
      (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
  } catch {
    return 0;
  }
};

const UpcomingCheckInsCard = () => {
  const { data, isLoading } = GetUpcomingBookings({ limit: 5, days_ahead: 30 });
  const items = data?.items ?? [];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden h-full">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <Icon
            icon="solar:calendar-bold-duotone"
            className="w-5 h-5 text-primary"
          />
          Upcoming Check-Ins
        </h3>
        <Link
          href={`${PAGE_ROUTES.dashboard.bookingManagement.bookings.base}?status=CONFIRMED`}
          className="text-xs font-medium text-primary hover:underline"
        >
          View all →
        </Link>
      </div>
      {isLoading ? (
        <div className="p-4 space-y-2">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      ) : items.length === 0 ? (
        <div className="px-5 py-10 flex flex-col items-center justify-center text-center gap-2">
          <Icon
            icon="solar:calendar-mark-line-duotone"
            className="w-10 h-10 text-gray-300"
          />
          <p className="text-sm text-gray-500">
            No bookings in the next 30 days
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {items.map((b) => {
            const days = daysUntil(b.start_date);
            const dayLabel =
              days === 0
                ? "Today"
                : days === 1
                  ? "Tomorrow"
                  : days < 0
                    ? "Past"
                    : `In ${days}d`;
            return (
              <li key={b.id}>
                <Link
                  href={PAGE_ROUTES.dashboard.bookingManagement.bookings.details(
                    b.id,
                  )}
                  className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 text-center shrink-0">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        {dayLabel}
                      </div>
                      <div className="text-sm font-medium text-gray-700">
                        {formatDayMonth(b.start_date)}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">
                        {b.property_name || b.unit_name || "Property"}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {b.guest_first_name || "Guest"}
                        {b.unit_count > 1 ? ` · ${b.unit_count} units` : ""}
                        {" · "}
                        <span className="font-mono">{b.booking_id}</span>
                      </div>
                    </div>
                  </div>
                  <Icon
                    icon="mdi:chevron-right"
                    className="w-4 h-4 text-gray-300"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default UpcomingCheckInsCard;

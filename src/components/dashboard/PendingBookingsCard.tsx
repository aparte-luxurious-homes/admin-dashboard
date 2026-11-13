"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  GetPendingBookings,
  PendingBucket,
  PendingBookingRow,
} from "@/src/lib/request-handlers/dashboardMgt";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";

const naira = (value: string | number) =>
  `₦${Number(value || 0).toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;

function ago(iso: string | null): string {
  if (!iso) return "";
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

// What each bucket means to the person reading the card, in the order the
// API returns them: the money problem first, the noise last.
const BUCKETS: Record<
  PendingBucket,
  { label: string; tone: string; sub: (count: number, value: string) => string }
> = {
  PAID_NOT_CONFIRMED: {
    label: "Paid, not confirmed",
    tone: "bg-red-50 text-red-700 border-red-100",
    sub: (_, value) => `${naira(value)} · reconcile`,
  },
  APPROVAL_OVERDUE: {
    label: "Request overdue",
    tone: "bg-amber-50 text-amber-700 border-amber-100",
    sub: () => "over 24 h unanswered",
  },
  ABANDONED: {
    label: "Abandoned",
    tone: "bg-gray-50 text-gray-600 border-gray-100",
    sub: () => "dates already released",
  },
  IN_PROGRESS: {
    label: "In progress",
    tone: "bg-sky-50 text-sky-700 border-sky-100",
    sub: () => "checkout or request open",
  },
};

const AttentionRow = ({ row }: { row: PendingBookingRow }) => {
  const paid = row.bucket === "PAID_NOT_CONFIRMED";
  return (
    <Link
      href={PAGE_ROUTES.dashboard.bookingManagement.bookings.details(row.id)}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors"
    >
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
          paid ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
        }`}
      >
        <Icon
          icon={paid ? "solar:wad-of-money-linear" : "solar:hourglass-linear"}
          className="w-4 h-4"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-gray-800 truncate">
          {row.guest_name || "Guest"} · <span className="tabular-nums">{row.booking_id}</span>
        </div>
        <div className="text-xs text-gray-500 truncate">
          {paid ? "Paid, not confirmed" : "Request not answered"}
          {row.property_name ? ` · ${row.property_name}` : ""} · {ago(row.created_at)}
        </div>
      </div>
      <div className="hidden sm:block text-sm font-semibold text-gray-800 tabular-nums">
        {naira(row.value_payable)}
      </div>
      <span
        className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-medium ${
          paid ? "bg-primary text-white" : "border border-gray-200 text-gray-700"
        }`}
      >
        {paid ? "Reconcile" : "Review"}
      </span>
    </Link>
  );
};

/**
 * Bookings that are not settled, for every staff role. The first bucket is
 * the one that costs money: a guest has paid and the booking never confirmed.
 */
const PendingBookingsCard = () => {
  const { data, isLoading, isError } = GetPendingBookings();
  const held = data?.held_for_stays;

  return (
    <section className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <Icon icon="solar:calendar-mark-bold-duotone" className="w-5 h-5 text-primary" />
          Pending Bookings
          {data && (
            <span className="font-medium text-gray-400 tabular-nums">· {data.total_pending}</span>
          )}
        </h3>
        <Link
          href={`${PAGE_ROUTES.dashboard.bookingManagement.bookings.base}?status=PENDING`}
          className="px-2.5 py-1 rounded-md border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          View all
        </Link>
      </div>

      {isLoading ? (
        <div className="p-4 space-y-2">
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      ) : isError || !data ? (
        <div className="p-5 text-sm text-gray-500">Could not load pending bookings.</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-4">
            {data.buckets.map((b) => {
              const meta = BUCKETS[b.bucket];
              if (!meta) return null;
              return (
                <div key={b.bucket} className={`rounded-xl border px-3 py-2.5 ${meta.tone}`}>
                  <div className="text-xl font-bold tabular-nums">{b.count}</div>
                  <div className="text-xs font-medium">{meta.label}</div>
                  <div className="text-[11px] opacity-80 truncate">{meta.sub(b.count, b.value_payable)}</div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-gray-100">
            <div className="px-4 pt-3 pb-1 text-[10px] font-medium uppercase tracking-wider text-gray-400">
              Needs someone
            </div>
            {data.attention.length === 0 ? (
              <div className="px-4 pb-3 text-sm text-gray-400">
                Nothing paid and stuck, and no request left unanswered.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {data.attention.map((row) => (
                  <AttentionRow key={row.id} row={row} />
                ))}
              </div>
            )}
          </div>

          {held && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-600">
              <span>Held for stays not yet checked in:</span>
              <span>
                <b className="text-gray-800 tabular-nums">{naira(held.owner_escrow_held)}</b> owner share
              </span>
              <span>
                <b className="text-gray-800 tabular-nums">{naira(held.caution_held)}</b> caution fees
              </span>
              {held.checkin_overdue > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                  <Icon icon="solar:danger-triangle-linear" className="w-3.5 h-3.5" />
                  {held.checkin_overdue} check-in{held.checkin_overdue === 1 ? "" : "s"} overdue
                </span>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default PendingBookingsCard;

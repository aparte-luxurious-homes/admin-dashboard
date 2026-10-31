"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  GetAdminQueues,
  QueueSummary,
} from "@/src/lib/request-handlers/dashboardMgt";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import { useAuth } from "@/src/hooks/useAuth";
import {
  canViewEmailHealth,
  GetEmailHealthSummary,
} from "@/src/lib/request-handlers/emailHealthMgt";
import { GetAdjustmentRequests } from "@/src/lib/request-handlers/financeMgt";

const DAY_MS = 24 * 60 * 60 * 1000;

interface QueueRowProps {
  icon: string;
  label: string;
  href: string;
  summary: QueueSummary | undefined;
  accentColor: string; // tailwind classes like "text-amber-600 bg-amber-50"
}

const QueueRow = ({
  icon,
  label,
  href,
  summary,
  accentColor,
}: QueueRowProps) => {
  const count = summary?.count ?? 0;
  const oldest = summary?.oldest_age_days ?? 0;
  const isStale = oldest >= 7;
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${accentColor}`}
        >
          <Icon icon={icon} className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-800 truncate">
            {label}
          </div>
          {count > 0 ? (
            <div
              className={`text-xs ${isStale ? "text-red-600 font-medium" : "text-gray-500"}`}
            >
              oldest {oldest} day{oldest === 1 ? "" : "s"} ago
              {isStale && " · backlog"}
            </div>
          ) : (
            <div className="text-xs text-gray-400">Up to date</div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`text-2xl font-bold ${
            count === 0
              ? "text-gray-300"
              : isStale
                ? "text-red-600"
                : "text-gray-800"
          }`}
        >
          {count}
        </span>
        <Icon
          icon="mdi:chevron-right"
          className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors"
        />
      </div>
    </Link>
  );
};

/**
 * Undeliverable email addresses. Hidden unless the summary actually loads:
 * a 403 (no users.view_email_health) or 404 (API not deployed yet) means
 * the tile has nothing to say, not that the dashboard is broken.
 */
const UndeliverableEmailsRow = () => {
  const { user } = useAuth();
  const allowed = canViewEmailHealth(user?.role);
  const { data, isError } = GetEmailHealthSummary(allowed);
  if (!allowed || isError || !data) return null;

  const { undeliverable, bouncing } = data;
  return (
    <Link
      href={PAGE_ROUTES.dashboard.userManagement.emailDelivery.base}
      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-rose-600 bg-rose-50">
          <Icon icon="solar:letter-unread-bold-duotone" className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-800 truncate">
            Undeliverable emails
          </div>
          {undeliverable > 0 || bouncing > 0 ? (
            <div className="text-xs text-gray-500">
              {bouncing > 0
                ? `${bouncing} more bouncing`
                : "Fix the address to resend"}
            </div>
          ) : (
            <div className="text-xs text-gray-400">Up to date</div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`text-2xl font-bold ${
            undeliverable === 0 ? "text-gray-300" : "text-red-600"
          }`}
        >
          {undeliverable}
        </span>
        <Icon
          icon="mdi:chevron-right"
          className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors"
        />
      </div>
    </Link>
  );
};

const AdminQueuesCard = () => {
  const { data, isLoading } = GetAdminQueues();
  // One row is enough: the response carries the whole queue's size and age,
  // and `can_approve` says whether this admin decides adjustments at all.
  const { data: adjustments } = GetAdjustmentRequests({ status: "PENDING", size: 1 });
  const adjustmentQueue: QueueSummary | undefined = adjustments?.can_approve
    ? {
        count: adjustments.pending_total ?? 0,
        oldest_age_days: adjustments.oldest_pending_at
          ? Math.floor((Date.now() - new Date(adjustments.oldest_pending_at).getTime()) / DAY_MS)
          : 0,
      }
    : undefined;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <Icon
            icon="solar:checklist-minimalistic-bold-duotone"
            className="w-5 h-5 text-primary"
          />
          Action Queues
        </h3>
        <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
          Triage
        </span>
      </div>
      {isLoading ? (
        <div className="p-4 space-y-2">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {adjustmentQueue && (
            <QueueRow
              icon="solar:wallet-money-bold-duotone"
              label="Wallet adjustments to approve"
              href={PAGE_ROUTES.dashboard.walletAdjustments.base}
              summary={adjustmentQueue}
              accentColor="text-amber-600 bg-amber-50"
            />
          )}
          <QueueRow
            icon="solar:document-add-bold-duotone"
            label="KYC Reviews Pending"
            href={PAGE_ROUTES.dashboard.userManagement.kycQueue.base}
            summary={data?.kyc_pending}
            accentColor="text-blue-600 bg-blue-50"
          />
          <QueueRow
            icon="solar:shield-check-bold-duotone"
            label="Property Verifications"
            href={
              PAGE_ROUTES.dashboard.propertyManagement.manageVerifications.base
            }
            summary={data?.verifications_pending}
            accentColor="text-purple-600 bg-purple-50"
          />
          <QueueRow
            icon="solar:danger-triangle-bold-duotone"
            label="Open Disputes"
            href={PAGE_ROUTES.dashboard.bookingManagement.bookingDisputes.base}
            summary={data?.open_disputes}
            accentColor="text-red-600 bg-red-50"
          />
          <QueueRow
            icon="solar:bell-bing-bold-duotone"
            label="Booking Requests"
            href={PAGE_ROUTES.dashboard.bookingManagement.bookingRequests.base}
            summary={data?.booking_requests}
            accentColor="text-amber-600 bg-amber-50"
          />
          <UndeliverableEmailsRow />
        </div>
      )}
    </div>
  );
};

export default AdminQueuesCard;

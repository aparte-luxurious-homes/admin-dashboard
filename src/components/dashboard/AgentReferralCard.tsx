"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
  useAgentReferralStats,
  useMyReferralInfo,
} from "@/src/hooks/useReferrals";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";

const AgentReferralCard = () => {
  const { data: stats, isLoading: statsLoading } = useAgentReferralStats();
  const { data: info, isLoading: infoLoading } = useMyReferralInfo();
  const isLoading = statsLoading || infoLoading;

  const copy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text).then(
      () => toast.success(`${label} copied`),
      () => toast.error(`Could not copy ${label.toLowerCase()}`),
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <Icon
            icon="solar:gift-bold-duotone"
            className="w-5 h-5 text-primary"
          />
          My Referrals
        </h3>
        <Link
          href={PAGE_ROUTES.dashboard.referrals.agentStats}
          className="text-xs font-medium text-primary hover:underline"
        >
          View all →
        </Link>
      </div>
      {isLoading ? (
        <div className="p-4 space-y-3">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      ) : (
        <div className="p-4 space-y-3">
          {/* Referral code + link */}
          {info?.code && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                  Your Code
                </span>
                <button
                  type="button"
                  onClick={() => copy(info.code, "Code")}
                  className="text-primary hover:bg-primary/10 p-1 rounded transition-colors"
                  aria-label="Copy referral code"
                >
                  <Icon icon="mdi:content-copy" className="w-4 h-4" />
                </button>
              </div>
              <div className="font-mono text-base font-bold text-primary tracking-wider">
                {info.code}
              </div>
              {info.link && (
                <button
                  type="button"
                  onClick={() => copy(info.link, "Link")}
                  className="mt-2 text-[10px] text-gray-600 hover:text-primary truncate block w-full text-left"
                  title={info.link}
                >
                  <Icon
                    icon="mdi:link-variant"
                    className="w-3 h-3 inline mr-1"
                  />
                  {info.link}
                </button>
              )}
            </div>
          )}

          {/* Stats trio */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-50 rounded-lg p-2.5 text-center">
              <div className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
                Referred
              </div>
              <div className="text-xl font-bold text-gray-800 mt-0.5">
                {stats?.total_referrals ?? 0}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-2.5 text-center">
              <div className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
                Active
              </div>
              <div className="text-xl font-bold text-gray-800 mt-0.5">
                {stats?.active_referrals ?? 0}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-2.5 text-center">
              <div className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
                Bookings
              </div>
              <div className="text-xl font-bold text-gray-800 mt-0.5">
                {stats?.total_bookings ?? 0}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentReferralCard;

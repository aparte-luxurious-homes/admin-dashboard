"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Icon } from "@iconify/react";
import { Skeleton } from "@/src/components/ui/skeleton";
import axiosRequest from "@/src/lib/api";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";

const FIVE_MIN = 5 * 60 * 1000;

const AgentVerificationQueueCard = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard:agentMyVerifyQueue"],
    queryFn: async () => {
      const response = await axiosRequest.get(
        API_ROUTES.verifications.myQueue,
        {
          params: { status: "PENDING", size: 1, page: 1 },
        },
      );
      // Backend returns { meta: { total }, items }; we only need total here.
      const body = response?.data?.data ?? response?.data ?? {};
      return {
        pending: body?.meta?.total ?? body?.total ?? 0,
        latestPropertyName:
          body?.items?.[0]?.property?.name ??
          body?.data?.[0]?.property?.name ??
          null,
      };
    },
    staleTime: FIVE_MIN,
    refetchOnWindowFocus: true,
  });

  const pending = data?.pending ?? 0;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <Icon
            icon="solar:shield-check-bold-duotone"
            className="w-5 h-5 text-primary"
          />
          My Verification Queue
        </h3>
        <Link
          href={PAGE_ROUTES.dashboard.propertyManagement.myVerifications.base}
          className="text-xs font-medium text-primary hover:underline"
        >
          Open queue →
        </Link>
      </div>
      {isLoading ? (
        <div className="p-4">
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      ) : (
        <Link
          href={PAGE_ROUTES.dashboard.propertyManagement.myVerifications.base}
          className="block px-5 py-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-3xl font-bold ${pending === 0 ? "text-gray-300" : "text-gray-800"}`}
                >
                  {pending}
                </span>
                <span className="text-sm text-gray-500">
                  pending review{pending === 1 ? "" : "s"}
                </span>
              </div>
              {pending > 0 && data?.latestPropertyName ? (
                <p className="text-xs text-gray-500 mt-1 truncate">
                  Next: {data.latestPropertyName}
                </p>
              ) : pending === 0 ? (
                <p className="text-xs text-gray-400 mt-1">
                  All clear — no properties waiting
                </p>
              ) : null}
            </div>
            <Icon
              icon={
                pending === 0
                  ? "solar:check-circle-bold-duotone"
                  : "mdi:chevron-right"
              }
              className={`w-6 h-6 ${pending === 0 ? "text-emerald-400" : "text-gray-300"}`}
            />
          </div>
        </Link>
      )}
    </div>
  );
};

export default AgentVerificationQueueCard;

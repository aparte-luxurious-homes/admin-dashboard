"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";

import type { OwnerAction } from "@/src/lib/request-handlers/ownerHomeMgt";

/**
 * Anything with a deadline inside 48 hours, above the calendar (spec D6): a
 * clock under a month grid is invisible on a phone. Several urgent items
 * collapse to the nearest one with a count, so the bar never becomes a list.
 *
 * The backend decides what is urgent; this only renders it.
 */
function hoursLeft(deadline: string | null): string | null {
    if (!deadline) return null;
    const ms = new Date(deadline).getTime() - Date.now();
    if (Number.isNaN(ms)) return null;
    if (ms <= 0) return "overdue";
    // Floor, not round: 45 minutes left is not "1 hour left".
    const hours = Math.floor(ms / 3_600_000);
    if (hours < 1) return "under an hour left";
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} left`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? "" : "s"} left`;
}

export default function UrgentBar({ items }: { items: OwnerAction[] }) {
    const urgent = items.filter((i) => i.severity === "URGENT");
    if (urgent.length === 0) return null;

    const first = urgent[0];
    const clock = hoursLeft(first.deadline_at);

    return (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <Icon icon="mdi:clock-outline" width={18} className="shrink-0 text-amber-700" />
            <p className="min-w-0 flex-1 text-sm text-gray-900">
                <b className="font-semibold">{first.title}</b>{" "}
                <span className="text-gray-700">{first.detail}</span>{" "}
                {clock && <span className="whitespace-nowrap font-semibold text-amber-700">{clock}</span>}
                {urgent.length > 1 && (
                    <span className="text-gray-700">
                        {" "}
                        and {urgent.length - 1} other{urgent.length - 1 === 1 ? "" : "s"} today.
                    </span>
                )}
            </p>
            <Link
                href={first.cta_href}
                className="ml-auto max-sm:w-full max-sm:justify-center inline-flex items-center rounded-lg bg-[#028090] px-4 py-2 text-sm font-semibold text-white hover:bg-[#016171]"
            >
                {first.cta_label}
            </Link>
        </div>
    );
}

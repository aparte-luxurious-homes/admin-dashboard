"use client";

import { useState } from "react";

import { GetMyCatalogAnalytics } from "@/src/lib/request-handlers/linksMgt";
import { Skeleton } from "@/src/components/ui/skeleton";

import { Card, formatNaira } from "./shared";

const WINDOWS = [
    { value: "7d", label: "7 days" },
    { value: "30d", label: "30 days" },
    { value: "90d", label: "90 days" },
];

const SOURCE_LABELS: Record<string, string> = {
    DIRECT: "Direct",
    WHATSAPP_STATUS: "WhatsApp status",
    WHATSAPP_DM: "WhatsApp message",
    INSTAGRAM_BIO: "Instagram bio",
    INSTAGRAM_STORY: "Instagram story",
    QR_CODE: "QR code",
};

function sourceLabel(key: string): string {
    return SOURCE_LABELS[key] ?? key.toLowerCase().replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

/** Views, bookings and money attributed to the page, over a chosen window. */
export default function PerformanceCard({ enabled }: { enabled: boolean }) {
    const [window, setWindow] = useState("30d");
    const { data, isLoading } = GetMyCatalogAnalytics(window, enabled);

    const tiles = data
        ? [
              { label: "Page views", value: String(data.views.catalog_page) },
              { label: "People", value: String(data.views.unique) },
              { label: "Bookings from your page", value: `${data.bookings.confirmed} of ${data.bookings.total_attributed}`, hint: "confirmed of attributed" },
              { label: "Booking value", value: formatNaira(data.bookings.gross_value) },
              { label: "Your earnings", value: formatNaira(data.earnings.total), hint: data.earnings.note },
              { label: "Sign-ups", value: String(data.signups_attributed) },
          ]
        : [];

    const sources = data ? Object.entries(data.views.by_source).sort((a, b) => b[1] - a[1]) : [];
    const maxSource = sources.reduce((m, [, n]) => Math.max(m, n), 0);

    return (
        <Card
            title="How your page is doing"
            icon="lucide:bar-chart-3"
            action={
                <div className="inline-flex rounded-lg border border-gray-200 p-0.5 text-xs">
                    {WINDOWS.map((w) => (
                        <button
                            key={w.value}
                            type="button"
                            onClick={() => setWindow(w.value)}
                            className={`px-2.5 py-1 rounded-md font-medium ${
                                window === w.value ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            {w.label}
                        </button>
                    ))}
                </div>
            }
        >
            {isLoading || !data ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-20" />
                    ))}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {tiles.map((t) => (
                            <div key={t.label} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                                <p className="text-xs text-gray-500">{t.label}</p>
                                <p className="mt-1 text-xl font-semibold text-gray-900 tracking-tight">{t.value}</p>
                                {t.hint && <p className="mt-0.5 text-[11px] text-gray-400">{t.hint}</p>}
                            </div>
                        ))}
                    </div>

                    <div className="mt-5">
                        <p className="text-sm font-medium text-gray-700 mb-2">Where views came from</p>
                        {sources.length === 0 ? (
                            <p className="text-xs text-gray-500">No views in this period yet. Share your link and check back.</p>
                        ) : (
                            <ul className="space-y-2">
                                {sources.map(([key, n]) => (
                                    <li key={key} className="text-xs">
                                        <div className="flex justify-between text-gray-600 mb-1">
                                            <span>{sourceLabel(key)}</span>
                                            <span className="font-medium text-gray-900">{n}</span>
                                        </div>
                                        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-primary"
                                                style={{ width: `${maxSource ? Math.max(4, (n / maxSource) * 100) : 0}%` }}
                                            />
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </>
            )}
        </Card>
    );
}

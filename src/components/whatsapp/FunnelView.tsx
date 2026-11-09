'use client'

import { ReactNode, useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    LinearScale,
    Tooltip,
} from "chart.js";
import Loader from "@/src/components/loader";
import { getApiErrorMessage } from "@/src/lib/apiError";
import { GetWhatsAppFunnel, WaFunnel } from "@/src/lib/request-handlers/whatsappMgt";
import { Panel, Tabs } from "@/src/components/team/ui";
import { dateTime } from "./format";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const DAY_OPTIONS = ["7", "30", "90"] as const;
type Days = (typeof DAY_OPTIONS)[number];

const pct = (v: number | null | undefined) =>
    v === null || v === undefined ? "—" : `${(v * 100).toFixed(v * 100 < 10 ? 1 : 0)}%`;

const minutes = (secs: number | null | undefined) =>
    secs === null || secs === undefined ? "—" : `${(secs / 60).toFixed(secs < 600 ? 1 : 0)} min`;

/**
 * PRD "Aparte on WhatsApp" success targets. `met` is evaluated only when the
 * API has a value; with no data yet there is nothing to judge.
 */
const TARGETS = {
    guestLink: { text: "Target 15-20%", met: (v: number) => v >= 0.15 },
    linkToPaid: { text: "Target 50%", met: (v: number) => v >= 0.5 },
    medianToLink: { text: "Target under 5 min", met: (secs: number) => secs < 300 },
    botShare: { text: "Target 20%", met: (v: number) => v >= 0.2 },
};

function Kpi({ label, value, hint, target, met }: {
    label: string; value: ReactNode; hint?: string; target?: string; met?: boolean | null;
}) {
    return (
        <div className="border border-[#D9D9D9] rounded-[15px] p-4 bg-white">
            <p className="text-xs font-medium text-gray-600">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
            {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
            {target && (
                <p className={`text-xs mt-2 font-medium ${met === true ? "text-emerald-700" : met === false ? "text-amber-700" : "text-gray-500"}`}>
                    {met === true ? "On target · " : met === false ? "Below target · " : ""}{target}
                </p>
            )}
        </div>
    );
}

function judge(value: number | null | undefined, met: (v: number) => boolean): boolean | null {
    return value === null || value === undefined ? null : met(value);
}

function FunnelChart({ data }: { data: WaFunnel }) {
    const stages = useMemo(() => data.stages ?? [], [data.stages]);
    const chartData = useMemo(() => ({
        labels: stages.map((s) => s.label),
        datasets: [{
            label: "Conversations",
            data: stages.map((s) => s.count),
            backgroundColor: "#007080",
            hoverBackgroundColor: "#124452",
            borderRadius: 4,
            borderSkipped: "start" as const,
            barThickness: 22,
        }],
    }), [stages]);

    const options = useMemo(() => ({
        indexAxis: "y" as const,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (ctx: any) => {
                        const s = stages[ctx.dataIndex];
                        const rate = s?.rate_from_previous;
                        return `${Number(ctx.raw).toLocaleString()}${rate !== null && rate !== undefined ? ` (${pct(rate)} of previous step)` : ""}`;
                    },
                },
            },
        },
        scales: {
            x: { beginAtZero: true, grid: { color: "#F0F0F0" }, ticks: { precision: 0, color: "#6B7280" } },
            y: { grid: { display: false }, ticks: { color: "#374151" } },
        },
    }), [stages]);

    if (!stages.length) return <p className="py-10 text-center text-sm text-gray-500">No conversations in this period.</p>;

    return (
        <div>
            <div className="h-[220px] w-full">
                <Bar data={chartData} options={options} />
            </div>
            {/* The same numbers as text: the chart's only table view, and the
                step-to-step rates a bar length cannot show. */}
            <table className="w-full mt-4 text-sm">
                <thead>
                    <tr className="text-xs text-gray-500 uppercase tracking-wide text-left border-b border-gray-200">
                        <th className="py-2 font-medium">Step</th>
                        <th className="py-2 font-medium text-right">Conversations</th>
                        <th className="py-2 font-medium text-right">From previous step</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {stages.map((s) => (
                        <tr key={s.key}>
                            <td className="py-2 text-gray-700">{s.label}</td>
                            <td className="py-2 text-right font-medium text-gray-900">{s.count.toLocaleString()}</td>
                            <td className="py-2 text-right text-gray-600">{pct(s.rate_from_previous)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/** The WhatsApp bot funnel against the PRD's targets. Staff and ANALYST. */
export default function FunnelView() {
    // Plain state, not the URL: one selector, nothing to paginate, and keeping
    // it out of useSearchParams means the page needs no Suspense boundary.
    const [days, setDays] = useState<Days>("30");
    const { data, isLoading, isFetching, error } = GetWhatsAppFunnel(Number(days));

    return (
        <Panel
            title="WhatsApp funnel"
            subtitle={data?.since ? `Bot conversations since ${dateTime(data.since)}.` : "How chats with the WhatsApp bot turn into paid bookings."}
        >
            <Tabs<Days>
                value={days}
                onChange={setDays}
                options={DAY_OPTIONS.map((d) => ({ value: d, label: `Last ${d} days` }))}
            />
            {isLoading ? (
                <div className="flex items-center justify-center py-16"><Loader /></div>
            ) : error || !data ? (
                <p className="py-10 text-center text-sm text-red-600">{getApiErrorMessage(error, "Couldn't load the funnel")}</p>
            ) : (
                <div className={isFetching ? "opacity-60 transition-opacity" : ""}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <Kpi
                            label="Bot bookings (paid)"
                            value={data.bot_bookings.toLocaleString()}
                            hint={`of ${data.all_bookings.toLocaleString()} bookings in the period`}
                        />
                        <Kpi
                            label="Bot share of bookings"
                            value={pct(data.bot_share)}
                            target={TARGETS.botShare.text}
                            met={judge(data.bot_share, TARGETS.botShare.met)}
                        />
                        <Kpi
                            label="Guest chats reaching a payment link"
                            value={pct(data.guest_link_rate)}
                            target={TARGETS.guestLink.text}
                            met={judge(data.guest_link_rate, TARGETS.guestLink.met)}
                        />
                        <Kpi
                            label="Payment link to paid"
                            value={pct(data.link_to_paid_rate)}
                            target={TARGETS.linkToPaid.text}
                            met={judge(data.link_to_paid_rate, TARGETS.linkToPaid.met)}
                        />
                        <Kpi
                            label="Median time to payment link"
                            value={minutes(data.median_seconds_to_link)}
                            hint="first message to link sent"
                            target={TARGETS.medianToLink.text}
                            met={judge(data.median_seconds_to_link, TARGETS.medianToLink.met)}
                        />
                        <Kpi label="Handovers to ops" value={data.handovers.toLocaleString()} />
                        <Kpi label="Opt-outs (STOP)" value={data.opt_outs.toLocaleString()} />
                        <Kpi
                            label="Agents using the bot"
                            value={data.agents_active.toLocaleString()}
                            hint={`${data.agents_with_booking.toLocaleString()} closed at least one booking`}
                        />
                    </div>

                    <div className="mt-6 border border-[#D9D9D9] rounded-[15px] p-4 bg-white">
                        <h2 className="text-sm font-semibold text-gray-800 mb-3">Conversation funnel</h2>
                        <FunnelChart data={data} />
                    </div>
                </div>
            )}
        </Panel>
    );
}


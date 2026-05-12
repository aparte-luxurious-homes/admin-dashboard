"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import { Skeleton } from "@/src/components/ui/skeleton";
import {
    GetAgentPerformance,
    AgentPerformanceRow,
} from "@/src/lib/request-handlers/dashboardMgt";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";

type Lens = "week" | "mtd" | "lifetime";

// Each lens picks the primary metric to sort by + which columns to emphasize.
// SQL already sorts by listings_this_week DESC by default; the toggle lets
// admins re-rank without leaving the page.
const LENS_LABEL: Record<Lens, string> = {
    week: "This week",
    mtd: "Month-to-date",
    lifetime: "Lifetime",
};

const formatDate = (iso: string | null): string => {
    if (!iso) return "—";
    try {
        return new Date(iso).toLocaleDateString("en-NG", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    } catch {
        return iso;
    }
};

// GMV values arrive as Decimal-as-string from the API. Format as ₦ with
// thousands separators, no decimals (units are NGN so cents don't matter
// at the report-level granularity).
const formatNgn = (s: string | null | undefined): string =>
    "₦" + parseFloat(s ?? "0").toLocaleString("en-NG", { maximumFractionDigits: 0 });

const daysSince = (iso: string | null): number | null => {
    if (!iso) return null;
    try {
        const then = new Date(iso).getTime();
        const now = Date.now();
        return Math.floor((now - then) / (1000 * 60 * 60 * 24));
    } catch {
        return null;
    }
};

// CSV export — minimal, no deps. Quotes any field containing comma/quote/newline.
const csvEscape = (val: unknown): string => {
    if (val === null || val === undefined) return "";
    const s = String(val);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
};

const downloadCsv = (filename: string, rows: AgentPerformanceRow[]) => {
    const headers = [
        "agent_id",
        "agent_name",
        "email",
        "phone",
        "agent_joined_at",
        "listings_this_week",
        "verified_this_week",
        "listings_mtd",
        "verified_listings_mtd",
        "verified_listings",
        "total_listings",
        "pending_listings",
        "is_active_agent",
        "verification_rate_pct",
        "last_listed_at",
        "last_verified_at",
        "assigned_count_week",
        "assigned_count_mtd",
        "assigned_count_total",
        "assigned_gmv_total",
        "assigned_last_booking_at",
        "referred_count_week",
        "referred_count_mtd",
        "referred_count_total",
        "referred_gmv_total",
        "referred_last_booking_at",
    ];
    // Hand-written value extractor: booking fields live one level deep, so the
    // generic index-based lookup used previously can't reach them.
    const valueFor = (r: AgentPerformanceRow, h: string): unknown => {
        const rec = r as unknown as Record<string, unknown>;
        switch (h) {
            case "assigned_count_week": return r.assigned_bookings.count_week;
            case "assigned_count_mtd": return r.assigned_bookings.count_mtd;
            case "assigned_count_total": return r.assigned_bookings.count_total;
            case "assigned_gmv_total": return r.assigned_bookings.gmv_total;
            case "assigned_last_booking_at": return r.assigned_bookings.last_booking_at;
            case "referred_count_week": return r.referred_bookings.count_week;
            case "referred_count_mtd": return r.referred_bookings.count_mtd;
            case "referred_count_total": return r.referred_bookings.count_total;
            case "referred_gmv_total": return r.referred_bookings.gmv_total;
            case "referred_last_booking_at": return r.referred_bookings.last_booking_at;
            default: return rec[h];
        }
    };
    const lines = [
        headers.join(","),
        ...rows.map((r) => headers.map((h) => csvEscape(valueFor(r, h))).join(",")),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

const AgentPerformanceReportPage = () => {
    const { data, isLoading, error } = GetAgentPerformance();
    const [lens, setLens] = useState<Lens>("week");
    const [search, setSearch] = useState("");
    const [activeOnly, setActiveOnly] = useState(false);

    const summary = data?.summary;
    const agentsRaw = data?.agents;

    const filtered = useMemo(() => {
        let rows: AgentPerformanceRow[] = agentsRaw ? [...agentsRaw] : [];
        const q = search.trim().toLowerCase();
        if (q) {
            rows = rows.filter(
                (r) =>
                    (r.agent_name ?? "").toLowerCase().includes(q) ||
                    (r.email ?? "").toLowerCase().includes(q) ||
                    (r.phone ?? "").toLowerCase().includes(q)
            );
        }
        if (activeOnly) {
            rows = rows.filter((r) => r.is_active_agent);
        }
        const primary: keyof AgentPerformanceRow =
            lens === "week"
                ? "listings_this_week"
                : lens === "mtd"
                    ? "listings_mtd"
                    : "verified_listings";
        rows.sort((a, b) => {
            const av = (a[primary] as number) ?? 0;
            const bv = (b[primary] as number) ?? 0;
            if (bv !== av) return bv - av;
            return (a.agent_name ?? "").localeCompare(b.agent_name ?? "");
        });
        return rows;
    }, [agentsRaw, search, activeOnly, lens]);

    const handleExport = () => {
        if (filtered.length === 0) {
            toast.error("No rows to export");
            return;
        }
        const stamp = new Date().toISOString().slice(0, 10);
        downloadCsv(`agent-performance-${lens}-${stamp}.csv`, filtered);
        toast.success(`Exported ${filtered.length} row${filtered.length === 1 ? "" : "s"}`);
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                        <Link href={PAGE_ROUTES.dashboard.base} className="hover:text-primary">
                            Dashboard
                        </Link>
                        <Icon icon="mdi:chevron-right" className="w-3 h-3" />
                        <span>Reports</span>
                        <Icon icon="mdi:chevron-right" className="w-3 h-3" />
                        <span className="text-gray-700">Agent Performance</span>
                    </div>
                    <h1 className="text-xl font-semibold text-gray-900">Agent Performance</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Five-numbers framework — listings, verified listings, MTD, lifetime, and
                        the active-agent flag. Drives the dashboard's Top Agents widget.
                        {summary?.week_start_monday && summary?.week_end_sunday && (
                            <span className="ml-1">
                                Week of {formatDate(summary.week_start_monday)} —{" "}
                                {formatDate(summary.week_end_sunday)}.
                            </span>
                        )}
                    </p>
                </div>
                <button
                    onClick={handleExport}
                    disabled={isLoading || filtered.length === 0}
                    className="px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm text-gray-700 font-medium flex items-center gap-2 disabled:opacity-50"
                >
                    <Icon icon="mdi:download" className="w-4 h-4" />
                    Export CSV
                </button>
            </div>

            {/* Summary header */}
            {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                    ))}
                </div>
            ) : summary ? (
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                    <SummaryCard
                        label="Registered"
                        value={summary.total_registered_agents}
                        hint="All AGENT accounts"
                    />
                    <SummaryCard
                        label="Account active"
                        value={summary.active_account_agents}
                        hint="users.is_active = true"
                    />
                    <SummaryCard
                        label="Contact verified"
                        value={summary.verified_contact_agents}
                        hint="Email/phone confirmed"
                    />
                    <SummaryCard
                        label="Active agents"
                        value={summary.total_active_agents}
                        hint="≥1 verified APT/HOTEL"
                        emphasis
                    />
                    <SummaryCard
                        label="Joined last 30d"
                        value={summary.agents_joined_last_30d}
                        hint="Fresh signups"
                    />
                    <SummaryCard
                        label="Bookings (MTD)"
                        value={summary.total_attributed_bookings_mtd}
                        hint={`${formatNgn(summary.total_attributed_gmv_mtd)} GMV`}
                    />
                </div>
            ) : null}

            {/* Toolbar */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-wrap items-center gap-3">
                {/* Lens toggle */}
                <div className="inline-flex border border-gray-200 rounded-lg overflow-hidden text-xs font-medium">
                    {(Object.keys(LENS_LABEL) as Lens[]).map((k) => (
                        <button
                            key={k}
                            onClick={() => setLens(k)}
                            className={`px-3 py-1.5 transition-colors ${lens === k
                                ? "bg-primary text-white"
                                : "bg-white text-gray-700 hover:bg-gray-50"
                                }`}
                        >
                            {LENS_LABEL[k]}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                    <Icon
                        icon="mdi:magnify"
                        className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
                    />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name, email, phone..."
                        className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                </div>

                {/* Active filter */}
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={activeOnly}
                        onChange={(e) => setActiveOnly(e.target.checked)}
                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    Active agents only
                </label>

                {/* Result count */}
                <span className="text-xs text-gray-500 ml-auto">
                    {filtered.length} of {agentsRaw?.length ?? 0} agent{(agentsRaw?.length ?? 0) === 1 ? "" : "s"}
                </span>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                {isLoading ? (
                    <div className="p-4 space-y-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full rounded-lg" />
                        ))}
                    </div>
                ) : error ? (
                    <div className="p-10 text-center">
                        <Icon icon="mdi:alert-circle-outline" className="w-10 h-10 text-red-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">Failed to load agent performance.</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-10 text-center">
                        <Icon icon="solar:user-id-line-duotone" className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">
                            {(agentsRaw?.length ?? 0) === 0
                                ? "No agents on the platform yet."
                                : "No agents match your filters."}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                <tr>
                                    <th className="px-4 py-3 text-left">Agent</th>
                                    <th className="px-4 py-3 text-right">
                                        Week
                                        <span className="block text-[9px] font-normal text-gray-400">
                                            new / verified
                                        </span>
                                    </th>
                                    <th className="px-4 py-3 text-right">
                                        MTD
                                        <span className="block text-[9px] font-normal text-gray-400">
                                            new / verified
                                        </span>
                                    </th>
                                    <th className="px-4 py-3 text-right">
                                        Lifetime
                                        <span className="block text-[9px] font-normal text-gray-400">
                                            verified / total
                                        </span>
                                    </th>
                                    <th className="px-4 py-3 text-right">
                                        Bookings (assigned)
                                        <span className="block text-[9px] font-normal text-gray-400">
                                            wk / mtd / total · gmv mtd
                                        </span>
                                    </th>
                                    <th className="px-4 py-3 text-right">
                                        Bookings (referred)
                                        <span className="block text-[9px] font-normal text-gray-400">
                                            wk / mtd / total · gmv mtd
                                        </span>
                                    </th>
                                    <th className="px-4 py-3 text-right">Verif. rate</th>
                                    <th className="px-4 py-3 text-left">Last activity</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map((r) => {
                                    const verifPct = parseFloat(r.verification_rate_pct ?? "0");
                                    const dormantDays = daysSince(r.last_listed_at);
                                    const isDormant = dormantDays !== null && dormantDays > 30;
                                    const isPrimaryColumn = (col: Lens) => lens === col;
                                    return (
                                        <tr key={r.agent_id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                                                            {r.agent_name || "—"}
                                                            {r.is_active_agent && (
                                                                <span
                                                                    className="text-[9px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded"
                                                                    title="Has at least one verified APARTMENT or HOTEL listing"
                                                                >
                                                                    Active
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-[11px] text-gray-500">
                                                            {r.email || r.phone || ""}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td
                                                className={`px-4 py-3 text-right tabular-nums ${isPrimaryColumn("week") ? "font-semibold text-gray-900" : "text-gray-700"}`}
                                            >
                                                {r.listings_this_week}{" "}
                                                <span className="text-[11px] text-gray-400">
                                                    / {r.verified_this_week}
                                                </span>
                                            </td>
                                            <td
                                                className={`px-4 py-3 text-right tabular-nums ${isPrimaryColumn("mtd") ? "font-semibold text-gray-900" : "text-gray-700"}`}
                                            >
                                                {r.listings_mtd}{" "}
                                                <span className="text-[11px] text-gray-400">
                                                    / {r.verified_listings_mtd}
                                                </span>
                                            </td>
                                            <td
                                                className={`px-4 py-3 text-right tabular-nums ${isPrimaryColumn("lifetime") ? "font-semibold text-gray-900" : "text-gray-700"}`}
                                            >
                                                {r.verified_listings}{" "}
                                                <span className="text-[11px] text-gray-400">
                                                    / {r.total_listings}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                                                {r.assigned_bookings.count_week}
                                                <span className="text-[11px] text-gray-400">
                                                    {" "}/ {r.assigned_bookings.count_mtd} / {r.assigned_bookings.count_total}
                                                </span>
                                                <div className="text-[10px] text-gray-400 font-normal">
                                                    {formatNgn(r.assigned_bookings.gmv_mtd)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                                                {r.referred_bookings.count_week}
                                                <span className="text-[11px] text-gray-400">
                                                    {" "}/ {r.referred_bookings.count_mtd} / {r.referred_bookings.count_total}
                                                </span>
                                                <div className="text-[10px] text-gray-400 font-normal">
                                                    {formatNgn(r.referred_bookings.gmv_mtd)}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span
                                                    className={`text-xs font-medium px-2 py-0.5 rounded ${verifPct >= 70
                                                        ? "text-emerald-700 bg-emerald-50"
                                                        : verifPct >= 40
                                                            ? "text-amber-700 bg-amber-50"
                                                            : "text-red-700 bg-red-50"
                                                        }`}
                                                >
                                                    {verifPct.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-[11px] text-gray-500">
                                                {r.last_listed_at ? (
                                                    <span className={isDormant ? "text-red-600 font-medium" : ""}>
                                                        {formatDate(r.last_listed_at)}
                                                        {isDormant && ` · ${dormantDays}d`}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-300">never</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

const SummaryCard: React.FC<{
    label: string;
    value: number;
    hint: string;
    emphasis?: boolean;
}> = ({ label, value, hint, emphasis }) => (
    <div
        className={`rounded-2xl border p-4 ${emphasis
            ? "bg-primary text-white border-primary"
            : "bg-white border-gray-200"
            }`}
    >
        <div
            className={`text-[10px] font-semibold uppercase tracking-wider ${emphasis ? "text-white/80" : "text-gray-500"
                }`}
        >
            {label}
        </div>
        <div className={`text-2xl font-bold mt-0.5 ${emphasis ? "text-white" : "text-gray-900"}`}>
            {value}
        </div>
        <div className={`text-[11px] mt-0.5 ${emphasis ? "text-white/70" : "text-gray-400"}`}>
            {hint}
        </div>
    </div>
);

export default AgentPerformanceReportPage;

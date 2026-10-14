'use client'

import { ReactNode } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import Loader from "@/src/components/loader";

/**
 * Small building blocks shared by the team workspace, the team-request
 * queue, mentor reassignment and the network reports. Same look as the
 * existing network tables (ZoneMembersTable).
 */

export const ngn = (value: number | string | null | undefined) =>
    `₦${Number(value ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export const shortDate = (value?: string | null) =>
    value ? new Date(value).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—";

export function Panel({ title, subtitle, actions, children }: {
    title: string; subtitle?: string; actions?: ReactNode; children: ReactNode;
}) {
    return (
        <div className="p-4 sm:p-[20px] mx-2 sm:mx-5 mt-5 border border-[#D9D9D9] rounded-[15px] bg-white shadow-md">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
                    {subtitle && <p className="text-sm text-gray-500 mt-1 max-w-2xl">{subtitle}</p>}
                </div>
                {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
            </div>
            {children}
        </div>
    );
}

const TIER_STYLE: Record<string, string> = {
    GOLD: "bg-yellow-50 text-yellow-700 border-yellow-300",
    SILVER: "bg-slate-100 text-slate-700 border-slate-300",
    BRONZE: "bg-orange-50 text-orange-700 border-orange-200",
};

const STATUS_STYLE: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
    REJECTED: "bg-red-50 text-red-700 border-red-200",
    FAILED: "bg-red-50 text-red-700 border-red-200",
    PAUSED: "bg-slate-100 text-slate-600 border-slate-300",
    CANCELLED: "bg-gray-100 text-gray-500 border-gray-200",
};

export function Badge({ value, kind = "status" }: { value?: string | null; kind?: "status" | "tier" }) {
    if (!value) return <span className="text-sm text-gray-400">—</span>;
    const v = value.toUpperCase();
    const style = (kind === "tier" ? TIER_STYLE : STATUS_STYLE)[v] ?? "bg-gray-100 text-gray-600 border-gray-200";
    const label = v.charAt(0) + v.slice(1).toLowerCase().replace(/_/g, " ");
    return (
        <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border ${style}`}>
            {label}
        </span>
    );
}

export interface Column<T> {
    header: string;
    render: (row: T) => ReactNode;
    className?: string;
}

export function DataTable<T>({ columns, rows, rowKey, isLoading, isFetching, onRowClick, empty }: {
    columns: Column<T>[];
    rows: T[];
    rowKey: (row: T) => string;
    isLoading?: boolean;
    isFetching?: boolean;
    onRowClick?: (row: T) => void;
    empty: { title: string; body?: string };
}) {
    if (isLoading) {
        return <div className="flex items-center justify-center py-16"><Loader /></div>;
    }
    if (!rows.length) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <Icon icon="hugeicons:album-not-found-01" width="32" className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">{empty.title}</h3>
                {empty.body && <p className="text-sm text-gray-500 max-w-sm">{empty.body}</p>}
            </div>
        );
    }
    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                        {columns.map((c) => (
                            <th key={c.header} className={`px-4 py-3 text-left whitespace-nowrap ${c.className ?? ""}`}>
                                {c.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className={`divide-y divide-gray-200 ${isFetching ? "opacity-60" : ""}`}>
                    {rows.map((row) => (
                        <tr
                            key={rowKey(row)}
                            onClick={onRowClick ? () => onRowClick(row) : undefined}
                            className={`text-sm text-gray-700 ${onRowClick ? "hover:bg-gray-50 cursor-pointer" : ""}`}
                        >
                            {columns.map((c) => (
                                <td key={c.header} className={`px-4 py-3 align-top ${c.className ?? ""}`}>
                                    {c.render(row)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function Pager({ page, size, total, onPage }: {
    page: number; size: number; total: number; onPage: (p: number) => void;
}) {
    const pages = Math.max(1, Math.ceil(total / size));
    if (pages <= 1) return null;
    const btn = "px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed";
    return (
        <div className="px-4 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">Page {page} of {pages}</p>
            <div className="flex items-center gap-2">
                <button className={btn} disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
                <button className={btn} disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button>
            </div>
        </div>
    );
}

export function SearchBox({ value, onChange, placeholder }: {
    value: string; onChange: (v: string) => void; placeholder: string;
}) {
    return (
        <div className="relative max-w-sm w-full">
            <Icon icon="mdi:magnify" width="18" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                maxLength={100}
                className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
        </div>
    );
}

export function Tabs<T extends string>({ value, onChange, options }: {
    value: T; onChange: (v: T) => void; options: { value: T; label: string }[];
}) {
    return (
        <div className="flex gap-1 flex-wrap border-b border-gray-200 mb-4">
            {options.map((o) => (
                <button
                    key={o.value}
                    onClick={() => onChange(o.value)}
                    className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
                        value === o.value ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                >
                    {o.label}
                </button>
            ))}
        </div>
    );
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="rounded-lg border border-gray-200 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
            <p className="text-sm font-semibold text-gray-900">{value}</p>
        </div>
    );
}

export function NotTeamLead() {
    return (
        <Panel title="Team" subtitle="">
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <Icon icon="mdi:account-group-outline" width="40" className="text-gray-300 mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No team yet</h3>
                <p className="text-sm text-gray-500 max-w-sm">
                    The team workspace is for Silver and Gold agents with at least one mentee.
                </p>
            </div>
        </Panel>
    );
}

"use client";

import { Icon } from "@iconify/react";

/** The API's error detail, or a fallback. */
export function errorMessage(err: any, fallback: string): string {
    const detail = err?.response?.data?.detail;
    if (typeof detail === "string") return detail;
    // Pydantic 422s arrive as a list of {loc, msg}.
    if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
    return err?.response?.data?.message ?? fallback;
}

export function formatNaira(value: string | number | null | undefined): string {
    const n = typeof value === "string" ? parseFloat(value) : value ?? 0;
    if (!Number.isFinite(n)) return "₦0";
    return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 0,
    }).format(n);
}

export function Card({
    title,
    description,
    icon,
    action,
    children,
    className = "",
}: {
    title: string;
    description?: string;
    icon?: string;
    action?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <section className={`bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6 ${className}`}>
            <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                        {icon && <Icon icon={icon} width="18" height="18" className="text-primary" />}
                        {title}
                    </h2>
                    {description && <p className="text-xs sm:text-sm text-gray-500 mt-1">{description}</p>}
                </div>
                {action}
            </div>
            {children}
        </section>
    );
}

export function Toggle({
    checked,
    onChange,
    disabled,
    label,
}: {
    checked: boolean;
    onChange: (next: boolean) => void;
    disabled?: boolean;
    label: string;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                checked ? "bg-primary" : "bg-gray-300"
            }`}
        >
            <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    checked ? "translate-x-5" : "translate-x-0.5"
                }`}
            />
        </button>
    );
}

export const primaryButton =
    "inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg whitespace-nowrap";
export const secondaryButton =
    "inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-gray-700 rounded-lg whitespace-nowrap";

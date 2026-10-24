"use client";

import React from "react";
import Tooltip from "@mui/material/Tooltip";
import { Icon } from "@iconify/react";
import type { EmailStatus } from "@/src/lib/request-handlers/emailHealthMgt";

/** "Fri 14 Nov 2026", or null when there is no usable date. */
export function formatBounceDate(iso: string | null | undefined): string | null {
    if (!iso) return null;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Africa/Lagos",
    }).replace(/,/g, "");
}

const STYLES: Record<Exclude<EmailStatus, "OK">, { label: string; className: string; icon: string }> = {
    BOUNCING: {
        label: "Email bouncing",
        className: "bg-amber-50 text-amber-700 border-amber-200",
        icon: "mdi:email-alert-outline",
    },
    UNDELIVERABLE: {
        label: "Email undeliverable",
        className: "bg-red-50 text-red-700 border-red-200",
        icon: "mdi:email-off-outline",
    },
};

interface EmailHealthChipProps {
    status: EmailStatus;
    bouncedAt?: string | null;
    reason?: string | null;
    suggestion?: string | null;
}

/** Amber "Email bouncing" / red "Email undeliverable". Renders nothing when OK. */
const EmailHealthChip: React.FC<EmailHealthChipProps> = ({ status, bouncedAt, reason, suggestion }) => {
    if (status !== "BOUNCING" && status !== "UNDELIVERABLE") return null;
    const style = STYLES[status];
    const since = formatBounceDate(bouncedAt);

    const detail = (
        <div className="space-y-1 text-xs leading-snug">
            <p>Emails to this address aren&apos;t arriving.</p>
            {reason && <p>{reason}</p>}
            {since && <p>Since {since}</p>}
            {suggestion && <p>Did they mean {suggestion}?</p>}
        </div>
    );

    return (
        <Tooltip title={detail} arrow placement="bottom-start">
            <span
                tabIndex={0}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border cursor-default ${style.className}`}
            >
                <Icon icon={style.icon} className="w-3.5 h-3.5" />
                {style.label}
            </span>
        </Tooltip>
    );
};

export default EmailHealthChip;

"use client";

import React from "react";
import Tooltip from "@mui/material/Tooltip";
import { Icon } from "@iconify/react";
import { formatBounceDate } from "./email-health/EmailHealthChip";

interface PhoneVerificationChipProps {
    /** True only when the number was confirmed by an SMS code. */
    verified: boolean;
    verifiedAt?: string | null;
}

/**
 * Green "Phone confirmed" / grey "Phone not confirmed". Only an SMS code
 * confirmed against the number counts; a number typed at signup, or one the
 * old email fallback "verified", shows as not confirmed. Render it only where
 * there is a number to confirm.
 */
const PhoneVerificationChip: React.FC<PhoneVerificationChipProps> = ({ verified, verifiedAt }) => {
    const since = formatBounceDate(verifiedAt);
    const detail = verified
        ? (since ? `Confirmed by SMS code on ${since}.` : "Confirmed by SMS code.")
        : "Not confirmed by SMS yet. If phone verification is required, they'll be asked for a code the next time they sign in.";

    return (
        <Tooltip title={<span className="text-xs leading-snug">{detail}</span>} arrow placement="bottom-start">
            <span
                tabIndex={0}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border cursor-default ${verified
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-gray-50 text-gray-600 border-gray-200"}`}
            >
                <Icon icon={verified ? "mdi:cellphone-check" : "mdi:cellphone-remove"} className="w-3.5 h-3.5" />
                {verified ? "Phone confirmed" : "Phone not confirmed"}
            </span>
        </Tooltip>
    );
};

export default PhoneVerificationChip;

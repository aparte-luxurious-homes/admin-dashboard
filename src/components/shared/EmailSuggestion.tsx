"use client";

import React, { useMemo } from "react";
import { Icon } from "@iconify/react";
import { suggestEmail } from "@/src/lib/email-check";
import { useEmailCheck } from "@/src/lib/request-handlers/emailHealthMgt";

interface EmailSuggestionProps {
    /** The current value of the email input. */
    email: string;
    /** Called with the corrected address when the suggestion is clicked. */
    onApply: (email: string) => void;
    /** Skip the server check (e.g. where the user is not signed in). */
    serverCheck?: boolean;
    className?: string;
}

/**
 * Warnings under an email field: "Did you mean ...?", a domain that cannot
 * receive mail, or an address that has bounced before.
 *
 * Warn only. Nothing here blocks a submit: the typo list is a guess, the MX
 * lookup can time out, and staff sometimes know better than either.
 */
const EmailSuggestion: React.FC<EmailSuggestionProps> = ({
    email,
    onApply,
    serverCheck = true,
    className = "",
}) => {
    const typed = (email || "").trim();
    const local = useMemo(() => suggestEmail(typed), [typed]);
    const { data } = useEmailCheck(serverCheck ? typed : "");

    // The query answers for the debounced value; ignore it once the field has
    // moved on, so a stale "can't receive email" never sits under a new address.
    const server = data && (data.email || "").trim().toLowerCase() === typed.toLowerCase() ? data : undefined;

    const serverSuggestion =
        server?.suggestion && server.suggestion.toLowerCase() !== typed.toLowerCase()
            ? server.suggestion
            : null;
    const suggestion = local ?? serverSuggestion;
    const cannotReceive = server?.domain_accepts_mail === false;
    const knownBad = server?.known_undeliverable === true;

    if (!typed || (!suggestion && !cannotReceive && !knownBad)) return null;

    return (
        <div className={`space-y-1 mt-1 ml-1 ${className}`} aria-live="polite">
            {suggestion && (
                <p className="text-xs text-amber-700 flex items-center gap-1 flex-wrap">
                    <Icon icon="mdi:lightbulb-on-outline" className="shrink-0" />
                    Did you mean{" "}
                    <button
                        type="button"
                        onClick={() => onApply(suggestion)}
                        className="font-semibold underline underline-offset-2 hover:text-amber-900"
                    >
                        {suggestion}
                    </button>
                    ?
                </p>
            )}
            {cannotReceive && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                    <Icon icon="mdi:email-off-outline" className="shrink-0" />
                    This domain can&apos;t receive email. Check the spelling.
                </p>
            )}
            {knownBad && !cannotReceive && (
                <p className="text-xs text-amber-700 flex items-center gap-1">
                    <Icon icon="mdi:alert-outline" className="shrink-0" />
                    Emails to this address haven&apos;t been arriving. Confirm it with them.
                </p>
            )}
        </div>
    );
};

export default EmailSuggestion;

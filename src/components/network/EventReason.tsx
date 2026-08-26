'use client'

import Link from "next/link";
import type { ReactNode } from "react";

export interface EventReasonAgent {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
}

/** Matches a canonical UUID anywhere inside a free-text string. */
const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

function eventAgentName(agent?: EventReasonAgent | null): string {
    if (!agent) return "";
    return [agent.first_name, agent.last_name].filter(Boolean).join(" ") || agent.email || "";
}

/**
 * Split a reason string around the token naming the related agent.
 *
 * Two shapes exist and both have to work. Rows written before the backend
 * started resolving the name carry a raw UUID; newer ones carry the name
 * itself. The UUID is tried first because it is unambiguous — a name can
 * legitimately occur elsewhere in the prose, a UUID cannot.
 */
function splitAroundAgent(
    reason: string,
    name: string,
): { before: string; token: string; after: string } | null {
    const uuid = reason.match(UUID_PATTERN);
    if (uuid?.index !== undefined) {
        return {
            before: reason.slice(0, uuid.index),
            // Prefer the resolved name; fall back to the id when the related
            // agent no longer resolves, so the row never loses the reference.
            token: name || uuid[0],
            after: reason.slice(uuid.index + uuid[0].length),
        };
    }
    if (name) {
        const at = reason.indexOf(name);
        if (at !== -1) {
            return {
                before: reason.slice(0, at),
                token: name,
                after: reason.slice(at + name.length),
            };
        }
    }
    return null;
}

/**
 * An activity event's `reason`, with the related agent's name linked to the
 * event the row was derived from.
 *
 * On a MENTOR_POINT_OVERRIDE that means the mentee's name links to the award
 * the mentor's cut came out of — the row explains both who it came from and
 * where to verify it, which a frozen prose string cannot do on its own.
 *
 * Pass `href` where the target is a routable page (the admin event detail), or
 * `onOpenRelated` where it is not (an agent's modal opens it in place). With
 * neither, or with nothing to link to, this degrades to plain text.
 */
export default function EventReason({
    reason,
    relatedAgent,
    relatedEventId,
    href,
    onOpenRelated,
    emptyText = "--/--",
}: {
    reason?: string | null;
    relatedAgent?: EventReasonAgent | null;
    relatedEventId?: string | null;
    href?: string;
    onOpenRelated?: () => void;
    emptyText?: string;
}) {
    if (!reason) return <>{emptyText}</>;

    const name = eventAgentName(relatedAgent);
    const parts = splitAroundAgent(reason, name);
    const linkable = Boolean(relatedEventId) && Boolean(href || onOpenRelated);

    if (!parts) return <>{reason}</>;
    if (!linkable) return <>{`${parts.before}${parts.token}${parts.after}`}</>;

    const linkClass =
        "font-semibold text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary transition-colors";

    let anchor: ReactNode;
    if (href) {
        anchor = (
            <Link href={href} className={linkClass} title="View the source event">
                {parts.token}
            </Link>
        );
    } else {
        anchor = (
            <button type="button" onClick={onOpenRelated} className={linkClass} title="View the source event">
                {parts.token}
            </button>
        );
    }

    return (
        <>
            {parts.before}
            {anchor}
            {parts.after}
        </>
    );
}

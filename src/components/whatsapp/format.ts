import type {
    WaContactMode,
    WaConversationState,
    WaMessage,
} from "@/src/lib/request-handlers/whatsappMgt";

/**
 * Parse an API timestamp. The wa_* columns are timezone-aware, but a naive
 * ISO string (no offset) would otherwise be read as the browser's local time
 * and put every wait time an hour out in Lagos, so treat it as UTC.
 */
export function parseApiDate(value?: string | null): Date | null {
    if (!value) return null;
    const hasZone = /[zZ]|[+-]\d{2}:?\d{2}$/.test(value);
    const d = new Date(hasZone || !value.includes("T") ? value : `${value}Z`);
    return Number.isNaN(d.getTime()) ? null : d;
}

/** "just now", "4m", "2h 5m", "3d". */
export function waitTime(value?: string | null, now: number = Date.now()): string {
    const d = parseApiDate(value);
    if (!d) return "—";
    const mins = Math.max(0, Math.floor((now - d.getTime()) / 60000));
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return mins % 60 ? `${hours}h ${mins % 60}m` : `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
}

export function timeOfDay(value?: string | null): string {
    const d = parseApiDate(value);
    return d ? d.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }) : "";
}

export function dayLabel(value?: string | null): string {
    const d = parseApiDate(value);
    if (!d) return "";
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export function dateTime(value?: string | null): string {
    const d = parseApiDate(value);
    return d
        ? d.toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
        : "—";
}

/** NGN 150,000 — never the naira sign (PRD FR-12, same as the bot's own copy). */
export function ngnText(value: number | string | null | undefined): string {
    const n = Number(value ?? 0);
    return `NGN ${(Number.isFinite(n) ? n : 0).toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;
}

export const STATE_LABEL: Record<WaConversationState, string> = {
    GREETING: "Greeting",
    COLLECTING: "Collecting details",
    RESULTS: "Results shown",
    CONFIRM_DETAILS: "Confirming details",
    HOLD_PLACED: "Hold placed",
    PAID: "Paid",
    EXPIRED: "Expired",
    HANDED_OVER: "With ops",
    RESOLVED: "Resolved",
    OPTED_OUT: "Opted out",
};

export const STATE_STYLE: Record<WaConversationState, string> = {
    GREETING: "bg-gray-100 text-gray-600 border-gray-200",
    COLLECTING: "bg-sky-50 text-sky-700 border-sky-200",
    RESULTS: "bg-indigo-50 text-indigo-700 border-indigo-200",
    CONFIRM_DETAILS: "bg-violet-50 text-violet-700 border-violet-200",
    HOLD_PLACED: "bg-amber-50 text-amber-700 border-amber-200",
    PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
    EXPIRED: "bg-slate-100 text-slate-500 border-slate-200",
    HANDED_OVER: "bg-orange-50 text-orange-700 border-orange-200",
    RESOLVED: "bg-gray-100 text-gray-500 border-gray-200",
    OPTED_OUT: "bg-red-50 text-red-700 border-red-200",
};

export const MODE_LABEL: Record<WaContactMode, string> = {
    GUEST: "Guest",
    AGENT: "Agent",
};

/** Why the chat reached ops. Unknown codes are shown humanised. */
const HANDOVER_REASON: Record<string, string> = {
    OPS_TAKEOVER: "Taken over by ops",
    USER_REQUEST: "Asked for a person",
    HELP: "Asked for help",
    FAILED_PARSE: "Bot could not understand twice",
    PARSE_FAILURES: "Bot could not understand twice",
};

export function handoverReasonLabel(reason?: string | null): string {
    if (!reason) return "—";
    return HANDOVER_REASON[reason] ?? humanise(reason);
}

export function humanise(value: string): string {
    const s = value.replace(/_/g, " ").toLowerCase();
    return s.charAt(0).toUpperCase() + s.slice(1);
}

export function contactName(c?: { profile_name?: string | null; user_name?: string | null; wa_id?: string } | null): string {
    return c?.user_name || c?.profile_name || (c?.wa_id ? `+${c.wa_id}` : "Unknown");
}

export function displayNumber(waId?: string | null): string {
    if (!waId) return "—";
    return waId.startsWith("+") ? waId : `+${waId}`;
}

// ---------------------------------------------------------------------------
// message payloads
// ---------------------------------------------------------------------------

export interface RenderedMessage {
    text: string;
    /** Button / list-row titles offered by an outbound interactive message. */
    options: string[];
    /** Extra one-line context, e.g. the template name or the list button label. */
    note?: string;
    imageUrl?: string;
}

const titlesOf = (items: unknown): string[] =>
    Array.isArray(items)
        ? items
              .map((b: any) => b?.reply?.title ?? b?.title ?? b?.text ?? null)
              .filter((t: unknown): t is string => typeof t === "string" && t.length > 0)
        : [];

/**
 * What a message says, for a human. `body` is the server's plain-text
 * rendering and wins when present; the payload fills in what the body
 * cannot carry (button titles, a template's name, an image).
 *
 * Accepts both Meta's wire shape (`interactive.action.buttons[].reply.title`,
 * `interactive.action.sections[].rows[]`, `template.name`) and the engine's
 * own OutboundMessage shape (`buttons[].title`, `rows[]`, `template_name`).
 */
export function renderMessage(m: WaMessage): RenderedMessage {
    const p: any = m.payload ?? {};
    const interactive = p.interactive ?? p;
    const action = interactive?.action ?? {};

    let text = m.body ?? "";
    if (!text) {
        text =
            interactive?.body?.text ??
            (typeof p.body === "string" ? p.body : "") ??
            "";
        if (!text) text = p.text?.body ?? (typeof p.text === "string" ? p.text : "") ?? "";
        if (!text) text = p.image?.caption ?? p.button_reply?.title ?? p.interactive?.button_reply?.title ?? "";
    }

    const options = [
        ...titlesOf(action.buttons),
        ...titlesOf(p.buttons),
        ...(Array.isArray(action.sections) ? action.sections.flatMap((s: any) => titlesOf(s?.rows)) : []),
        ...titlesOf(p.rows),
    ];
    // Dedupe while keeping order: both shapes may be present on one row.
    const uniqueOptions = Array.from(new Set(options));

    let note: string | undefined;
    if (m.type === "TEMPLATE") {
        const name = p.template?.name ?? p.template_name ?? p.name;
        note = name ? `Template: ${name}` : "Template message";
    } else if (m.type === "UNSUPPORTED") {
        note = "Sent something the bot cannot read (voice note, sticker, location…)";
    } else if (action.button || p.button_label) {
        note = `List: ${action.button ?? p.button_label}`;
    }

    const imageUrl: string | undefined =
        p.image?.link ?? p.image_url ?? interactive?.header?.image?.link ?? undefined;

    return { text, options: uniqueOptions, note, imageUrl };
}

// ---------------------------------------------------------------------------
// slots
// ---------------------------------------------------------------------------

/** The bot's read-back of what it has understood, as label/value rows. */
export function slotRows(slots: Record<string, any> | null | undefined): { label: string; value: string }[] {
    const s = slots ?? {};
    const rows: { label: string; value: string }[] = [];
    const area = s.area_label ?? s.area;
    if (area) rows.push({ label: "Area", value: typeof area === "string" ? area : JSON.stringify(area) });
    if (s.check_in || s.check_out) {
        rows.push({ label: "Dates", value: `${s.check_in ?? "?"} to ${s.check_out ?? "?"}` });
    }
    if (s.guests) rows.push({ label: "Guests", value: String(s.guests) });
    if (s.bedrooms) rows.push({ label: "Bedrooms", value: String(s.bedrooms) });
    if (s.budget_min || s.budget_max) {
        const min = s.budget_min ? ngnText(s.budget_min) : null;
        const max = s.budget_max ? ngnText(s.budget_max) : null;
        rows.push({ label: "Budget", value: min && max ? `${min} to ${max}` : max ? `Up to ${max}` : `From ${min}` });
    }
    if (s.dates_error) rows.push({ label: "Date problem", value: String(s.dates_error) });
    if (s.raw_query) rows.push({ label: "Last search", value: String(s.raw_query) });
    return rows;
}

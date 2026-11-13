/**
 * One place that knows how this API reports failures.
 *
 * The backend returns three different shapes, and a handler that reads only
 * one of them shows the user nothing for the other two:
 *
 *   403 / 404 / 409   { detail: "Cannot reduce this unit to 1: 2 are already
 *                       booked for 2026-10-01..." }            <- a string
 *
 *   422 validation    { status, code, message, data }          <- under `message`
 *
 *   403 profile gate  { detail: { code: "PROFILE_INCOMPLETE",
 *                                 missing_fields: [...],
 *                                 message: "..." } }           <- an object
 *
 * Reading only `detail` loses every validation error. Reading only `message`
 * loses every conflict. Rendering `detail` straight into a toast prints
 * "[object Object]" on the profile gate.
 *
 * That matters more than it looks: the server's refusals name the blocking
 * date, the blocking booking reference, and the lowest value it will accept.
 * Replacing that with "Failed to update unit" throws away the part the user
 * needs to act on.
 */

export type ApiErrorShape = {
    response?: {
        status?: number;
        data?: {
            detail?: unknown;
            message?: string;
            [k: string]: unknown;
        };
    };
    message?: string;
};

/** Structured payload of the profile-completeness gate, when that is what failed. */
export type ProfileIncomplete = {
    code: "PROFILE_INCOMPLETE";
    missing_fields: string[];
    message?: string;
};

/**
 * The profile gate, when this error is one — otherwise null.
 *
 * Callers that can render the dedicated "complete your profile" dialog should
 * check this first; it carries the field list a toast cannot usefully show.
 */
export function getProfileIncomplete(error: unknown): ProfileIncomplete | null {
    const detail = (error as ApiErrorShape)?.response?.data?.detail;
    if (
        detail &&
        typeof detail === "object" &&
        (detail as { code?: string }).code === "PROFILE_INCOMPLETE"
    ) {
        const d = detail as Partial<ProfileIncomplete>;
        return {
            code: "PROFILE_INCOMPLETE",
            missing_fields: Array.isArray(d.missing_fields) ? d.missing_fields : [],
            message: typeof d.message === "string" ? d.message : undefined,
        };
    }
    return null;
}

/**
 * The most useful human-readable message this error carries.
 *
 * Always returns something renderable — never an object, never "undefined".
 * Pass `fallback` for the case where the server said nothing useful (a network
 * failure, a 500), so the caller still shows domain-appropriate wording.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
    const data = (error as ApiErrorShape)?.response?.data;
    if (!data) {
        // No response at all: offline, DNS, CORS, timeout.
        return fallback;
    }

    const { detail } = data;

    // 4xx from HTTPException — the common case, and the one carrying the
    // actionable text.
    if (typeof detail === "string" && detail.trim()) return detail;

    // Structured detail (the profile gate, and anything shaped like it).
    if (detail && typeof detail === "object") {
        const nested = (detail as { message?: unknown }).message;
        if (typeof nested === "string" && nested.trim()) return nested;
    }

    // FastAPI's raw validation array, if the custom 422 handler is ever bypassed.
    if (Array.isArray(detail) && detail.length) {
        const first = detail[0] as { msg?: unknown; loc?: unknown[] };
        if (typeof first?.msg === "string") {
            const field = Array.isArray(first.loc) ? first.loc[first.loc.length - 1] : undefined;
            return field ? `${String(field)}: ${first.msg}` : first.msg;
        }
    }

    // The custom 422 handler's shape.
    if (typeof data.message === "string" && data.message.trim()) return data.message;

    return fallback;
}

/** True when the server refused because the action conflicts with live state. */
export function isConflict(error: unknown): boolean {
    return (error as ApiErrorShape)?.response?.status === 409;
}

import { getApiErrorMessage } from "./apiError";

/**
 * Self-service email change: what the API's refusals mean in plain words.
 *
 * Flow: POST /profile/email/change sends a 6-digit code to the NEW address,
 * POST /profile/email/confirm switches to it, DELETE cancels. The code proves
 * the new address receives mail, so a hijacked session can't quietly move the
 * account, and a typo can't replace a typo. Pure (relative imports only) so it
 * runs under the Node unit tests.
 */

export const EMAIL_CODE_LENGTH = 6;

/** Digits only, at most six: what a pasted "123 456" or "Code: 123456" becomes. */
export function sanitizeEmailCode(raw: string): string {
    return (raw || "").replace(/\D/g, "").slice(0, EMAIL_CODE_LENGTH);
}

export type EmailChangeErrorKind =
    | "wrong_code"
    | "expired"
    | "taken"
    | "rate_limited"
    | "invalid_email"
    | "other";

export interface EmailChangeError {
    kind: EmailChangeErrorKind;
    message: string;
    /** Tries left on this code, when the API said. 0 means the change was cleared. */
    attemptsLeft: number | null;
}

type ErrorBody = { response?: { status?: number; data?: { detail?: unknown; message?: unknown } } };

const ATTEMPT_KEYS = ["attempts_left", "attempts_remaining", "tries_left", "remaining_attempts"];

/** The API's 400 for a bad code may be a sentence or `{ code, message, attempts_left }`. */
function readDetail(error: unknown): { code: string; text: string; attempts: number | null } {
    const detail = (error as ErrorBody)?.response?.data?.detail;
    let code = "";
    let text = "";
    let attempts: number | null = null;

    if (typeof detail === "string") {
        text = detail;
    } else if (detail && typeof detail === "object" && !Array.isArray(detail)) {
        const d = detail as Record<string, unknown>;
        if (typeof d.code === "string") code = d.code;
        else if (typeof d.reason === "string") code = d.reason;
        if (typeof d.message === "string") text = d.message;
        for (const key of ATTEMPT_KEYS) {
            const n = Number(d[key]);
            if (d[key] !== undefined && d[key] !== null && Number.isFinite(n)) {
                attempts = Math.max(0, Math.floor(n));
                break;
            }
        }
    }

    if (attempts === null && text) {
        const match = text.match(/(\d+)\s+(?:more\s+)?(?:tries|try|attempts?)\s+(?:left|remaining)/i);
        if (match) attempts = Number(match[1]);
    }
    return { code: code.toUpperCase(), text, attempts };
}

/** "That code isn't right. 3 tries left." */
export function wrongCodeMessage(attemptsLeft: number | null): string {
    if (attemptsLeft === null) return "That code isn't right.";
    if (attemptsLeft <= 0) return "That code isn't right, and that was the last try. Send a new code.";
    return `That code isn't right. ${attemptsLeft} ${attemptsLeft === 1 ? "try" : "tries"} left.`;
}

export const EXPIRED_CODE_MESSAGE = "That code has expired. Send a new one.";
export const EMAIL_TAKEN_MESSAGE = "Another account already uses that email.";
export const RATE_LIMITED_MESSAGE = "Please wait a minute before asking for another code.";

/**
 * Turn a failed change/confirm/resend/cancel call into the sentence to show.
 * `stage` is "request" for POST /change (sending or re-sending a code) and
 * "confirm" for POST /confirm.
 */
export function emailChangeError(error: unknown, stage: "request" | "confirm"): EmailChangeError {
    const status = (error as ErrorBody)?.response?.status;
    const fallback =
        stage === "confirm" ? "Couldn't confirm the code. Try again." : "Couldn't send the code. Try again.";

    if (status === 409) return { kind: "taken", message: EMAIL_TAKEN_MESSAGE, attemptsLeft: null };
    if (status === 429) return { kind: "rate_limited", message: RATE_LIMITED_MESSAGE, attemptsLeft: null };
    if (status === 422) {
        return {
            kind: "invalid_email",
            message: "That doesn't look like a valid email address.",
            attemptsLeft: null,
        };
    }

    if (status === 400 && stage === "confirm") {
        const { code, text, attempts } = readDetail(error);
        if (/EXPIRED/.test(code) || /expired/i.test(text)) {
            return { kind: "expired", message: EXPIRED_CODE_MESSAGE, attemptsLeft: null };
        }
        const wrong =
            /INVALID|WRONG|INCORRECT|MISMATCH/.test(code) ||
            /isn.t right|incorrect|invalid|wrong|doesn.t match|does not match/i.test(text) ||
            attempts !== null;
        if (wrong) return { kind: "wrong_code", message: wrongCodeMessage(attempts), attemptsLeft: attempts };
    }

    // Anything else (same as the current address, no pending change, a 500):
    // the API's own sentence beats a generic one.
    return { kind: "other", message: getApiErrorMessage(error, fallback), attemptsLeft: null };
}

/** Whole seconds until `timestamp` (ms), never negative; 0 when there is none. */
export function secondsUntil(timestamp: number | null, now: number): number {
    if (timestamp === null) return 0;
    return Math.max(0, Math.ceil((timestamp - now) / 1000));
}

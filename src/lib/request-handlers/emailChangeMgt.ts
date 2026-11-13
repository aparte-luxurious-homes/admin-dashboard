import { useMutation } from "@tanstack/react-query";
import axiosRequest from "../api";
import { API_ROUTES } from "../routes/endpoints";
import { unwrap, type EmailStatus } from "./emailHealthMgt";

/**
 * Changing your OWN email address. The new address has to prove it receives
 * mail: POST /profile/email/change emails it a 6-digit code (valid 15
 * minutes, 5 tries), POST /profile/email/confirm switches to it, DELETE
 * cancels. PUT /profile refuses an email change outright.
 *
 * Staff fixing someone else's address use PATCH /admin/users/{id}/email
 * (FixUserEmail) instead, which needs no code.
 *
 * Errors are left to the caller: emailChangeError() in lib/email-change.ts
 * turns each refusal into the sentence to show.
 */

export interface EmailChangeRequested {
    pending_email: string;
    expires_at: string | null;
    /** How long before another code may be requested. */
    resend_after_seconds: number;
}

export interface EmailChangeConfirmed {
    email: string;
    email_status: EmailStatus;
    email_bounced_at: string | null;
    email_bounce_reason: string | null;
    email_suggestion: string | null;
    /** Failed emails the API re-sent to the new address. */
    resent: number;
}

/** Send (or re-send) a code to `email`. */
export function RequestEmailChange() {
    return useMutation({
        mutationFn: async (email: string): Promise<EmailChangeRequested> => {
            const res = await axiosRequest.post(API_ROUTES.profile.emailChange, { email: email.trim() });
            const body = unwrap<Partial<EmailChangeRequested>>(res?.data, "pending_email");
            const wait = Number(body?.resend_after_seconds);
            return {
                pending_email: body?.pending_email || email.trim(),
                expires_at: body?.expires_at ?? null,
                resend_after_seconds: Number.isFinite(wait) && wait >= 0 ? wait : 60,
            };
        },
    });
}

/** Switch to the pending address with the code that was emailed to it. */
export function ConfirmEmailChange() {
    return useMutation({
        mutationFn: async (code: string): Promise<EmailChangeConfirmed> => {
            const res = await axiosRequest.post(API_ROUTES.profile.emailConfirm, { code });
            const body = unwrap<EmailChangeConfirmed>(res?.data, "email");
            return { ...body, resent: Number(body?.resent ?? 0) };
        },
    });
}

/** Drop the pending change. The current address stays as it is. */
export function CancelEmailChange() {
    return useMutation({
        mutationFn: async (): Promise<void> => {
            await axiosRequest.delete(API_ROUTES.profile.emailChange);
        },
    });
}

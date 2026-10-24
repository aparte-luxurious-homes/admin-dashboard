"use client";

import React, { FormEvent, useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import CustomModal from "@/src/components/ui/CustomModal";
import EmailSuggestion from "@/src/components/shared/EmailSuggestion";
import { isLikelyEmail } from "@/src/lib/email-check";
import {
    EMAIL_CODE_LENGTH,
    emailChangeError,
    sanitizeEmailCode,
    secondsUntil,
} from "@/src/lib/email-change";
import {
    CancelEmailChange,
    ConfirmEmailChange,
    RequestEmailChange,
} from "@/src/lib/request-handlers/emailChangeMgt";

type Step = "email" | "code" | "done";

interface ChangeEmailDialogProps {
    /** Mount only while open: the steps start from these props once. */
    onClose: () => void;
    currentEmail: string;
    /** A change already waiting for its code: open on the code step. */
    pendingEmail?: string | null;
    /** Pre-fills the new address, e.g. the API's typo correction. */
    suggestion?: string | null;
    /**
     * Called whenever the server-side state moved (a code was sent, the
     * change was confirmed or cancelled), so the page can refetch the user.
     */
    onChanged?: () => void;
}

const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm";
const primaryButton =
    "px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
const secondaryButton =
    "px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm text-gray-700 font-medium disabled:opacity-50";

/**
 * Change your own email: new address → 6-digit code sent to it → confirm.
 *
 * The code goes to the NEW address, which is the point: it proves the
 * address receives mail before the account moves to it. Closing the dialog
 * leaves a pending change in place; the page shows it and reopens here on
 * the code step.
 */
const ChangeEmailDialog: React.FC<ChangeEmailDialogProps> = ({
    onClose,
    currentEmail,
    pendingEmail,
    suggestion,
    onChanged,
}) => {
    const [step, setStep] = useState<Step>(pendingEmail ? "code" : "email");
    const [email, setEmail] = useState(suggestion || "");
    const [sentTo, setSentTo] = useState(pendingEmail || "");
    const [code, setCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    // A resumed change carries no timer; the API's 429 covers an early resend.
    const [resendAt, setResendAt] = useState<number | null>(null);
    const [now, setNow] = useState(() => Date.now());
    const [finalEmail, setFinalEmail] = useState("");
    const [resent, setResent] = useState(0);

    const request = RequestEmailChange();
    const confirm = ConfirmEmailChange();
    const cancel = CancelEmailChange();
    const busy = request.isPending || confirm.isPending || cancel.isPending;

    const waitSeconds = secondsUntil(resendAt, now);
    useEffect(() => {
        if (step !== "code" || resendAt === null || resendAt <= Date.now()) return;
        const timer = setInterval(() => {
            const t = Date.now();
            setNow(t);
            if (t >= resendAt) clearInterval(timer);
        }, 1000);
        return () => clearInterval(timer);
    }, [step, resendAt]);

    const trimmed = email.trim();
    const sameAsCurrent = !!trimmed && trimmed.toLowerCase() === (currentEmail || "").trim().toLowerCase();
    const canSend = isLikelyEmail(trimmed) && !sameAsCurrent && !busy;
    const canConfirm = code.length === EMAIL_CODE_LENGTH && !busy;

    const sendCode = async (address: string, isResend: boolean) => {
        setError(null);
        try {
            const result = await request.mutateAsync(address);
            setSentTo(result.pending_email);
            setResendAt(Date.now() + result.resend_after_seconds * 1000);
            setNow(Date.now());
            setCode("");
            setStep("code");
            if (isResend) toast.success(`We sent a new code to ${result.pending_email}.`);
            onChanged?.();
        } catch (err) {
            setError(emailChangeError(err, "request").message);
        }
    };

    const onSubmitEmail = (e: FormEvent) => {
        e.preventDefault();
        if (canSend) void sendCode(trimmed, false);
    };

    const onSubmitCode = async (e: FormEvent) => {
        e.preventDefault();
        if (!canConfirm) return;
        setError(null);
        try {
            const result = await confirm.mutateAsync(code);
            setFinalEmail(result.email || sentTo);
            setResent(result.resent);
            setStep("done");
            onChanged?.();
        } catch (err) {
            const failure = emailChangeError(err, "confirm");
            setError(failure.message);
            setCode("");
            // Out of tries, or expired: the code is dead, so let them ask for a new one now.
            if (failure.kind === "expired" || failure.attemptsLeft === 0) setResendAt(null);
            if (failure.kind === "taken") onChanged?.();
        }
    };

    const onCancelChange = async () => {
        setError(null);
        try {
            await cancel.mutateAsync();
            toast.success("Email change cancelled. Your email is still " + currentEmail + ".");
            onChanged?.();
            onClose();
        } catch (err) {
            setError(emailChangeError(err, "request").message);
        }
    };

    const title = step === "done" ? "Email changed" : "Change email";

    return (
        <CustomModal isOpen onClose={onClose} title={title}>
            {step === "email" && (
                <form onSubmit={onSubmitEmail} className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Your email is <span className="font-semibold text-gray-900 break-all">{currentEmail}</span>.
                        We&apos;ll send a 6-digit code to the new address to check it receives mail.
                    </p>
                    <div>
                        <label htmlFor="change-email-input" className="text-sm font-medium text-gray-700 block mb-1">
                            New email address
                        </label>
                        <input
                            id="change-email-input"
                            type="email"
                            autoComplete="email"
                            autoFocus
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setError(null);
                            }}
                            className={inputClass}
                        />
                        <EmailSuggestion email={email} onApply={setEmail} />
                        {sameAsCurrent && (
                            <p className="text-xs text-gray-500 mt-1 ml-1">This is your email now.</p>
                        )}
                    </div>
                    {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} disabled={busy} className={secondaryButton}>
                            Cancel
                        </button>
                        <button type="submit" disabled={!canSend} className={primaryButton}>
                            {request.isPending && <Icon icon="mdi:loading" className="animate-spin w-4 h-4" />}
                            Send code
                        </button>
                    </div>
                </form>
            )}

            {step === "code" && (
                <form onSubmit={onSubmitCode} className="space-y-4">
                    <p className="text-sm text-gray-600">
                        We sent a 6-digit code to{" "}
                        <span className="font-semibold text-gray-900 break-all">{sentTo}</span>. Enter it to
                        switch your account to that address.
                    </p>
                    <div>
                        <label htmlFor="change-email-code" className="text-sm font-medium text-gray-700 block mb-1">
                            Code
                        </label>
                        <input
                            id="change-email-code"
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            autoFocus
                            maxLength={EMAIL_CODE_LENGTH + 4}
                            value={code}
                            onChange={(e) => {
                                setCode(sanitizeEmailCode(e.target.value));
                                setError(null);
                            }}
                            placeholder="123456"
                            className={`${inputClass} tracking-[0.4em] font-mono text-base`}
                        />
                        <div className="mt-2 ml-1 text-xs text-gray-500">
                            {waitSeconds > 0 ? (
                                <span>Didn&apos;t get it? You can ask for a new code in {waitSeconds}s.</span>
                            ) : (
                                <span>
                                    Didn&apos;t get it? Check spam, or{" "}
                                    <button
                                        type="button"
                                        onClick={() => void sendCode(sentTo, true)}
                                        disabled={busy}
                                        className="font-semibold text-primary underline underline-offset-2 disabled:opacity-50"
                                    >
                                        send a new code
                                    </button>
                                    .
                                </span>
                            )}
                        </div>
                    </div>
                    {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
                    <div className="flex flex-wrap justify-between gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => void onCancelChange()}
                            disabled={busy}
                            className="px-2 py-2 text-sm text-gray-600 hover:text-red-600 font-medium disabled:opacity-50 flex items-center gap-2"
                        >
                            {cancel.isPending && <Icon icon="mdi:loading" className="animate-spin w-4 h-4" />}
                            Cancel change
                        </button>
                        <button type="submit" disabled={!canConfirm} className={primaryButton}>
                            {confirm.isPending && <Icon icon="mdi:loading" className="animate-spin w-4 h-4" />}
                            Confirm
                        </button>
                    </div>
                </form>
            )}

            {step === "done" && (
                <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-100 rounded-lg">
                        <Icon icon="mdi:email-check-outline" className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                        <div className="text-sm text-green-900 space-y-1">
                            <p>
                                Your email is now <span className="font-semibold break-all">{finalEmail}</span>.
                            </p>
                            {resent > 0 && (
                                <p>
                                    We re-sent {resent} email{resent === 1 ? "" : "s"} that didn&apos;t reach you
                                    before.
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-end pt-2">
                        <button type="button" onClick={onClose} className={primaryButton}>
                            Done
                        </button>
                    </div>
                </div>
            )}
        </CustomModal>
    );
};

export default ChangeEmailDialog;

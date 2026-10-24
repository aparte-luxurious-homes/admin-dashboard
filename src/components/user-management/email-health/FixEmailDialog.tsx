"use client";

import React, { FormEvent, useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import CustomModal from "@/src/components/ui/CustomModal";
import EmailSuggestion from "@/src/components/shared/EmailSuggestion";
import { getApiErrorMessage } from "@/src/lib/apiError";
import { isLikelyEmail } from "@/src/lib/email-check";
import { ResendFailedEmails, UpdateUserEmail } from "@/src/lib/request-handlers/emailHealthMgt";

interface FixEmailDialogProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    /** Shown in the title, e.g. "Jane Doe". */
    userLabel?: string | null;
    currentEmail: string;
    /** Pre-fills the field when the API thinks it knows the right address. */
    suggestion?: string | null;
    reason?: string | null;
    /**
     * Called when the dialog closes after a successful save, so the caller can
     * refetch. Not on save itself: a refetch that remounts the caller would
     * take the Resend step away mid-dialog.
     */
    onFixed?: () => void;
}

/**
 * Correct a bouncing address, then offer to resend what failed.
 *
 * Saving goes through the ordinary admin user update with only `email` set.
 * The API resets the bounce state and re-sends the last 7 days of failed
 * emails on an address change by itself; the Resend button is the manual
 * second try (the endpoint is idempotent), not a required step.
 */
const FixEmailDialog: React.FC<FixEmailDialogProps> = ({
    isOpen,
    onClose,
    userId,
    userLabel,
    currentEmail,
    suggestion,
    reason,
    onFixed,
}) => {
    const [email, setEmail] = useState("");
    const [savedEmail, setSavedEmail] = useState<string | null>(null);
    const update = UpdateUserEmail();
    const resend = ResendFailedEmails();

    useEffect(() => {
        if (isOpen) {
            setEmail(suggestion || currentEmail || "");
            setSavedEmail(null);
        }
    }, [isOpen, suggestion, currentEmail]);

    const trimmed = email.trim();
    const unchanged = trimmed.toLowerCase() === (currentEmail || "").trim().toLowerCase();
    const canSave = isLikelyEmail(trimmed) && !unchanged && !update.isPending;

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!canSave) return;
        try {
            await update.mutateAsync({ userId, email: trimmed });
            toast.success("Email updated.");
            setSavedEmail(trimmed);
        } catch (error) {
            // The update rides users.update, which not every role that can SEE
            // email health holds (support staff usually don't).
            const status = (error as { response?: { status?: number } })?.response?.status;
            toast.error(
                status === 403
                    ? "Your role can't change email addresses. Ask an admin to make this fix."
                    : getApiErrorMessage(error, "Couldn't update the email.")
            );
        }
    };

    const onResend = async () => {
        try {
            const { resent } = await resend.mutateAsync(userId);
            toast.success(
                resent > 0
                    ? `Re-sent ${resent} email${resent === 1 ? "" : "s"}.`
                    : "Nothing to resend. Recent emails have already gone out."
            );
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Couldn't resend the failed emails."));
        }
    };

    const handleClose = () => {
        if (savedEmail) onFixed?.();
        onClose();
    };

    const title = userLabel ? `Fix email for ${userLabel}` : "Fix email";

    return (
        <CustomModal isOpen={isOpen} onClose={handleClose} title={title}>
            {savedEmail ? (
                <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-100 rounded-lg">
                        <Icon icon="mdi:check-circle" className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                        <div className="text-sm text-green-900">
                            Email changed to <span className="font-semibold break-all">{savedEmail}</span>.
                            Emails that failed in the last 7 days are re-sent to the new address
                            automatically.
                        </div>
                    </div>
                    <p className="text-sm text-gray-600">
                        If they still say something is missing, resend now.
                    </p>
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onResend}
                            disabled={resend.isPending}
                            className="px-4 py-2 border border-primary/30 text-primary rounded-lg bg-white hover:bg-primary/5 text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                        >
                            <Icon
                                icon={resend.isPending ? "mdi:loading" : "mdi:email-sync-outline"}
                                className={`w-4 h-4 ${resend.isPending ? "animate-spin" : ""}`}
                            />
                            Resend failed emails
                        </button>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg"
                        >
                            Done
                        </button>
                    </div>
                </div>
            ) : (
                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                        <Icon icon="mdi:email-alert-outline" className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                        <div className="text-sm text-amber-900 space-y-1">
                            <p>
                                Emails to <span className="font-semibold break-all">{currentEmail}</span>{" "}
                                aren&apos;t arriving.
                            </p>
                            {reason && <p>{reason}</p>}
                            <p>Confirm the right address with them before you save.</p>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="fix-email-input" className="text-sm font-medium text-gray-700 block mb-1">
                            Correct email address
                        </label>
                        <input
                            id="fix-email-input"
                            type="email"
                            autoComplete="off"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                        />
                        <EmailSuggestion email={email} onApply={setEmail} />
                        {unchanged && trimmed && (
                            <p className="text-xs text-gray-500 mt-1 ml-1">This is the address on file now.</p>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={update.isPending}
                            className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm text-gray-700 font-medium disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!canSave}
                            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {update.isPending && <Icon icon="mdi:loading" className="animate-spin w-4 h-4" />}
                            Save email
                        </button>
                    </div>
                </form>
            )}
        </CustomModal>
    );
};

export default FixEmailDialog;

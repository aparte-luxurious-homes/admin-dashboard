"use client";

import React, { FormEvent, useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import CustomModal from "@/src/components/ui/CustomModal";
import EmailSuggestion from "@/src/components/shared/EmailSuggestion";
import { getApiErrorMessage } from "@/src/lib/apiError";
import { isLikelyEmail } from "@/src/lib/email-check";
import { FixUserEmail, fixEmailErrorMessage } from "@/src/lib/request-handlers/emailHealthMgt";

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
    /** Called after the address is saved, so the caller can refetch. */
    onFixed?: () => void;
}

/**
 * Correct a bouncing address via `PATCH /admin/users/{id}/email`.
 *
 * One step: the API resets the bounce state, reactivates the address with
 * Postmark and re-sends the last 7 days of failed emails in the same call,
 * and reports how many it re-sent. Render only where canFixEmailFor() allows; the
 * route is gated on users.fix_email, which SUPPORT_ADMIN does not hold.
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
    const fix = FixUserEmail();

    useEffect(() => {
        if (isOpen) setEmail(suggestion || currentEmail || "");
    }, [isOpen, suggestion, currentEmail]);

    const trimmed = email.trim();
    const unchanged = trimmed.toLowerCase() === (currentEmail || "").trim().toLowerCase();
    const canSave = isLikelyEmail(trimmed) && !unchanged && !fix.isPending;

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!canSave) return;
        try {
            const { resent } = await fix.mutateAsync({ userId, email: trimmed });
            toast.success(
                resent > 0
                    ? `Saved. Re-sent ${resent} email${resent === 1 ? "" : "s"}.`
                    : "Saved. There were no failed emails to re-send."
            );
            // Close first: the caller's refetch may remount the component hosting us.
            onClose();
            onFixed?.();
        } catch (error) {
            toast.error(
                fixEmailErrorMessage(error) ?? getApiErrorMessage(error, "Couldn't update the email.")
            );
        }
    };

    const title = userLabel ? `Fix email for ${userLabel}` : "Fix email";

    return (
        <CustomModal isOpen={isOpen} onClose={onClose} title={title}>
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
                        onClick={onClose}
                        disabled={fix.isPending}
                        className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm text-gray-700 font-medium disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!canSave}
                        className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {fix.isPending && <Icon icon="mdi:loading" className="animate-spin w-4 h-4" />}
                        Save email
                    </button>
                </div>
            </form>
        </CustomModal>
    );
};

export default FixEmailDialog;

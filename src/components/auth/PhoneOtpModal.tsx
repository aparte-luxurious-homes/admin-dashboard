"use client";

import { MESSAGES } from '@/src/lib/messages';
import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import CustomModal from "@/src/components/ui/CustomModal";
import {
    GuestAccountError,
    useRequestPhoneOtp,
    useVerifyPhoneOtp,
} from "@/src/hooks/useAuth";
import type { IUser } from "@/src/lib/types";

/**
 * The sign-in challenge from a 401 PHONE_VERIFICATION_REQUIRED on
 * POST /auth/login. `challenge` is a short-lived token naming the account; it
 * is what lets the phone endpoints send, re-target and verify a code without a
 * session, and it is not an access token.
 */
export interface PhoneVerificationChallenge {
    challenge: string;
    /** Full number on file, when there is one. Only used to prefill "Change it". */
    phone: string | null;
    phoneMasked: string | null;
    phoneOnFile: boolean;
    /** A code is already on its way (or was sent minutes ago and is still live). */
    otpSent: boolean;
    resendAfterSeconds: number;
    message: string | null;
}

/** The challenge carried by a login 401, or null if this error isn't one. */
export function parsePhoneVerificationDetail(detail: unknown): PhoneVerificationChallenge | null {
    if (!detail || typeof detail !== "object") return null;
    const d = detail as Record<string, any>;
    if (d.code !== "PHONE_VERIFICATION_REQUIRED") return null;
    if (typeof d.challenge !== "string" || !d.challenge) return null;
    const phone = typeof d.phone === "string" && d.phone ? d.phone : null;
    return {
        challenge: d.challenge,
        phone,
        phoneMasked: typeof d.phone_masked === "string" && d.phone_masked ? d.phone_masked : maskPhone(phone),
        phoneOnFile: typeof d.phone_on_file === "boolean" ? d.phone_on_file : Boolean(phone),
        otpSent: d.otp_sent === true,
        resendAfterSeconds: Math.max(0, Number(d.resend_after_seconds) || 0),
        message: typeof d.message === "string" ? d.message : null,
    };
}

interface PhoneOtpModalProps {
    isOpen: boolean;
    challenge: PhoneVerificationChallenge | null;
    onClose: () => void;
    /** The verified account is a GUEST: hand its session to the page, which
     *  offers the account-type switch instead of refusing. */
    onGuestAccount?: (session: { token: string; user: IUser }) => void;
}

const OTP_LENGTH = 6;
/** Fallback when the server doesn't say; matches PHONE_OTP_RESEND_SECONDS. */
const DEFAULT_RESEND_SECONDS = 60;

/** `+234803***4567`, the same shape the API masks with. */
function maskPhone(phone: string | null): string | null {
    if (!phone) return null;
    if (phone.length < 8) return "***";
    return `${phone.slice(0, -7)}***${phone.slice(-4)}`;
}

/**
 * `+234XXXXXXXXXX` for a Nigerian mobile number typed any common way
 * (0803..., 803..., 234803..., +234 803 ...), else null. Mirrors the API's
 * normalize_phone for Nigerian numbers; the platform is Nigeria-locked.
 */
export function normalizeNigerianPhone(raw: string): string | null {
    const digits = raw.replace(/\D/g, "");
    let national: string;
    if (digits.startsWith("234")) national = digits.slice(3);
    else if (digits.startsWith("0")) national = digits.slice(1);
    else national = digits;
    return /^[789]\d{9}$/.test(national) ? `+234${national}` : null;
}

/** The part of a stored number that goes after the fixed +234 prefix. */
function nationalPart(phone: string | null): string {
    if (!phone) return "";
    const normalized = normalizeNigerianPhone(phone);
    return normalized ? normalized.slice(4) : "";
}

// Backend returns errors as `{detail: "..."}` (string) or `{detail: {message: "..."}}`
// (object with code) or `{message: "..."}` depending on the handler. Pull whichever is set.
const extractApiMessage = (err: any, fallback: string): string => {
    const data = err?.response?.data;
    if (!data) return err?.message || fallback;
    const candidate =
        (typeof data.detail === "string" && data.detail) ||
        data.detail?.message ||
        data.message ||
        err?.message;
    return typeof candidate === "string" && candidate ? candidate : fallback;
};

const errorCode = (err: any): string | undefined => {
    const detail = err?.response?.data?.detail;
    return detail && typeof detail === "object" ? detail.code : undefined;
};

const PhoneOtpModal = ({ isOpen, challenge, onClose, onGuestAccount }: PhoneOtpModalProps) => {
    const [step, setStep] = useState<"phone" | "code">("code");
    const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
    const [phoneMasked, setPhoneMasked] = useState<string | null>(null);
    const [hasPhoneOnFile, setHasPhoneOnFile] = useState(false);
    const [codeSent, setCodeSent] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [limitReached, setLimitReached] = useState(false);
    const [phoneInput, setPhoneInput] = useState("");
    const [phoneError, setPhoneError] = useState<string | null>(null);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const phoneInputRef = useRef<HTMLInputElement | null>(null);

    const verifyMutation = useVerifyPhoneOtp();
    const requestMutation = useRequestPhoneOtp();

    // Start over for every new challenge: a second sign-in attempt hands back
    // a fresh one, with its own idea of whether a code went out.
    useEffect(() => {
        if (!isOpen || !challenge) return;
        const needsPhone = !challenge.phoneOnFile;
        setStep(needsPhone ? "phone" : "code");
        setDigits(Array(OTP_LENGTH).fill(""));
        setPhoneMasked(challenge.phoneMasked);
        setHasPhoneOnFile(challenge.phoneOnFile);
        // A code that went out moments ago may be reported as not sent this
        // time round, but the server is still holding a cooldown for it: treat
        // it as in the user's hands rather than inviting a send that will 429.
        setCodeSent(challenge.otpSent || challenge.resendAfterSeconds > 0);
        setCooldown(challenge.resendAfterSeconds);
        setLimitReached(false);
        setPhoneInput(nationalPart(challenge.phone));
        setPhoneError(null);
        const timer = setTimeout(() => {
            if (needsPhone) phoneInputRef.current?.focus();
            else inputRefs.current[0]?.focus();
        }, 50);
        return () => clearTimeout(timer);
    }, [isOpen, challenge]);

    // Resend cooldown countdown, driven by what the server last said.
    useEffect(() => {
        if (!isOpen || cooldown <= 0) return;
        const timer = setTimeout(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
        return () => clearTimeout(timer);
    }, [isOpen, cooldown]);

    if (!challenge) return null;

    const busy = verifyMutation.isPending || requestMutation.isPending;

    /** The challenge is dead (expired, or the password changed since): start over. */
    const endChallenge = (err: any) => {
        toast.error(
            extractApiMessage(err, "This verification session has expired. Sign in again to get a new code."),
            { duration: 6000 },
        );
        onClose();
    };

    const focusFirstDigit = () => setTimeout(() => inputRefs.current[0]?.focus(), 50);

    /** Send (or resend) the code. With `newPhone`, the number on the account is set first. */
    const sendCode = async (newPhone?: string) => {
        try {
            const result = await requestMutation.mutateAsync({
                challenge: challenge.challenge,
                ...(newPhone ? { phone: newPhone } : {}),
            });
            const masked = result.phoneMasked ?? maskPhone(result.phone ?? newPhone ?? null) ?? phoneMasked;
            setPhoneMasked(masked);
            setHasPhoneOnFile(true);
            setCodeSent(true);
            setCooldown(result.resendAfterSeconds || DEFAULT_RESEND_SECONDS);
            setDigits(Array(OTP_LENGTH).fill(""));
            setStep("code");
            toast.success(masked ? `We've texted a code to ${masked}.` : MESSAGES.MSG_NEW_OTP_SENT_TO_YOUR_PHONE);
            focusFirstDigit();
        } catch (err: any) {
            const status = err?.response?.status;
            const code = errorCode(err);
            if (status === 401) {
                endChallenge(err);
                return;
            }
            if (code === "PHONE_OTP_COOLDOWN") {
                const wait = Number(err?.response?.data?.detail?.resend_after_seconds);
                setCooldown(wait > 0 ? wait : DEFAULT_RESEND_SECONDS);
            } else if (code === "PHONE_OTP_LIMIT") {
                setLimitReached(true);
            } else if (code === "SMS_NOT_DELIVERED" && newPhone) {
                // The new number was saved before the text failed. Show it as
                // the number on file so "Send code" retries it, and "Change it"
                // fixes a typo.
                setPhoneMasked(maskPhone(newPhone));
                setHasPhoneOnFile(true);
                setCodeSent(false);
                setStep("code");
            }
            if (step === "phone" && (status === 409 || status === 422)) {
                setPhoneError(extractApiMessage(err, "Enter a valid phone number."));
                return;
            }
            toast.error(extractApiMessage(err, "We couldn't send a code. Please try again."), { duration: 6000 });
        }
    };

    const submitPhone = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const normalized = normalizeNigerianPhone(phoneInput);
        if (!normalized) {
            setPhoneError("Enter a Nigerian mobile number, e.g. 0803 123 4567.");
            return;
        }
        setPhoneError(null);
        void sendCode(normalized);
    };

    const submit = async (otpString: string) => {
        try {
            await verifyMutation.mutateAsync({ challenge: challenge.challenge, otp: otpString });
            toast.success(MESSAGES.MSG_PHONE_VERIFIED_WELCOME_BACK);
            // useVerifyPhoneOtp's onSuccess handles the redirect.
        } catch (err: any) {
            if (err instanceof GuestAccountError && onGuestAccount) {
                onGuestAccount({ token: err.token, user: err.user });
                onClose();
                return;
            }
            if (err?.response?.status === 401) {
                endChallenge(err);
                return;
            }
            toast.error(extractApiMessage(err, "That code is not correct. Please try again."), { duration: 6000 });
            setDigits(Array(OTP_LENGTH).fill(""));
            inputRefs.current[0]?.focus();
        }
    };

    const handleChange = (index: number, value: string) => {
        // Only digits, take last char if pasted long string
        const cleaned = value.replace(/\D/g, "");
        if (!cleaned) {
            const next = [...digits];
            next[index] = "";
            setDigits(next);
            return;
        }

        const next = [...digits];

        // Handle paste of full code
        if (cleaned.length === OTP_LENGTH && index === 0) {
            const split = cleaned.split("");
            setDigits(split);
            inputRefs.current[OTP_LENGTH - 1]?.focus();
            void submit(split.join(""));
            return;
        }

        next[index] = cleaned.charAt(cleaned.length - 1);
        setDigits(next);

        if (index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        if (next.every((d) => d) && next.length === OTP_LENGTH) {
            void submit(next.join(""));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !digits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === "ArrowLeft" && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const openChangeNumber = () => {
        setPhoneError(null);
        setStep("phone");
        setTimeout(() => phoneInputRef.current?.focus(), 50);
    };

    const handleClose = () => {
        if (verifyMutation.isPending) return;
        onClose();
    };

    const sendLabel = (idle: string) =>
        requestMutation.isPending
            ? "Sending..."
            : cooldown > 0
                ? `${idle} in ${cooldown}s`
                : idle;

    const sendDisabled = busy || cooldown > 0 || limitReached;

    return (
        <CustomModal
            isOpen={isOpen}
            onClose={handleClose}
            title={step === "phone" ? (hasPhoneOnFile ? "Change your phone number" : "Add your phone number") : "Confirm your phone number"}
        >
            {step === "phone" ? (
                <form className="space-y-5" onSubmit={submitPhone} noValidate>
                    <div className="flex items-start gap-3 p-3 bg-[#f4fbfb] border border-[#cfe9eb] rounded-lg">
                        <Icon icon="mdi:cellphone-message" className="w-5 h-5 text-[#028090] mt-0.5 shrink-0" />
                        <div className="text-sm text-gray-700">
                            {hasPhoneOnFile
                                ? "Enter the number you want on your account. We'll text a code to it to confirm it."
                                : "Add your phone number to continue. We'll text you a code to confirm it."}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="phone-verify-number" className="block text-sm font-medium text-gray-700 mb-1.5">
                            Phone number
                        </label>
                        <div
                            className={`flex items-stretch rounded-lg border-2 overflow-hidden transition-all focus-within:ring-2 focus-within:ring-[#028090]/20 ${phoneError ? "border-red-400 focus-within:border-red-500" : "border-gray-300 focus-within:border-[#028090]"}`}
                        >
                            <span className="flex items-center px-3 bg-gray-50 text-sm font-semibold text-gray-600 border-r border-gray-200 select-none">
                                +234
                            </span>
                            <input
                                id="phone-verify-number"
                                ref={phoneInputRef}
                                type="tel"
                                inputMode="tel"
                                autoComplete="tel-national"
                                value={phoneInput}
                                onChange={(e) => {
                                    setPhoneInput(e.target.value.replace(/[^\d\s+]/g, ""));
                                    if (phoneError) setPhoneError(null);
                                }}
                                placeholder="803 123 4567"
                                disabled={requestMutation.isPending}
                                aria-invalid={Boolean(phoneError)}
                                aria-describedby={phoneError ? "phone-verify-number-error" : undefined}
                                className="flex-1 min-w-0 px-3 py-2.5 text-base text-gray-900 outline-none disabled:bg-gray-50"
                            />
                        </div>
                        {phoneError && (
                            <p id="phone-verify-number-error" className="text-xs text-red-600 mt-1.5">
                                {phoneError}
                            </p>
                        )}
                        {limitReached && (
                            <p className="text-xs text-red-600 mt-1.5">
                                Too many codes requested. Try again in an hour, or contact support.
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={sendDisabled || !phoneInput.trim()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#028090] hover:bg-[#026d7a] text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Icon icon={requestMutation.isPending ? "mdi:loading" : "mdi:send"} className={`w-4 h-4 ${requestMutation.isPending ? "animate-spin" : ""}`} />
                        <span>{sendLabel("Send code")}</span>
                    </button>

                    {hasPhoneOnFile && (
                        <button
                            type="button"
                            onClick={() => {
                                setStep("code");
                                focusFirstDigit();
                            }}
                            disabled={requestMutation.isPending}
                            className="w-full text-sm font-medium text-gray-600 hover:text-gray-800 disabled:text-gray-400"
                        >
                            Keep {phoneMasked ?? "my current number"}
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={requestMutation.isPending}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm text-gray-700 font-medium disabled:opacity-50"
                    >
                        Cancel and use a different account
                    </button>
                </form>
            ) : (
                <div className="space-y-5">
                    <div className="flex items-start gap-3 p-3 bg-[#f4fbfb] border border-[#cfe9eb] rounded-lg">
                        <Icon icon="mdi:cellphone-message" className="w-5 h-5 text-[#028090] mt-0.5 shrink-0" />
                        <div className="text-sm text-gray-700">
                            {codeSent ? (
                                <>
                                    Enter the 6-digit code we texted to{" "}
                                    <span className="font-mono font-semibold">{phoneMasked}</span>.
                                    It expires in 30 minutes.
                                </>
                            ) : (
                                <>
                                    We&apos;ll text a 6-digit code to{" "}
                                    <span className="font-mono font-semibold">{phoneMasked}</span>.
                                    Tap <span className="font-semibold">Send code</span>, then enter it below.
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-between gap-2">
                        {digits.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => {
                                    inputRefs.current[index] = el;
                                }}
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
                                maxLength={OTP_LENGTH}
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                disabled={verifyMutation.isPending}
                                className="w-12 h-14 text-center text-2xl font-semibold border-2 border-gray-300 rounded-lg focus:border-[#028090] focus:ring-2 focus:ring-[#028090]/20 outline-none transition-all disabled:opacity-50 disabled:bg-gray-50"
                            />
                        ))}
                    </div>

                    {verifyMutation.isPending && (
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                            <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
                            <span>Verifying...</span>
                        </div>
                    )}

                    {limitReached && (
                        <p className="text-xs text-center text-red-600">
                            Too many codes requested. Try again in an hour, or contact support.
                        </p>
                    )}

                    <div className="border-t border-gray-200 pt-4 space-y-2">
                        {codeSent ? (
                            <button
                                type="button"
                                onClick={() => void sendCode()}
                                disabled={sendDisabled}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-[#028090] hover:text-[#026d7a] disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                                <Icon icon="mdi:send" className="w-4 h-4" />
                                <span>{sendLabel("Resend code")}</span>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => void sendCode()}
                                disabled={sendDisabled}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#028090] hover:bg-[#026d7a] text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Icon icon={requestMutation.isPending ? "mdi:loading" : "mdi:send"} className={`w-4 h-4 ${requestMutation.isPending ? "animate-spin" : ""}`} />
                                <span>{sendLabel("Send code")}</span>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={openChangeNumber}
                            disabled={busy}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            <Icon icon="mdi:pencil-outline" className="w-4 h-4" />
                            <span>Wrong number? Change it</span>
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={verifyMutation.isPending}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm text-gray-700 font-medium disabled:opacity-50"
                    >
                        Cancel and use a different account
                    </button>
                </div>
            )}
        </CustomModal>
    );
};

export default PhoneOtpModal;

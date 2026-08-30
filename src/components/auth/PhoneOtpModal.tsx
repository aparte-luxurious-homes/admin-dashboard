"use client";

import { MESSAGES } from '@/src/lib/messages';
import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import CustomModal from "@/src/components/ui/CustomModal";
import {
    useRequestPhoneOtp,
    useRequestPhoneOtpViaEmail,
    useVerifyPhoneOtp,
} from "@/src/hooks/useAuth";

interface PhoneOtpModalProps {
    isOpen: boolean;
    phone: string;
    onClose: () => void;
}

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60; // matches backend rate limit (services/auth/services.py:866)

const maskPhone = (phone: string): string => {
    if (!phone) return "";
    if (phone.length <= 4) return phone;
    const last4 = phone.slice(-4);
    return `${phone.slice(0, 2)}${"*".repeat(Math.max(0, phone.length - 6))}${last4}`;
};

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

const PhoneOtpModal = ({ isOpen, phone, onClose }: PhoneOtpModalProps) => {
    const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
    const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const verifyMutation = useVerifyPhoneOtp();
    const resendMutation = useRequestPhoneOtp();
    const emailFallbackMutation = useRequestPhoneOtpViaEmail();

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setDigits(Array(OTP_LENGTH).fill(""));
            setResendCooldown(RESEND_COOLDOWN_SECONDS);
            // Focus first input shortly after open animation
            setTimeout(() => inputRefs.current[0]?.focus(), 50);
        }
    }, [isOpen]);

    // Resend cooldown countdown
    useEffect(() => {
        if (!isOpen || resendCooldown <= 0) return;
        const timer = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
        return () => clearTimeout(timer);
    }, [isOpen, resendCooldown]);

    const submit = async (otpString: string) => {
        try {
            await verifyMutation.mutateAsync({ phone, otp: otpString });
            toast.success(MESSAGES.MSG_PHONE_VERIFIED_WELCOME_BACK);
            // useVerifyPhoneOtp's onSuccess handles the redirect.
        } catch (err: any) {
            toast.error(extractApiMessage(err, "Invalid OTP. Please try again."));
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

    const handleResendSms = async () => {
        try {
            await resendMutation.mutateAsync({ phone });
            toast.success(MESSAGES.MSG_NEW_OTP_SENT_TO_YOUR_PHONE);
            setResendCooldown(RESEND_COOLDOWN_SECONDS);
        } catch (err: any) {
            toast.error(extractApiMessage(err, "Couldn't resend OTP. Try the email fallback below."));
            // Backend rate-limits at 60s. On 429, lock the button so the user
            // sees a visible countdown instead of being able to spam-retry.
            if (err?.response?.status === 429) {
                setResendCooldown(RESEND_COOLDOWN_SECONDS);
            }
        }
    };

    const handleSendToEmail = async () => {
        try {
            await emailFallbackMutation.mutateAsync({ phone });
            toast.success(MESSAGES.MSG_OTP_SENT_TO_THE_EMAIL_ON_YOUR_ACCOUNT);
            setResendCooldown(RESEND_COOLDOWN_SECONDS);
        } catch (err: any) {
            toast.error(extractApiMessage(err, "Couldn't send OTP to email. Contact support."));
            if (err?.response?.status === 429) {
                setResendCooldown(RESEND_COOLDOWN_SECONDS);
            }
        }
    };

    const handleClose = () => {
        if (verifyMutation.isPending) return;
        onClose();
    };

    return (
        <CustomModal isOpen={isOpen} onClose={handleClose} title="Verify your phone">
            <div className="space-y-5">
                <div className="flex items-start gap-3 p-3 bg-[#f4fbfb] border border-[#cfe9eb] rounded-lg">
                    <Icon icon="mdi:cellphone-message" className="w-5 h-5 text-[#028090] mt-0.5 shrink-0" />
                    <div className="text-sm text-gray-700">
                        We sent a 6-digit code to <span className="font-mono font-semibold">{maskPhone(phone)}</span>.
                        Enter it below to finish signing in.
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

                <div className="border-t border-gray-200 pt-4 space-y-2">
                    <button
                        type="button"
                        onClick={handleResendSms}
                        disabled={resendCooldown > 0 || resendMutation.isPending || verifyMutation.isPending}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-[#028090] hover:text-[#026d7a] disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        <Icon icon="mdi:send" className="w-4 h-4" />
                        <span>
                            {resendMutation.isPending
                                ? "Sending..."
                                : resendCooldown > 0
                                    ? `Resend SMS in ${resendCooldown}s`
                                    : "Resend SMS"}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={handleSendToEmail}
                        disabled={emailFallbackMutation.isPending || verifyMutation.isPending}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        <Icon icon="mdi:email-outline" className="w-4 h-4" />
                        <span>
                            {emailFallbackMutation.isPending
                                ? "Sending..."
                                : "Didn't get it? Send to my email instead"}
                        </span>
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
        </CustomModal>
    );
};

export default PhoneOtpModal;

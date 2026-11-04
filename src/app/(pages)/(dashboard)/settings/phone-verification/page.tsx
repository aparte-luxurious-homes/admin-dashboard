"use client";

import { MESSAGES } from '@/src/lib/messages';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import BreadCrumb from "@/src/components/breadcrumb";
import Loader from "@/src/components/loader";
import { useAuth } from "@/src/hooks/useAuth";
import { UserRole } from "@/src/lib/enums";
import { formatDate } from "@/src/lib/utils";
import {
    GetPhoneVerificationFeatureState,
    UpdatePhoneVerificationFeature,
} from "@/src/lib/request-handlers/platformMgt";

/**
 * What happens when the switch goes on. The first line is the one that
 * matters: turning it on signs people out, which should never be a surprise.
 */
const ENABLE_EFFECTS = [
    "Every owner, agent and guest whose phone number is not confirmed will be signed out and asked to confirm it by SMS. Staff are not affected.",
    "Signing in asks for a 6-digit code texted to the number on the account, once per account",
    "Accounts with no phone number on file are asked to add one before they can continue",
    "Codes are sent through the SMS provider set under Payments & payouts",
];

const DISABLE_EFFECTS = [
    "Owners, agents and guests can sign in without confirming their phone number",
    "Numbers already confirmed stay confirmed; nothing is undone",
    "Turning it back on asks only the accounts that are still unconfirmed",
];

export default function PhoneVerificationSettingsPage() {
    const router = useRouter();
    const { user, isFetching } = useAuth();
    const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;

    const { data: state, isLoading } = GetPhoneVerificationFeatureState(isSuperAdmin);
    const updateFeature = UpdatePhoneVerificationFeature();

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [reason, setReason] = useState("");
    const [acknowledged, setAcknowledged] = useState(false);

    // Direct URL access — the card is hidden for everyone else, but the route
    // still has to refuse. The API refuses too; this is only so a non-super-admin
    // gets a redirect instead of a page that renders and then errors.
    useEffect(() => {
        if (!isFetching && user && !isSuperAdmin) {
            toast.error(MESSAGES.MSG_ONLY_A_SUPER_ADMIN_CAN_CHANGE_PLATFORM_F);
            router.replace("/settings");
        }
    }, [isFetching, user, isSuperAdmin, router]);

    if (isFetching || !user) return <Loader message="Loading settings..." />;
    if (!isSuperAdmin) return null;

    const enabled = state?.phone_verification_enforced === true;
    // The switch's target position: the opposite of where it sits now.
    const nextEnabled = !enabled;
    const effects = nextEnabled ? ENABLE_EFFECTS : DISABLE_EFFECTS;

    const closeConfirm = () => {
        setConfirmOpen(false);
        setPassword("");
        setReason("");
        setAcknowledged(false);
        setShowPassword(false);
    };

    const handleConfirm = async () => {
        if (!password) return;
        try {
            const response: any = await updateFeature.mutateAsync({
                enabled: nextEnabled,
                password,
                ...(reason.trim() ? { reason: reason.trim() } : {}),
            });
            toast.success(
                response?.data?.message ||
                (nextEnabled
                    ? "Phone verification is now required"
                    : "Phone verification is no longer required"),
            );
            closeConfirm();
        } catch (error: any) {
            // 401 means the password was wrong and nothing changed — keep the
            // modal open so the attempt can be repeated without re-reading the
            // consequences.
            const detail = error?.response?.data?.detail;
            toast.error(
                (typeof detail === "string" && detail) ||
                detail?.message ||
                error?.response?.data?.message ||
                "Could not update the setting",
            );
            setPassword("");
        }
    };

    return (
        <>
            <div className="p-4 sm:p-[20px] mx-2 sm:mx-5 mt-5 border border-[#D9D9D9] rounded-[15px] bg-white shadow-md min-h-[calc(100vh-150px)]">
                <BreadCrumb
                    description=""
                    active="Phone Verification"
                    link_one="/settings"
                    link_one_name="Settings"
                />

                <div className="mt-6 max-w-3xl">
                    <h1 className="text-2xl sm:text-3xl font-bold">Phone verification</h1>
                    <p className="text-sm text-gray-500 mt-2">
                        When this is on, every owner, agent and guest has to confirm their phone
                        number by SMS once before they can use Aparte. Staff accounts are never
                        asked.
                    </p>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader />
                        </div>
                    ) : (
                        <>
                            <div className="mt-8 p-5 border border-gray-200 rounded-xl flex items-start justify-between gap-6 flex-wrap">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-lg font-semibold text-gray-900">Require phone verification</h2>
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${enabled
                                            ? "bg-green-50 text-green-700 border-green-200"
                                            : "bg-gray-50 text-gray-600 border-gray-200"}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${enabled ? "bg-green-500" : "bg-gray-400"}`} />
                                            {enabled ? "Required" : "Off"}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-2">
                                        {enabled
                                            ? "Owners, agents and guests must confirm their phone number by SMS to sign in."
                                            : "Owners, agents and guests can sign in without confirming their phone number."}
                                    </p>
                                    {state?.updated_at && (
                                        <p className="text-xs text-gray-400 mt-3">
                                            Last changed {formatDate(state.updated_at)}
                                            {state.updated_by_name || state.updated_by_email
                                                ? ` by ${state.updated_by_name || state.updated_by_email}`
                                                : ""}
                                        </p>
                                    )}
                                </div>

                                <button
                                    onClick={() => setConfirmOpen(true)}
                                    className={`shrink-0 px-5 py-2.5 text-sm font-bold rounded-xl transition-all ${enabled
                                        ? "text-red-600 border border-red-500 hover:bg-red-50"
                                        : "text-white bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"}`}
                                >
                                    {enabled ? "Stop requiring" : "Require platform-wide"}
                                </button>
                            </div>

                            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
                                <Icon icon="mdi:information-outline" width="20" className="text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-sm text-amber-800">
                                    Turning this on signs out everyone it applies to who hasn&apos;t
                                    confirmed their number yet, including people in the middle of
                                    something. Check that the SMS provider under Payments &amp;
                                    payouts is delivering before you switch it on.
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {confirmOpen && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${nextEnabled ? "bg-amber-100" : "bg-primary/10"}`}>
                                    <Icon
                                        icon={nextEnabled ? "mdi:alert-outline" : "mdi:cellphone-check"}
                                        width="22"
                                        className={nextEnabled ? "text-amber-600" : "text-primary"}
                                    />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {nextEnabled ? "Require phone verification?" : "Stop requiring phone verification?"}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        This applies to every owner, agent and guest, immediately.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-5">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                    What will happen
                                </p>
                                <ul className="space-y-1.5">
                                    {effects.map((effect, index) => (
                                        <li
                                            key={effect}
                                            className={`flex gap-2 text-sm ${nextEnabled && index === 0 ? "font-semibold text-gray-900" : "text-gray-700"}`}
                                        >
                                            <Icon
                                                icon={nextEnabled ? "mdi:alert-circle-outline" : "mdi:check-circle-outline"}
                                                width="16"
                                                className={`shrink-0 mt-0.5 ${nextEnabled ? "text-amber-600" : "text-green-600"}`}
                                            />
                                            <span>{effect}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <label htmlFor="feature-reason" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                    Reason <span className="font-normal normal-case text-gray-400">(optional, recorded in the audit log)</span>
                                </label>
                                <input
                                    id="feature-reason"
                                    type="text"
                                    value={reason}
                                    maxLength={500}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="e.g. Confirming every host's number before payouts"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                                />
                            </div>

                            <div>
                                <label htmlFor="feature-password" className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                    Confirm your password
                                </label>
                                <div className="relative">
                                    <input
                                        id="feature-password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        autoComplete="current-password"
                                        onChange={(e) => setPassword(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && password && acknowledged && !updateFeature.isPending) {
                                                handleConfirm();
                                            }
                                        }}
                                        placeholder="Your account password"
                                        className="w-full px-3 py-2 pr-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600"
                                    >
                                        <Icon icon={showPassword ? "mdi:eye-off-outline" : "mdi:eye-outline"} width="18" />
                                    </button>
                                </div>
                                <p className="text-xs text-gray-400 mt-1.5">
                                    Re-entering your password confirms it is you making this change.
                                </p>
                            </div>

                            <label className="flex gap-2.5 items-start cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={acknowledged}
                                    onChange={(e) => setAcknowledged(e.target.checked)}
                                    className="mt-0.5 w-4 h-4 accent-primary shrink-0"
                                />
                                <span className="text-sm text-gray-700">
                                    {nextEnabled
                                        ? "I understand that unconfirmed owners, agents and guests will be signed out now."
                                        : "I understand that owners, agents and guests will no longer be asked to confirm their phone number."}
                                </span>
                            </label>
                        </div>

                        <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3">
                            <button
                                onClick={closeConfirm}
                                disabled={updateFeature.isPending}
                                className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={!password || !acknowledged || updateFeature.isPending}
                                className={`px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed ${nextEnabled ? "bg-primary hover:bg-primary/90" : "bg-red-600 hover:bg-red-700"}`}
                            >
                                {updateFeature.isPending
                                    ? "Applying…"
                                    : nextEnabled ? "Require verification" : "Stop requiring"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

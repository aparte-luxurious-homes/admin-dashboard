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
    GetNetworkFeatureState,
    UpdateNetworkFeature,
} from "@/src/lib/request-handlers/platformMgt";

/**
 * What actually stops when the switch goes off. Spelled out on the confirmation
 * step rather than left to the toggle's label — a platform-wide change to what
 * every agent can see and earn should not be a one-word decision.
 */
const DISABLE_EFFECTS = [
    "No activity events are recorded — points stop accruing for every agent",
    "Mentor cash overrides stop being paid from the platform margin",
    "The weekly tier cron and monthly zone payout cron stop running",
    "The Network tab disappears from every user's sidebar",
    "Tier and zone standing roles stop granting permissions; agents fall back to plain Agent access",
    "Network pages and API routes become unavailable platform-wide",
];

const ENABLE_EFFECTS = [
    "Activity events resume recording from now on",
    "The Network tab returns for every eligible role",
    "Standing roles resolve again and regrant their permissions",
    "Existing points, tiers, mentorships and zone assignments reappear exactly as they were",
];

export default function NetworkEventsSettingsPage() {
    const router = useRouter();
    const { user, isFetching } = useAuth();
    const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;

    const { data: state, isLoading } = GetNetworkFeatureState(isSuperAdmin);
    const updateFeature = UpdateNetworkFeature();

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

    const enabled = state?.network_enabled !== false;
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
                    ? "Agent Network enabled platform-wide"
                    : "Agent Network disabled platform-wide"),
            );
            closeConfirm();
        } catch (error: any) {
            // 401 means the password was wrong and nothing changed — keep the
            // modal open so the attempt can be repeated without re-reading the
            // consequences.
            toast.error(
                error?.response?.data?.detail ||
                error?.response?.data?.message ||
                "Could not update the feature",
            );
            setPassword("");
        }
    };

    return (
        <>
            <div className="p-4 sm:p-[20px] mx-2 sm:mx-5 mt-5 border border-[#D9D9D9] rounded-[15px] bg-white shadow-md min-h-[calc(100vh-150px)]">
                <BreadCrumb
                    description=""
                    active="Network Events"
                    link_one="/settings"
                    link_one_name="Settings"
                />

                <div className="mt-6 max-w-3xl">
                    <h1 className="text-2xl sm:text-3xl font-bold">Network events</h1>
                    <p className="text-sm text-gray-500 mt-2">
                        The Agent Network covers activity events, points, tiers, mentorship and
                        zones. Turning it off pauses the whole feature across the platform for
                        every user.
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
                                        <h2 className="text-lg font-semibold text-gray-900">Agent Network</h2>
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${enabled
                                            ? "bg-green-50 text-green-700 border-green-200"
                                            : "bg-red-50 text-red-700 border-red-200"}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${enabled ? "bg-green-500" : "bg-red-500"}`} />
                                            {enabled ? "Enabled" : "Disabled"}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-2">
                                        {enabled
                                            ? "Events are being recorded and every network feature is live."
                                            : "The feature is paused. No data has been deleted — everything resumes when you switch it back on."}
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
                                    {enabled ? "Disable platform-wide" : "Enable platform-wide"}
                                </button>
                            </div>

                            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3">
                                <Icon icon="mdi:information-outline" width="20" className="text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-sm text-amber-800">
                                    Switching the feature off never deletes anything. Points, tiers,
                                    mentorships, zone assignments and the permissions configured
                                    against tier and zone roles are all preserved, and resume
                                    unchanged when it is switched back on.
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
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${nextEnabled ? "bg-primary/10" : "bg-red-100"}`}>
                                    <Icon
                                        icon={nextEnabled ? "mdi:power-plug-outline" : "mdi:alert-outline"}
                                        width="22"
                                        className={nextEnabled ? "text-primary" : "text-red-600"}
                                    />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {nextEnabled ? "Enable the Agent Network?" : "Disable the Agent Network?"}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        This applies to every user on the platform, immediately.
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
                                    {effects.map((effect) => (
                                        <li key={effect} className="flex gap-2 text-sm text-gray-700">
                                            <Icon
                                                icon={nextEnabled ? "mdi:check-circle-outline" : "mdi:minus-circle-outline"}
                                                width="16"
                                                className={`shrink-0 mt-0.5 ${nextEnabled ? "text-green-600" : "text-red-500"}`}
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
                                    placeholder="e.g. Pausing while we recalculate tier thresholds"
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
                                    I understand this affects every user on the platform
                                    {nextEnabled ? "." : ", and that agents will stop earning points until it is switched back on."}
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
                                    : nextEnabled ? "Enable" : "Disable"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

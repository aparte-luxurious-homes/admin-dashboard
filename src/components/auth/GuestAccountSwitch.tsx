"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Icon } from "@iconify/react";

import axiosRequest from "@/src/lib/api";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import { setUser } from "@/src/lib/slices/authSlice";
import { UserRole } from "@/src/lib/enums";
import { getLandingAgentKycUrl } from "@/src/lib/agentApproval";
import { setAuthCookie } from "@/src/hooks/useAuth";
import type { IUser } from "@/src/lib/types";

type Target = "OWNER" | "AGENT";

const CHOICES: { value: Target; title: string; body: string; icon: string }[] = [
    {
        value: "OWNER",
        title: "I own homes I rent out",
        body: "Manage your listings, calendar, bookings and payouts here.",
        icon: "mdi:home-account",
    },
    {
        value: "AGENT",
        title: "I'm an agent",
        body: "An admin approves agent accounts after you submit your KYC.",
        icon: "mdi:account-tie",
    },
];

/**
 * Shown instead of "Access Denied" when a sign-in reaches a GUEST account.
 *
 * Guest accounts book stays; the dashboard is for hosts, agents and staff.
 * But the guests who arrive here are usually hosts or agents whose account got
 * the wrong type, and before this there was no way forward except asking
 * support. The switch only goes from GUEST to OWNER or AGENT (the API enforces
 * that), and an agent still has to be approved.
 *
 * `token` is the session the sign-in just returned. It lives in memory only:
 * no cookie is set for a guest, and it is sent explicitly on the one call.
 */
export default function GuestAccountSwitch({
    token,
    user,
    onCancel,
}: {
    token: string;
    user: IUser;
    onCancel: () => void;
}) {
    const [choice, setChoice] = useState<Target | null>(null);
    const [busy, setBusy] = useState(false);
    const router = useRouter();
    const dispatch = useDispatch();
    const queryClient = useQueryClient();

    const who = user.email || (user as any).phone || "This account";

    const confirm = async () => {
        if (!choice) return;
        setBusy(true);
        try {
            await axiosRequest.post(
                API_ROUTES.profile.accountType,
                { role: choice },
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (err: any) {
            const detail = err?.response?.data?.detail;
            toast.error(
                (typeof detail === "string" && detail) ||
                    err?.response?.data?.message ||
                    "Could not switch this account. Please contact support."
            );
            setBusy(false);
            return;
        }

        if (choice === "AGENT") {
            // Agents are approved from their KYC, which is submitted on
            // aparte.ng; the dashboard would only send them there anyway.
            toast.success(
                "Your account is now an agent account. Sign in on aparte.ng to submit your KYC for approval.",
                { duration: 7000 }
            );
            window.location.href = getLandingAgentKycUrl();
            return;
        }

        const host = { ...user, role: UserRole.OWNER } as IUser;
        setAuthCookie(token);
        dispatch(setUser(host));
        queryClient.setQueryData(["authUser"], host);
        toast.success("Your account is now a host account.");
        router.replace(PAGE_ROUTES.dashboard.base);
    };

    return (
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-gray-900 shadow-sm">
            <div className="mb-1 flex items-center gap-2 text-[#028090]">
                <Icon icon="mdi:account-switch" width={22} />
                <h1 className="text-lg font-semibold text-gray-900">This is a guest account</h1>
            </div>
            <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{who}</span> is set up for booking stays
                on aparte.ng. To use this dashboard, switch it to a host or agent account.
            </p>

            <div className="mt-4 space-y-2" role="radiogroup" aria-label="Account type">
                {CHOICES.map((c) => {
                    const selected = choice === c.value;
                    return (
                        <button
                            key={c.value}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => setChoice(c.value)}
                            className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
                                selected
                                    ? "border-[#028090] bg-[#028090]/5"
                                    : "border-gray-200 hover:border-gray-300"
                            }`}
                        >
                            <Icon icon={c.icon} width={22} className="mt-0.5 shrink-0 text-[#028090]" />
                            <span>
                                <span className="block text-sm font-semibold">{c.title}</span>
                                <span className="block text-xs text-gray-600">{c.body}</span>
                            </span>
                        </button>
                    );
                })}
            </div>

            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                An account has one type. After switching, this account can no longer book stays as
                a guest on aparte.ng, so use a different email for your own trips. If you have an
                upcoming stay booked with it, contact support before switching.
            </p>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={busy}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                    Not now
                </button>
                <button
                    type="button"
                    onClick={confirm}
                    disabled={!choice || busy}
                    className="rounded-lg bg-[#028090] px-4 py-2 text-sm font-semibold text-white hover:bg-[#016171] disabled:opacity-50"
                >
                    {busy
                        ? "Switching..."
                        : choice === "AGENT"
                          ? "Switch to agent account"
                          : "Switch to host account"}
                </button>
            </div>
        </div>
    );
}

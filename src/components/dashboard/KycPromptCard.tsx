"use client";

import Link from "next/link";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useAuth } from "@/src/hooks/useAuth";
import { usePermissions } from "@/src/hooks/usePermissions";
import { KycStatus } from "@/src/lib/enums";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";

/**
 * Prompt an owner or agent to finish KYC — before it costs them something.
 *
 * Until now nothing asked. Two paths to a VERIFIED status already existed
 * (a BVN check that runs automatically when a payout account is created, and
 * admin review of uploaded documents) but neither was ever surfaced, so the
 * requirement was invisible until it bit: a listing refused approval, or a
 * withdrawal blocked with KYC_REQUIRED. Both are late, and both land as a
 * failure rather than a task.
 *
 * The card states the two consequences up front — those are the reason to act
 * — and offers the faster route first. It is not dismissible: the work is
 * mandatory, and a dismissed prompt would just recreate the silence.
 */

type Kyc = KycStatus | string | null | undefined;

export default function KycPromptCard() {
    const { user } = useAuth();
    const { isOwner, isAgent } = usePermissions();

    const status: Kyc = user?.profile?.kycStatus ?? user?.profile?.kyc_status;
    const hasBvn = Boolean(user?.profile?.bvn);

    // Staff have no listings or payouts of their own, so this is not their task.
    if (!isOwner && !isAgent) return null;
    // Nothing to prompt once they're through.
    if (status === KycStatus.VERIFIED) return null;

    const rejected = status === KycStatus.REJECTED;
    const pending = status === KycStatus.PENDING && hasBvn;

    // A submission already under review is a different message: waiting is the
    // correct action, and repeating "you must verify" reads as it not working.
    if (pending) {
        return (
            <div className="bg-white rounded-lg border border-blue-200 shadow-sm p-4 sm:p-5">
                <div className="flex items-start gap-3">
                    <Icon
                        icon="lucide:clock"
                        width="20" height="20"
                        className="text-blue-600 mt-0.5 shrink-0"
                    />
                    <div className="min-w-0">
                        <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                            Your identity check is being reviewed
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            Nothing more to do. We&apos;ll email you when it&apos;s approved —
                            usually within one business day. Your listings can be approved and
                            your payouts released once it clears.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`bg-white rounded-lg border shadow-sm p-4 sm:p-6 ${
                rejected ? "border-red-300" : "border-amber-300"
            }`}
        >
            <div className="flex items-start gap-3 mb-4">
                <Icon
                    icon={rejected ? "lucide:alert-circle" : "lucide:shield-alert"}
                    width="22" height="22"
                    className={`mt-0.5 shrink-0 ${rejected ? "text-red-600" : "text-amber-600"}`}
                />
                <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                        {rejected
                            ? "Your identity check needs another look"
                            : "Verify your identity to get paid"}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        {rejected
                            ? "Your last submission couldn't be approved. Re-submit with a clearer document, or add a payout account with your BVN to verify instantly."
                            : "Two things need this, and both fail late if you leave it:"}
                    </p>
                </div>
            </div>

            {!rejected && (
                <ul className="mb-4 space-y-1.5 pl-1">
                    <li className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                        <Icon icon="lucide:home" width="15" height="15" className="mt-0.5 shrink-0 text-gray-400" />
                        <span><strong className="text-gray-800">Your listings can&apos;t be approved</strong> until your identity is verified.</span>
                    </li>
                    <li className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                        <Icon icon="lucide:wallet" width="15" height="15" className="mt-0.5 shrink-0 text-gray-400" />
                        <span><strong className="text-gray-800">You can&apos;t withdraw earnings</strong> without a verified BVN.</span>
                    </li>
                </ul>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
                {/* Faster route first — the BVN check runs against the provider
                    and flips the status immediately, with no admin in the loop. */}
                <Link
                    href={PAGE_ROUTES.dashboard.wallet.base}
                    className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 text-center"
                >
                    <Icon icon="lucide:zap" width="16" height="16" />
                    Add payout account with BVN
                </Link>
                <Link
                    href={PAGE_ROUTES.dashboard.settings.kyc}
                    className="flex-1 px-4 py-2.5 border border-gray-300 hover:bg-gray-50 text-sm font-medium text-gray-700 rounded-lg flex items-center justify-center gap-2 text-center"
                >
                    <Icon icon="lucide:file-text" width="16" height="16" />
                    {rejected ? "Re-submit documents" : "Upload documents instead"}
                </Link>
            </div>

            <p className="text-[11px] text-gray-400 mt-3">
                Adding a payout account verifies you automatically. Uploading documents needs an
                admin review first.
            </p>
        </div>
    );
}

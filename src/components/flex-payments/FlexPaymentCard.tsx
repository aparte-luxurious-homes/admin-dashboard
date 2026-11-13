"use client";

import { format } from "date-fns";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";
import { usePermissions } from "@/src/hooks/usePermissions";
import { formatMoney } from "@/src/lib/utils";
import {
    CONTRIBUTOR_STATUS_LABEL,
    FLEX_KIND_LABEL,
    isOpenPayment,
    koboToNaira,
    summariseContributors,
} from "@/src/lib/flexPayments";
import { ResendContributorInvitation } from "@/src/lib/request-handlers/flexPaymentsMgt";
import {
    ContributorStatus,
    FlexPaymentKind,
    IContributor,
    IPaymentPlan,
    PlanPaymentStatus,
} from "@/src/lib/types/flexPayments";
import DueLabel from "./DueLabel";
import FlexPaymentStatusChip from "./FlexPaymentStatusChip";

const money = (kobo: number) => formatMoney(koboToNaira(kobo));

const CONTRIBUTOR_STYLES: Record<ContributorStatus, string> = {
    PENDING: "bg-gray-100 text-gray-700",
    PROCESSING: "bg-blue-100 text-blue-800",
    PAID: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-700",
    EXPIRED: "bg-orange-100 text-orange-800",
    REFUNDED: "bg-purple-100 text-purple-800",
};

const PAYMENT_STYLES: Record<PlanPaymentStatus, string> = {
    PENDING: "text-gray-600",
    PROCESSING: "text-blue-700",
    SUCCESS: "text-green-700",
    FAILED: "text-red-700",
    REFUNDED: "text-purple-700",
};

function ProgressBar({ percent }: { percent: number }) {
    return (
        <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            className="h-2 w-full overflow-hidden rounded-full bg-zinc-100"
        >
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
        </div>
    );
}

function ContributorRow({
    contributor,
    canResend,
    resending,
    onResend,
}: {
    contributor: IContributor;
    canResend: boolean;
    resending: boolean;
    onResend: () => void;
}) {
    // Only an unpaid share can usefully be chased; a paid or refunded one cannot.
    const chaseable = contributor.status === "PENDING" || contributor.status === "FAILED";
    return (
        <li className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-800">
                    {contributor.displayName}
                    {contributor.isInitiator && (
                        <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
                            Initiator
                        </span>
                    )}
                </p>
                <p className="truncate text-xs text-zinc-500">
                    {contributor.contact}
                    {contributor.paidAt && ` · paid ${format(new Date(contributor.paidAt), "d MMM, h:mm a")}`}
                    {!contributor.paidAt &&
                        contributor.lastInvitedAt &&
                        ` · invited ${format(new Date(contributor.lastInvitedAt), "d MMM, h:mm a")}`}
                </p>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-zinc-800">{money(contributor.shareKobo)}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${CONTRIBUTOR_STYLES[contributor.status]}`}>
                    {CONTRIBUTOR_STATUS_LABEL[contributor.status]}
                </span>
                {canResend && chaseable && !contributor.isInitiator && (
                    <button
                        type="button"
                        onClick={onResend}
                        disabled={resending}
                        className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                    >
                        Resend link
                    </button>
                )}
            </div>
        </li>
    );
}

/**
 * Payment-plan breakdown for a booking: what's been received, what's
 * outstanding and when it falls due, plus the contributors (invite friends) or
 * the initial/balance split (instalment).
 *
 * Renders nothing for an ordinary pay-in-full booking, so it is safe to mount
 * on every booking page. Booking status and payment status are shown
 * separately on purpose: a partly funded booking can be confirmed yet unpaid.
 */
export default function FlexPaymentCard({ plan }: { plan: IPaymentPlan | null }) {
    const { canManageBookings } = usePermissions();
    const { mutate: resend, isPending: resending } = ResendContributorInvitation();

    if (!plan) return null;

    const isInvite = plan.kind === FlexPaymentKind.INVITE_FRIENDS;
    const contributors = plan.contributors ?? [];
    // Contributors' verified shares are the source of truth for an invite plan.
    const summary = isInvite ? summariseContributors(contributors, plan.totalKobo) : null;
    const paidKobo = summary ? summary.paidKobo : plan.paidKobo;
    const outstandingKobo = Math.max(0, plan.totalKobo - paidKobo);
    const percent = plan.totalKobo > 0 ? Math.min(100, Math.floor((paidKobo / plan.totalKobo) * 100)) : 0;
    const open = isOpenPayment(plan.status);

    return (
        <section className="rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm sm:p-6" aria-label="Payment plan">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-base font-bold text-zinc-800">
                    <Icon
                        icon={isInvite ? "solar:users-group-rounded-bold-duotone" : "solar:card-transfer-bold-duotone"}
                        className="text-primary"
                    />
                    {FLEX_KIND_LABEL[plan.kind]} payment
                </h3>
                <FlexPaymentStatusChip status={plan.status} />
            </div>

            <div className="mt-4 space-y-2">
                <ProgressBar percent={percent} />
                <div className="flex flex-wrap justify-between gap-x-4 text-sm">
                    <span className="text-zinc-600">
                        <strong className="text-zinc-900">{money(paidKobo)}</strong> of {money(plan.totalKobo)} received
                    </span>
                    <span className={outstandingKobo > 0 ? "text-amber-700" : "text-green-700"}>
                        {outstandingKobo > 0 ? `${money(outstandingKobo)} outstanding` : "Nothing outstanding"}
                    </span>
                </div>
            </div>

            {plan.dueAt && (
                <div className="mt-4 rounded-xl bg-zinc-50 p-3 text-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        {isInvite ? "Funding window closes" : "Balance due"}
                    </p>
                    <DueLabel dueAt={plan.dueAt} settled={!open} />
                </div>
            )}

            {!isInvite && plan.initialKobo !== undefined && plan.balanceKobo !== undefined && (
                <dl className="mt-4 divide-y divide-zinc-100 text-sm">
                    <div className="flex justify-between py-2">
                        <dt className="text-zinc-600">Initial payment</dt>
                        <dd className="font-semibold text-zinc-900">{money(plan.initialKobo)}</dd>
                    </div>
                    <div className="flex justify-between py-2">
                        <dt className="text-zinc-600">Balance</dt>
                        <dd className="font-semibold text-zinc-900">{money(plan.balanceKobo)}</dd>
                    </div>
                </dl>
            )}

            {isInvite && contributors.length > 0 && (
                <div className="mt-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        Contributors · {summary?.paidCount ?? 0} of {contributors.length} paid
                    </h4>
                    <ul className="divide-y divide-zinc-100">
                        {contributors.map((c) => (
                            <ContributorRow
                                key={c.id}
                                contributor={c}
                                canResend={canManageBookings}
                                resending={resending}
                                onResend={() =>
                                    resend(
                                        { planId: plan.id, contributorId: c.id },
                                        {
                                            onSuccess: () => toast.success("Payment link re-sent"),
                                            onError: (e) =>
                                                toast.error(e instanceof Error ? e.message : "Couldn't re-send the link"),
                                        },
                                    )
                                }
                            />
                        ))}
                    </ul>
                </div>
            )}

            {plan.payments.length > 0 && (
                <div className="mt-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Transactions</h4>
                    <div className="overflow-x-auto">
                        <table className="mt-1 w-full min-w-[420px] text-left text-sm">
                            <tbody className="divide-y divide-zinc-100">
                                {plan.payments.map((p) => (
                                    <tr key={p.id}>
                                        <td className="py-2 pr-3">
                                            <span className="block text-zinc-800">{p.label}</span>
                                            <span className="block font-mono text-xs text-zinc-400">{p.reference}</span>
                                        </td>
                                        <td className="py-2 pr-3 font-medium text-zinc-900">{money(p.amountKobo)}</td>
                                        <td className={`py-2 pr-3 text-xs font-medium ${PAYMENT_STYLES[p.status]}`}>
                                            {p.status.charAt(0) + p.status.slice(1).toLowerCase()}
                                        </td>
                                        <td className="py-2 text-xs text-zinc-500">
                                            {p.paidAt ? format(new Date(p.paidAt), "d MMM yyyy, h:mm a") : "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </section>
    );
}

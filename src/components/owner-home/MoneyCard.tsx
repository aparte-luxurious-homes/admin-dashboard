"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";

import { formatNgn } from "@/src/lib/utils";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import type { MoneyCard as MoneyCardData } from "@/src/lib/request-handlers/ownerHomeMgt";
import { trackEvent } from "@/src/lib/analytics";

/**
 * "When am I getting paid", the first question an owner opens this page with.
 *
 * The big figure is the wallet balance, because that is the only figure that
 * agrees with the wallet page and the withdraw button. Owners are paid in two
 * parts: a first share when the guest pays, the rest when the guest checks in.
 * The part that has not been released is named as clearing, with the event
 * that releases it, and is never folded into the balance.
 *
 * With nothing settled and nothing clearing the card explains how payouts
 * work rather than printing a zero (spec section 9).
 */
export default function MoneyCard({ money }: { money: MoneyCardData }) {
    const release = money.next_release;
    // Compared as numbers, but only ever FORMATTED from the string, so the
    // figure on screen is the one the wallet holds, to the kobo.
    const hasMoney = Number(money.ready) > 0;
    const hasClearing = Number(money.clearing) > 0;
    const ngn = (value: string) => formatNgn(value, { whole: true, currency: money.currency });

    return (
        <section className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col min-h-[168px]">
            <h2 className="text-sm font-semibold text-gray-600">Money</h2>

            {hasMoney ? (
                <>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-[#028090] tabular-nums">
                        {ngn(money.ready)}
                    </p>
                    <p className="mt-1.5 text-sm text-gray-600 max-w-[36ch]">
                        Ready to withdraw now.
                        {release ? (
                            release.overdue ? (
                                <>
                                    {" "}Another <b className="text-gray-900">{ngn(release.amount)}</b>{" "}
                                    is waiting on {release.guest_name}&apos;s check-in.
                                </>
                            ) : (
                                <>
                                    {" "}Another <b className="text-gray-900">{ngn(release.amount)}</b>{" "}
                                    lands when {release.guest_name} checks in on{" "}
                                    {format(parseISO(release.date), "EEEE, d MMMM")}.
                                </>
                            )
                        ) : null}
                    </p>
                </>
            ) : hasClearing ? (
                <>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 tabular-nums">
                        {ngn(money.clearing)}
                    </p>
                    <p className="mt-1.5 text-sm text-gray-600 max-w-[36ch]">
                        Clearing.{" "}
                        {release
                            ? release.overdue
                                ? `It reaches your wallet once ${release.guest_name} is checked in.`
                                : `The first of it lands when ${release.guest_name} checks in on ${format(
                                      parseISO(release.date),
                                      "EEEE, d MMMM"
                                  )}.`
                            : "It reaches your wallet as your guests check in."}
                    </p>
                </>
            ) : (
                <>
                    <p className="mt-2 text-xl font-semibold tracking-tight text-gray-900 max-w-[30ch]">
                        You are paid in two parts.
                    </p>
                    <p className="mt-1.5 text-sm text-gray-600 max-w-[36ch]">
                        A first share when a guest pays, the rest when they check in. Both
                        show up here.
                    </p>
                </>
            )}

            <div className="mt-auto pt-4 flex items-center gap-5 text-sm font-semibold text-[#028090]">
                {hasMoney ? (
                    <>
                        <Link
                            href={PAGE_ROUTES.dashboard.wallet.base}
                            onClick={() => trackEvent("owner_withdrawal_started")}
                            className="hover:underline"
                        >
                            Withdraw
                        </Link>
                        <Link href={PAGE_ROUTES.dashboard.transactions.all.base} className="hover:underline">
                            See every payment
                        </Link>
                    </>
                ) : (
                    <Link href={PAGE_ROUTES.dashboard.wallet.base} className="hover:underline">
                        How payouts work
                    </Link>
                )}
            </div>
        </section>
    );
}

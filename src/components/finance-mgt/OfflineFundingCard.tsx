"use client";

import { toast } from "react-hot-toast";
import { Icon } from "@iconify/react";

import { usePermissions } from "@/src/hooks/usePermissions";
import { GetOfflineFunding } from "@/src/lib/request-handlers/financeMgt";

/**
 * Fund a wallet by bank transfer: the account to pay into, and what to send
 * afterwards so the money lands in the right wallet.
 *
 * Agents only. The details come from the API, never from this file, so the
 * wallet page and the dashboard cannot show two different account numbers —
 * and so changing the account is a reviewed backend change, not a string
 * someone edits in a component.
 *
 * Self-hiding: renders nothing for other roles, while loading, if the request
 * fails, or when the API says offline funding is switched off. A half-rendered
 * card with a missing account number is worse than no card.
 */
export default function OfflineFundingCard({ className = "" }: { className?: string }) {
    const { isAgent } = usePermissions();
    const { details } = GetOfflineFunding(isAgent);

    if (!isAgent || !details?.enabled || !details.account_number) return null;

    const copy = async (value: string, label: string) => {
        try {
            await navigator.clipboard.writeText(value);
            toast.success(`${label} copied`);
        } catch {
            toast.error(`Could not copy the ${label.toLowerCase()}`);
        }
    };

    const identifier = details.identifier ?? "";
    // The message is pre-filled with everything staff need to match the
    // transfer, so the agent only has to add the amount and attach the receipt.
    const message =
        `Hi Aparte, I have funded my wallet by bank transfer.\n` +
        `Email: ${identifier}\n` +
        `Amount: NGN \n` +
        `My proof of payment is attached.`;
    const whatsappHref = details.whatsapp_number
        ? `https://wa.me/${details.whatsapp_number}?text=${encodeURIComponent(message)}`
        : null;

    return (
        <section className={`rounded-xl border border-gray-200 bg-white text-gray-900 ${className}`}>
            <header className="flex items-center gap-2.5 px-5 pt-4 pb-1">
                <Icon icon="mdi:bank-transfer-in" width={20} className="text-[#028090]" />
                <h2 className="text-[15px] font-semibold">Fund your wallet by bank transfer</h2>
            </header>
            <p className="px-5 pb-3 text-[13px] text-gray-600">
                Transfer to the account below, then send us your proof of payment.
            </p>

            <div className="mx-5 rounded-lg bg-gray-50 px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className="min-w-0">
                        <span className="block text-xs text-gray-500">Account number</span>
                        <span className="block font-mono text-xl font-semibold tracking-wide tabular-nums">
                            {details.account_number}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => copy(details.account_number!, "Account number")}
                        className="ml-auto shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[13px] font-semibold text-[#028090] hover:bg-[#028090]/5"
                    >
                        Copy
                    </button>
                </div>
                <div className="mt-2.5 grid grid-cols-2 gap-3 border-t border-gray-200 pt-2.5 text-sm">
                    <div className="min-w-0">
                        <span className="block text-xs text-gray-500">Bank</span>
                        <span className="block truncate font-semibold">{details.bank_name}</span>
                    </div>
                    <div className="min-w-0">
                        <span className="block text-xs text-gray-500">Account name</span>
                        <span className="block truncate font-semibold">{details.account_name}</span>
                    </div>
                </div>
            </div>

            <ol className="space-y-2 px-5 py-3.5 text-[13px] text-gray-700">
                <li className="flex gap-2.5">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#028090]/10 text-[11px] font-bold text-[#028090]">1</span>
                    <span>Transfer the amount you want in your wallet to the account above.</span>
                </li>
                <li className="flex gap-2.5">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#028090]/10 text-[11px] font-bold text-[#028090]">2</span>
                    <span>
                        Send your proof of payment on WhatsApp, with your email
                        {identifier && (
                            <>
                                {" "}
                                <button
                                    type="button"
                                    onClick={() => copy(identifier, "Email")}
                                    title="Copy your email"
                                    className="font-semibold text-gray-900 underline decoration-dotted underline-offset-2 hover:text-[#028090]"
                                >
                                    {identifier}
                                </button>
                            </>
                        )}
                        . It is how we know which wallet to credit.
                    </span>
                </li>
                <li className="flex gap-2.5">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#028090]/10 text-[11px] font-bold text-[#028090]">3</span>
                    <span>We credit your wallet once the transfer is confirmed.</span>
                </li>
            </ol>

            {whatsappHref && (
                <div className="px-5 pb-4">
                    <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#028090] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#016171] sm:w-auto"
                    >
                        <Icon icon="mdi:whatsapp" width={18} />
                        Send proof on WhatsApp
                    </a>
                </div>
            )}
        </section>
    );
}

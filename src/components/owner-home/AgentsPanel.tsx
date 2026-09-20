"use client";

import { format, parseISO } from "date-fns";

import { formatNgn } from "@/src/lib/utils";
import type { AgentPerformance } from "@/src/lib/request-handlers/ownerHomeMgt";

/**
 * The agents working an owner's places, earning their place on attribution
 * rather than contact (spec D9): bookings produced and what the owner earned
 * from them are facts that change an owner's decisions; a phone number alone
 * is not.
 *
 * What an agent is PAID never appears here, and the API never sends it
 * (spec D13). Call and WhatsApp are handoffs to the phone's own apps, so no
 * in-app calling has to exist for them to work.
 */
function initials(name: string): string {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join("");
}

function whatsappHref(phone: string): string {
    // wa.me needs the country code and no plus. A number stored the local way
    // (08033333333) is rejected outright, so the leading 0 becomes 234.
    const digits = phone.replace(/[^\d]/g, "");
    const international = digits.startsWith("0") ? `234${digits.slice(1)}` : digits;
    return `https://wa.me/${international}`;
}

export default function AgentsPanel({
    agents,
    windowDays,
}: {
    agents: AgentPerformance[];
    windowDays: number;
}) {
    if (agents.length === 0) return null;

    return (
        <section className="bg-white border border-gray-200 rounded-xl">
            <header className="flex flex-wrap items-center gap-3 px-5 pt-4 pb-3">
                <h2 className="text-[15px] font-semibold text-gray-900">Your agents</h2>
                <span className="ml-auto text-xs text-gray-500">Last {windowDays} days</span>
            </header>

            {agents.map((agent) => (
                <div
                    key={agent.agent_id}
                    className="grid grid-cols-2 items-center gap-3 border-t border-gray-100 px-5 py-3.5 text-sm"
                >
                    <div className="col-span-2 flex min-w-0 items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#028090]/10 text-xs font-bold text-[#028090]">
                            {initials(agent.name)}
                        </span>
                        <span className="min-w-0">
                            <b className="block truncate font-semibold text-gray-900">{agent.name}</b>
                            <span className="block truncate text-xs text-gray-500">
                                {agent.places.length > 0 ? agent.places.join(", ") : "No places assigned"}
                            </span>
                        </span>
                    </div>

                    <span className="font-semibold tabular-nums text-gray-900">
                        {agent.bookings}
                        <span className="ml-1 text-xs font-medium text-gray-500">bookings</span>
                    </span>

                    <span className="font-semibold tabular-nums text-gray-900">
                        {formatNgn(agent.you_earned, { whole: true })}
                        <em className="block text-[11.5px] font-medium not-italic text-gray-500">
                            your share
                        </em>
                    </span>

                    <span
                        className={`text-[13px] tabular-nums ${
                            agent.quiet ? "font-semibold text-amber-700" : "text-gray-600"
                        }`}
                    >
                        {agent.last_booking_at
                            ? format(parseISO(agent.last_booking_at), "d MMM yyyy")
                            : "No bookings yet"}
                        {agent.last_booking_at && (
                            <em className="block text-[11.5px] font-medium not-italic text-gray-500">
                                last booking
                            </em>
                        )}
                    </span>

                    <span className="col-span-2 flex gap-2">
                        {agent.phone && (
                            <>
                                <a
                                    href={`tel:${agent.phone}`}
                                    className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-center text-[13px] font-semibold text-[#028090] hover:bg-[#028090]/5"
                                >
                                    Call
                                </a>
                                <a
                                    href={whatsappHref(agent.phone)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-center text-[13px] font-semibold text-[#028090] hover:bg-[#028090]/5"
                                >
                                    WhatsApp
                                </a>
                            </>
                        )}
                    </span>
                </div>
            ))}
        </section>
    );
}

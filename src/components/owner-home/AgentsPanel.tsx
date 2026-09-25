"use client";

import { Icon } from "@iconify/react";

import type { AgentPerformance } from "@/src/lib/request-handlers/ownerHomeMgt";

/**
 * The agents working an owner's places, as a way to reach them: a name and a
 * WhatsApp button. The list is still built on attribution (spec D9), so an
 * agent appears because they produce bookings here, not because they asked.
 *
 * No figures. The API still sends bookings and the owner's share per agent,
 * but the card deliberately shows none of them — it is a contact list, not a
 * leaderboard. What an agent is PAID is never sent at all (spec D13).
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

export default function AgentsPanel({ agents }: { agents: AgentPerformance[] }) {
    if (agents.length === 0) return null;

    return (
        <section className="bg-white border border-gray-200 rounded-xl">
            <header className="px-5 pt-4 pb-3">
                <h2 className="text-[15px] font-semibold text-gray-900">Your agents</h2>
            </header>

            {agents.map((agent) => (
                <div
                    key={agent.agent_id}
                    className="flex items-center gap-3 border-t border-gray-100 px-5 py-3 text-sm"
                >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#028090]/10 text-xs font-bold text-[#028090]">
                        {initials(agent.name)}
                    </span>
                    <b className="min-w-0 flex-1 truncate font-semibold text-gray-900">{agent.name}</b>

                    {agent.phone ? (
                        <a
                            href={whatsappHref(agent.phone)}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`WhatsApp ${agent.name}`}
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-[13px] font-semibold text-[#028090] hover:bg-[#028090]/5"
                        >
                            <Icon icon="mdi:whatsapp" width={16} />
                            WhatsApp
                        </a>
                    ) : (
                        <span className="shrink-0 text-xs text-gray-400">No number</span>
                    )}
                </div>
            ))}
        </section>
    );
}

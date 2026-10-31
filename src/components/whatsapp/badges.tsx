'use client'

import type { WaContactMode, WaConversationState } from "@/src/lib/request-handlers/whatsappMgt";
import { MODE_LABEL, STATE_LABEL, STATE_STYLE } from "./format";

const pill = "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap";

export function WaStateBadge({ state }: { state: WaConversationState }) {
    return (
        <span className={`${pill} ${STATE_STYLE[state] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
            {STATE_LABEL[state] ?? state}
        </span>
    );
}

export function WaModeBadge({ mode }: { mode: WaContactMode }) {
    const style = mode === "AGENT"
        ? "bg-primary/10 text-primary border-primary/30"
        : "bg-white text-gray-600 border-gray-300";
    return <span className={`${pill} ${style}`}>{MODE_LABEL[mode] ?? mode}</span>;
}

/** The chat is waiting for a person — the bot has stopped answering. */
export function NeedsOpsBadge() {
    return (
        <span className={`${pill} bg-orange-500 text-white border-orange-500`} title="The bot has paused and is waiting for ops">
            Needs ops
        </span>
    );
}

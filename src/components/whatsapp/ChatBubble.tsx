'use client'

import { Icon } from "@iconify/react/dist/iconify.js";
import type { WaMessage, WaMessageStatus } from "@/src/lib/request-handlers/whatsappMgt";
import { renderMessage, timeOfDay } from "./format";

function StatusTick({ status, error }: { status: WaMessageStatus; error: string | null }) {
    switch (status) {
        case "QUEUED":
            return <Icon icon="mdi:clock-outline" width={14} className="text-gray-400" aria-label="Queued" />;
        case "SENT":
            return <Icon icon="mdi:check" width={15} className="text-gray-400" aria-label="Sent" />;
        case "DELIVERED":
            return <Icon icon="mdi:check-all" width={15} className="text-gray-400" aria-label="Delivered" />;
        case "READ":
            return <Icon icon="mdi:check-all" width={15} className="text-sky-500" aria-label="Read" />;
        case "FAILED":
            return (
                <span className="inline-flex items-center gap-1 text-red-600" title={error ?? "Not delivered"}>
                    <Icon icon="mdi:alert-circle" width={14} aria-hidden />
                    <span className="text-[10px] font-semibold">Not delivered</span>
                </span>
            );
        case "DRY_RUN":
            return (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400" title="WHATSAPP_DRY_RUN: logged, never sent to Meta">
                    dry run
                </span>
            );
        default:
            return null;
    }
}

/**
 * One message. Inbound on the left; the bot's replies on the right in
 * WhatsApp green; messages an ops user typed on the right in the brand
 * colour, signed with who sent them, so nobody mistakes a person for the bot.
 */
export default function ChatBubble({ message }: { message: WaMessage }) {
    const inbound = message.direction === "INBOUND";
    const byOps = !inbound && Boolean(message.sent_by_user_id);
    const { text, options, note, imageUrl } = renderMessage(message);

    const tone = inbound
        ? "bg-white border border-gray-200 text-gray-800 rounded-tl-sm"
        : byOps
          ? "bg-primary text-white rounded-tr-sm"
          : "bg-[#D9FDD3] text-gray-800 rounded-tr-sm";
    const muted = byOps ? "text-white/70" : "text-gray-500";

    return (
        <div className={`flex ${inbound ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-3 py-2 shadow-sm ${tone}`}>
                {!inbound && (
                    <p className={`text-[10px] font-semibold uppercase tracking-wide mb-0.5 ${muted}`}>
                        {byOps ? `Sent by ${message.sent_by_name || "ops"}` : "Bot"}
                    </p>
                )}
                {imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl} alt="" className="mb-2 max-h-48 w-full rounded-lg object-cover" />
                )}
                {text ? (
                    <p className="text-sm whitespace-pre-wrap break-words">{text}</p>
                ) : (
                    <p className={`text-sm italic ${muted}`}>{message.type === "IMAGE" ? "Image" : "No text"}</p>
                )}
                {options.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {options.map((o) => (
                            <span
                                key={o}
                                className={`text-xs px-2 py-1 rounded-full border ${byOps ? "border-white/40 text-white" : "border-emerald-700/30 text-emerald-800 bg-white/70"}`}
                            >
                                {o}
                            </span>
                        ))}
                    </div>
                )}
                {inbound && message.type === "BUTTON_REPLY" && (
                    <p className="mt-1 text-[10px] text-gray-400">Tapped a button</p>
                )}
                {note && <p className={`mt-1 text-[11px] ${muted}`}>{note}</p>}
                {message.status === "FAILED" && message.error && (
                    <p className="mt-1 text-[11px] text-red-600 bg-white/80 rounded px-1">{message.error}</p>
                )}
                <div className={`mt-1 flex items-center justify-end gap-1.5 text-[10px] ${muted}`}>
                    <span>{timeOfDay(message.created_at)}</span>
                    {!inbound && <StatusTick status={message.status} error={message.error} />}
                </div>
            </div>
        </div>
    );
}

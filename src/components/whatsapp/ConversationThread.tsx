'use client'

import { Fragment, ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { Icon } from "@iconify/react/dist/iconify.js";
import Loader from "@/src/components/loader";
import { getApiErrorMessage } from "@/src/lib/apiError";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import {
    GetWhatsAppConversation,
    ReplyToWhatsAppConversation,
    WaConversationAction,
    WaConversationDetail,
    WhatsAppConversationAction,
} from "@/src/lib/request-handlers/whatsappMgt";
import { Panel } from "@/src/components/team/ui";
import ChatBubble from "./ChatBubble";
import { NeedsOpsBadge, WaModeBadge, WaStateBadge } from "./badges";
import {
    contactName,
    dateTime,
    dayLabel,
    displayNumber,
    handoverReasonLabel,
    ngnText,
    slotRows,
    waitTime,
} from "./format";
import { useNow } from "./InboxList";

const MAX_REPLY = 4096;

function SideSection({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="border-t border-gray-100 pt-4 first:border-t-0 first:pt-0">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-2">{title}</h3>
            {children}
        </section>
    );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div className="flex justify-between gap-3 py-1 text-sm">
            <span className="text-gray-500 shrink-0">{label}</span>
            <span className="text-gray-900 text-right break-words min-w-0">{value}</span>
        </div>
    );
}

/** Why the reply box is closed, or null when ops may type. */
function replyBlockedReason(c: WaConversationDetail): string | null {
    if (c.state === "OPTED_OUT" || c.contact?.opted_out_at) {
        return "This contact sent STOP. WhatsApp does not allow messaging them until they write START.";
    }
    if (!c.contact?.within_service_window) {
        return "More than 24 hours since this contact last wrote, so WhatsApp only allows approved templates. You can reply once they message again.";
    }
    if (c.state !== "HANDED_OVER") {
        return "The bot is answering this chat. Take it over first so the bot stops replying while you type.";
    }
    return null;
}

export default function ConversationThread({ id }: { id: string }) {
    const now = useNow();
    const { data: conv, isLoading, error } = GetWhatsAppConversation(id);
    const action = WhatsAppConversationAction();
    const reply = ReplyToWhatsAppConversation();
    const [draft, setDraft] = useState("");
    const bottomRef = useRef<HTMLDivElement>(null);
    const messageCount = conv?.messages?.length ?? 0;

    // Follow the conversation as it grows; never yank the view on a refetch
    // that brought nothing new.
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ block: "end" });
    }, [messageCount]);

    if (isLoading) return <div className="flex items-center justify-center py-24"><Loader /></div>;
    if (error || !conv) {
        return (
            <Panel title="WhatsApp conversation">
                <p className="text-sm text-gray-500">{getApiErrorMessage(error, "Conversation not found")}</p>
                <Link href={PAGE_ROUTES.dashboard.whatsapp.inbox} className="mt-3 inline-block text-sm text-primary hover:underline">
                    Back to the inbox
                </Link>
            </Panel>
        );
    }

    const handedOver = conv.state === "HANDED_OVER";
    const optedOut = conv.state === "OPTED_OUT";
    const blocked = replyBlockedReason(conv);

    const run = (a: WaConversationAction, done: string) =>
        action.mutate({ id: conv.id, action: a }, {
            onSuccess: () => toast.success(done),
            onError: (e) => toast.error(getApiErrorMessage(e, "Couldn't update this conversation")),
        });

    const send = () => {
        const body = draft.trim();
        if (!body || blocked) return;
        reply.mutate({ id: conv.id, body }, {
            onSuccess: () => {
                setDraft("");
                toast.success("Sent");
            },
            // 409 = outside the 24h window or opted out; the server's detail says which.
            onError: (e) => toast.error(getApiErrorMessage(e, "Couldn't send this message")),
        });
    };

    const btn = "px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 inline-flex items-center gap-1.5";
    const slots = slotRows(conv.slots);

    return (
        <div className="p-2 sm:p-5">
            <div className="mb-3 flex items-center gap-2 text-sm">
                <Link href={PAGE_ROUTES.dashboard.whatsapp.inbox} className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-800">
                    <Icon icon="lucide:arrow-left" width={16} /> Inbox
                </Link>
            </div>

            <div className="flex flex-col lg:flex-row gap-4">
                {/* ------------------------------------------------ thread */}
                <div className="flex-1 min-w-0 bg-white border border-[#D9D9D9] rounded-[15px] shadow-md flex flex-col">
                    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-gray-200">
                        <div className="min-w-0">
                            <h1 className="text-lg font-semibold text-gray-900 truncate">{contactName(conv.contact)}</h1>
                            <p className="text-xs text-gray-500">{displayNumber(conv.contact?.wa_id)}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {handedOver && conv.handover_to && (
                                <button className={`${btn} bg-primary text-white`} disabled={action.isPending} onClick={() => run("release", "Handed back to the bot")}>
                                    <Icon icon="mdi:robot-outline" width={16} /> Hand back to bot
                                </button>
                            )}
                            {!optedOut && (!handedOver || !conv.handover_to) && (
                                <button className={`${btn} bg-orange-500 text-white`} disabled={action.isPending} onClick={() => run("takeover", "You have this chat. The bot is paused.")}>
                                    <Icon icon="mdi:account-arrow-right-outline" width={16} /> Take over
                                </button>
                            )}
                            {handedOver && !conv.handover_to && (
                                <button className={`${btn} border border-gray-300 text-gray-700`} disabled={action.isPending} onClick={() => run("release", "Handed back to the bot")}>
                                    Hand back to bot
                                </button>
                            )}
                            {conv.state !== "RESOLVED" && (
                                <button className={`${btn} border border-gray-300 text-gray-700`} disabled={action.isPending} onClick={() => run("resolve", "Conversation resolved")}>
                                    <Icon icon="mdi:check-circle-outline" width={16} /> Resolve
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-[#EFEAE2] px-3 sm:px-5 py-4 space-y-2 min-h-[320px] max-h-[62vh]">
                        {conv.messages.length === 0 && (
                            <p className="text-center text-sm text-gray-500 py-10">No messages yet.</p>
                        )}
                        {conv.messages.map((m, i) => {
                            const day = dayLabel(m.created_at);
                            const showDay = i === 0 || dayLabel(conv.messages[i - 1].created_at) !== day;
                            return (
                                <Fragment key={m.id}>
                                    {showDay && (
                                        <div className="flex justify-center py-1">
                                            <span className="text-[11px] bg-white/90 text-gray-600 rounded-md px-2 py-0.5 shadow-sm">{day}</span>
                                        </div>
                                    )}
                                    <ChatBubble message={m} />
                                </Fragment>
                            );
                        })}
                        <div ref={bottomRef} />
                    </div>

                    <div className="border-t border-gray-200 p-3">
                        {blocked ? (
                            <div className="flex items-start gap-2 rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm text-gray-600">
                                <Icon icon="mdi:information-outline" width={18} className="shrink-0 mt-0.5 text-gray-400" />
                                <span>{blocked}</span>
                            </div>
                        ) : (
                            <div className="flex items-end gap-2">
                                <textarea
                                    rows={2}
                                    value={draft}
                                    maxLength={MAX_REPLY}
                                    onChange={(e) => setDraft(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            send();
                                        }
                                    }}
                                    placeholder="Type a reply. Enter sends, Shift+Enter for a new line."
                                    className="flex-1 resize-none border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                                <button
                                    onClick={send}
                                    disabled={reply.isPending || !draft.trim()}
                                    className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-50 inline-flex items-center gap-1.5"
                                >
                                    <Icon icon="mdi:send" width={16} /> {reply.isPending ? "Sending…" : "Send"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ------------------------------------------------ side panel */}
                <aside className="lg:w-[320px] shrink-0 bg-white border border-[#D9D9D9] rounded-[15px] shadow-md p-4 space-y-4 h-fit">
                    <SideSection title="Contact">
                        <Row label="Name" value={contactName(conv.contact)} />
                        <Row label="Number" value={displayNumber(conv.contact?.wa_id)} />
                        {conv.contact?.profile_name && conv.contact?.user_name && (
                            <Row label="WhatsApp name" value={conv.contact.profile_name} />
                        )}
                        <Row label="Aparte account" value={conv.contact?.user_id ? (conv.contact.user_name || "Yes") : "None"} />
                        <Row label="Mode" value={<WaModeBadge mode={conv.mode} />} />
                        {conv.mode === "AGENT" && conv.acting_agent_name && <Row label="Agent" value={conv.acting_agent_name} />}
                        <Row label="Last wrote" value={conv.contact?.last_inbound_at ? `${waitTime(conv.contact.last_inbound_at, now)} ago` : "—"} />
                        <Row
                            label="Reply window"
                            value={conv.contact?.within_service_window
                                ? <span className="text-emerald-700">Open (24h)</span>
                                : <span className="text-gray-500">Closed</span>}
                        />
                        {conv.contact?.opted_out_at && <Row label="Opted out" value={dateTime(conv.contact.opted_out_at)} />}
                    </SideSection>

                    <SideSection title="Conversation">
                        <Row label="State" value={handedOver ? <NeedsOpsBadge /> : <WaStateBadge state={conv.state} />} />
                        <Row label="Started" value={dateTime(conv.first_message_at)} />
                        {conv.failed_parse_count > 0 && <Row label="Misunderstood" value={`${conv.failed_parse_count}x in a row`} />}
                        {conv.resolved_at && <Row label="Resolved" value={dateTime(conv.resolved_at)} />}
                    </SideSection>

                    {(handedOver || conv.handover_at) && (
                        <SideSection title="Handover">
                            <Row label="Reason" value={handoverReasonLabel(conv.handover_reason)} />
                            <Row label="At" value={dateTime(conv.handover_at)} />
                            {handedOver && <Row label="Waiting" value={waitTime(conv.handover_at, now)} />}
                            <Row label="With" value={conv.handover_to_name || (conv.handover_to ? "An ops user" : "Nobody yet")} />
                        </SideSection>
                    )}

                    <SideSection title="What the bot understood">
                        {slots.length ? slots.map((r) => <Row key={r.label} label={r.label} value={r.value} />) : (
                            <p className="text-sm text-gray-400">Nothing yet.</p>
                        )}
                    </SideSection>

                    <SideSection title="Booking">
                        {conv.booking ? (
                            <div className="space-y-1">
                                <Link
                                    href={PAGE_ROUTES.dashboard.bookingManagement.bookings.details(String(conv.booking.id))}
                                    className="text-sm font-medium text-primary hover:underline"
                                >
                                    {conv.booking.booking_id}
                                </Link>
                                {conv.booking.property_name && <Row label="Property" value={conv.booking.property_name} />}
                                <Row label="Dates" value={`${conv.booking.start_date} to ${conv.booking.end_date}`} />
                                <Row label="Total" value={ngnText(conv.booking.total_price)} />
                                <Row label="Status" value={conv.booking.status.replace(/_/g, " ")} />
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400">No booking from this chat.</p>
                        )}
                    </SideSection>
                </aside>
            </div>
        </div>
    );
}

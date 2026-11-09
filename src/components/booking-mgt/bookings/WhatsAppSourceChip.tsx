"use client";

import Link from "next/link";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useAuth } from "@/src/hooks/useAuth";
import { UserRole } from "@/src/lib/enums";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import { WHATSAPP_INBOX_ROLES } from "@/src/lib/whatsappRoles";

type BookingLike = {
    source?: string | null;
    wa_conversation_id?: string | null;
    waConversationId?: string | null;
};

export const isWhatsAppBooking = (b?: BookingLike | null) =>
    String(b?.source ?? "").toUpperCase() === "WHATSAPP_BOT";

/**
 * "WhatsApp" chip for a booking the WhatsApp bot made. For staff who can open
 * the inbox it links to the conversation; for everyone else it is a label.
 *
 * Rendered inside clickable table rows, so the link stops propagation —
 * otherwise opening the chat would also open the booking.
 */
export default function WhatsAppSourceChip({
    booking,
    size = "md",
}: {
    booking: BookingLike;
    size?: "sm" | "md";
}) {
    const { user } = useAuth();
    if (!isWhatsAppBooking(booking)) return null;

    const conversationId = booking.wa_conversation_id ?? booking.waConversationId;
    const canOpen = Boolean(conversationId) && WHATSAPP_INBOX_ROLES.includes(user?.role as UserRole);
    const base =
        size === "sm"
            ? "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
            : "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium";
    const cls = `${base} bg-emerald-50 text-emerald-800 border border-emerald-200`;
    const content = (
        <>
            <Icon icon="mdi:whatsapp" width={size === "sm" ? 11 : 13} aria-hidden />
            WhatsApp
        </>
    );

    if (!canOpen) {
        return <span className={cls} title="Booked through the Aparte WhatsApp bot">{content}</span>;
    }
    return (
        <Link
            href={PAGE_ROUTES.dashboard.whatsapp.conversation(String(conversationId))}
            onClick={(e) => e.stopPropagation()}
            className={`${cls} hover:bg-emerald-100`}
            title="Booked through the Aparte WhatsApp bot. Open the conversation."
        >
            {content}
        </Link>
    );
}

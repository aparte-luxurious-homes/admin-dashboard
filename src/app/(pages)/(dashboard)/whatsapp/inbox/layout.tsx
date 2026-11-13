"use client";

import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { WHATSAPP_INBOX_ROLES } from "@/lib/whatsappRoles";

/** Ops staff only; ANALYST sees the funnel, never the chats. */
export default function WhatsAppInboxLayout({ children }: { children: React.ReactNode }) {
    return <ProtectedRoute allowedRoles={WHATSAPP_INBOX_ROLES}>{children}</ProtectedRoute>;
}

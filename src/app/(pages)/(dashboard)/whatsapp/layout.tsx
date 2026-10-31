"use client";

import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { WHATSAPP_ANALYTICS_ROLES } from "@/lib/whatsappRoles";

/**
 * Aparte on WhatsApp. The section admits every role that may see either
 * child; the inbox narrows further in its own layout (ANALYST reads the
 * funnel only). The API enforces whatsapp.view_inbox / view_analytics anyway.
 */
export default function WhatsAppLayout({ children }: { children: React.ReactNode }) {
    return <ProtectedRoute allowedRoles={WHATSAPP_ANALYTICS_ROLES}>{children}</ProtectedRoute>;
}

import { UserRole } from "./enums";

/**
 * Who may open the WhatsApp pages. Kept free of React / axios so the nav
 * config (and its node unit test) can import it.
 */

/** Mirrors whatsapp.view_inbox / whatsapp.reply on the API. */
export const WHATSAPP_INBOX_ROLES: UserRole[] = [
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.OPERATIONS_ADMIN,
    UserRole.SUPPORT_ADMIN,
];

/** Mirrors whatsapp.view_analytics: the inbox roles plus ANALYST. */
export const WHATSAPP_ANALYTICS_ROLES: UserRole[] = [...WHATSAPP_INBOX_ROLES, UserRole.ANALYST];

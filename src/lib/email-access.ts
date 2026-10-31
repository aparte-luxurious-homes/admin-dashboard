import { UserRole } from "./enums";
import { getApiErrorMessage } from "./apiError";

/**
 * Who may change whose email address. Pure, so it is unit-tested; the request
 * handlers re-export it. Relative imports only: the unit tests run under Node,
 * which does not resolve the `@/` alias.
 */

/**
 * Who may CHANGE an address at all. Mirrors users.fix_email on the API:
 * changing someone's email is an account-takeover lever, so SUPPORT_ADMIN
 * stays review-only here, as it is for NIN/BVN. Support keeps the badge, the
 * list and Resend.
 */
export const FIX_EMAIL_ROLES: readonly UserRole[] = [
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATIONS_ADMIN,
];

/**
 * The accounts an ADMIN or OPERATIONS_ADMIN may fix. A staff account's
 * address is its sign-in and its password-reset route, so only a SUPER_ADMIN
 * may change one. An allow-list, as on the API: a role added later is
 * refused until someone decides otherwise.
 */
export const NON_STAFF_ROLES: readonly UserRole[] = [
    UserRole.GUEST,
    UserRole.OWNER,
    UserRole.AGENT,
];

export function canFixEmail(role: string | null | undefined): boolean {
    return FIX_EMAIL_ROLES.includes(role as UserRole);
}

/** Whether `viewerRole` may fix the address of an account whose role is `targetRole`. */
export function canFixEmailFor(
    viewerRole: string | null | undefined,
    targetRole: string | null | undefined
): boolean {
    if (!canFixEmail(viewerRole)) return false;
    if (viewerRole === UserRole.SUPER_ADMIN) return true;
    return NON_STAFF_ROLES.includes(targetRole as UserRole);
}

/** A plain sentence for each way the fix-email route can refuse. */
export function fixEmailErrorMessage(error: unknown): string | null {
    const status = (error as { response?: { status?: number } })?.response?.status;
    switch (status) {
        case 409:
            return "Another account already uses that email address.";
        case 400:
        case 422:
            return "That doesn't look like a valid email address.";
        case 403:
            // The API says why: "Ask a super admin" for a staff account, a
            // missing permission otherwise. Its words beat ours.
            return getApiErrorMessage(
                error,
                "Your role can't change email addresses. Ask an admin or operations admin."
            );
        default:
            return null;
    }
}

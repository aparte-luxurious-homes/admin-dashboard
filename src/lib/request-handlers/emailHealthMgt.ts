import { useEffect, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosRequest from "../api";
import { API_ROUTES } from "../routes/endpoints";
import { UserRole } from "../enums";
import { isLikelyEmail } from "../email-check";

/**
 * Email health: addresses our emails are bouncing off.
 *
 * Contract (api-v1): `GET /admin/email-health`, `GET /admin/email-health/summary`,
 * `POST /admin/users/{id}/email-health/resend`, `GET /utils/email-check`, and the
 * `email_status` / `email_bounced_at` / `email_bounce_reason` / `email_suggestion`
 * fields on every user payload. All admin reads are gated server-side on
 * `users.view_email_health` (SUPER_ADMIN, ADMIN, OPERATIONS_ADMIN, SUPPORT_ADMIN).
 */

export type EmailStatus = "OK" | "BOUNCING" | "UNDELIVERABLE";

/** Who sees email-health UI. Mirrors the backend grant for users.view_email_health. */
export const EMAIL_HEALTH_ROLES: readonly UserRole[] = [
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATIONS_ADMIN,
    UserRole.SUPPORT_ADMIN,
];

export function canViewEmailHealth(role: string | null | undefined): boolean {
    return EMAIL_HEALTH_ROLES.includes(role as UserRole);
}

export interface EmailHealthAgent {
    id: string;
    name: string | null;
    email: string | null;
}

export interface EmailHealthItem {
    user_id: string;
    name: string | null;
    role: string;
    email: string;
    phone: string | null;
    email_status: EmailStatus;
    email_bounced_at: string | null;
    email_bounce_reason: string | null;
    email_suggestion: string | null;
    failed_emails_count: number;
    last_failed_subject: string | null;
    agent: EmailHealthAgent | null;
}

export interface EmailHealthList {
    items: EmailHealthItem[];
    total: number;
    page: number;
    size: number;
}

export interface EmailHealthSummary {
    undeliverable: number;
    bouncing: number;
}

export interface EmailCheckResult {
    email: string;
    valid_format: boolean;
    suggestion: string | null;
    /** null = DNS lookup failed or timed out. Unknown, never a reason to block. */
    domain_accepts_mail: boolean | null;
    known_undeliverable: boolean;
}

enum EmailHealthKeys {
    list = "emailHealth:list",
    summary = "emailHealth:summary",
    check = "emailHealth:check",
}

/**
 * The API wraps most payloads in CustomResponse (`{ data: ... }`) but not all.
 * Accept either so a backend envelope change cannot blank these screens.
 */
function unwrap<T>(body: unknown, probe: string): T {
    const outer = body as Record<string, unknown> | null | undefined;
    const inner = outer?.data as Record<string, unknown> | null | undefined;
    if (inner && typeof inner === "object" && probe in inner) return inner as T;
    return outer as T;
}

export function GetEmailHealthList(params: {
    status: EmailStatus;
    search?: string;
    page: number;
    size: number;
}) {
    return useQuery({
        queryKey: [EmailHealthKeys.list, params],
        queryFn: async () => {
            const res = await axiosRequest.get(API_ROUTES.admin.emailHealth.base, {
                params: {
                    status: params.status,
                    search: params.search || undefined,
                    page: params.page,
                    size: params.size,
                },
            });
            const body = unwrap<EmailHealthList>(res?.data, "items");
            return {
                items: Array.isArray(body?.items) ? body.items : [],
                total: Number(body?.total ?? 0),
                page: Number(body?.page ?? params.page),
                size: Number(body?.size ?? params.size),
            } as EmailHealthList;
        },
        placeholderData: keepPreviousData,
    });
}

/**
 * Counts for the dashboard tile. `retry: false` because a 403/404 here means
 * "not for you" or "not deployed yet" — the tile hides itself on error rather
 * than retrying three times.
 */
export function GetEmailHealthSummary(enabled = true) {
    return useQuery({
        queryKey: [EmailHealthKeys.summary],
        queryFn: async () => {
            const res = await axiosRequest.get(API_ROUTES.admin.emailHealth.summary);
            const body = unwrap<EmailHealthSummary>(res?.data, "undeliverable");
            return {
                undeliverable: Number(body?.undeliverable ?? 0),
                bouncing: Number(body?.bouncing ?? 0),
            } as EmailHealthSummary;
        },
        enabled,
        retry: false,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: true,
    });
}

function useInvalidateEmailHealth() {
    const queryClient = useQueryClient();
    return () => {
        queryClient.invalidateQueries({ queryKey: [EmailHealthKeys.list] });
        queryClient.invalidateQueries({ queryKey: [EmailHealthKeys.summary] });
    };
}

/** Re-send the transactional emails that failed for this user in the last 7 days. */
export function ResendFailedEmails() {
    const invalidate = useInvalidateEmailHealth();
    return useMutation({
        mutationFn: async (userId: string) => {
            const res = await axiosRequest.post(API_ROUTES.admin.users.resendFailedEmails(userId));
            const body = unwrap<{ resent: number }>(res?.data, "resent");
            return { resent: Number(body?.resent ?? 0) };
        },
        onSuccess: invalidate,
    });
}

/**
 * Change only the user's email through the existing admin update endpoint.
 * The API's UserUpdate is all-optional, so sending `{ email }` alone leaves
 * every other field as it is. On an email change the backend resets the
 * bounce state and re-sends the last 7 days of failed emails itself.
 */
export function UpdateUserEmail() {
    const invalidate = useInvalidateEmailHealth();
    return useMutation({
        mutationFn: async ({ userId, email }: { userId: string; email: string }) => {
            const res = await axiosRequest.put(API_ROUTES.admin.users.userByUuid(userId), {
                email: email.trim(),
            });
            return res?.data;
        },
        onSuccess: invalidate,
    });
}

/** `value`, but only after it has stopped changing for `ms`. */
export function useDebouncedValue<T>(value: T, ms: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), ms);
        return () => clearTimeout(timer);
    }, [value, ms]);
    return debounced;
}

/**
 * Debounced server-side check of an address: MX lookup, Postmark suppression,
 * and the backend's own typo suggestion. Any failure (endpoint not deployed,
 * DNS timeout, network) resolves to "no opinion" — this is a hint, never a gate.
 */
export function useEmailCheck(email: string, debounceMs = 600) {
    const trimmed = (email || "").trim();
    const debounced = useDebouncedValue(trimmed, debounceMs);
    const ready = debounced === trimmed && isLikelyEmail(debounced);
    return useQuery({
        queryKey: [EmailHealthKeys.check, debounced.toLowerCase()],
        queryFn: async () => {
            const res = await axiosRequest.get(API_ROUTES.utils.emailCheck, {
                params: { email: debounced },
            });
            return unwrap<EmailCheckResult>(res?.data, "valid_format");
        },
        enabled: ready,
        retry: false,
        staleTime: 30 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
}

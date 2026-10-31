import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie";
import axiosRequest from "../api";
import { API_ROUTES } from "../routes/endpoints";

/**
 * Aparte on WhatsApp: the ops inbox, the funnel and the bot's public number.
 *
 * Contract: api-v1 services/whatsapp/schemas.py. The admin endpoints answer
 * the Pydantic model itself (no `{status, data}` envelope), but `unwrap`
 * accepts both shapes so a later move to the envelope does not blank a page.
 *
 * Permissions (API): whatsapp.view_inbox / whatsapp.reply for ADMIN,
 * SUPER_ADMIN, OPERATIONS_ADMIN and SUPPORT_ADMIN; whatsapp.view_analytics
 * adds ANALYST. GET /platform/whatsapp is open to any authenticated role.
 */

export { WHATSAPP_ANALYTICS_ROLES, WHATSAPP_INBOX_ROLES } from "../whatsappRoles";

export enum WhatsAppKeys {
    conversations = "whatsapp:conversations",
    conversation = "whatsapp:conversation",
    handoverCount = "whatsapp:handover-count",
    funnel = "whatsapp:funnel",
    platform = "whatsapp:platform",
}

// ---------------------------------------------------------------------------
// types (mirror services/whatsapp/enums.py + schemas.py)
// ---------------------------------------------------------------------------

export type WaContactMode = "GUEST" | "AGENT";

export type WaConversationState =
    | "GREETING"
    | "COLLECTING"
    | "RESULTS"
    | "CONFIRM_DETAILS"
    | "HOLD_PLACED"
    | "PAID"
    | "EXPIRED"
    | "HANDED_OVER"
    | "RESOLVED"
    | "OPTED_OUT";

export const WA_STATES: WaConversationState[] = [
    "GREETING",
    "COLLECTING",
    "RESULTS",
    "CONFIRM_DETAILS",
    "HOLD_PLACED",
    "PAID",
    "EXPIRED",
    "HANDED_OVER",
    "RESOLVED",
    "OPTED_OUT",
];

export type WaMessageDirection = "INBOUND" | "OUTBOUND";
export type WaMessageType = "TEXT" | "IMAGE" | "INTERACTIVE" | "BUTTON_REPLY" | "TEMPLATE" | "UNSUPPORTED";
export type WaMessageStatus = "RECEIVED" | "QUEUED" | "DRY_RUN" | "SENT" | "DELIVERED" | "READ" | "FAILED";

export interface WaContact {
    id: string;
    wa_id: string;
    profile_name: string | null;
    mode: WaContactMode;
    user_id: string | null;
    user_name?: string | null;
    opted_out_at: string | null;
    last_inbound_at: string | null;
    within_service_window: boolean;
}

export interface WaMessage {
    id: string;
    direction: WaMessageDirection;
    type: WaMessageType;
    body: string | null;
    payload: Record<string, any> | null;
    status: WaMessageStatus;
    error: string | null;
    sent_by_user_id: string | null;
    sent_by_name?: string | null;
    created_at: string;
}

export interface WaConversationBooking {
    id: string;
    booking_id: string;
    status: string;
    start_date: string;
    end_date: string;
    total_price: number | string;
    property_name?: string | null;
}

export interface WaConversationSummary {
    id: string;
    contact: WaContact;
    mode: WaContactMode;
    state: WaConversationState;
    acting_agent_id: string | null;
    acting_agent_name?: string | null;
    handover_reason: string | null;
    handover_at: string | null;
    handover_to: string | null;
    handover_to_name?: string | null;
    last_message_at: string | null;
    last_message_preview?: string | null;
    booking_id: string | null;
    first_message_at: string;
}

export interface WaConversationList {
    items: WaConversationSummary[];
    total: number;
    page: number;
    limit: number;
    /** Waiting for ops right now — drives the nav badge. */
    handover_count: number;
}

export interface WaConversationDetail extends WaConversationSummary {
    slots: Record<string, any>;
    failed_parse_count: number;
    resolved_at: string | null;
    messages: WaMessage[];
    booking: WaConversationBooking | null;
}

export interface WaFunnelStage {
    key: "conversations" | "results_shown" | "link_sent" | "paid" | string;
    label: string;
    count: number;
    /** 0..1 */
    rate_from_previous: number | null;
}

export interface WaFunnel {
    days: number;
    since: string;
    stages: WaFunnelStage[];
    guest_link_rate: number | null;
    link_to_paid_rate: number | null;
    median_seconds_to_link: number | null;
    agents_active: number;
    agents_with_booking: number;
    bot_bookings: number;
    all_bookings: number;
    bot_share: number | null;
    handovers: number;
    opt_outs: number;
}

export interface PlatformWhatsApp {
    enabled: boolean;
    /** Display form, e.g. "+234 901 234 5678". */
    number: string | null;
    /** https://wa.me/234... */
    wa_link: string | null;
}

export interface WaConversationParams {
    page: number;
    limit: number;
    state?: string;
    mode?: string;
    handover?: boolean;
    search?: string;
    sort_by?: string;
}

const unwrap = <T,>(resp: any): T => {
    const body = resp?.data;
    // The admin endpoints have no `data` field of their own, so a `data` key
    // here can only be the standard envelope.
    return (body && typeof body === "object" && "data" in body && body.data ? body.data : body) as T;
};

// ---------------------------------------------------------------------------
// inbox
// ---------------------------------------------------------------------------

/** The inbox list. Refetches every 30s so a new handover appears unprompted. */
export function GetWhatsAppConversations(params: WaConversationParams) {
    return useQuery({
        queryKey: [WhatsAppKeys.conversations, params],
        queryFn: () => axiosRequest.get(API_ROUTES.whatsapp.conversations, { params }),
        select: (resp: any) => unwrap<WaConversationList>(resp),
        refetchInterval: 30 * 1000,
        placeholderData: (prev) => prev,
    });
}

/**
 * Chats waiting for ops right now, for the nav badge. Only mounted for roles
 * the Inbox link is shown to, so ANALYST never asks (it would 403).
 */
export function GetWhatsAppHandoverCount() {
    const hasToken = Boolean(Cookies.get("token"));
    return useQuery({
        queryKey: [WhatsAppKeys.handoverCount],
        queryFn: () =>
            axiosRequest.get(API_ROUTES.whatsapp.conversations, {
                params: { handover: true, page: 1, limit: 1 },
            }),
        enabled: hasToken,
        select: (resp: any): number => {
            const n = unwrap<WaConversationList>(resp)?.handover_count ?? 0;
            return typeof n === "number" ? n : Number(n) || 0;
        },
        refetchInterval: 60 * 1000,
        refetchOnWindowFocus: true,
        retry: false,
    });
}

/** One thread. Refetches every 10s while open. */
export function GetWhatsAppConversation(id?: string) {
    return useQuery({
        queryKey: [WhatsAppKeys.conversation, id],
        queryFn: () => axiosRequest.get(API_ROUTES.whatsapp.conversation(id as string)),
        enabled: Boolean(id),
        select: (resp: any) => unwrap<WaConversationDetail>(resp),
        refetchInterval: 10 * 1000,
    });
}

function useInvalidateInbox() {
    const qc = useQueryClient();
    return (id?: string) => {
        qc.invalidateQueries({ queryKey: [WhatsAppKeys.conversations] });
        qc.invalidateQueries({ queryKey: [WhatsAppKeys.handoverCount] });
        if (id) qc.invalidateQueries({ queryKey: [WhatsAppKeys.conversation, id] });
    };
}

export type WaConversationAction = "takeover" | "release" | "resolve";

/** Take over (bot pauses), hand back to the bot, or resolve. */
export function WhatsAppConversationAction() {
    const qc = useQueryClient();
    const invalidate = useInvalidateInbox();
    return useMutation({
        mutationFn: ({ id, action }: { id: string; action: WaConversationAction }) =>
            axiosRequest.post(API_ROUTES.whatsapp[action](id)),
        onSuccess: (resp: any, { id }) => {
            const detail = unwrap<WaConversationDetail>(resp);
            if (detail?.id) {
                // Seed the thread with the server's answer so the buttons flip
                // immediately; the select runs on the raw response, so store it raw.
                qc.setQueryData([WhatsAppKeys.conversation, id], resp);
            }
            invalidate(id);
        },
    });
}

/**
 * Send a message as ops. A 409 means the contact is outside WhatsApp's 24h
 * service window; the server's `detail` says so and is what the caller shows.
 */
export function ReplyToWhatsAppConversation() {
    const invalidate = useInvalidateInbox();
    return useMutation({
        mutationFn: ({ id, body }: { id: string; body: string }) =>
            axiosRequest.post(API_ROUTES.whatsapp.reply(id), { body }),
        onSuccess: (_resp, { id }) => invalidate(id),
    });
}

// ---------------------------------------------------------------------------
// analytics
// ---------------------------------------------------------------------------

export function GetWhatsAppFunnel(days: number) {
    return useQuery({
        queryKey: [WhatsAppKeys.funnel, days],
        queryFn: () => axiosRequest.get(API_ROUTES.whatsapp.funnel, { params: { days } }),
        select: (resp: any) => unwrap<WaFunnel>(resp),
        placeholderData: (prev) => prev,
        staleTime: 60 * 1000,
    });
}

// ---------------------------------------------------------------------------
// platform
// ---------------------------------------------------------------------------

/**
 * The bot's public number. Any authenticated role. Callers hide their UI
 * unless this resolves with `enabled: true` and a link — an error (the API
 * not deployed yet, or an unapproved agent's 403) reads as "off".
 */
export function GetPlatformWhatsApp(enabled = true) {
    const hasToken = Boolean(Cookies.get("token"));
    return useQuery({
        queryKey: [WhatsAppKeys.platform],
        queryFn: () => axiosRequest.get(API_ROUTES.platform.whatsapp),
        enabled: enabled && hasToken,
        select: (resp: any) => unwrap<PlatformWhatsApp>(resp),
        staleTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: false,
    });
}

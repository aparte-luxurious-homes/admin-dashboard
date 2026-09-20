import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosRequest from "../api";
import { API_ROUTES } from "../routes/endpoints";

/**
 * Owner home (docs/owner-home-spec.md).
 *
 * Every endpoint answers for the logged-in owner; none takes an owner id.
 * Money arrives as strings ("1530000.00") and stays that way until it is
 * formatted — never parse it into a float and do arithmetic on it.
 */

enum OwnerHomeKeys {
    summary = "ownerHomeSummary",
    calendar = "ownerHomeCalendar",
    actions = "ownerHomeActions",
    agents = "ownerHomeAgents",
}

export interface NextRelease {
    amount: string;
    date: string;
    guest_name: string;
    unit_name: string;
    booking_id: string;
    /** The stay started but nobody checked the guest in, so the money waits on that. */
    overdue: boolean;
}

export interface MoneyCard {
    currency: string;
    /** What the owner can withdraw now: their wallet balance. */
    ready: string;
    /** Owner share of confirmed stays, released when the guest checks in. */
    clearing: string;
    next_release: NextRelease | null;
}

export interface Arrival {
    booking_id: string;
    reference: string;
    guest_name: string;
    unit_name: string;
    property_name: string;
    check_in: string;
    check_out: string;
    nights: number;
}

export interface BookingsCard {
    arrivals_30d: number;
    next_arrival: Arrival | null;
    open_nights_30d: number;
    in_house: number;
    units: number;
}

export interface OwnerSummary {
    as_of: string;
    money: MoneyCard;
    bookings: BookingsCard;
}

export type NightState =
    | "OPEN"
    | "BOOKED"
    | "OWNER_HOLD"
    | "OFFLINE"
    | "EXTERNAL"
    | "CLOSED"
    | "UNAVAILABLE"
    | "PARTIAL";

export interface CalendarUnit {
    unit_id: string;
    property_id: string;
    property_name: string;
    unit_name: string;
    rooms: number;
    /** False for multi-room units: their nights are read only here. */
    writable: boolean;
    source: string;
}

export interface CalendarBooking {
    id: string;
    reference: string;
    status: string;
    guest_name: string;
    check_in: string;
    check_out: string;
    nights: number;
    guest_paid: string;
    platform_fee: string;
    your_share: string;
    agent_name: string | null;
    source: string;
}

export interface CalendarNight {
    unit_id: string;
    date: string;
    state: NightState;
    writable: boolean;
    rooms_booked: number;
    rooms_total: number;
    booking_id: string | null;
    block_group_id: string | null;
    reopenable: boolean;
    note: string | null;
}

export interface OwnerCalendar {
    from_date: string;
    to_date: string;
    today: string;
    units: CalendarUnit[];
    nights: CalendarNight[];
    bookings: CalendarBooking[];
}

export type BlockReason = "OWNER_HOLD" | "OFFLINE_BOOKING";

export interface OwnerAction {
    kind: string;
    severity: "URGENT" | "NORMAL" | "INFO";
    deadline_at: string | null;
    title: string;
    detail: string;
    cta_label: string;
    cta_href: string;
}

export interface OwnerActions {
    items: OwnerAction[];
    urgent_count: number;
}

export interface AgentPerformance {
    agent_id: string;
    name: string;
    places: string[];
    bookings: number;
    /** What the OWNER earned from this agent's bookings. Never the agent's pay. */
    you_earned: string;
    last_booking_at: string | null;
    phone: string | null;
    quiet: boolean;
}

export interface OwnerAgents {
    window_days: number;
    agents: AgentPerformance[];
}

/**
 * Pull the payload out of the {status, code, message, data} envelope.
 *
 * `body.data.data ?? body.data` would hand back the ENVELOPE whenever the API
 * answers `data: null`, and the page would then read `.money` off it and throw
 * on a blank screen. If the response looks like an envelope, its `data` is the
 * only thing that counts, null included.
 */
function unwrap<T>(response: unknown): T | undefined {
    const body = response as { data?: Record<string, unknown> } | undefined;
    const payload = body?.data;
    if (!payload || typeof payload !== "object") return undefined;
    if ("data" in payload && "status" in payload) {
        return (payload.data as T) ?? undefined;
    }
    return payload as T;
}

export function GetOwnerSummary(enabled = true) {
    const query = useQuery({
        queryKey: [OwnerHomeKeys.summary],
        queryFn: () => axiosRequest.get(API_ROUTES.ownerHome.summary),
        staleTime: 1000 * 60,
        enabled,
    });
    return { ...query, summary: unwrap<OwnerSummary>(query.data) };
}

export function GetOwnerCalendar(
    from: string,
    to: string,
    propertyId?: string,
    enabled = true
) {
    const query = useQuery({
        // Each month is cached under its own key, so paging back to a month
        // already seen costs no request.
        queryKey: [OwnerHomeKeys.calendar, from, to, propertyId ?? "all"],
        queryFn: () =>
            axiosRequest.get(API_ROUTES.ownerHome.calendar(from, to, propertyId)),
        staleTime: 1000 * 60,
        enabled,
    });
    return { ...query, calendar: unwrap<OwnerCalendar>(query.data) };
}

export function GetOwnerActions(enabled = true) {
    const query = useQuery({
        queryKey: [OwnerHomeKeys.actions],
        queryFn: () => axiosRequest.get(API_ROUTES.ownerHome.actions),
        staleTime: 1000 * 60,
        enabled,
    });
    return { ...query, actions: unwrap<OwnerActions>(query.data) };
}

export function GetOwnerAgents(windowDays = 90, enabled = true) {
    const query = useQuery({
        queryKey: [OwnerHomeKeys.agents, windowDays],
        queryFn: () => axiosRequest.get(API_ROUTES.ownerHome.agents(windowDays)),
        staleTime: 1000 * 60 * 5,
        enabled,
    });
    return { ...query, agents: unwrap<OwnerAgents>(query.data) };
}

/**
 * Closing and reopening both invalidate the calendar and the summary: closed
 * nights change how many are open, which the bookings card counts.
 */
export function CloseNights() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: {
            unit_id: string;
            start_date: string;
            nights: number;
            source: BlockReason;
            note?: string;
        }) => axiosRequest.post(API_ROUTES.ownerHome.blocks, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [OwnerHomeKeys.calendar] });
            queryClient.invalidateQueries({ queryKey: [OwnerHomeKeys.summary] });
        },
    });
}

export function ReopenNights() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (blockGroupId: string) =>
            axiosRequest.delete(API_ROUTES.ownerHome.block(blockGroupId)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [OwnerHomeKeys.calendar] });
            queryClient.invalidateQueries({ queryKey: [OwnerHomeKeys.summary] });
        },
    });
}

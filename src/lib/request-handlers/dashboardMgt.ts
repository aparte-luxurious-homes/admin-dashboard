import { useQuery } from "@tanstack/react-query";
import axiosRequest from "../api";
import { API_ROUTES } from "../routes/endpoints";

enum DashboardKeys {
    adminQueues = "dashboard:adminQueues",
    upcomingBookings = "dashboard:upcomingBookings",
    agentPerformance = "dashboard:agentPerformance",
}

// Five-minute staleTime matches the backend's read pattern — these aren't
// real-time critical but should refresh on focus so admin dashboards feel
// responsive after they take an action elsewhere.
const FIVE_MIN = 5 * 60 * 1000;

export interface QueueSummary {
    count: number;
    oldest_age_days: number;
}

export interface AdminQueuesResponse {
    kyc_pending: QueueSummary;
    verifications_pending: QueueSummary;
    open_disputes: QueueSummary;
    booking_requests: QueueSummary;
}

export function GetAdminQueues(enabled = true) {
    return useQuery({
        queryKey: [DashboardKeys.adminQueues],
        queryFn: async () => {
            const response = await axiosRequest.get(API_ROUTES.statistic.adminQueues);
            return (response?.data?.data ?? response?.data) as AdminQueuesResponse;
        },
        enabled,
        staleTime: FIVE_MIN,
        refetchOnWindowFocus: true,
    });
}

export interface UpcomingBookingItem {
    id: string;
    booking_id: string;
    property_name: string | null;
    unit_name: string | null;
    guest_first_name: string | null;
    start_date: string;
    end_date: string;
    unit_count: number;
    status: string;
}

export interface UpcomingBookingsResponse {
    items: UpcomingBookingItem[];
    total: number;
    days_ahead: number;
    as_of: string;
}

// --- Agent performance framework (powers Top Agents widget + reports page) ---
// Shape mirrors services/statistics/agent_performance_service.py exactly. See
// scripts/agent_performance_metrics.sql for the canonical metric definitions.
export interface AgentPerformanceSummary {
    total_registered_agents: number;
    active_account_agents: number;
    verified_contact_agents: number;
    total_active_agents: number;
    agents_joined_last_30d: number;
    week_start_monday: string | null;
    week_end_sunday: string | null;
    month_start_date: string | null;
}

export interface AgentPerformanceRow {
    agent_id: string;
    agent_name: string;
    email: string | null;
    phone: string | null;
    agent_joined_at: string | null;
    listings_this_week: number;
    verified_this_week: number;
    listings_mtd: number;
    verified_listings_mtd: number;
    verified_listings: number;
    total_listings: number;
    pending_listings: number;
    is_active_agent: boolean;
    verification_rate_pct: string; // Decimal-as-string; parseFloat to display
    last_listed_at: string | null;
    last_verified_at: string | null;
}

export interface AgentPerformanceResponse {
    summary: AgentPerformanceSummary;
    agents: AgentPerformanceRow[];
}

export function GetAgentPerformance(enabled = true) {
    return useQuery({
        queryKey: [DashboardKeys.agentPerformance],
        queryFn: async () => {
            const response = await axiosRequest.get(API_ROUTES.statistic.adminAgentPerformance);
            return (response?.data?.data ?? response?.data) as AgentPerformanceResponse;
        },
        enabled,
        staleTime: FIVE_MIN,
        refetchOnWindowFocus: true,
    });
}

export function GetUpcomingBookings(params?: { limit?: number; days_ahead?: number; enabled?: boolean }) {
    const limit = params?.limit ?? 5;
    const daysAhead = params?.days_ahead ?? 30;
    return useQuery({
        queryKey: [DashboardKeys.upcomingBookings, limit, daysAhead],
        queryFn: async () => {
            const response = await axiosRequest.get(API_ROUTES.bookings.upcoming, {
                params: { limit, days_ahead: daysAhead },
            });
            return (response?.data?.data ?? response?.data) as UpcomingBookingsResponse;
        },
        enabled: params?.enabled ?? true,
        staleTime: FIVE_MIN,
        refetchOnWindowFocus: true,
    });
}

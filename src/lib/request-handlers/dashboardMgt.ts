import { useQuery } from "@tanstack/react-query";
import axiosRequest from "../api";
import { API_ROUTES } from "../routes/endpoints";

enum DashboardKeys {
    adminQueues = "dashboard:adminQueues",
    upcomingBookings = "dashboard:upcomingBookings",
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

import { useQuery } from "@tanstack/react-query";
import axiosRequest from "../api";
import { API_ROUTES } from "../routes/endpoints";
import { UserRole } from "../enums";

enum NetworkRequestKeys {
    myNetworkSummary = "myNetworkSummary",
}

/**
 * Mentor status for the calling agent, from GET /network/me.
 *
 * Sidebar labelling depends on it, so it is a shared cached query rather than a
 * per-component fetch. The endpoint is AGENT-only (require_roles([AGENT])), so
 * the query is disabled for every other role — an admin calling it would 403.
 */
export function GetIsMentor(role?: UserRole) {
    return useQuery({
        queryKey: [NetworkRequestKeys.myNetworkSummary],
        queryFn: () => axiosRequest.get(API_ROUTES.network.me),
        enabled: role === UserRole.AGENT,
        select: (resp: any): boolean => {
            const data = resp?.data?.data ?? resp?.data;
            const summary = data?.mentorship;
            return Boolean(summary?.is_mentor) || (summary?.active_mentee_count ?? 0) > 0;
        },
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
}

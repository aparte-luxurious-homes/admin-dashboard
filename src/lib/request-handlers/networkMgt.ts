import { useQuery } from "@tanstack/react-query";
import axiosRequest from "../api";
import { API_ROUTES } from "../routes/endpoints";
import { AgentNetworkRole, UserRole } from "../enums";

enum NetworkRequestKeys {
    myNetworkSummary = "myNetworkSummary",
    myNetworkAgents = "myNetworkAgents",
}

/**
 * Why an agent can see more than their own rows.
 *
 * `mentor` — they mentor at least one non-ENDED mentee.
 * `zone`   — they hold an ACTIVE AREA_MANAGER / REGIONAL_LEAD assignment, so
 *            every agent with a property inside their zone tree is in scope.
 *
 * Both come off the same `/network/me` payload the backend added for exactly
 * this purpose (`mentorship.is_mentor`, `zone.is_zone_manager`) — they are the
 * flags a client gates its network-wide filter controls on. An agent who is
 * neither sees only themselves everywhere, so the controls would be empty.
 */
export interface NetworkStanding {
    isMentor: boolean;
    isZoneManager: boolean;
    /** Direct roles held through ACTIVE assignments. Empty for a plain agent. */
    zoneRoles: AgentNetworkRole[];
    /** Agents visible beyond the caller — zone tree plus mentees. */
    managedAgentCount: number;
    currentTier: string | null;
    menteeCap: number;
    remainingMenteeSlots: number;
    /** True once either flag is set — the single gate for "show the pickers". */
    hasNetwork: boolean;
}

/**
 * Network standing for the calling agent, from GET /network/me.
 *
 * Several tables gate their filter chrome on it, so it is a shared cached query
 * rather than a per-component fetch. The endpoint is AGENT-only, so the query is
 * disabled for every other role — an admin calling it would 403.
 */
export function GetNetworkStanding(role?: UserRole) {
    return useQuery({
        queryKey: [NetworkRequestKeys.myNetworkSummary],
        queryFn: () => axiosRequest.get(API_ROUTES.network.me),
        enabled: role === UserRole.AGENT,
        select: (resp: any): NetworkStanding => {
            const data = resp?.data?.data ?? resp?.data;
            const mentorship = data?.mentorship;
            const zone = data?.zone;

            const isMentor =
                Boolean(mentorship?.is_mentor) || (mentorship?.active_mentee_count ?? 0) > 0;
            // `zone` is absent on a backend older than the standing card; fall
            // back to the roles array so the flag is never wrongly false.
            const zoneRoles: AgentNetworkRole[] = Array.isArray(zone?.roles) ? zone.roles : [];
            const isZoneManager = Boolean(zone?.is_zone_manager) || zoneRoles.length > 0;

            const cap = mentorship?.mentee_cap ?? 10;
            return {
                isMentor,
                isZoneManager,
                zoneRoles,
                managedAgentCount: zone?.managed_agent_count ?? 0,
                currentTier: data?.current_tier ?? data?.tier ?? null,
                menteeCap: cap,
                remainingMenteeSlots:
                    mentorship?.remaining_mentee_slots ??
                    Math.max(0, cap - (mentorship?.active_mentee_count ?? 0)),
                hasNetwork: isMentor || isZoneManager,
            };
        },
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
}

/** One selectable agent in the caller's network — a row in the "whose events" picker. */
export interface NetworkAgentOption {
    agent_id: string;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    phone?: string | null;
    profile_image?: string | null;
    current_tier?: string | null;
    /** Why the agent is visible: the caller, a mentee, or a zone-tree agent. */
    relation: "self" | "mentee" | "zone";
}

export function networkAgentName(option: NetworkAgentOption): string {
    const name = [option.first_name, option.last_name].filter(Boolean).join(" ");
    return name || option.email || "Unnamed agent";
}

/**
 * The agents the caller may filter their network views by, from GET /network/agents.
 *
 * Search is server-side: a Regional Lead's zone can hold hundreds of agents, so
 * filtering a first page client-side would silently hide everyone past it — the
 * same bug the mentee dropdown had before it moved server-side. Debounce the
 * `search` argument at the call site.
 *
 * Every id returned here is accepted by `agent_id` on /network/history and
 * /network/mentorship, so a selection can never 403.
 */
export function GetNetworkAgents({
    search,
    relation,
    includeSelf = true,
    enabled = true,
    size = 50,
}: {
    search?: string;
    relation?: "self" | "mentee" | "zone";
    includeSelf?: boolean;
    enabled?: boolean;
    size?: number;
} = {}) {
    return useQuery({
        queryKey: [NetworkRequestKeys.myNetworkAgents, search ?? "", relation ?? "", includeSelf, size],
        queryFn: () =>
            axiosRequest.get(API_ROUTES.network.myNetworkAgents, {
                params: {
                    page: 1,
                    size,
                    ...(search ? { search } : {}),
                    ...(relation ? { relation } : {}),
                    include_self: includeSelf,
                },
            }),
        enabled,
        select: (resp: any) => {
            const data = resp?.data?.data ?? resp?.data;
            const items: NetworkAgentOption[] = data?.items ?? [];
            return {
                items,
                total: data?.total ?? items.length,
                isMentor: Boolean(data?.is_mentor),
                isZoneManager: Boolean(data?.is_zone_manager),
            };
        },
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
    });
}

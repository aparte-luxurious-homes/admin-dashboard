import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie";
import axiosRequest from "../api";
import { API_ROUTES } from "../routes/endpoints";

export enum PlatformRequestKeys {
    features = "platform:features",
    networkFeature = "platform:network-feature",
}

/** Who last moved the switch — shown on the settings screen. */
export interface NetworkFeatureState {
    network_enabled: boolean;
    /** Null until the switch has been flipped at least once. */
    updated_at: string | null;
    updated_by: string | null;
    updated_by_name: string | null;
    updated_by_email: string | null;
}

/**
 * Whether the Agent Network feature is live, from GET /platform/features.
 *
 * Every authenticated role may read this, and every client needs it: the
 * navigation, the dashboard cards and the route guards all depend on it.
 *
 * **Defaults to enabled while loading and on error.** The alternative is worse
 * — a slow or failed request would blank the Network tab out from under an
 * agent mid-session, which looks identical to the feature being switched off.
 * The API is the real gate: every /network route 503s when it is off, so the
 * cost of guessing wrong for a moment is a request that fails cleanly.
 */
export function GetPlatformFeatures() {
    // Gated on the token, not just on mount. The dashboard layout calls this
    // before its own auth check has run, and an unauthenticated request would
    // 401 — which the axios interceptor turns into a full logout and redirect.
    const hasToken = Boolean(Cookies.get("token"));
    return useQuery({
        queryKey: [PlatformRequestKeys.features],
        queryFn: () => axiosRequest.get(API_ROUTES.platform.features),
        enabled: hasToken,
        select: (resp: any): { networkEnabled: boolean } => {
            const data = resp?.data?.data ?? resp?.data;
            return { networkEnabled: data?.network_enabled !== false };
        },
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
    });
}

/**
 * Convenience wrapper: the one boolean most callers want.
 *
 * `isLoading` is exposed separately for the few places that must not commit to
 * a layout until the answer is known.
 */
export function useNetworkEnabled(): { networkEnabled: boolean; isLoading: boolean } {
    const { data, isLoading } = GetPlatformFeatures();
    return { networkEnabled: data?.networkEnabled !== false, isLoading };
}

/** The switch plus its provenance, from GET /admin/platform/features. SUPER_ADMIN only. */
export function GetNetworkFeatureState(enabled = true) {
    return useQuery({
        queryKey: [PlatformRequestKeys.networkFeature],
        queryFn: () => axiosRequest.get(API_ROUTES.platform.adminFeatures),
        enabled,
        select: (resp: any): NetworkFeatureState => {
            const data = resp?.data?.data ?? resp?.data;
            return {
                network_enabled: data?.network_enabled !== false,
                updated_at: data?.updated_at ?? null,
                updated_by: data?.updated_by ?? null,
                updated_by_name: data?.updated_by_name ?? null,
                updated_by_email: data?.updated_by_email ?? null,
            };
        },
        staleTime: 0,
        refetchOnWindowFocus: false,
    });
}

/**
 * Flip the Agent Network switch platform-wide.
 *
 * `password` is the caller's own, re-entered — the API verifies it against the
 * calling account. A 401 back means the password was wrong and nothing changed.
 *
 * On success every cached query is invalidated, not just the two feature keys:
 * the switch changes which navigation exists, which roles the permissions
 * matrix offers, and whether /network data is reachable at all, so anything
 * already in the cache may now be wrong.
 */
export function UpdateNetworkFeature() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: { enabled: boolean; password: string; reason?: string }) =>
            axiosRequest.put(API_ROUTES.platform.networkFeature, payload),
        onSuccess: () => {
            queryClient.invalidateQueries();
        },
    });
}

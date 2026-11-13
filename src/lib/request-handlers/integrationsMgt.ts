import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosRequest from "../api";
import { API_ROUTES } from "../routes/endpoints";

enum IntegrationsRequestKeys {
    gatewayBalances = "gatewayBalances",
    walletTotals = "walletTotals",
    integrationConfigs = "integrationConfigs",
}

export function GetGatewayBalances(enabled: boolean = true) {
    return useQuery({
        queryKey: [IntegrationsRequestKeys.gatewayBalances],
        queryFn: () => axiosRequest.get(API_ROUTES.statistic.gatewayBalances),
        staleTime: 1000 * 60 * 2, // 2 minutes
        enabled,
    });
}

/**
 * The platform's wallet liability (GET /stats/wallet-totals), read beside the
 * gateway balances to reconcile what the gateways hold against what the
 * platform owes its wallet holders. Same audience as the gateway balances.
 */
export function GetWalletTotals(enabled: boolean = true) {
    return useQuery({
        queryKey: [IntegrationsRequestKeys.walletTotals],
        queryFn: () => axiosRequest.get(API_ROUTES.statistic.walletTotals),
        staleTime: 1000 * 60 * 2, // 2 minutes, like the gateway balances
        enabled,
    });
}

export function GetIntegrationConfigs() {
    return useQuery({
        queryKey: [IntegrationsRequestKeys.integrationConfigs],
        queryFn: () => axiosRequest.get(API_ROUTES.admin.integrations.configs),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

export function UpdateIntegrationConfig() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ key, payload }: { key: string; payload: any }) =>
            axiosRequest.patch(API_ROUTES.admin.integrations.configByKey(key), payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [IntegrationsRequestKeys.integrationConfigs] });
        },
    });
}

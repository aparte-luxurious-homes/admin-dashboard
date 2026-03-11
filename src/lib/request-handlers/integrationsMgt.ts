import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosRequest from "../api";
import { API_ROUTES } from "../routes/endpoints";

enum IntegrationsRequestKeys {
    gatewayBalances = "gatewayBalances",
    integrationConfigs = "integrationConfigs",
}

export function GetGatewayBalances() {
    return useQuery({
        queryKey: [IntegrationsRequestKeys.gatewayBalances],
        queryFn: () => axiosRequest.get(API_ROUTES.statistic.gatewayBalances),
    });
}

export function GetIntegrationConfigs() {
    return useQuery({
        queryKey: [IntegrationsRequestKeys.integrationConfigs],
        queryFn: () => axiosRequest.get(API_ROUTES.admin.integrations.configs),
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

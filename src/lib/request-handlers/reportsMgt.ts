import { useQuery } from "@tanstack/react-query";
import axiosRequest from "../api";
import { API_ROUTES } from "../routes/endpoints";

export enum ReportsRequestKeys {
    statements = "getStatements",
}

export function GetStatements(userType: 'owner' | 'agent' = 'owner', agentId?: string) {
    return useQuery({
        queryKey: [ReportsRequestKeys.statements, userType, agentId],
        queryFn: () => {
            const url = userType === 'agent' && agentId 
                ? API_ROUTES.agents.statements.base(agentId)
                : API_ROUTES.reports.statements.base;
            return axiosRequest.get(url);
        },
        enabled: userType === 'owner' || !!agentId,
        refetchOnWindowFocus: true,
    });
}

/**
 * Utility to request a file download from the new GCS-based reporting endpoints
 */
export async function requestReportDownload(url: string, format: string) {
    try {
        const response = await axiosRequest.get(url, {
            params: { format },
        });

        const downloadUrl = response.data?.data?.download_url;
        
        if (!downloadUrl) {
            throw new Error("Report generated, but download URL is missing.");
        }
        
        window.open(downloadUrl, '_blank');
        return downloadUrl;
    } catch (error) {
        console.error("Error downloading file:", error);
        throw error;
    }
}

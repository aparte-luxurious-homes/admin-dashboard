import { useQuery } from "@tanstack/react-query";
import axiosRequest from "../api";
import { API_ROUTES } from "../routes/endpoints";

export enum ReportsRequestKeys {
    statements = "getStatements",
    statementDetails = "getStatementDetails",
}

export function GetStatements(userType: 'owner' | 'agent' = 'owner', userId?: string) {
    return useQuery({
        queryKey: [ReportsRequestKeys.statements, userType, userId],
        queryFn: () => {
            const url = userType === 'agent'
                ? API_ROUTES.agents.statements.base(userId!)
                : API_ROUTES.reports.statements.base(userId!);
            return axiosRequest.get(url);
        },
        enabled: !!userId,
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

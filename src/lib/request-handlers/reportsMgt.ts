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
 *
 * The tab is opened BEFORE the request and pointed at the file once the API
 * returns its URL. Opening it afterwards, as this used to, silently did nothing
 * in Safari: its popup blocker only honours `window.open` while the click that
 * caused it is still being handled, and generating a statement (render, then
 * upload to GCS) takes seconds. Chrome allows a new tab for ~5s after a click,
 * which is why this only ever failed on Safari.
 *
 * So callers must reach this without awaiting anything first — by then the
 * click is already spent.
 */
export async function requestReportDownload(url: string, format: string) {
    const tab = window.open("", "_blank");
    if (tab) {
        tab.document.title = "Preparing report…";
        tab.document.body.textContent = "Preparing your report…";
    }

    try {
        const response = await axiosRequest.get(url, {
            params: { format },
        });

        const downloadUrl = response.data?.data?.download_url;

        if (!downloadUrl) {
            throw new Error("Report generated, but download URL is missing.");
        }

        if (tab && !tab.closed) {
            // The file lives on another origin; don't give it a handle back
            // to the dashboard.
            tab.opener = null;
            tab.location.href = downloadUrl;
        } else {
            // Even the blank tab was refused (popups disabled outright), or it
            // was closed while waiting. Navigating here is recoverable with
            // Back; doing nothing while a toast reports success is not.
            window.location.assign(downloadUrl);
        }
        return downloadUrl;
    } catch (error) {
        tab?.close();
        console.error("Error downloading file:", error);
        throw error;
    }
}

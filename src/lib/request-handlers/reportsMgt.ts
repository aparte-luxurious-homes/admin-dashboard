import { useQuery } from "@tanstack/react-query";
import axiosRequest from "../api";
import { API_ROUTES } from "../routes/endpoints";

export enum ReportsRequestKeys {
    statements = "getStatements",
}

export function GetStatements() {
    return useQuery({
        queryKey: [ReportsRequestKeys.statements],
        queryFn: () => axiosRequest.get(API_ROUTES.reports.statements.base),
        refetchOnWindowFocus: true,
    });
}

/**
 * Utility to download a file from a given URL as a blob
 */
export async function downloadReportFile(url: string, format: string, defaultFilename: string) {
    try {
        const response = await axiosRequest.get(url, {
            params: { format },
            responseType: 'blob', // Important: tells axios to handle binary data
        });

        // Determine content type from response or fallback
        const contentType = response.headers['content-type'] || 
                            (format === 'pdf' ? 'application/pdf' : 
                             format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
                             'text/csv');

        const blob = new Blob([response.data], { type: contentType });
        const downloadUrl = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = downloadUrl;
        
        // Try to get filename from content-disposition header if available
        let filename = defaultFilename;
        const disposition = response.headers['content-disposition'];
        if (disposition && disposition.indexOf('attachment') !== -1) {
            const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
            const matches = filenameRegex.exec(disposition);
            if (matches != null && matches[1]) { 
                filename = matches[1].replace(/['"]/g, '');
            }
        }

        link.download = filename;
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        }, 100);

        return true;
    } catch (error) {
        console.error("Error downloading file:", error);
        throw error;
    }
}

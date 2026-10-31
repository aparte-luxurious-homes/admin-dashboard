import { useQuery } from "@tanstack/react-query";
import axiosRequest from "../api";
import { API_ROUTES } from "../routes/endpoints";
import { UserRole } from "../enums";

/**
 * Owners and agents receive reports by email, never as a download; staff keep
 * the download. Mirrors REPORT_EMAIL_ROLES in api-v1 services/reporting/delivery.py.
 * Decided by role rather than by the response because the download path has to
 * open its tab synchronously on click (see requestReportDownload).
 */
export function receivesReportsByEmail(role?: string) {
    return role === UserRole.OWNER || role === UserRole.AGENT;
}

/**
 * Payment-method filter values for the booking report, spelled the way the API
 * stores them on bookings.payment_method (api-v1 services/bookings/schemas.py:
 * "online", "wallet", "bank_transfer", "cash", "pos"). The filter used to send PAYSTACK /
 * TRANSFER / CASH / POS. While the API still ignored the misnamed parameter
 * nobody noticed; once the parameter name was fixed, every payment-method
 * filter matched nothing and returned an empty report.
 */
export const REPORT_PAYMENT_METHODS = [
    { value: "online", label: "Online (card/transfer via gateway)" },
    { value: "wallet", label: "Agent wallet" },
    { value: "bank_transfer", label: "Bank transfer" },
    { value: "cash", label: "Cash" },
    { value: "pos", label: "POS" },
] as const;

/**
 * How a finished report request ended, and the one line to show for it.
 *
 * "already_sent" is the API declining to email the same report twice within a
 * few minutes: the first copy is already in the inbox. That is information,
 * not a success to celebrate and not an error to retry, so callers show it as
 * a plain toast rather than a green or red one.
 */
export type ReportDelivery = "email" | "already_sent" | "download";

export interface ReportOutcome {
    delivery: ReportDelivery;
    message: string;
}

/**
 * Generating a report (render, upload, then email with retries) can outlast the
 * client's default 30s, while the server keeps going for up to 300s. Giving up
 * at 30s showed an error for a report that then arrived anyway.
 */
const REPORT_TIMEOUT_MS = 120000;

const REPORT_EMAIL_TIMEOUT_MESSAGE =
    "This is taking longer than usual. If it completes, the report will arrive in your email, so check your inbox before trying again.";

function isTimeout(error: any) {
    return error?.code === "ECONNABORTED" || error?.code === "ETIMEDOUT";
}

/**
 * Ask the API to generate a report and email it. Resolves with what happened
 * and the message to show (it names the address the report went to). The API
 * only answers once the email has been accepted, so a resolved promise means
 * it was sent — or, for `delivery: "already_sent"`, that it had been sent
 * moments earlier and was not sent again.
 *
 * A report the API will not email at all (too large; narrow the date range)
 * comes back as a 400 and is rethrown as-is, so the API's own wording reaches
 * the toast through reportErrorMessage.
 */
export async function requestReportEmail(url: string, format: string): Promise<ReportOutcome> {
    let response;
    try {
        response = await axiosRequest.get(url, { params: { format }, timeout: REPORT_TIMEOUT_MS });
    } catch (error) {
        // A timeout is not a failure the server reported: the email may still
        // go out, and retrying straight away would send it twice.
        if (isTimeout(error)) throw new Error(REPORT_EMAIL_TIMEOUT_MESSAGE);
        throw error;
    }
    const body = response.data;
    const data = body?.data;
    const sentTo = data?.sent_to;
    // The router wraps the delivery result under `data`; accept it at the top
    // level too so a flatter response shape cannot demote this to "sent".
    if ((data?.delivery ?? body?.delivery) === "already_sent") {
        return {
            delivery: "already_sent",
            message: sentTo
                ? `This report was already sent to ${sentTo} a moment ago`
                : body?.message || "This report was already sent to your email a moment ago",
        };
    }
    return {
        delivery: "email",
        message: body?.message
            || (sentTo ? `Your report has been sent to ${sentTo}` : "Your report has been sent to your email"),
    };
}

/**
 * Email the report (owner/agent) or download it (staff). Resolves with the
 * outcome to toast (see notifyReportOutcome in components/reports-mgt).
 * Must be called without awaiting anything first, for the download path.
 */
export async function requestReport(url: string, format: string, role?: string): Promise<ReportOutcome> {
    if (receivesReportsByEmail(role)) {
        return requestReportEmail(url, format);
    }
    await requestReportDownload(url, format);
    return { delivery: "download", message: `${format.toUpperCase()} downloaded successfully` };
}

/**
 * The line to show when a report request fails. The API's own wording comes
 * first and is shown verbatim: it is what tells an owner that a report is too
 * large to email and to narrow the date range, and that instruction must reach
 * them as written. Only a string `detail` is trusted — a 422 carries a list of
 * field errors there, which would otherwise render as "[object Object]".
 */
export function reportErrorMessage(error: any, fallback: string): string {
    const body = error?.response?.data;
    if (typeof body?.detail === "string" && body.detail) return body.detail;
    if (typeof body?.message === "string" && body.message) return body.message;
    if (typeof error?.message === "string" && error.message) return error.message;
    return fallback;
}

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
            timeout: REPORT_TIMEOUT_MS,
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

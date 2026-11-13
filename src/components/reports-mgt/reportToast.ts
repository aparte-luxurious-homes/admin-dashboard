import toast from "react-hot-toast";
import { reportErrorMessage, ReportOutcome } from "@/src/lib/request-handlers/reportsMgt";

/**
 * One place that decides how a finished report request is announced, so the
 * Booking Reports and History tabs cannot drift apart on it.
 *
 * "already_sent" is the API refusing to email the same report twice within a
 * few minutes because the first copy is already in the inbox. It is shown as a
 * neutral toast — the codebase's convention for information (see
 * RunSettlementSweepButton) — not as a success, which would read as a second
 * email on its way, and not as an error, which would invite the retry the API
 * just declined.
 */
export function notifyReportOutcome(outcome: ReportOutcome) {
    if (outcome.delivery === "already_sent") {
        toast(outcome.message, { duration: 6000 });
        return;
    }
    toast.success(outcome.message);
}

/**
 * Error toast for a failed report request, in the API's own words where it
 * gave any (reportErrorMessage says why that matters).
 */
export function notifyReportError(error: unknown, fallback: string) {
    toast.error(reportErrorMessage(error, fallback));
}

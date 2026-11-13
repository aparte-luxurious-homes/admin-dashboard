/**
 * The public website (aparte.ng), where the blog is read. Same fallback chain
 * as getLandingAgentKycUrl in agentApproval.ts.
 */
export function siteUrl(path = ""): string {
    const base = (
        process.env.NEXT_PUBLIC_LANDING_PAGE_URL ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        "https://aparte.ng"
    ).replace(/\/$/, "");
    return `${base}${path}`;
}

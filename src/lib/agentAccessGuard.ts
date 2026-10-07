import Cookies from "js-cookie";
import { getLandingAgentKycUrl } from "@/src/lib/agentApproval";

export const AGENT_KYC_REQUIRED_MESSAGE =
  "Your agent account requires approved KYC before you can access the dashboard. Complete verification on the landing site, or contact sales@aparte.ng.";

/**
 * Clear the JS-readable cookies the dashboard owns.
 *
 * The session itself is an HttpOnly cookie that only the API can expire (see
 * `endServerSession` in lib/api.ts). `token` is the pre-HttpOnly session
 * cookie, still removed so a browser upgrading from that version is left clean.
 */
export function clearAdminSessionCookies() {
  Cookies.remove("token");
  Cookies.remove("networkRole");
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  if (hostname.includes("aparte.ng")) {
    Cookies.remove("token", { domain: ".aparte.ng" });
    Cookies.remove("networkRole", { domain: ".aparte.ng" });
  }
}

export async function redirectUnapprovedAgentToLanding() {
  clearAdminSessionCookies();
  // Dynamic import: lib/api imports this module, so a static import is a cycle.
  const { endServerSession } = await import("./api");
  await endServerSession();
  if (typeof window !== "undefined") {
    window.location.href = getLandingAgentKycUrl();
  }
}

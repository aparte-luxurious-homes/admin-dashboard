import Cookies from "js-cookie";
import { getLandingAgentKycUrl } from "@/src/lib/agentApproval";

export const AGENT_KYC_REQUIRED_MESSAGE =
  "Your agent account requires approved KYC before you can access the dashboard. Complete verification on the landing site, or contact sales@aparte.ng.";

/** Clear local session artifacts used by the admin dashboard. */
export function clearAdminSessionCookies() {
  Cookies.remove("token");
  Cookies.remove("networkRole");
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  if (hostname.includes("aparte.ng")) {
    Cookies.remove("token", { domain: ".aparte.ng" });
    Cookies.remove("networkRole", { domain: ".aparte.ng" });
  }
}

export function redirectUnapprovedAgentToLanding() {
  clearAdminSessionCookies();
  if (typeof window !== "undefined") {
    window.location.href = getLandingAgentKycUrl();
  }
}

// Phase 4 — mentorship feature disabled until next release.
// To re-enable: restore the nav links in nav_links.tsx and remove the redirect below.

import { redirect } from "next/navigation";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";

export default function MentorshipPage() {
    redirect(PAGE_ROUTES.dashboard.network.history.base);
}

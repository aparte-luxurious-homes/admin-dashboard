// Phase 4 — mentorship detail disabled. Restore from git history when releasing.
import { redirect } from "next/navigation";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";

export default function MentorshipDetailPage() {
    redirect(PAGE_ROUTES.dashboard.network.history.base);
}

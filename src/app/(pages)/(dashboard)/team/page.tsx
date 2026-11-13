import { redirect } from "next/navigation";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";

export default function TeamIndexPage() {
    redirect(PAGE_ROUTES.dashboard.team.members);
}

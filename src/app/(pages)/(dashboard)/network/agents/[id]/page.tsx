'use client'

import { useAuth } from "@/src/hooks/useAuth";
import { UserRole } from "@/src/lib/enums";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import ZoneMemberProfile from "@/src/components/network/ZoneMemberProfile";
import Loader from "@/src/components/loader";

/**
 * Profile of one agent in the caller's network, reached from a mentorship
 * mapping.
 *
 * Distinct from `/network/zone-members/[id]` on purpose. Both render the same
 * component against the same endpoint, but a mentee is not necessarily a zone
 * member — filing them under the zone roster's URL would misdescribe the
 * relationship and send the reader back to a roster a plain mentor does not
 * have. The breadcrumb here returns to Mentorship instead.
 *
 * Scope is enforced by the API (`visibility.assert_agent`), so an agent outside
 * the caller's network renders the "not in your network" state rather than
 * leaking anything.
 */
export default function NetworkAgentProfilePage() {
    const { user, isFetching } = useAuth();

    if (isFetching) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader />
            </div>
        );
    }

    if (user?.role !== UserRole.AGENT) {
        return (
            <div className="p-6 mx-2 sm:mx-5 mt-5 border border-[#D9D9D9] rounded-[15px] bg-white shadow-md">
                <p className="text-sm text-gray-500">
                    This view is for agents. Administrators can open the full record from
                    User Management.
                </p>
            </div>
        );
    }

    return (
        <ZoneMemberProfile
            backLink={PAGE_ROUTES.dashboard.network.mentorship.base}
            backLabel="Mentorship"
        />
    );
}

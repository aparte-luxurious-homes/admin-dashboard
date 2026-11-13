'use client'

import { useAuth } from "@/src/hooks/useAuth";
import { UserRole } from "@/src/lib/enums";
import ZoneMembersTable from "@/src/components/network/tables/ZoneMembersTable";
import ZoneManagerOnly from "@/src/components/network/ZoneManagerOnly";
import Loader from "@/src/components/loader";

/**
 * Zone roster for an Area Manager / Regional Lead.
 *
 * Agent-only by design: the roster is derived from the caller's own zone
 * assignment, so there is nothing for staff to look at here — admins already
 * have the platform-wide agent list under user-management. The nav entry is
 * hidden from non-leads in the dashboard layout; this check is what refuses a
 * direct URL.
 */
export default function ZoneMembersPage() {
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
                    Zone members are only available to agents holding a zone assignment.
                </p>
            </div>
        );
    }

    return (
        <ZoneManagerOnly>
            <ZoneMembersTable />
        </ZoneManagerOnly>
    );
}

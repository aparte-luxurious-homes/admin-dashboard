'use client'

import { ReactNode } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import Loader from "@/src/components/loader";
import { useAuth } from "@/src/hooks/useAuth";
import { UserRole } from "@/src/lib/enums";
import { GetNetworkStanding } from "@/src/lib/request-handlers/networkMgt";

const STAFF_ROLES: UserRole[] = [
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.OPERATIONS_ADMIN,
    UserRole.SUPPORT_ADMIN,
    UserRole.ANALYST,
];

/**
 * Gate for the zone screens — Zones, Zone Members, Zone Assignments.
 *
 * The sidebar already hides these from agents without a zone, but a nav filter
 * only removes the link: the routes stay reachable by URL, and the layout's
 * route guard cannot bounce them (it only bounces paths matching a nav entry
 * the role is *not* allowed to see, and a filtered-out entry matches nothing).
 * This is what refuses.
 *
 * Standing is read from `GetNetworkStanding`, not the layout's cookie-derived
 * flag, specifically so this can WAIT. The cookie is absent on a first login
 * and expires after a day, so a lead would briefly look like a plain agent —
 * gating on that would bounce a legitimate manager off their own page on
 * refresh. Holding the loader until the server answers costs a moment and is
 * never wrong.
 *
 * Staff pass straight through: these screens are theirs to administer, and they
 * hold no agent standing to check.
 */
export default function ZoneManagerOnly({ children }: { children: ReactNode }) {
    const { user, isFetching } = useAuth();
    const role = user?.role as UserRole | undefined;
    const isStaff = Boolean(role && STAFF_ROLES.includes(role));

    const { data: standing, isLoading: standingLoading } = GetNetworkStanding(role);

    if (isFetching || (!isStaff && standingLoading)) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader />
            </div>
        );
    }

    if (isStaff) return <>{children}</>;

    if (!standing?.isZoneManager) {
        return (
            <div className="p-6 mx-2 sm:mx-5 mt-5 border border-[#D9D9D9] rounded-[15px] bg-white shadow-md">
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Icon icon="mdi:lock-outline" width="40" className="text-gray-300 mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">Not available</h3>
                    <p className="text-sm text-gray-500 max-w-sm">
                        Zone screens are available to Area Managers and Regional Leads. You do
                        not currently hold an active zone assignment.
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}

'use client'

import { useAuth } from "@/src/hooks/useAuth";
import { UserRole } from "@/src/lib/enums";
import ZoneMemberProfile from "@/src/components/network/ZoneMemberProfile";
import Loader from "@/src/components/loader";

/**
 * Agent-only. Staff have the fuller user detail under user-management; this
 * view exists for zone leads, who are denied `users.read`. The endpoint behind
 * it enforces scope regardless of what reaches this component.
 */
export default function ZoneMemberProfilePage() {
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
                    This view is for agents. Administrators can open the full profile from
                    User Management.
                </p>
            </div>
        );
    }

    return <ZoneMemberProfile />;
}

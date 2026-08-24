'use client'

import { useAuth } from "@/src/hooks/useAuth";
import { UserRole } from "@/src/lib/enums";
import NetworkMentorshipsTable from "@/src/components/network/tables/NetworkMentorshipsTable";
import AgentNetworkMentorshipsTable from "@/src/components/network/tables/AgentNetworkMentorshipsTable";
import Loader from "@/src/components/loader";

export default function MentorshipPage() {
    const { user, isFetching } = useAuth();

    if (isFetching) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader />
            </div>
        );
    }

    if (user?.role === UserRole.AGENT) {
        return <AgentNetworkMentorshipsTable />;
    }

    return <NetworkMentorshipsTable />;
}

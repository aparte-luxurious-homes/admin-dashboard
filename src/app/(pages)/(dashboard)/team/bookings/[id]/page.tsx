'use client'

import { useParams } from "next/navigation";
import TeamLeadOnly from "@/src/components/team/TeamLeadOnly";
import { TeamBookingDetailView } from "@/src/components/team/TeamDetails";

export default function Page() {
    const { id } = useParams<{ id: string }>();
    return (
        <TeamLeadOnly>
            <TeamBookingDetailView id={id} />
        </TeamLeadOnly>
    );
}

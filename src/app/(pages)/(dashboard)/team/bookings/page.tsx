'use client'

import TeamLeadOnly from "@/src/components/team/TeamLeadOnly";
import { TeamBookingsView } from "@/src/components/team/TeamLists";

export default function Page() {
    return (
        <TeamLeadOnly>
            <TeamBookingsView />
        </TeamLeadOnly>
    );
}

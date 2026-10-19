'use client'

import TeamLeadOnly from "@/src/components/team/TeamLeadOnly";
import { TeamRequestsView } from "@/src/components/team/TeamLists";

export default function Page() {
    return (
        <TeamLeadOnly>
            <TeamRequestsView />
        </TeamLeadOnly>
    );
}

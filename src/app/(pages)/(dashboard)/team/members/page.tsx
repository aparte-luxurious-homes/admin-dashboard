'use client'

import TeamLeadOnly from "@/src/components/team/TeamLeadOnly";
import { TeamMembersView } from "@/src/components/team/TeamLists";

export default function Page() {
    return (
        <TeamLeadOnly>
            <TeamMembersView />
        </TeamLeadOnly>
    );
}

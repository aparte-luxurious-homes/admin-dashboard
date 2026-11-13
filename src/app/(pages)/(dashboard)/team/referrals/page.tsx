'use client'

import TeamLeadOnly from "@/src/components/team/TeamLeadOnly";
import { TeamReferralsView } from "@/src/components/team/TeamLists";

export default function Page() {
    return (
        <TeamLeadOnly>
            <TeamReferralsView />
        </TeamLeadOnly>
    );
}

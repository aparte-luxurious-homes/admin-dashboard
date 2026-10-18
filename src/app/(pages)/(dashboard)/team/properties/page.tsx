'use client'

import TeamLeadOnly from "@/src/components/team/TeamLeadOnly";
import { TeamPropertiesView } from "@/src/components/team/TeamLists";

export default function Page() {
    return (
        <TeamLeadOnly>
            <TeamPropertiesView />
        </TeamLeadOnly>
    );
}

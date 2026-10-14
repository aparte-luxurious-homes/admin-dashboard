'use client'

import TeamLeadOnly from "@/src/components/team/TeamLeadOnly";
import { TeamTransactionsView } from "@/src/components/team/TeamLists";

export default function Page() {
    return (
        <TeamLeadOnly>
            <TeamTransactionsView />
        </TeamLeadOnly>
    );
}

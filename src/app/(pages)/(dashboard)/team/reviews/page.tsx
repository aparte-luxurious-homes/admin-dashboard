'use client'

import TeamLeadOnly from "@/src/components/team/TeamLeadOnly";
import { TeamReviewsView } from "@/src/components/team/TeamLists";

export default function Page() {
    return (
        <TeamLeadOnly>
            <TeamReviewsView />
        </TeamLeadOnly>
    );
}

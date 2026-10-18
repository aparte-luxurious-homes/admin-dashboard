'use client'

import { ReactNode } from "react";
import Loader from "@/src/components/loader";
import { useAuth } from "@/src/hooks/useAuth";
import { UserRole } from "@/src/lib/enums";
import { GetTeamStanding } from "@/src/lib/request-handlers/teamMgt";
import { NotTeamLead } from "./ui";

/** Renders children only for a current team lead. The API refuses everyone
 *  else anyway; this keeps a direct URL from showing an empty shell. */
export default function TeamLeadOnly({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const { data, isLoading } = GetTeamStanding(user?.role as UserRole | undefined);
    if (isLoading) {
        return <div className="flex items-center justify-center py-24"><Loader /></div>;
    }
    if (!data?.is_team_lead) return <NotTeamLead />;
    return <>{children}</>;
}

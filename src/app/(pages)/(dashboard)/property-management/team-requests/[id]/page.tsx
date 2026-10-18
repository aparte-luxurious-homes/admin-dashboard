'use client'

import { useParams } from "next/navigation";
import { TeamRequestReview } from "@/src/components/team/AdminNetworkViews";

export default function Page() {
    const { id } = useParams<{ id: string }>();
    return <TeamRequestReview id={id} />;
}

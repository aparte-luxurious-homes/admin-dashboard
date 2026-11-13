'use client'

import { useParams } from "next/navigation";
import ConversationThread from "@/src/components/whatsapp/ConversationThread";

export default function Page() {
    const { id } = useParams<{ id: string }>();
    return <ConversationThread id={id} />;
}

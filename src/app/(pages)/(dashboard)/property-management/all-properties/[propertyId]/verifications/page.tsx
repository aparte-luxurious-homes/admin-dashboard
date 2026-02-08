"use client";

import PropertyVerificationsTable from "@/src/components/properties-mgt/tables/property-verifications";
import { useParams } from "next/navigation";

export default function PropertyVerificationTable() {
    const params = useParams();

    return (
        <div className="w-full">
            <PropertyVerificationsTable
                propertyId={params?.propertyId as string}
            // verificationId={Number(params?.verificationId)}
            />
        </div>
    );
}
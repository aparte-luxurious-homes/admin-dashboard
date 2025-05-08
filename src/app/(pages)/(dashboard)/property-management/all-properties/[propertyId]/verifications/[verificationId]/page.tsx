"use client";

import VerifcationDetails from "@/src/components/properties-mgt/manage-verifications/VerificationDetails";
import { useParams } from "next/navigation";

export default function PropertyVerificationDetail() {
    const params = useParams();
    
    return (
        <div className="w-full">
            <VerifcationDetails
                propertyId={Number(params?.propertyId)}
                verificationId={Number(params?.verificationId)}
            />
        </div>
    );
}
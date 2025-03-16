"use client";

import VerificationDetails from "@/src/components/properties-mgt/manage-verifications/VerificationDetails";
import { useParams } from "next/navigation";

export default function PropertyDetail() {
    const params = useParams();
    
    return (
        <div className="w-full">
            <VerificationDetails
                verificationId={Number(params?.verificationId)}
            />
        </div>
    );
}
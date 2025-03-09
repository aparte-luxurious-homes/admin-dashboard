"use client";

import VerifcationDetails from "@/src/components/properties-mgt/manage-verifications/VerificationDetails";
import { useParams } from "next/navigation";

export default function PropertyDetail() {
    const params = useParams();
    
    return (
        <div className="w-full">
            <VerifcationDetails
                verificationId={Number(params?.verificationId)}
            />
        </div>
    );
}
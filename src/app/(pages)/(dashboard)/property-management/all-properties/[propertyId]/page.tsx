"use client";

import { useParams } from "next/navigation";
import PropertyDetailsView from "@/src/components/properties-mgt/PropertyDetailsView";

export default function PropertyDetail() {
    const params = useParams();
    
    return (
        <div className="w-full">
            <PropertyDetailsView
                propertyId={Number(params?.propertyId)}
            />
        </div>
    );
}
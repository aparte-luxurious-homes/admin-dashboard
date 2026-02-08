"use client";

import { useParams } from "next/navigation";
import PropertyDetailsView from "@/src/components/properties-mgt/all-properties/PropertyDetailsView";

export default function PropertyDetail() {
    const params = useParams();

    return (
        <div className="w-full">
            <PropertyDetailsView
                propertyId={params?.propertyId as string}
            />
        </div>
    );
}
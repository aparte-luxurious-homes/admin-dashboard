'use client'

import UnitDetailsView from "@/src/components/properties-mgt/unit-mgt/UnitDetailsView";
import { useParams } from "next/navigation";

export default function UnitDetail() {
    const params = useParams();

    return (
        <div className="w-full">
            <UnitDetailsView
                propertyId={params?.propertyId as string}
                unitId={params?.unitId as string}
            />
        </div>
    );
}
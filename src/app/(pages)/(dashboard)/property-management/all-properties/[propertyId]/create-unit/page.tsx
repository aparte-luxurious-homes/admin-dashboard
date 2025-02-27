'use client'

import CreateUnitView from "@/src/components/properties-mgt/unit-mgt/CreateUnitView";
import { useParams } from "next/navigation";

export default function CreateUnit() {
    const params = useParams();

    return(
        <CreateUnitView
            propertyId={Number(params.propertyId)}        
        />
    );
};
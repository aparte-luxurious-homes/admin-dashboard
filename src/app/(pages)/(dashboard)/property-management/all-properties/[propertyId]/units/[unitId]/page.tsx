import UnitDetailsView from "@/src/components/properties-mgt/unit-mgt/UnitDetailsView";
import { useParams } from "next/navigation";

export default function UnitDetail() {
    const params = useParams();
        
    return (
        <div className="w-full">
            <UnitDetailsView
                propertyId={Number(params?.prpertyId)}
                unitId={Number(params?.unitId)}
            />
        </div>
    );
}
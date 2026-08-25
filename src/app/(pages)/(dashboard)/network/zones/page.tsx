import NetworkZonesTable from "@/src/components/network/tables/NetworkZonesTable";
import ZoneManagerOnly from "@/src/components/network/ZoneManagerOnly";

export default function ZonesPage() {
    return (
        <ZoneManagerOnly>
            <NetworkZonesTable />
        </ZoneManagerOnly>
    );
}

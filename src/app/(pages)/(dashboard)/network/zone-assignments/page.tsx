import NetworkZoneAssignmentsTable from "@/src/components/network/tables/NetworkZoneAssignmentsTable";
import ZoneManagerOnly from "@/src/components/network/ZoneManagerOnly";

export default function ZoneAssignmentsPage() {
    return (
        <ZoneManagerOnly>
            <NetworkZoneAssignmentsTable />
        </ZoneManagerOnly>
    );
}

import { Suspense } from "react";
import PropertiesTable from "@/src/components/properties-mgt/tables/properties";
import Loader from "@/src/components/loader";

// Suspense boundary required: the table reads URL state via useSearchParams,
// which Next 15 cannot evaluate while prerendering the static shell.
export default function AllProperties() {
    return (
        <div className="w-full">
            <Suspense fallback={<Loader />}>
                <PropertiesTable />
            </Suspense>
        </div>
    );
}

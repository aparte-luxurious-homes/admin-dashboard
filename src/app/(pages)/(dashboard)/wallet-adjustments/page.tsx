import { Suspense } from "react";
import WalletAdjustmentsView from "@/src/components/finance-mgt/WalletAdjustmentsView";
import Loader from "@/src/components/loader";

/** The status tab lives in the URL (useSearchParams), so it needs a boundary. */
export default function WalletAdjustments() {
    return (
        <div className="w-full">
            <Suspense fallback={<Loader />}>
                <WalletAdjustmentsView />
            </Suspense>
        </div>
    );
}

import { Suspense } from "react";
import EmailDeliveryView from "@/src/components/user-management/email-health/EmailDeliveryView";
import Loader from "@/src/components/loader";

/**
 * The view keeps its tab, search and page in the URL (useTableState →
 * useSearchParams), which Next 15 cannot evaluate while prerendering. Without
 * this boundary `next build` fails; with it only the table waits for the URL.
 * Role gating comes from the user-management layout.
 */
export default function EmailDeliveryPage() {
    return (
        <Suspense fallback={<Loader />}>
            <EmailDeliveryView />
        </Suspense>
    );
}

import { Suspense } from "react";
import Loader from "@/src/components/loader";
import InboxList from "@/src/components/whatsapp/InboxList";

// Suspense boundary required: the list keeps its filters in the URL via
// useSearchParams, which Next 15 cannot evaluate during static prerender.
export default function Page() {
    return (
        <div className="w-full">
            <Suspense fallback={<Loader />}>
                <InboxList />
            </Suspense>
        </div>
    );
}

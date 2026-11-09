import { Suspense } from "react";
import BlogListView from "@/src/components/blog-mgt/BlogListView";
import Loader from "@/src/components/loader";

/** Tab, search and page live in the URL (useSearchParams), so it needs a boundary. */
export default function BlogPage() {
    return (
        <div className="w-full">
            <Suspense fallback={<Loader />}>
                <BlogListView />
            </Suspense>
        </div>
    );
}

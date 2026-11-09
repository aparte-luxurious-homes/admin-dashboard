"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import { Skeleton } from "@/src/components/ui/skeleton";
import TablePagination from "@/src/components/TablePagination";
import { useTableState } from "@/src/hooks/useTableState";
import { getApiErrorMessage } from "@/src/lib/apiError";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import { siteUrl } from "@/src/lib/siteUrl";
import {
    BlogPostSummary,
    BlogStatus,
    DeleteBlogPost,
    FeatureBlogPost,
    GetBlogCategories,
    GetBlogPosts,
    RestoreBlogPost,
} from "@/src/lib/request-handlers/blogMgt";
import { STATUS_LABEL, STATUS_STYLE, formatDate, formatDateTime, roleLabel } from "./blogFormat";

const PAGE_SIZE = 20;
/** Shared size for the row buttons: comfortably clickable, all the same height. */
const BTN =
    "inline-flex items-center justify-center min-w-[84px] px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 whitespace-nowrap";
const TABS = ["REVIEW", "ALL", "DRAFT", "SCHEDULED", "PUBLISHED", "UNPUBLISHED", "DELETED"] as const;
type Tab = (typeof TABS)[number];
/** Tabs only an admin (who can publish) sees. */
const ADMIN_TABS: Tab[] = ["REVIEW", "DELETED"];
const TAB_LABEL: Record<Tab, string> = {
    REVIEW: "Needs review",
    ALL: "All",
    DRAFT: "Drafts",
    SCHEDULED: "Scheduled",
    PUBLISHED: "Published",
    UNPUBLISHED: "Unpublished",
    DELETED: "Deleted",
};

function dateLine(post: BlogPostSummary): string {
    if (post.is_deleted) return `Deleted ${formatDate(post.deleted_at)}`;
    if (post.status === "SCHEDULED") return `Goes live ${formatDateTime(post.published_at)}`;
    if (post.status === "PUBLISHED") return `Published ${formatDate(post.published_at)}`;
    return `Last edited ${formatDate(post.updated_at)}`;
}

interface RowProps {
    post: BlogPostSummary;
    canPublish: boolean;
    featuredFull: boolean;
}

const PostRow = ({ post, canPublish, featuredFull }: RowProps) => {
    const { mutate: feature, isPending: featuring } = FeatureBlogPost();
    const { mutate: remove, isPending: deleting } = DeleteBlogPost();
    const { mutate: restore, isPending: restoring } = RestoreBlogPost();
    const live = post.status === "PUBLISHED" && !post.is_deleted;
    const canFeature = canPublish && !post.is_deleted && (post.status === "PUBLISHED" || post.status === "SCHEDULED");

    const onFeature = () =>
        feature(
            { id: post.id, featured: !post.is_featured },
            {
                onSuccess: () =>
                    toast.success(post.is_featured ? "Removed from featured." : "Now featured on the blog homepage."),
                onError: (err) => toast.error(getApiErrorMessage(err, "Could not change featured")),
            },
        );

    const onDelete = () => {
        if (!window.confirm(`Delete "${post.title}"? You can restore it later from the Deleted tab.`)) return;
        remove(post.id, {
            onSuccess: () => toast.success("Moved to Deleted. You can restore it from there."),
            onError: (err) => toast.error(getApiErrorMessage(err, "Could not delete the article")),
        });
    };

    const onRestore = () =>
        restore(post.id, {
            onSuccess: () => toast.success("Restored."),
            onError: (err) => toast.error(getApiErrorMessage(err, "Could not restore the article")),
        });

    return (
        <article className="grid grid-cols-[5rem_minmax(0,1fr)] sm:grid-cols-[8rem_minmax(0,1fr)] xl:grid-cols-[8rem_minmax(0,1fr)_auto] gap-x-4 gap-y-3 px-5 py-4">
            <div className="w-20 h-14 sm:w-32 sm:h-20 shrink-0 rounded-lg bg-gray-100 overflow-hidden">
                {post.featured_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.featured_image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Icon icon="lucide:image" width={24} />
                    </div>
                )}
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[post.status]}`}>
                        {post.is_deleted ? "Deleted" : STATUS_LABEL[post.status]}
                    </span>
                    {post.needs_review && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            <Icon icon="lucide:eye" width={12} /> Needs review
                        </span>
                    )}
                    {post.is_featured && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-800">
                            <Icon icon="mdi:star" width={12} /> Featured
                        </span>
                    )}
                    {post.category && <span className="text-xs text-gray-500">{post.category.name}</span>}
                </div>
                {post.is_deleted ? (
                    <p className="mt-1 text-base font-semibold text-gray-900 break-words">{post.title}</p>
                ) : (
                    <Link
                        href={PAGE_ROUTES.dashboard.blog.edit(post.id)}
                        className="mt-1 block text-base font-semibold text-gray-900 hover:text-primary break-words"
                    >
                        {post.title}
                    </Link>
                )}
                <p className="text-xs text-gray-500 mt-1">
                    {dateLine(post)}
                    {post.written_by
                        ? ` · written by ${post.written_by}${post.written_by_role ? ` (${roleLabel(post.written_by_role)})` : ""}`
                        : ""}
                    {live ? ` · ${post.view_count.toLocaleString()} reads` : ""}
                </p>
            </div>

            {/* One row of buttons, side by side; wraps only on a narrow phone.
                The main action (Edit / Review) comes first and is filled. */}
            <div className="col-span-2 sm:col-start-2 sm:col-span-1 xl:col-start-3 flex flex-wrap items-center xl:justify-end gap-2 xl:self-center">
                {post.is_deleted ? (
                    canPublish && (
                        <button
                            type="button"
                            disabled={restoring}
                            onClick={onRestore}
                            className={`${BTN} border border-gray-300 text-gray-800 hover:bg-gray-50`}
                        >
                            {restoring ? "Restoring..." : "Restore"}
                        </button>
                    )
                ) : (
                    <>
                        <Link
                            href={PAGE_ROUTES.dashboard.blog.edit(post.id)}
                            className={`${BTN} text-white ${
                                post.needs_review && canPublish
                                    ? "bg-orange-600 hover:bg-orange-700"
                                    : "bg-primary hover:bg-primary/90"
                            }`}
                        >
                            {post.needs_review && canPublish
                                ? "Review"
                                : post.status === "DRAFT" || canPublish
                                  ? "Edit"
                                  : "Open"}
                        </Link>
                        {live && (
                            <a
                                href={siteUrl(`/blog/${post.slug}`)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`${BTN} border border-gray-300 text-gray-800 hover:bg-gray-50`}
                            >
                                View
                            </a>
                        )}
                        {canPublish && canFeature && (
                            <button
                                type="button"
                                disabled={featuring || (!post.is_featured && featuredFull)}
                                title={
                                    !post.is_featured && featuredFull
                                        ? "Three articles are already featured. Unfeature one first."
                                        : undefined
                                }
                                onClick={onFeature}
                                className={`${BTN} border border-gray-300 text-gray-800 hover:bg-gray-50`}
                            >
                                {post.is_featured ? "Unfeature" : "Feature"}
                            </button>
                        )}
                        {canPublish && (
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={onDelete}
                                className={`${BTN} border border-red-200 text-red-600 hover:bg-red-50`}
                            >
                                Delete
                            </button>
                        )}
                    </>
                )}
            </div>
        </article>
    );
};

const BlogListView = () => {
    const table = useTableState({ filterKeys: ["status", "category"] });
    const tab = (TABS as readonly string[]).includes(table.filters.status ?? "")
        ? (table.filters.status as Tab)
        : "ALL";
    const { data: categories } = GetBlogCategories();
    const { data, isLoading, isError } = GetBlogPosts({
        status: tab === "ALL" || tab === "DELETED" || tab === "REVIEW" ? undefined : (tab as BlogStatus),
        deleted: tab === "DELETED",
        review: tab === "REVIEW",
        categoryId: table.filters.category || undefined,
        search: table.debouncedSearch || undefined,
        page: table.page,
        pageSize: PAGE_SIZE,
    });
    const items = data?.items ?? [];
    const canPublish = Boolean(data?.can_publish);
    const featuredFull = (data?.featured_count ?? 0) >= (data?.max_featured ?? 3);

    const count = (t: Tab): number | null => {
        if (!data) return null;
        if (t === "DELETED") return data.deleted_count;
        if (t === "REVIEW") return data.review_count;
        if (t === "ALL") return null;
        return data.status_counts?.[t as BlogStatus] ?? 0;
    };

    return (
        <div className="p-4 md:p-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 md:px-6 pt-6 pb-4 border-b border-gray-100">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">Blog</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {canPublish || !data
                                    ? `Write, schedule and publish articles for aparte.ng/blog. ${
                                          data ? `${data.featured_count} of ${data.max_featured} featured.` : ""
                                      }`
                                    : "Write drafts here. An Admin reviews and publishes them."}
                            </p>
                        </div>
                        <Link
                            href={PAGE_ROUTES.dashboard.blog.create}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-sm font-medium text-white hover:bg-primary/90"
                        >
                            <Icon icon="lucide:plus" width={16} /> New article
                        </Link>
                    </div>

                    {canPublish && (data?.review_count ?? 0) > 0 && tab !== "REVIEW" && (
                        <button
                            type="button"
                            onClick={() => table.setFilter("status", "REVIEW")}
                            className="mt-4 w-full flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-left hover:bg-orange-100"
                        >
                            <Icon icon="lucide:eye" width={20} className="text-orange-700 shrink-0" />
                            <span className="flex-1 text-sm text-orange-900">
                                <strong>
                                    {data?.review_count} {data?.review_count === 1 ? "draft is" : "drafts are"} waiting
                                    for your review.
                                </strong>{" "}
                                Open one, make any edits, then publish or schedule it.
                            </span>
                            <span className="text-sm font-medium text-orange-800 whitespace-nowrap">Show them →</span>
                        </button>
                    )}

                    <div className="flex flex-wrap gap-1 mt-4" role="group" aria-label="Status">
                        {TABS.filter((t) => !ADMIN_TABS.includes(t) || canPublish).map((t) => {
                            const n = count(t);
                            return (
                                <button
                                    key={t}
                                    type="button"
                                    aria-pressed={tab === t}
                                    onClick={() => table.setFilter("status", t === "ALL" ? "" : t)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                        tab === t ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-100"
                                    }`}
                                >
                                    {TAB_LABEL[t]}
                                    {n !== null && n > 0 && (
                                        <span
                                            className={`px-1.5 rounded-full text-xs tabular-nums ${
                                                tab === t ? "bg-white/20" : "bg-gray-100 text-gray-700"
                                            }`}
                                        >
                                            {n}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 mt-4">
                        <label className="relative flex-1">
                            <span className="sr-only">Search articles</span>
                            <Icon
                                icon="lucide:search"
                                width={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                            <input
                                type="search"
                                value={table.search}
                                onChange={(e) => table.setSearch(e.target.value)}
                                placeholder="Search titles, text, authors or tags"
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </label>
                        <select
                            aria-label="Category"
                            value={table.filters.category ?? ""}
                            onChange={(e) => table.setFilter("category", e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                        >
                            <option value="">All categories</option>
                            {(categories ?? []).map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-5 space-y-3">
                        <Skeleton className="h-20 w-full rounded-xl" />
                        <Skeleton className="h-20 w-full rounded-xl" />
                    </div>
                ) : isError ? (
                    <div className="p-8 text-center text-sm text-gray-500">Could not load articles.</div>
                ) : items.length === 0 ? (
                    <div className="p-10 text-center text-sm text-gray-400">
                        {table.hasActiveFilters
                            ? "No articles match."
                            : tab === "DELETED"
                              ? "Nothing deleted."
                              : tab === "REVIEW"
                                ? "Nothing waiting for review. Drafts from operations and support admins appear here."
                                : "No articles yet. Start with New article."}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {items.map((post) => (
                            <PostRow key={post.id} post={post} canPublish={canPublish} featuredFull={featuredFull} />
                        ))}
                    </div>
                )}

                {(data?.total ?? 0) > PAGE_SIZE && (
                    <div className="px-5 py-3 border-t border-gray-100">
                        <TablePagination
                            total={data?.total ?? 0}
                            itemsPerPage={PAGE_SIZE}
                            currentPage={table.page}
                            setPage={table.setPage}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlogListView;

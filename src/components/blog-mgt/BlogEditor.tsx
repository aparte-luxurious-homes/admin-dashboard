"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import Loader from "@/src/components/loader";
import { useAuth } from "@/src/hooks/useAuth";
import { getApiErrorMessage } from "@/src/lib/apiError";
import { UserRole } from "@/src/lib/enums";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import { siteUrl } from "@/src/lib/siteUrl";
import {
    BlogPost,
    BlogPostPayload,
    CreateBlogPost,
    DeleteBlogPost,
    FeatureBlogPost,
    GetBlogCategories,
    GetBlogPost,
    PublishBlogPost,
    UnpublishBlogPost,
    UpdateBlogPost,
} from "@/src/lib/request-handlers/blogMgt";
import RichTextEditor from "./RichTextEditor";
import TagInput from "./TagInput";
import FeaturedImageField from "./FeaturedImageField";
import PropertyPicker, { pickedFromCards } from "./PropertyPicker";
import {
    STATUS_LABEL,
    STATUS_STYLE,
    formatDateTime,
    isoToLagosLocal,
    lagosLocalToIso,
    roleLabel,
    slugify,
} from "./blogFormat";

const SEO_TITLE_MAX = 60;
const META_MAX = 160;
const EDITOR_ROLES = [UserRole.ADMIN, UserRole.SUPER_ADMIN];

interface FormState {
    title: string;
    slug: string;
    excerpt: string;
    content_html: string;
    featured_image_url: string | null;
    featured_image_alt: string;
    category_id: string;
    author_name: string;
    tags: string[];
    seo_title: string;
    meta_description: string;
    canonical_url: string;
    properties: ReturnType<typeof pickedFromCards>;
}

const EMPTY: FormState = {
    title: "",
    slug: "",
    excerpt: "",
    content_html: "",
    featured_image_url: null,
    featured_image_alt: "",
    category_id: "",
    author_name: "",
    tags: [],
    seo_title: "",
    meta_description: "",
    canonical_url: "",
    properties: [],
};

function fromPost(post: BlogPost): FormState {
    return {
        title: post.title ?? "",
        slug: post.slug ?? "",
        excerpt: post.excerpt ?? "",
        content_html: post.content_html ?? "",
        featured_image_url: post.featured_image_url,
        featured_image_alt: post.featured_image_alt ?? "",
        category_id: post.category?.id ?? "",
        author_name: post.author_name ?? "",
        tags: post.tags ?? [],
        seo_title: post.seo_title ?? "",
        meta_description: post.meta_description ?? "",
        canonical_url: post.canonical_url ?? "",
        properties: pickedFromCards(post.properties ?? []),
    };
}

function toPayload(form: FormState, includeSlug: boolean): BlogPostPayload {
    return {
        title: form.title.trim(),
        ...(includeSlug && form.slug ? { slug: form.slug } : {}),
        excerpt: form.excerpt.trim(),
        content_html: form.content_html,
        featured_image_url: form.featured_image_url,
        featured_image_alt: form.featured_image_alt.trim(),
        category_id: form.category_id || null,
        author_name: form.author_name.trim(),
        tags: form.tags,
        seo_title: form.seo_title.trim(),
        meta_description: form.meta_description.trim(),
        canonical_url: form.canonical_url.trim() || null,
        property_ids: form.properties.map((p) => p.id),
    };
}

type NameFields = { first_name?: string; firstName?: string; last_name?: string; lastName?: string };

/** The signed-in user's name. The user object carries both snake and camel case. */
function nameOf(user: unknown): string {
    const u = (user ?? {}) as NameFields & { profile?: NameFields };
    const p = u.profile ?? {};
    const first = p.first_name || p.firstName || u.first_name || u.firstName || "";
    const last = p.last_name || p.lastName || u.last_name || u.lastName || "";
    return `${first} ${last}`.trim();
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
    return (
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
            <div>
                <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
                {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
            </div>
            {children}
        </section>
    );
}

function Counter({ value, max }: { value: string; max: number }) {
    const over = value.length > max;
    return (
        <span className={`text-xs tabular-nums ${over ? "text-amber-700" : "text-gray-400"}`}>
            {value.length}/{max}
            {over ? " (Google may cut it short)" : ""}
        </span>
    );
}

const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-gray-50";

export default function BlogEditor({ postId }: { postId?: string }) {
    const router = useRouter();
    const { user } = useAuth();
    const isNew = !postId;
    const { data: post, isLoading, isError } = GetBlogPost(postId);
    const { data: categories } = GetBlogCategories();

    const { mutateAsync: create, isPending: creating } = CreateBlogPost();
    const { mutateAsync: update, isPending: updating } = UpdateBlogPost();
    const { mutateAsync: publish, isPending: publishing } = PublishBlogPost();
    const { mutate: unpublish, isPending: unpublishing } = UnpublishBlogPost();
    const { mutate: feature, isPending: featuring } = FeatureBlogPost();
    const { mutate: remove, isPending: deleting } = DeleteBlogPost();

    const [form, setForm] = useState<FormState>(EMPTY);
    const [saved, setSaved] = useState<FormState>(EMPTY);
    const [slugTouched, setSlugTouched] = useState(false);
    const [scheduleOpen, setScheduleOpen] = useState(false);
    const [scheduleAt, setScheduleAt] = useState("");
    const [titleError, setTitleError] = useState(false);

    // Load the article once per article. Featuring or unpublishing updates the
    // cached article too, and must not wipe edits the writer has not saved;
    // save and publish put the saved version into the form themselves.
    const [loadedId, setLoadedId] = useState<string | null>(null);
    useEffect(() => {
        if (post && post.id !== loadedId) {
            setLoadedId(post.id);
            const next = fromPost(post);
            setForm(next);
            setSaved(next);
            setSlugTouched(true);
            if (post.status === "SCHEDULED" && post.published_at) setScheduleAt(isoToLagosLocal(post.published_at));
        }
    }, [post, loadedId]);
    useEffect(() => {
        if (isNew && user) {
            setForm((f) => (f.author_name ? f : { ...f, author_name: nameOf(user) }));
        }
    }, [isNew, user]);

    const canPublish = post ? post.can_publish : EDITOR_ROLES.includes(user?.role as UserRole);
    const status = post?.status ?? "DRAFT";
    const readOnly = Boolean(post && status !== "DRAFT" && !canPublish);
    const hasBeenLive = Boolean(post?.first_published_at || status === "PUBLISHED");
    const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(saved), [form, saved]);
    const busy = creating || updating || publishing || unpublishing || featuring || deleting;

    // Warn before leaving with unsaved changes.
    useEffect(() => {
        if (!dirty) return;
        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = "";
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [dirty]);

    const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

    const onTitle = (title: string) => {
        setTitleError(false);
        setForm((f) => ({ ...f, title, slug: slugTouched ? f.slug : slugify(title) }));
    };

    /** Save; returns the saved article, or null when nothing was saved. */
    const save = async (quiet = false): Promise<BlogPost | null> => {
        if (!form.title.trim()) {
            setTitleError(true);
            toast.error("Give the article a title first.");
            return null;
        }
        try {
            let result: BlogPost;
            if (isNew) {
                result = await create(toPayload(form, slugTouched));
            } else {
                result = await update({
                    id: postId as string,
                    payload: toPayload(form, form.slug !== saved.slug),
                });
            }
            const next = fromPost(result);
            setForm(next);
            setSaved(next);
            setSlugTouched(true);
            if (!quiet) toast.success(isNew ? "Draft saved." : "Changes saved.");
            if (isNew) router.replace(PAGE_ROUTES.dashboard.blog.edit(result.id));
            return result;
        } catch (err) {
            toast.error(getApiErrorMessage(err, "Could not save the article"));
            return null;
        }
    };

    const onPublish = async (when?: string) => {
        const savedPost = dirty || isNew ? await save(true) : post;
        if (!savedPost) return;
        try {
            const result = await publish({ id: savedPost.id, publishAt: when ? lagosLocalToIso(when) : null });
            const next = fromPost(result);
            setForm(next);
            setSaved(next);
            setScheduleOpen(false);
            toast.success(
                result.status === "SCHEDULED"
                    ? `Scheduled. It goes live ${formatDateTime(result.published_at)} (Nigerian time).`
                    : "Published. It's live on the website now.",
            );
            if (isNew) router.replace(PAGE_ROUTES.dashboard.blog.edit(result.id));
        } catch (err) {
            toast.error(getApiErrorMessage(err, "Could not publish the article"));
        }
    };

    const onUnpublish = () => {
        if (!post) return;
        const message =
            status === "SCHEDULED"
                ? "Cancel the schedule? The article goes back to being a draft."
                : "Take this article off the website? Its link will show a 'not found' page until you publish it again.";
        if (!window.confirm(message)) return;
        unpublish(post.id, {
            onSuccess: () => toast.success(status === "SCHEDULED" ? "Schedule cancelled." : "Unpublished."),
            onError: (err) => toast.error(getApiErrorMessage(err, "Could not unpublish")),
        });
    };

    const onDelete = () => {
        if (!post) return;
        if (!window.confirm(`Delete "${post.title}"? You can restore it later from the Deleted tab.`)) return;
        remove(post.id, {
            onSuccess: () => {
                toast.success("Moved to Deleted. You can restore it from there.");
                router.push(PAGE_ROUTES.dashboard.blog.base);
            },
            onError: (err) => toast.error(getApiErrorMessage(err, "Could not delete")),
        });
    };

    const onFeature = () => {
        if (!post) return;
        feature(
            { id: post.id, featured: !post.is_featured },
            {
                onSuccess: (p) => toast.success(p.is_featured ? "Featured on the blog homepage." : "No longer featured."),
                onError: (err) => toast.error(getApiErrorMessage(err, "Could not change featured")),
            },
        );
    };

    if (!isNew && isLoading) return <Loader message="Loading article..." />;
    if (!isNew && (isError || !post)) {
        return (
            <div className="p-6">
                <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-sm text-gray-500">
                    This article could not be found. It may have been deleted.{" "}
                    <Link href={PAGE_ROUTES.dashboard.blog.base} className="text-primary underline">
                        Back to the blog
                    </Link>
                </div>
            </div>
        );
    }

    const publicLink = siteUrl(`/blog/${form.slug}`);
    const minDate = isoToLagosLocal(new Date(Date.now() + 5 * 60 * 1000).toISOString());
    const googleTitle = form.seo_title || form.title || "Article title";
    const googleDescription = form.meta_description || form.excerpt || "The short description appears here.";

    return (
        <div className="p-4 md:p-6 space-y-4">
            {/* Header and actions */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div className="min-w-0">
                    <Link
                        href={PAGE_ROUTES.dashboard.blog.base}
                        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
                    >
                        <Icon icon="lucide:arrow-left" width={14} /> All articles
                    </Link>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                        <h1 className="text-xl font-semibold text-gray-900">{isNew ? "New article" : "Edit article"}</h1>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[status]}`}>
                            {STATUS_LABEL[status]}
                        </span>
                        {post?.is_featured && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-800">
                                <Icon icon="mdi:star" width={12} /> Featured
                            </span>
                        )}
                        {dirty && !readOnly && <span className="text-xs text-amber-700">Unsaved changes</span>}
                    </div>
                    {status === "SCHEDULED" && post?.published_at && (
                        <p className="text-sm text-sky-700 mt-1">
                            Goes live {formatDateTime(post.published_at)} (Nigerian time).
                        </p>
                    )}
                </div>

                {!readOnly && (
                    <div className="flex flex-wrap gap-2">
                        {status === "PUBLISHED" && (
                            <a
                                href={publicLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                View on website
                            </a>
                        )}
                        <button
                            type="button"
                            disabled={busy || (!dirty && !isNew)}
                            onClick={() => save()}
                            className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
                        >
                            {creating || updating ? "Saving..." : status === "DRAFT" ? "Save draft" : "Save changes"}
                        </button>
                        {canPublish && status !== "PUBLISHED" && (
                            <>
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => setScheduleOpen((o) => !o)}
                                    className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    {status === "SCHEDULED" ? "Change time" : "Schedule"}
                                </button>
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => onPublish()}
                                    className="px-4 py-2 rounded-lg bg-primary text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                                >
                                    {publishing ? "Publishing..." : "Publish now"}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {post?.needs_review && canPublish && (
                <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
                    <strong>
                        {post.written_by ?? "A writer"}
                        {post.written_by_role ? ` (${roleLabel(post.written_by_role)})` : ""} wrote this draft for
                        your review.
                    </strong>{" "}
                    Read it and make any edits, then press <strong>Publish now</strong> or <strong>Schedule</strong> at
                    the top right. Your edits are saved with it.
                </div>
            )}

            {readOnly && (
                <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                    This article is {STATUS_LABEL[status].toLowerCase()}. Only an Admin can change it now.
                </div>
            )}
            {!canPublish && !readOnly && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    You can write and save drafts. An Admin reviews and publishes them.
                </div>
            )}

            {scheduleOpen && canPublish && (
                <div className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col sm:flex-row sm:items-end gap-3">
                    <label className="block">
                        <span className="text-sm font-medium text-gray-800">Publish on (Nigerian time)</span>
                        <input
                            type="datetime-local"
                            value={scheduleAt}
                            min={minDate}
                            onChange={(e) => setScheduleAt(e.target.value)}
                            className={`mt-1 ${inputClass}`}
                        />
                    </label>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setScheduleOpen(false)}
                            className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={busy || !scheduleAt || scheduleAt < minDate}
                            onClick={() => onPublish(scheduleAt)}
                            className="px-4 py-2 rounded-lg bg-primary text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                        >
                            {publishing ? "Scheduling..." : "Schedule"}
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 sm:ml-auto sm:max-w-xs">
                        The article appears on the website at exactly this time.
                    </p>
                </div>
            )}

            {post && post.brand_warnings.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 space-y-1">
                    <p className="font-medium flex items-center gap-1.5">
                        <Icon icon="lucide:triangle-alert" width={16} /> Brand check
                    </p>
                    {post.brand_warnings.map((w) => (
                        <p key={w}>{w}</p>
                    ))}
                    <p className="text-xs text-amber-800">This is a reminder only. It does not stop you saving or publishing.</p>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-4 items-start">
                {/* Main column */}
                <div className="space-y-4 min-w-0">
                    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
                        <label className="block">
                            <span className="text-sm font-medium text-gray-800">Title</span>
                            <input
                                value={form.title}
                                disabled={readOnly}
                                maxLength={200}
                                onChange={(e) => onTitle(e.target.value)}
                                placeholder="e.g. How to choose a short-let in Lekki"
                                className={`mt-1 ${inputClass} text-lg font-semibold ${titleError ? "border-red-400" : ""}`}
                            />
                        </label>
                        <label className="block">
                            <span className="text-sm font-medium text-gray-800">Short description</span>
                            <span className="block text-xs text-gray-500">
                                Shown on article cards and under the title. One or two sentences.
                            </span>
                            <textarea
                                value={form.excerpt}
                                disabled={readOnly}
                                maxLength={500}
                                rows={2}
                                onChange={(e) => set("excerpt", e.target.value)}
                                className={`mt-1 ${inputClass} resize-y`}
                            />
                        </label>
                    </section>

                    <div>
                        <RichTextEditor
                            value={form.content_html}
                            disabled={readOnly}
                            onChange={(html) => set("content_html", html)}
                        />
                        {post && (
                            <p className="mt-1 text-xs text-gray-500">
                                About {post.reading_minutes} min read (updates when you save).
                            </p>
                        )}
                    </div>

                    <Section
                        title="Search engine settings"
                        hint="How the article appears on Google and in link previews. Leave blank to use the title and short description."
                    >
                        <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                            <p className="text-xs text-gray-500 truncate">aparte.ng › blog › {form.slug || "web-address"}</p>
                            <p className="text-[#1a0dab] text-base leading-snug line-clamp-1">{googleTitle}</p>
                            <p className="text-sm text-gray-600 line-clamp-2">{googleDescription}</p>
                        </div>
                        <label className="block">
                            <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-800">Title for Google</span>
                                <Counter value={form.seo_title} max={SEO_TITLE_MAX} />
                            </div>
                            <input
                                value={form.seo_title}
                                disabled={readOnly}
                                maxLength={200}
                                onChange={(e) => set("seo_title", e.target.value)}
                                placeholder={form.title}
                                className={`mt-1 ${inputClass}`}
                            />
                        </label>
                        <label className="block">
                            <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-800">Description for Google</span>
                                <Counter value={form.meta_description} max={META_MAX} />
                            </div>
                            <textarea
                                value={form.meta_description}
                                disabled={readOnly}
                                maxLength={320}
                                rows={2}
                                onChange={(e) => set("meta_description", e.target.value)}
                                placeholder={form.excerpt}
                                className={`mt-1 ${inputClass} resize-y`}
                            />
                        </label>
                        <label className="block">
                            <span className="text-sm font-medium text-gray-800">Web address</span>
                            <div className="mt-1 flex items-center rounded-lg border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-primary/20">
                                <span className="px-3 py-2 text-sm text-gray-500 bg-gray-50 border-r border-gray-300 whitespace-nowrap">
                                    aparte.ng/blog/
                                </span>
                                <input
                                    value={form.slug}
                                    disabled={readOnly}
                                    onChange={(e) => {
                                        setSlugTouched(true);
                                        // Tidy as they type but keep a trailing hyphen
                                        // so "lagos-" can become "lagos-guide"; blur
                                        // does the full clean-up.
                                        set(
                                            "slug",
                                            e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
                                        );
                                    }}
                                    onBlur={() => set("slug", slugify(form.slug) || slugify(form.title))}
                                    className="flex-1 min-w-0 px-2 py-2 text-sm outline-none disabled:bg-gray-50"
                                />
                            </div>
                            {hasBeenLive && form.slug !== saved.slug && (
                                <span className="block mt-1 text-xs text-gray-500">
                                    The old address will keep working and forward readers here.
                                </span>
                            )}
                        </label>
                        <label className="block">
                            <span className="text-sm font-medium text-gray-800">Original source (optional)</span>
                            <span className="block text-xs text-gray-500">
                                Only if this article was first published somewhere else. Paste that page&apos;s address.
                            </span>
                            <input
                                value={form.canonical_url}
                                disabled={readOnly}
                                type="url"
                                onChange={(e) => set("canonical_url", e.target.value)}
                                placeholder="https://"
                                className={`mt-1 ${inputClass}`}
                            />
                        </label>
                    </Section>
                </div>

                {/* Side column */}
                <div className="space-y-4">
                    <Section title="Featured image">
                        <FeaturedImageField
                            url={form.featured_image_url}
                            alt={form.featured_image_alt}
                            disabled={readOnly}
                            onUrl={(url) => set("featured_image_url", url)}
                            onAlt={(alt) => set("featured_image_alt", alt)}
                        />
                    </Section>

                    <Section title="Details">
                        <label className="block">
                            <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-800">Category</span>
                                {canPublish && (
                                    <Link href={PAGE_ROUTES.dashboard.blog.categories} className="text-xs text-primary hover:underline">
                                        Manage categories
                                    </Link>
                                )}
                            </div>
                            <select
                                value={form.category_id}
                                disabled={readOnly}
                                onChange={(e) => set("category_id", e.target.value)}
                                className={`mt-1 ${inputClass} bg-white`}
                            >
                                <option value="">No category</option>
                                {(categories ?? []).map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="block">
                            <span className="text-sm font-medium text-gray-800">Author</span>
                            <input
                                value={form.author_name}
                                disabled={readOnly}
                                maxLength={120}
                                onChange={(e) => set("author_name", e.target.value)}
                                placeholder="e.g. The Aparte Team"
                                className={`mt-1 ${inputClass}`}
                            />
                        </label>
                        <div>
                            <span className="text-sm font-medium text-gray-800">Tags</span>
                            <div className="mt-1">
                                <TagInput value={form.tags} disabled={readOnly} onChange={(tags) => set("tags", tags)} />
                            </div>
                        </div>
                    </Section>

                    <Section title="Listings to show" hint="Shown at the end of the article.">
                        <PropertyPicker
                            value={form.properties}
                            disabled={readOnly}
                            onChange={(properties) => set("properties", properties)}
                        />
                    </Section>

                    {post && canPublish && (
                        <Section title="More actions">
                            <div className="flex flex-col gap-2">
                                {(status === "PUBLISHED" || status === "SCHEDULED") && (
                                    <button
                                        type="button"
                                        disabled={busy}
                                        onClick={onFeature}
                                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-left"
                                    >
                                        {post.is_featured ? "Remove from featured" : "Feature on the blog homepage"}
                                    </button>
                                )}
                                {(status === "PUBLISHED" || status === "SCHEDULED") && (
                                    <button
                                        type="button"
                                        disabled={busy}
                                        onClick={onUnpublish}
                                        className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-left"
                                    >
                                        {status === "SCHEDULED" ? "Cancel schedule (back to draft)" : "Unpublish"}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    disabled={busy}
                                    onClick={onDelete}
                                    className="px-3 py-2 rounded-lg border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 text-left"
                                >
                                    Delete article
                                </button>
                            </div>
                        </Section>
                    )}
                </div>
            </div>
        </div>
    );
}

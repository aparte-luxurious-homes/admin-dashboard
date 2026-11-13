import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosRequest from "../api";
import { API_ROUTES } from "../routes/endpoints";

/**
 * Blog management (api-v1 services/blog/router.py, /admin/blog).
 *
 * Who may do what is decided by the API; the list and detail responses carry
 * `can_publish` so the screens can hide what the caller cannot do instead of
 * offering a button that answers 403.
 */

export enum BlogRequestKeys {
    posts = "blog:posts",
    post = "blog:post",
    categories = "blog:categories",
}

export type BlogStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED" | "UNPUBLISHED";

export interface BlogCategory {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    article_count?: number;
}

export interface BlogPropertyCard {
    id: string;
    slug: string | null;
    name: string;
    city: string;
    state: string;
    image_url: string | null;
    price_from: number | null;
    is_live?: boolean;
}

export interface BlogPostSummary {
    /** Who created the article in the dashboard (not the public author name). */
    written_by: string | null;
    written_by_role: string | null;
    /** A draft from a writer who cannot publish: waiting for an admin. */
    needs_review: boolean;
    id: string;
    title: string;
    slug: string;
    status: BlogStatus;
    category: BlogCategory | null;
    author_name: string | null;
    excerpt: string | null;
    featured_image_url: string | null;
    is_featured: boolean;
    published_at: string | null;
    created_at: string | null;
    updated_at: string | null;
    view_count: number;
    is_deleted: boolean;
    deleted_at: string | null;
}

export interface BlogPost extends BlogPostSummary {
    content_html: string;
    reading_minutes: number;
    featured_image_alt: string | null;
    seo_title: string | null;
    meta_description: string | null;
    canonical_url: string | null;
    tags: string[];
    property_ids: string[];
    properties: BlogPropertyCard[];
    first_published_at: string | null;
    brand_warnings: string[];
    public_path: string;
    can_publish: boolean;
}

export interface BlogPostList {
    items: BlogPostSummary[];
    total: number;
    page: number;
    page_size: number;
    status_counts: Record<BlogStatus, number>;
    deleted_count: number;
    review_count: number;
    featured_count: number;
    max_featured: number;
    can_publish: boolean;
}

/** Fields the editor saves. Status changes go through Publish / Unpublish. */
export interface BlogPostPayload {
    title?: string;
    slug?: string;
    excerpt?: string;
    content_html?: string;
    featured_image_url?: string | null;
    featured_image_alt?: string;
    category_id?: string | null;
    author_name?: string;
    tags?: string[];
    seo_title?: string;
    meta_description?: string;
    canonical_url?: string | null;
    property_ids?: string[];
}

export interface BlogPostFilters {
    status?: BlogStatus;
    categoryId?: string;
    search?: string;
    deleted?: boolean;
    /** Only drafts from writers who cannot publish. */
    review?: boolean;
    page?: number;
    pageSize?: number;
}

export function GetBlogPosts(filters: BlogPostFilters = {}) {
    const { status, categoryId, search, deleted = false, review = false, page = 1, pageSize = 20 } = filters;
    return useQuery({
        queryKey: [BlogRequestKeys.posts, status ?? "", categoryId ?? "", search ?? "", deleted, review, page, pageSize],
        queryFn: async () => {
            const response = await axiosRequest.get(API_ROUTES.blog.posts, {
                params: { status, category_id: categoryId, search, deleted, review, page, page_size: pageSize },
            });
            return response?.data?.data as BlogPostList;
        },
        staleTime: 15 * 1000,
    });
}

export function GetBlogPost(id: string | undefined) {
    return useQuery({
        queryKey: [BlogRequestKeys.post, id],
        queryFn: async () => {
            const response = await axiosRequest.get(API_ROUTES.blog.post(id as string));
            return response?.data?.data as BlogPost;
        },
        enabled: Boolean(id),
        // The editor owns the form state once loaded; a background refetch
        // must not overwrite what the writer is typing.
        refetchOnWindowFocus: false,
    });
}

function useBlogMutation<TVars>(request: (vars: TVars) => Promise<BlogPost>) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: request,
        onSuccess: (post) => {
            if (post?.id) {
                // Belt and braces: never let an answer without can_publish
                // turn an admin into a read-only writer mid-edit.
                const previous = queryClient.getQueryData<BlogPost>([BlogRequestKeys.post, post.id]);
                const merged =
                    typeof post.can_publish === "boolean" ? post : { ...post, can_publish: previous?.can_publish ?? false };
                queryClient.setQueryData([BlogRequestKeys.post, post.id], merged);
            }
            queryClient.invalidateQueries({ queryKey: [BlogRequestKeys.posts] });
            queryClient.invalidateQueries({ queryKey: [BlogRequestKeys.categories] });
        },
    });
}

const unwrap = (response: { data?: { data?: unknown } }) => response?.data?.data as BlogPost;

export const CreateBlogPost = () =>
    useBlogMutation(async (payload: BlogPostPayload) => unwrap(await axiosRequest.post(API_ROUTES.blog.posts, payload)));

export const UpdateBlogPost = () =>
    useBlogMutation(async ({ id, payload }: { id: string; payload: BlogPostPayload }) =>
        unwrap(await axiosRequest.put(API_ROUTES.blog.post(id), payload)),
    );

/** No `publishAt` (or a time already past) publishes now; a future time schedules. */
export const PublishBlogPost = () =>
    useBlogMutation(async ({ id, publishAt }: { id: string; publishAt?: string | null }) =>
        unwrap(await axiosRequest.post(API_ROUTES.blog.publish(id), publishAt ? { publish_at: publishAt } : {})),
    );

export const UnpublishBlogPost = () =>
    useBlogMutation(async (id: string) => unwrap(await axiosRequest.post(API_ROUTES.blog.unpublish(id))));

export const FeatureBlogPost = () =>
    useBlogMutation(async ({ id, featured }: { id: string; featured: boolean }) =>
        unwrap(await axiosRequest.patch(API_ROUTES.blog.featured(id), { is_featured: featured })),
    );

export const RestoreBlogPost = () =>
    useBlogMutation(async (id: string) => unwrap(await axiosRequest.post(API_ROUTES.blog.restore(id))));

export function DeleteBlogPost() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            await axiosRequest.delete(API_ROUTES.blog.post(id));
            return id;
        },
        onSuccess: (id) => {
            queryClient.removeQueries({ queryKey: [BlogRequestKeys.post, id] });
            queryClient.invalidateQueries({ queryKey: [BlogRequestKeys.posts] });
        },
    });
}

/** Resized and converted on the server; returns the stored image's URL. */
export function UploadBlogImage() {
    return useMutation({
        mutationFn: async (file: File) => {
            const form = new FormData();
            form.append("file", file);
            const response = await axiosRequest.post(API_ROUTES.blog.images, form, {
                headers: { "Content-Type": "multipart/form-data" },
                // Large photos are resized server-side; give it longer than 30s.
                timeout: 90 * 1000,
            });
            return response?.data?.data?.url as string;
        },
    });
}

export function GetBlogCategories() {
    return useQuery({
        queryKey: [BlogRequestKeys.categories],
        queryFn: async () => {
            const response = await axiosRequest.get(API_ROUTES.blog.categories);
            return (response?.data?.data ?? []) as BlogCategory[];
        },
        staleTime: 60 * 1000,
    });
}

export function SaveBlogCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, name, description }: { id?: string; name: string; description?: string }) => {
            const body = { name, description: description ?? "" };
            const response = id
                ? await axiosRequest.patch(API_ROUTES.blog.category(id), body)
                : await axiosRequest.post(API_ROUTES.blog.categories, body);
            return response?.data?.data as BlogCategory;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [BlogRequestKeys.categories] });
            queryClient.invalidateQueries({ queryKey: [BlogRequestKeys.posts] });
        },
    });
}

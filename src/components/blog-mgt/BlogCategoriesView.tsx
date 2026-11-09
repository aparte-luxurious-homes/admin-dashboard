"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useAuth } from "@/src/hooks/useAuth";
import { getApiErrorMessage } from "@/src/lib/apiError";
import { UserRole } from "@/src/lib/enums";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import { BlogCategory, GetBlogCategories, SaveBlogCategory } from "@/src/lib/request-handlers/blogMgt";

const EDITOR_ROLES = [UserRole.ADMIN, UserRole.SUPER_ADMIN];

function CategoryForm({
    initial,
    onDone,
}: {
    initial?: BlogCategory;
    onDone: () => void;
}) {
    const [name, setName] = useState(initial?.name ?? "");
    const [description, setDescription] = useState(initial?.description ?? "");
    const { mutate: save, isPending } = SaveBlogCategory();

    const submit = () => {
        if (name.trim().length < 2) {
            toast.error("A category needs a name.");
            return;
        }
        save(
            { id: initial?.id, name: name.trim(), description: description.trim() },
            {
                onSuccess: () => {
                    toast.success(initial ? "Category updated." : "Category added.");
                    onDone();
                },
                onError: (err) => toast.error(getApiErrorMessage(err, "Could not save the category")),
            },
        );
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-2 items-start">
            <input
                autoFocus
                value={name}
                maxLength={80}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="Name"
                aria-label="Category name"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
            <input
                value={description}
                maxLength={300}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="Short description (optional)"
                aria-label="Category description"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={onDone}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    disabled={isPending}
                    onClick={submit}
                    className="px-3 py-2 rounded-lg bg-primary text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
                >
                    {isPending ? "Saving..." : "Save"}
                </button>
            </div>
        </div>
    );
}

const BlogCategoriesView = () => {
    const { user } = useAuth();
    const canEdit = EDITOR_ROLES.includes(user?.role as UserRole);
    const { data, isLoading, isError } = GetBlogCategories();
    const [adding, setAdding] = useState(false);
    const [editing, setEditing] = useState<string | null>(null);

    return (
        <div className="p-4 md:p-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-5 md:px-6 pt-6 pb-4 border-b border-gray-100 flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div>
                        <Link
                            href={PAGE_ROUTES.dashboard.blog.base}
                            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
                        >
                            <Icon icon="lucide:arrow-left" width={14} /> All articles
                        </Link>
                        <h1 className="text-xl font-semibold text-gray-900 mt-1">Blog categories</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Topics readers can browse on the website. Renaming a category keeps its web address, so
                            shared links still work.
                        </p>
                    </div>
                    {canEdit && !adding && (
                        <button
                            type="button"
                            onClick={() => setAdding(true)}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-sm font-medium text-white hover:bg-primary/90"
                        >
                            <Icon icon="lucide:plus" width={16} /> Add category
                        </button>
                    )}
                </div>

                {adding && (
                    <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                        <CategoryForm onDone={() => setAdding(false)} />
                    </div>
                )}

                {isLoading ? (
                    <div className="p-5 space-y-3">
                        <Skeleton className="h-12 w-full rounded-xl" />
                        <Skeleton className="h-12 w-full rounded-xl" />
                    </div>
                ) : isError ? (
                    <div className="p-8 text-center text-sm text-gray-500">Could not load categories.</div>
                ) : (data ?? []).length === 0 ? (
                    <div className="p-10 text-center text-sm text-gray-400">No categories yet.</div>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {(data ?? []).map((cat) => (
                            <li key={cat.id} className="px-5 py-4">
                                {editing === cat.id ? (
                                    <CategoryForm initial={cat} onDone={() => setEditing(null)} />
                                ) : (
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-900">{cat.name}</p>
                                            {cat.description && (
                                                <p className="text-sm text-gray-600 mt-0.5">{cat.description}</p>
                                            )}
                                            <p className="text-xs text-gray-400 mt-1">
                                                aparte.ng/blog/category/{cat.slug} · {cat.article_count ?? 0}{" "}
                                                {cat.article_count === 1 ? "article" : "articles"}
                                            </p>
                                        </div>
                                        {canEdit && (
                                            <button
                                                type="button"
                                                onClick={() => setEditing(cat.id)}
                                                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                            >
                                                Rename
                                            </button>
                                        )}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default BlogCategoriesView;

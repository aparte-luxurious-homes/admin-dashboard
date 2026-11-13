"use client";

import Link from "next/link";
import { toast } from "react-hot-toast";
import { Icon } from "@iconify/react";

import { UpdatePropertyLink } from "@/src/lib/request-handlers/linksMgt";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import type { HostLinkProperty } from "@/src/lib/types";
import { Skeleton } from "@/src/components/ui/skeleton";

import { Card, Toggle, errorMessage } from "./shared";

function StatusChip({ row }: { row: HostLinkProperty }) {
    if (row.on_page) {
        return <span className="inline-flex rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">On your page</span>;
    }
    if (!row.is_verified) {
        return <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">Awaiting verification</span>;
    }
    return <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">Not on your page</span>;
}

/** One row owns one mutation hook, so a slow toggle only disables itself. */
function ListingRow({ row }: { row: HostLinkProperty }) {
    const { mutate, isPending } = UpdatePropertyLink(row.id);
    const flip = (next: boolean) =>
        mutate(
            { is_link_published: next },
            {
                onSuccess: () => toast.success(next ? `${row.name} is on your page` : `${row.name} removed from your page`),
                onError: (err: any) => toast.error(errorMessage(err, "Couldn't update this listing")),
            }
        );

    return (
        <li className="flex items-center gap-3 px-3 py-2.5">
            <span className="h-10 w-14 shrink-0 overflow-hidden rounded bg-gray-100">
                {row.hero_image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={row.hero_image} alt="" className="h-full w-full object-cover" />
                )}
            </span>
            <span className="min-w-0 flex-1">
                <Link
                    href={PAGE_ROUTES.dashboard.propertyManagement.allProperties.details(row.id)}
                    className="block truncate text-sm font-medium text-gray-900 hover:text-primary"
                >
                    {row.name}
                </Link>
                <span className="block truncate text-xs text-gray-500">{[row.city, row.state].filter(Boolean).join(", ")}</span>
            </span>
            <span className="hidden sm:block shrink-0">
                <StatusChip row={row} />
            </span>
            <span className="shrink-0 flex items-center gap-2">
                {!row.is_verified && (
                    <span className="hidden md:inline text-xs text-gray-400">Verify first</span>
                )}
                <Toggle
                    checked={row.is_link_published}
                    onChange={flip}
                    disabled={isPending || !row.is_verified}
                    label={`Show ${row.name} on your page`}
                />
            </span>
        </li>
    );
}

export default function ListingsTable({
    rows,
    isLoading,
}: {
    rows: HostLinkProperty[];
    isLoading: boolean;
}) {
    const onPage = rows.filter((r) => r.on_page).length;
    return (
        <Card
            title="Listings on your page"
            icon="lucide:building-2"
            description="A listing shows once it's verified and switched on here."
            action={
                !isLoading && rows.length > 0 ? (
                    <span className="shrink-0 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {onPage} of {rows.length} showing
                    </span>
                ) : undefined
            }
        >
            {isLoading ? (
                <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-14" />
                    ))}
                </div>
            ) : rows.length === 0 ? (
                <div className="rounded-lg bg-gray-50 p-6 text-center">
                    <Icon icon="lucide:home" width="24" height="24" className="mx-auto text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">No listings yet.</p>
                    <Link
                        href={PAGE_ROUTES.dashboard.propertyManagement.allProperties.create}
                        className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
                    >
                        Add your first property
                    </Link>
                </div>
            ) : (
                <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                    {rows.map((row) => (
                        <ListingRow key={row.id} row={row} />
                    ))}
                </ul>
            )}
        </Card>
    );
}

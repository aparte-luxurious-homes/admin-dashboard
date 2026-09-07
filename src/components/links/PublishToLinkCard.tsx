"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Icon } from "@iconify/react/dist/iconify.js";
import {
    GetPropertyShareKit,
    UpdatePropertyLink,
    PropertyShareKit,
} from "@/src/lib/request-handlers/linksMgt";

/**
 * Publish one property to the owner's/agent's public Aparte Link catalog.
 *
 * A property reaches a catalog page only when it is BOTH verified AND
 * link-published, and `is_link_published` defaults to false. The API to flip
 * it has existed since the links service shipped; nothing called it. The
 * result was reported on 2026-09-05: an agent's catalog rendering with zero
 * properties while they had verified ones, and no way to find out why.
 *
 * The unverified state says so explicitly rather than showing a control that
 * would be refused, because "why is this toggle not working" is the same dead
 * end in a different costume.
 */
export default function PublishToLinkCard({
    propertyId,
    isVerified,
}: {
    propertyId: string;
    isVerified: boolean;
}) {
    const { data, isLoading } = GetPropertyShareKit(propertyId);
    const { mutate: updateLink, isPending } = UpdatePropertyLink(propertyId);
    const [copied, setCopied] = useState(false);

    const kit: PropertyShareKit | undefined = data?.data?.data ?? data?.data;
    const published = Boolean(kit?.is_link_published);

    const toggle = () => {
        updateLink(
            { is_link_published: !published },
            {
                onSuccess: () =>
                    toast.success(
                        published
                            ? "Removed from your Aparte Link page"
                            : "Now showing on your Aparte Link page"
                    ),
                onError: (err: any) =>
                    toast.error(
                        err?.response?.data?.detail ??
                        err?.response?.data?.message ??
                        "Couldn't update this listing"
                    ),
            }
        );
    };

    const copyUrl = async () => {
        if (!kit?.direct_url) return;
        try {
            await navigator.clipboard.writeText(kit.direct_url);
            setCopied(true);
            toast.success("Link copied");
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Couldn't copy — select the link and copy it manually");
        }
    };

    if (isLoading) {
        return <div className="h-24 animate-pulse bg-gray-100 rounded-lg" />;
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Icon icon="lucide:link" width="16" height="16" className="text-primary shrink-0" />
                        Aparte Link page
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                        Show this listing on your public page so guests can book it directly.
                    </p>
                </div>
                {isVerified && (
                    <span
                        className={`shrink-0 text-[11px] font-medium px-2 py-1 rounded-full ${
                            published
                                ? "bg-green-50 text-green-700"
                                : "bg-gray-100 text-gray-500"
                        }`}
                    >
                        {published ? "Showing" : "Hidden"}
                    </span>
                )}
            </div>

            {!isVerified ? (
                /* Publishing is refused server-side until the property is
                   verified, so offer the reason rather than a control that
                   would fail. */
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <Icon
                        icon="lucide:clock"
                        width="15" height="15"
                        className="text-amber-600 mt-0.5 shrink-0"
                    />
                    <p className="text-xs text-amber-800">
                        You can publish this once it&apos;s verified. We&apos;ll review it and let
                        you know — then come back here to put it on your page.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {published && kit?.direct_url && (
                        <div className="flex items-stretch gap-2">
                            <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-xs text-gray-700 truncate self-center">
                                {kit.direct_url}
                            </div>
                            <button
                                onClick={copyUrl}
                                className="px-3 py-2 border border-gray-300 hover:bg-gray-50 text-xs font-medium text-gray-700 rounded-lg flex items-center gap-1.5 shrink-0"
                            >
                                <Icon icon={copied ? "lucide:check" : "lucide:copy"} width="14" height="14" />
                                {copied ? "Copied" : "Copy"}
                            </button>
                        </div>
                    )}

                    <button
                        onClick={toggle}
                        disabled={isPending}
                        className={`w-full px-4 py-2.5 text-sm font-medium rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 ${
                            published
                                ? "border border-gray-300 hover:bg-gray-50 text-gray-700"
                                : "bg-primary hover:bg-primary/90 text-white"
                        }`}
                    >
                        <Icon icon={published ? "lucide:eye-off" : "lucide:globe"} width="16" height="16" />
                        {isPending
                            ? "Saving…"
                            : published
                                ? "Remove from my page"
                                : "Publish to my page"}
                    </button>

                    {!published && (
                        <p className="text-[11px] text-gray-400">
                            Verified listings are hidden until you publish them.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

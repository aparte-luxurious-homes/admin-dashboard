"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { toast } from "react-hot-toast";
import { Icon } from "@iconify/react";

import Link from "next/link";

import { useAuth } from "@/src/hooks/useAuth";
import {
    GetMyCatalog,
    UpdateMyCatalog,
    downloadCatalogQr,
    type CatalogShareKit,
} from "@/src/lib/request-handlers/linksMgt";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import { trackEvent } from "@/src/lib/analytics";

export interface SharePillHandle {
    copy: (source?: string) => void;
}

/**
 * The owner's public page, at three volumes (spec D8). This is the quiet one:
 * always in the header, never growing. It reads the catalog the Aparte Link
 * feature already owns, so there is no second source for the handle.
 */
const SharePill = forwardRef<SharePillHandle, { className?: string }>(function SharePill(
    { className = "" },
    ref
) {
    const { user } = useAuth();
    const { data, isLoading } = GetMyCatalog(true);
    const publish = UpdateMyCatalog();
    const [qrBusy, setQrBusy] = useState(false);
    const kit: CatalogShareKit | undefined = data?.data?.data ?? data?.data;

    const url = kit?.catalog_url ?? (kit?.handle ? `https://aparte.ng/@${kit.handle}` : null);
    // A private page answers not-found to every guest the owner sends it to,
    // so copying the link is worse than useless until it is published.
    const isPrivate = Boolean(kit?.handle) && kit?.is_catalog_published === false;

    const copy = async (source = "pill") => {
        if (!url) return;
        try {
            await navigator.clipboard.writeText(url);
            toast.success("Link copied");
            trackEvent("owner_share_copied", { source });
        } catch {
            toast.error("Could not copy the link");
        }
    };

    useImperativeHandle(ref, () => ({ copy }));

    if (isLoading) {
        return <div className={`h-9 w-60 rounded-lg bg-gray-100 animate-pulse ${className}`} />;
    }

    if (!kit?.handle) {
        return (
            <Link
                href={PAGE_ROUTES.dashboard.settings.personalInfo}
                className={`inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-[#028090] ${className}`}
            >
                <Icon icon="mdi:link-variant" width={16} />
                Claim your page
            </Link>
        );
    }

    if (isPrivate) {
        return (
            <div
                id="owner-share"
                className={`inline-flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 ${className}`}
            >
                <span className="text-[13px] text-amber-900">
                    Your page is private. Anyone you send it to sees nothing.
                </span>
                <button
                    type="button"
                    disabled={publish.isPending}
                    onClick={async () => {
                        try {
                            await publish.mutateAsync({ is_catalog_published: true });
                            toast.success("Your page is live");
                        } catch {
                            toast.error("Could not publish your page");
                        }
                    }}
                    className="rounded-md bg-[#028090] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#016171] disabled:opacity-60"
                >
                    {publish.isPending ? "Publishing..." : "Make it public"}
                </button>
            </div>
        );
    }

    return (
        <div
            id="owner-share"
            className={`inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white py-1.5 pl-3 pr-1.5 ${className}`}
        >
            <code className="truncate font-mono text-xs text-gray-600">
                {url?.replace(/^https?:\/\//, "")}
            </code>
            <button
                type="button"
                onClick={() => copy("pill")}
                className="rounded-md border border-gray-200 px-2.5 py-1 text-xs font-semibold text-[#028090] hover:bg-[#028090]/5"
            >
                Copy
            </button>
            <button
                type="button"
                disabled={qrBusy}
                onClick={async () => {
                    if (!user?.id || !kit.handle) return;
                    setQrBusy(true);
                    try {
                        await downloadCatalogQr(String(user.id), kit.handle);
                    } catch {
                        toast.error("Could not generate the QR code");
                    } finally {
                        setQrBusy(false);
                    }
                }}
                className="rounded-md border border-gray-200 px-2.5 py-1 text-xs font-semibold text-[#028090] hover:bg-[#028090]/5 disabled:opacity-60"
            >
                {qrBusy ? "..." : "QR"}
            </button>
        </div>
    );
});

export default SharePill;

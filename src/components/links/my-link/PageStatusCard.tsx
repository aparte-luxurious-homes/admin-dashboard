"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Icon } from "@iconify/react";

import {
    UpdateMyCatalog,
    downloadCatalogQr,
    useCatalogQrPreview,
} from "@/src/lib/request-handlers/linksMgt";
import type { CatalogShareKit } from "@/src/lib/types";

import { Card, Toggle, errorMessage, primaryButton, secondaryButton } from "./shared";

// Mirrors HANDLE_REGEX in api-v1 services/links/reserved.py. Validating here
// is a courtesy, not a control — the server is still the authority, and its
// reserved-word and impersonation checks are not duplicated.
export const HANDLE_PATTERN = /^[a-z0-9][a-z0-9_-]{1,38}[a-z0-9]$/;
export const HANDLE_HELP =
    "Use 3–40 characters: lowercase letters, numbers, - or _, starting and ending with a letter or number.";

/**
 * Where the page lives and how to send it: the URL, public/private, the QR,
 * and the two ways hosts actually distribute it — a WhatsApp message and an
 * Instagram bio line.
 */
export default function PageStatusCard({
    kit,
    userId,
}: {
    kit: CatalogShareKit;
    userId?: string;
}) {
    const { mutate: updateCatalog, isPending } = UpdateMyCatalog();
    const [handleDraft, setHandleDraft] = useState("");
    const [downloading, setDownloading] = useState(false);
    const qrSrc = useCatalogQrPreview(userId, kit.handle, 320);

    const url = kit.catalog_url ?? (kit.handle ? `https://aparte.ng/@${kit.handle}` : null);

    const copy = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success(`${label} copied`);
        } catch {
            toast.error("Couldn't copy — select the text and copy it manually");
        }
    };

    const claimHandle = () => {
        const handle = handleDraft.trim().toLowerCase();
        if (!HANDLE_PATTERN.test(handle)) {
            toast.error(HANDLE_HELP);
            return;
        }
        updateCatalog(
            { handle, is_catalog_published: true },
            {
                onSuccess: () => toast.success(`Your page is live at @${handle}`),
                onError: (err: any) => toast.error(errorMessage(err, "That handle isn't available")),
            }
        );
    };

    const setPublished = (next: boolean) =>
        updateCatalog(
            { is_catalog_published: next },
            {
                onSuccess: () => toast.success(next ? "Your page is public" : "Your page is private"),
                onError: (err: any) => toast.error(errorMessage(err, "Couldn't update your page")),
            }
        );

    const getQr = async () => {
        if (!userId || !kit.handle) return;
        setDownloading(true);
        try {
            await downloadCatalogQr(userId, kit.handle);
        } catch {
            toast.error("Couldn't generate the QR code");
        } finally {
            setDownloading(false);
        }
    };

    if (!kit.handle) {
        return (
            <Card
                title="Claim your page"
                icon="lucide:link"
                description="One link with every listing you manage. Pick the name people will remember."
            >
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
                        <span className="px-3 py-2 text-sm text-gray-500 bg-gray-50 border-r border-gray-200 whitespace-nowrap">
                            aparte.ng/@
                        </span>
                        <input
                            type="text"
                            value={handleDraft}
                            onChange={(e) => setHandleDraft(e.target.value.toLowerCase())}
                            onKeyDown={(e) => e.key === "Enter" && claimHandle()}
                            className="flex-1 px-3 py-2 text-sm outline-none min-w-0"
                            placeholder="yourname"
                            maxLength={40}
                            autoComplete="off"
                        />
                    </div>
                    <button onClick={claimHandle} disabled={isPending || !handleDraft.trim()} className={primaryButton}>
                        {isPending ? "Claiming…" : "Claim handle"}
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    You can change this <strong>once</strong>. {HANDLE_HELP}
                </p>
            </Card>
        );
    }

    const whatsappText = kit.share_templates?.whatsapp_status;
    const instagramBio = kit.share_templates?.instagram_bio;

    return (
        <Card
            title="Your page"
            icon="lucide:link"
            action={
                <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-medium ${kit.is_catalog_published ? "text-green-700" : "text-amber-700"}`}>
                        {kit.is_catalog_published ? "Public" : "Private"}
                    </span>
                    <Toggle
                        checked={kit.is_catalog_published}
                        onChange={setPublished}
                        disabled={isPending}
                        label="Page is public"
                    />
                </div>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-5">
                <div className="space-y-3 min-w-0">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm text-gray-800 truncate">
                            {url}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => url && copy(url, "Link")} className={`${primaryButton} flex-1 sm:flex-none`}>
                                <Icon icon="lucide:copy" width="15" height="15" />
                                Copy
                            </button>
                            {url && (
                                <a href={url} target="_blank" rel="noopener noreferrer" className={`${secondaryButton} flex-1 sm:flex-none`}>
                                    <Icon icon="lucide:external-link" width="15" height="15" />
                                    Open
                                </a>
                            )}
                        </div>
                    </div>

                    {!kit.is_catalog_published && (
                        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <Icon icon="lucide:eye-off" width="16" height="16" className="text-amber-600 mt-0.5 shrink-0" />
                            <p className="text-xs text-amber-800">
                                Your page is private. Anyone opening this link right now sees a not-found page.
                                Switch it to public when you&apos;re ready to send it.
                            </p>
                        </div>
                    )}

                    {kit.is_catalog_published && kit.property_count === 0 && (
                        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <Icon icon="lucide:info" width="16" height="16" className="text-blue-600 mt-0.5 shrink-0" />
                            <p className="text-xs text-blue-800">
                                Your page is live but empty. A listing shows once it&apos;s verified <strong>and</strong> switched on
                                in <strong>Listings on your page</strong> below.
                            </p>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-1">
                        {whatsappText && (
                            <a
                                href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#1fb955] text-white text-sm font-medium rounded-lg"
                            >
                                <Icon icon="ic:baseline-whatsapp" width="18" height="18" />
                                Share on WhatsApp
                            </a>
                        )}
                        {instagramBio && (
                            <button onClick={() => copy(instagramBio, "Instagram bio")} className={secondaryButton}>
                                <Icon icon="lucide:instagram" width="15" height="15" />
                                Copy Instagram bio
                            </button>
                        )}
                        {whatsappText && (
                            <button onClick={() => copy(whatsappText, "Message")} className={secondaryButton}>
                                <Icon icon="lucide:message-square-text" width="15" height="15" />
                                Copy message
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex lg:flex-col items-center gap-3 lg:w-44">
                    <div className="h-36 w-36 rounded-lg border border-gray-200 bg-white flex items-center justify-center overflow-hidden shrink-0">
                        {qrSrc ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={qrSrc} alt={`QR code for ${url}`} className="h-full w-full object-contain" />
                        ) : (
                            <div className="h-full w-full animate-pulse bg-gray-100" />
                        )}
                    </div>
                    <button onClick={getQr} disabled={downloading} className={`${secondaryButton} w-full`}>
                        <Icon icon="lucide:download" width="15" height="15" />
                        {downloading ? "Preparing…" : "Download QR"}
                    </button>
                </div>
            </div>
        </Card>
    );
}

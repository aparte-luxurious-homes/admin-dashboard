"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Icon } from "@iconify/react/dist/iconify.js";
import {
    CatalogShareKit,
    GetMyCatalog,
    UpdateMyCatalog,
    downloadCatalogQr,
} from "@/src/lib/request-handlers/linksMgt";
import { useAuth } from "@/src/hooks/useAuth";
import { UserRole } from "@/src/lib/enums";

/**
 * "Share my Aparte link" — the owner/agent's public catalog at
 * aparte.ng/@handle, which lists their whole verified portfolio on one page.
 *
 * The backing endpoints (services/links) have existed since 2026-08-08 but
 * had no surface in this dashboard, so the feature was effectively
 * unshippable: an agent could not discover their own link, let alone send it.
 *
 * Three states, because a handle is claimed rather than auto-assigned:
 *   - no handle yet     -> claim form
 *   - handle, unpublished -> the link exists but 404s for visitors; say so
 *   - published         -> copy / QR / share templates
 */

// Mirrors HANDLE_REGEX in api-v1 services/links/reserved.py. Validating here
// is a courtesy, not a control — the server is still the authority, and its
// reserved-word and impersonation checks are not duplicated.
const HANDLE_PATTERN = /^[a-z0-9][a-z0-9_-]{1,38}[a-z0-9]$/;

export default function ShareMyLinkCard() {
    const { user } = useAuth();
    const role = user?.role as UserRole | undefined;
    const isEligible = role === UserRole.OWNER || role === UserRole.AGENT;

    const { data, isLoading } = GetMyCatalog(isEligible);
    const { mutate: updateCatalog, isPending } = UpdateMyCatalog();

    const [handleDraft, setHandleDraft] = useState("");
    const [downloading, setDownloading] = useState(false);

    if (!isEligible) return null;

    const kit: CatalogShareKit | undefined =
        data?.data?.data ?? data?.data;

    const copy = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success(`${label} copied`);
        } catch {
            // clipboard is unavailable over plain http and in some embedded
            // webviews — tell the user rather than failing silently.
            toast.error("Couldn't copy — select the link and copy it manually");
        }
    };

    const claimHandle = () => {
        const handle = handleDraft.trim().toLowerCase();
        if (!HANDLE_PATTERN.test(handle)) {
            toast.error(
                "Use 3–40 characters: lowercase letters, numbers, - or _, " +
                "starting and ending with a letter or number."
            );
            return;
        }
        updateCatalog(
            { handle, is_catalog_published: true },
            {
                onSuccess: () => toast.success(`Your link is live at @${handle}`),
                onError: (err: any) =>
                    toast.error(
                        err?.response?.data?.detail ??
                        err?.response?.data?.message ??
                        "That handle isn't available"
                    ),
            }
        );
    };

    const publish = (next: boolean) =>
        updateCatalog(
            { is_catalog_published: next },
            {
                onSuccess: () =>
                    toast.success(next ? "Your link is live" : "Your link is now private"),
                onError: () => toast.error("Couldn't update your link"),
            }
        );

    const getQr = async () => {
        if (!user?.id || !kit?.handle) return;
        setDownloading(true);
        try {
            await downloadCatalogQr(String(user.id), kit.handle);
        } catch {
            toast.error("Couldn't generate the QR code");
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Icon icon="lucide:link" width="18" height="18" className="text-primary" />
                        Share my Aparte link
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        One link with every listing you manage. Send it on WhatsApp,
                        put it in your Instagram bio, print the QR.
                    </p>
                </div>
                {kit?.property_count !== undefined && (
                    <span className="shrink-0 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {kit.property_count} listing{kit.property_count === 1 ? "" : "s"}
                    </span>
                )}
            </div>

            {isLoading ? (
                <div className="h-20 animate-pulse bg-gray-100 rounded-lg" />
            ) : !kit?.handle ? (
                /* ---------- No handle yet: claim one ---------- */
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Choose your handle
                    </label>
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
                        <button
                            onClick={claimHandle}
                            disabled={isPending || !handleDraft.trim()}
                            className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg whitespace-nowrap"
                        >
                            {isPending ? "Claiming…" : "Claim handle"}
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        You can change this <strong>once</strong>, so pick the name you
                        want people to remember.
                    </p>
                </div>
            ) : (
                /* ---------- Handle exists ---------- */
                <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm text-gray-800 truncate">
                            {kit.catalog_url ?? `aparte.ng/@${kit.handle}`}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => copy(kit.catalog_url ?? `https://aparte.ng/@${kit.handle}`, "Link")}
                                className="flex-1 sm:flex-none px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2"
                            >
                                <Icon icon="lucide:copy" width="15" height="15" />
                                Copy
                            </button>
                            <button
                                onClick={getQr}
                                disabled={downloading}
                                title="Download a QR code for print"
                                className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 text-sm font-medium text-gray-700 rounded-lg flex items-center justify-center gap-2"
                            >
                                <Icon icon="lucide:qr-code" width="15" height="15" />
                                {downloading ? "…" : "QR"}
                            </button>
                        </div>
                    </div>

                    {!kit.is_catalog_published && (
                        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <Icon
                                icon="lucide:eye-off"
                                width="16" height="16"
                                className="text-amber-600 mt-0.5 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-amber-800">
                                    Your page is private — anyone opening this link right now
                                    sees a not-found page.
                                </p>
                                <button
                                    onClick={() => publish(true)}
                                    disabled={isPending}
                                    className="mt-2 text-xs font-medium text-amber-900 underline hover:no-underline disabled:opacity-50"
                                >
                                    Make it public
                                </button>
                            </div>
                        </div>
                    )}

                    {kit.is_catalog_published && kit.property_count === 0 && (
                        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <Icon
                                icon="lucide:info"
                                width="16" height="16"
                                className="text-blue-600 mt-0.5 shrink-0"
                            />
                            {/* This used to say approved listings "show up
                                automatically". They do not: a property needs to
                                be verified AND published, and publishing is off
                                by default. That copy sent agents looking for a
                                bug instead of a button. */}
                            <p className="text-xs text-blue-800">
                                Your page is live but empty. A listing shows here once it&apos;s
                                verified <strong>and</strong> you&apos;ve published it — open any
                                verified property and use <strong>Publish to my page</strong>.
                            </p>
                        </div>
                    )}

                    {kit.share_templates?.whatsapp_status && (
                        <button
                            onClick={() => copy(kit.share_templates!.whatsapp_status, "Message")}
                            className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 group"
                        >
                            <span className="flex items-center justify-between gap-2 mb-1">
                                <span className="text-xs font-medium text-gray-700">
                                    Ready-to-send message
                                </span>
                                <Icon
                                    icon="lucide:copy"
                                    width="14" height="14"
                                    className="text-gray-400 group-hover:text-gray-600 shrink-0"
                                />
                            </span>
                            <span className="block text-xs text-gray-500 whitespace-pre-line line-clamp-3">
                                {kit.share_templates.whatsapp_status}
                            </span>
                        </button>
                    )}

                    {kit.is_catalog_published && (
                        <button
                            onClick={() => publish(false)}
                            disabled={isPending}
                            className="text-xs text-gray-500 hover:text-gray-700 underline hover:no-underline disabled:opacity-50"
                        >
                            Make my page private
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { Icon } from "@iconify/react";

import { UpdateMyCatalog } from "@/src/lib/request-handlers/linksMgt";
import type { CatalogConfig, CatalogShareKit, HostLinkProperty } from "@/src/lib/types";

import CoverUploader from "./CoverUploader";
import FeaturedPicker from "./FeaturedPicker";
import { HANDLE_HELP, HANDLE_PATTERN } from "./PageStatusCard";
import PreviewCard from "./PreviewCard";
import { Card, Toggle, errorMessage, primaryButton, secondaryButton } from "./shared";

export const HEADLINE_MAX = 80;
export const BIO_MAX = 600;

interface Draft {
    headline: string;
    bio: string;
    whatsapp_number: string;
    show_whatsapp_button: boolean;
    featured_property_ids: string[];
}

function draftFrom(kit: CatalogShareKit): Draft {
    const c = kit.catalog_config ?? {};
    return {
        headline: c.headline ?? "",
        bio: c.bio ?? "",
        whatsapp_number: c.whatsapp_number ?? "",
        show_whatsapp_button: Boolean(c.show_whatsapp_button),
        featured_property_ids: kit.featured_property_ids ?? [],
    };
}

/**
 * Everything on the public page a host writes themselves.
 *
 * Saves only the fields that changed: the API merges a PATCH into the stored
 * config, and an emptied field is sent as null to clear it. Phone numbers and
 * links typed into the headline or bio are stripped server-side — the page
 * exists to keep booking on Aparte — and the form says so before the host
 * finds out from the result.
 */
export default function ProfileForm({
    kit,
    properties,
    displayName,
    profileImage,
    isVerified,
}: {
    kit: CatalogShareKit;
    properties: HostLinkProperty[];
    displayName: string;
    profileImage: string | null;
    isVerified: boolean;
}) {
    const { mutate: updateCatalog, isPending } = UpdateMyCatalog();
    const [saved, setSaved] = useState<Draft>(() => draftFrom(kit));
    const [draft, setDraft] = useState<Draft>(() => draftFrom(kit));
    const [handleDraft, setHandleDraft] = useState(kit.handle ?? "");
    const [confirmHandle, setConfirmHandle] = useState(false);

    // A save elsewhere (publish toggle, cover upload) refreshes the kit; keep
    // the untouched fields in step without clobbering what is being typed.
    useEffect(() => {
        const next = draftFrom(kit);
        setSaved(next);
        setDraft((d) => ({
            ...d,
            ...Object.fromEntries(
                (Object.keys(next) as (keyof Draft)[])
                    .filter((k) => JSON.stringify(d[k]) === JSON.stringify(saved[k]))
                    .map((k) => [k, next[k]])
            ),
        }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [kit]);

    const dirty = useMemo(
        () => (Object.keys(draft) as (keyof Draft)[]).filter((k) => JSON.stringify(draft[k]) !== JSON.stringify(saved[k])),
        [draft, saved]
    );

    const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

    const save = () => {
        const config: CatalogConfig = {};
        for (const key of dirty) {
            if (key === "featured_property_ids") config.featured_property_ids = draft.featured_property_ids;
            else if (key === "show_whatsapp_button") config.show_whatsapp_button = draft.show_whatsapp_button;
            else config[key] = draft[key].trim() ? draft[key].trim() : null;
        }
        updateCatalog(
            { catalog_config: config },
            {
                onSuccess: () => toast.success("Page saved"),
                onError: (err: any) => toast.error(errorMessage(err, "Couldn't save your page")),
            }
        );
    };

    const changeHandle = () => {
        const handle = handleDraft.trim().toLowerCase();
        if (!HANDLE_PATTERN.test(handle)) {
            toast.error(HANDLE_HELP);
            return;
        }
        updateCatalog(
            { handle },
            {
                onSuccess: () => {
                    toast.success(`Your page is now at @${handle}`);
                    setConfirmHandle(false);
                },
                onError: (err: any) => toast.error(errorMessage(err, "That handle isn't available")),
            }
        );
    };

    const handleChanged = handleDraft.trim().toLowerCase() !== (kit.handle ?? "");
    const inputClass =
        "w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary";

    return (
        <Card
            title="What your page says"
            icon="lucide:pencil-line"
            description="Your name and photo come from your profile. Everything here is yours to write."
            action={
                <button onClick={save} disabled={isPending || dirty.length === 0} className={primaryButton}>
                    {isPending ? "Saving…" : dirty.length ? "Save changes" : "Saved"}
                </button>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
                <div className="space-y-5">
                    {/* Handle */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Handle</label>
                        {kit.can_change_handle ? (
                            <>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <div className="flex-1 flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
                                        <span className="px-3 py-2 text-sm text-gray-500 bg-gray-50 border-r border-gray-200 whitespace-nowrap">
                                            aparte.ng/@
                                        </span>
                                        <input
                                            type="text"
                                            value={handleDraft}
                                            onChange={(e) => {
                                                setHandleDraft(e.target.value.toLowerCase());
                                                setConfirmHandle(false);
                                            }}
                                            className="flex-1 px-3 py-2 text-sm outline-none min-w-0"
                                            maxLength={40}
                                            autoComplete="off"
                                        />
                                    </div>
                                    {!confirmHandle ? (
                                        <button
                                            type="button"
                                            onClick={() => setConfirmHandle(true)}
                                            disabled={!handleChanged || isPending}
                                            className={secondaryButton}
                                        >
                                            Change handle
                                        </button>
                                    ) : (
                                        <button type="button" onClick={changeHandle} disabled={isPending} className={primaryButton}>
                                            {isPending ? "Changing…" : "Yes, change it once"}
                                        </button>
                                    )}
                                </div>
                                {confirmHandle ? (
                                    <p className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2">
                                        This is your one change. Links and QR codes you&apos;ve already shared at @{kit.handle} will
                                        stop working.
                                    </p>
                                ) : (
                                    <p className="mt-1 text-xs text-gray-500">You can change this once. {HANDLE_HELP}</p>
                                )}
                            </>
                        ) : (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                <span className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono">
                                    aparte.ng/@{kit.handle}
                                </span>
                                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                    <Icon icon="lucide:lock" width="12" height="12" />
                                    Changed
                                    {kit.handle_changed_at ? ` on ${new Date(kit.handle_changed_at).toLocaleDateString("en-NG")}` : ""}
                                    ; contact support to change it again
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Headline */}
                    <div>
                        <div className="flex items-baseline justify-between">
                            <label htmlFor="ml-headline" className="block text-sm font-medium text-gray-700 mb-1">
                                Headline
                            </label>
                            <span className={`text-xs ${draft.headline.length > HEADLINE_MAX ? "text-red-600" : "text-gray-400"}`}>
                                {draft.headline.length}/{HEADLINE_MAX}
                            </span>
                        </div>
                        <input
                            id="ml-headline"
                            type="text"
                            value={draft.headline}
                            maxLength={HEADLINE_MAX}
                            onChange={(e) => set("headline", e.target.value)}
                            placeholder="Short-lets in Lekki and Ikoyi, ready today"
                            className={inputClass}
                        />
                        <p className="mt-1 text-xs text-gray-500">One line under your name. Say where and what you let.</p>
                    </div>

                    {/* Bio */}
                    <div>
                        <div className="flex items-baseline justify-between">
                            <label htmlFor="ml-bio" className="block text-sm font-medium text-gray-700 mb-1">
                                About you
                            </label>
                            <span className={`text-xs ${draft.bio.length > BIO_MAX ? "text-red-600" : "text-gray-400"}`}>
                                {draft.bio.length}/{BIO_MAX}
                            </span>
                        </div>
                        <textarea
                            id="ml-bio"
                            value={draft.bio}
                            maxLength={BIO_MAX}
                            rows={5}
                            onChange={(e) => set("bio", e.target.value)}
                            placeholder="How long you've hosted, what guests can count on, how you handle check-in."
                            className={inputClass}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Phone numbers and web links are removed automatically — guests book and pay through Aparte, and
                            WhatsApp has its own button below.
                        </p>
                    </div>

                    {/* WhatsApp */}
                    <div className="rounded-lg border border-gray-200 p-3 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-medium text-gray-700">WhatsApp button</p>
                                <p className="text-xs text-gray-500">Shown on your page only while this is on.</p>
                            </div>
                            <Toggle
                                checked={draft.show_whatsapp_button}
                                onChange={(v) => set("show_whatsapp_button", v)}
                                label="Show WhatsApp button"
                            />
                        </div>
                        <input
                            type="tel"
                            inputMode="tel"
                            value={draft.whatsapp_number}
                            onChange={(e) => set("whatsapp_number", e.target.value)}
                            placeholder="0803 123 4567"
                            className={inputClass}
                        />
                        {draft.show_whatsapp_button && !draft.whatsapp_number.trim() && !saved.whatsapp_number && (
                            <p className="text-xs text-amber-700">Add a number or the button won&apos;t show.</p>
                        )}
                    </div>

                    <CoverUploader coverImage={kit.cover_image} />

                    <FeaturedPicker
                        properties={properties}
                        selected={draft.featured_property_ids}
                        onChange={(ids) => set("featured_property_ids", ids)}
                    />
                </div>

                <div className="lg:sticky lg:top-4 self-start">
                    <PreviewCard
                        displayName={displayName}
                        profileImage={profileImage}
                        coverImage={kit.cover_image}
                        isVerified={isVerified}
                        headline={draft.headline}
                        showWhatsapp={draft.show_whatsapp_button && Boolean(draft.whatsapp_number.trim())}
                        propertyCount={kit.property_count}
                    />
                </div>
            </div>
        </Card>
    );
}

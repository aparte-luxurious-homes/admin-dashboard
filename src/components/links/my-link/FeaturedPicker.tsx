"use client";

import { Icon } from "@iconify/react";

import type { HostLinkProperty } from "@/src/lib/types";

export const FEATURED_MAX = 4;

/**
 * Up to four listings pinned to the top of the public page, whatever the
 * visitor sorts by. Only listings that are actually on the page can be
 * pinned — the server refuses the rest, so they are shown greyed with the
 * reason rather than offered and then refused.
 */
export default function FeaturedPicker({
    properties,
    selected,
    onChange,
}: {
    properties: HostLinkProperty[];
    selected: string[];
    onChange: (next: string[]) => void;
}) {
    const toggle = (id: string) => {
        if (selected.includes(id)) {
            onChange(selected.filter((x) => x !== id));
        } else if (selected.length < FEATURED_MAX) {
            onChange([...selected, id]);
        }
    };
    const full = selected.length >= FEATURED_MAX;

    if (!properties.length) {
        return (
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Featured listings</label>
                <p className="text-xs text-gray-500">Once you have listings on your page you can pin up to {FEATURED_MAX} to the top.</p>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-baseline justify-between">
                <label className="block text-sm font-medium text-gray-700 mb-1">Featured listings</label>
                <span className="text-xs text-gray-500">{selected.length} of {FEATURED_MAX}</span>
            </div>
            <p className="text-xs text-gray-500 mb-2">Pinned to the top of your page, in this order.</p>
            <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 max-h-72 overflow-y-auto">
                {properties.map((p) => {
                    const checked = selected.includes(p.id);
                    const blocked = !p.on_page;
                    const disabled = blocked || (!checked && full);
                    return (
                        <li key={p.id}>
                            <label
                                className={`flex items-center gap-3 px-3 py-2 ${
                                    disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:bg-gray-50"
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={disabled}
                                    onChange={() => toggle(p.id)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <span className="h-9 w-12 shrink-0 overflow-hidden rounded bg-gray-100">
                                    {p.hero_image && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={p.hero_image} alt="" className="h-full w-full object-cover" />
                                    )}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm text-gray-900">{p.name}</span>
                                    <span className="block truncate text-xs text-gray-500">
                                        {blocked
                                            ? p.is_verified
                                                ? "Switch it on below to pin it"
                                                : "Verify it first"
                                            : [p.city, p.state].filter(Boolean).join(", ")}
                                    </span>
                                </span>
                                {checked && <Icon icon="lucide:pin" width="14" height="14" className="text-primary shrink-0" />}
                            </label>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

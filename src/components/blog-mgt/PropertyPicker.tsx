"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { useAuth } from "@/src/hooks/useAuth";
import { UserRole } from "@/src/lib/enums";
import { GetAllProperties } from "@/src/lib/request-handlers/propertyMgt";
import type { BlogPropertyCard } from "@/src/lib/request-handlers/blogMgt";

const MAX = 3;

interface PickedProperty {
    id: string;
    name: string;
    place: string;
    /** False when the listing has since been unverified or deleted. */
    live?: boolean;
}

interface ListedProperty {
    id: string | number;
    name?: string;
    city?: string;
    state?: string;
}

export function pickedFromCards(cards: BlogPropertyCard[]): PickedProperty[] {
    return cards.map((c) => ({
        id: c.id,
        name: c.name,
        place: [c.city, c.state].filter(Boolean).join(", "),
        live: c.is_live,
    }));
}

/**
 * Up to three listings to show under the article. Only verified listings are
 * offered: the website hides anything else anyway. Leave it empty and the
 * website picks listings in a place the article mentions.
 */
export default function PropertyPicker({
    value,
    onChange,
    disabled = false,
}: {
    value: PickedProperty[];
    onChange: (next: PickedProperty[]) => void;
    disabled?: boolean;
}) {
    const { user } = useAuth();
    const [search, setSearch] = useState("");
    const [debounced, setDebounced] = useState("");
    useEffect(() => {
        const t = setTimeout(() => setDebounced(search.trim()), 350);
        return () => clearTimeout(t);
    }, [search]);

    const full = value.length >= MAX;
    const { data, isFetching } = GetAllProperties(
        1, 6, debounced, (user?.role as UserRole) ?? UserRole.ADMIN, user?.id, true,
    );
    const results: ListedProperty[] = debounced.length >= 2 ? (data?.data?.data?.items ?? []) : [];
    const chosen = new Set(value.map((p) => p.id));

    return (
        <div className="space-y-2">
            {value.length > 0 && (
                <ul className="space-y-1.5">
                    {value.map((p, i) => (
                        <li key={p.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50">
                            <span className="text-xs text-gray-400 tabular-nums">{i + 1}</span>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                                <p className="text-xs text-gray-500 truncate">
                                    {p.place}
                                    {p.live === false && (
                                        <span className="text-amber-700"> · not verified, hidden on the website</span>
                                    )}
                                </p>
                            </div>
                            {!disabled && (
                                <button
                                    type="button"
                                    aria-label={`Remove ${p.name}`}
                                    onClick={() => onChange(value.filter((x) => x.id !== p.id))}
                                    className="p-1 rounded hover:bg-gray-200 text-gray-500"
                                >
                                    <Icon icon="lucide:x" width={14} />
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            {!disabled && !full && (
                <div className="relative">
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search verified listings by name or area"
                        aria-label="Search listings to add"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    {debounced.length >= 2 && (
                        <div className="mt-1 rounded-lg border border-gray-200 bg-white shadow-sm divide-y divide-gray-100 max-h-64 overflow-auto">
                            {isFetching && results.length === 0 ? (
                                <p className="px-3 py-2 text-sm text-gray-400">Searching...</p>
                            ) : results.length === 0 ? (
                                <p className="px-3 py-2 text-sm text-gray-400">No verified listings match.</p>
                            ) : (
                                results.map((r) => {
                                    const id = String(r.id);
                                    return (
                                        <button
                                            key={id}
                                            type="button"
                                            disabled={chosen.has(id)}
                                            onClick={() => {
                                                onChange([
                                                    ...value,
                                                    {
                                                        id,
                                                        name: r.name ?? "Listing",
                                                        place: [r.city, r.state].filter(Boolean).join(", "),
                                                        live: true,
                                                    },
                                                ]);
                                                setSearch("");
                                            }}
                                            className="w-full text-left px-3 py-2 hover:bg-gray-50 disabled:opacity-40"
                                        >
                                            <p className="text-sm text-gray-900">{r.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {[r.city, r.state].filter(Boolean).join(", ")}
                                                {chosen.has(id) ? " · already added" : ""}
                                            </p>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
            )}
            <p className="text-xs text-gray-500">
                {full
                    ? "Three listings added, the most an article shows."
                    : "Optional. If you add none, the website shows up to three listings in a place the article mentions, or a \"Browse stays\" button."}
            </p>
        </div>
    );
}

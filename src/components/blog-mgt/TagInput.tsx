"use client";

import { useState, type KeyboardEvent } from "react";
import { Icon } from "@iconify/react";

const MAX_TAGS = 15;

/** Type a tag and press Enter or comma. Backspace on an empty box removes the last. */
export default function TagInput({
    value,
    onChange,
    disabled = false,
}: {
    value: string[];
    onChange: (tags: string[]) => void;
    disabled?: boolean;
}) {
    const [draft, setDraft] = useState("");

    const add = (raw: string) => {
        const name = raw.replace(/,/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
        setDraft("");
        if (!name || value.length >= MAX_TAGS) return;
        if (value.some((t) => t.toLowerCase() === name.toLowerCase())) return;
        onChange([...value, name]);
    };

    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add(draft);
        } else if (e.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
        }
    };

    return (
        <div
            className={`flex flex-wrap items-center gap-1.5 px-2 py-1.5 border border-gray-300 rounded-lg bg-white min-h-[42px] ${
                disabled ? "opacity-70" : ""
            }`}
        >
            {value.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-md bg-gray-100 text-sm text-gray-800">
                    {tag}
                    {!disabled && (
                        <button
                            type="button"
                            aria-label={`Remove ${tag}`}
                            onClick={() => onChange(value.filter((t) => t !== tag))}
                            className="p-0.5 rounded hover:bg-gray-200"
                        >
                            <Icon icon="lucide:x" width={12} />
                        </button>
                    )}
                </span>
            ))}
            {!disabled && value.length < MAX_TAGS && (
                <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={onKeyDown}
                    onBlur={() => draft && add(draft)}
                    placeholder={value.length ? "" : "e.g. Lagos, weekend, travel tips"}
                    aria-label="Add a tag"
                    className="flex-1 min-w-[8rem] px-1 py-1 text-sm outline-none"
                />
            )}
        </div>
    );
}

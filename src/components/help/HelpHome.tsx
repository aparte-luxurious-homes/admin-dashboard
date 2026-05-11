"use client";

import { useState } from "react";
import { SearchInput } from "./SearchInput";
import { ArticleCard } from "./ArticleCard";
import { searchGuides } from "@/lib/help/search";
import { allGuides } from "@/lib/help/data";
import type { Audience, Guide } from "@/lib/help/types";
import { trackHelpEvent } from "@/lib/help/analytics";

const AUDIENCES: Audience[] = ["owner", "agent", "guest"];

interface HelpHomeProps {
  /** When provided, cards open inside the drawer (drawer mode). */
  onSelect?: (guide: Guide) => void;
  /** Auto-focus the search input on mount (used inside drawer). */
  autoFocusSearch?: boolean;
}

export function HelpHome({ onSelect, autoFocusSearch }: HelpHomeProps) {
  const [query, setQuery] = useState("");
  const [audience, setAudience] = useState<Audience>("owner");

  const results = query ? searchGuides(query) : [];
  const visibleGuides = query
    ? results.map((r) => r.guide)
    : allGuides.filter((g) => g.audience === audience);

  return (
    <div>
      <SearchInput
        value={query}
        onChange={(v) => {
          setQuery(v);
          if (v) {
            trackHelpEvent("help_searched", {
              query: v,
              results_count: searchGuides(v).length,
            });
          }
        }}
        autoFocus={autoFocusSearch}
      />

      {!query && (
        <div className="flex gap-2 mt-4" role="tablist" aria-label="Help by audience">
          {AUDIENCES.map((a) => (
            <button
              key={a}
              role="tab"
              aria-selected={audience === a}
              onClick={() => setAudience(a)}
              className={`px-3 py-1.5 rounded-full text-sm font-semibold transition ${
                audience === a
                  ? "bg-teal text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {a[0].toUpperCase() + a.slice(1)}s
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 space-y-2">
        {visibleGuides.map((guide) => (
          <ArticleCard key={guide.id} guide={guide} onClick={onSelect} />
        ))}
        {query && results.length === 0 && (
          <p className="text-gray-500 text-sm py-8 text-center">
            No matches. Try a different search, or email support@aparte.ng.
          </p>
        )}
      </div>
    </div>
  );
}

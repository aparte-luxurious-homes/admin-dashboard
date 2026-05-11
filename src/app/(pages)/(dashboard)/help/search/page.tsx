"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchInput } from "@/components/help/SearchInput";
import { ArticleCard } from "@/components/help/ArticleCard";
import { searchGuides } from "@/lib/help/search";
import { trackHelpEvent } from "@/lib/help/analytics";

export default function HelpSearchPage() {
  const params = useSearchParams();
  const router = useRouter();
  const initial = params?.get("q") ?? "";
  const [query, setQuery] = useState(initial);

  const results = query ? searchGuides(query) : [];

  useEffect(() => {
    const next = new URLSearchParams(params?.toString() ?? "");
    if (query) {
      next.set("q", query);
      trackHelpEvent("help_searched", {
        query,
        results_count: results.length,
        surface: "page",
      });
    } else {
      next.delete("q");
    }
    const qs = next.toString();
    router.replace(qs ? `/help/search?${qs}` : "/help/search");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <header className="mb-6">
        <h1 className="font-serif text-2xl md:text-3xl font-semibold text-ink mb-3">
          Search the help center
        </h1>
        <SearchInput value={query} onChange={setQuery} />
      </header>
      <div className="space-y-3">
        {query && results.length === 0 && (
          <p className="text-gray-500 text-sm py-8 text-center">
            No matches for &quot;{query}&quot;. Try different keywords or{" "}
            <a
              href="mailto:support@aparte.ng"
              className="text-primary font-semibold hover:underline"
            >
              contact support
            </a>
            .
          </p>
        )}
        {results.map((hit) => (
          <ArticleCard key={hit.guide.id} guide={hit.guide} />
        ))}
      </div>
    </div>
  );
}

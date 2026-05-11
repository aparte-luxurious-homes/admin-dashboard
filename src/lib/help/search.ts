import Fuse from "fuse.js";
import { allGuides } from "./data";
import type { Guide } from "./types";

const fuse = new Fuse(allGuides, {
  keys: [
    { name: "title", weight: 3 },
    { name: "summary", weight: 2 },
    { name: "long_form.intro", weight: 1 },
    { name: "long_form.sections.heading", weight: 1.5 },
  ],
  threshold: 0.35, // 0 = exact match, 1 = anything; 0.35 forgiving but relevant
  includeMatches: true,
  minMatchCharLength: 2,
});

export interface SearchHit {
  guide: Guide;
  matchedFields: string[];
}

export function searchGuides(query: string): SearchHit[] {
  if (!query.trim()) return [];
  const results = fuse.search(query, { limit: 10 });
  return results.map((r) => ({
    guide: r.item,
    matchedFields: (r.matches ?? [])
      .map((m) => m.key ?? "")
      .filter(Boolean),
  }));
}

"use client";

import type { Guide } from "@/lib/help/types";
import { getGuide } from "@/lib/help/data";
import { ArticleCard } from "./ArticleCard";

interface RelatedGuidesProps {
  ids: string[];
  /** When provided, related cards open inside the drawer (used in drawer mode). */
  onSelect?: (guide: Guide) => void;
}

export function RelatedGuides({ ids, onSelect }: RelatedGuidesProps) {
  const guides = ids
    .map((id) => getGuide(id))
    .filter((g): g is Guide => Boolean(g))
    .slice(0, 3);

  if (guides.length === 0) return null;

  return (
    <section className="mt-8 border-t border-gray-100 pt-6">
      <h3 className="font-serif text-base font-semibold text-ink mb-3">
        Related guides
      </h3>
      <div className="space-y-2">
        {guides.map((guide) => (
          <ArticleCard key={guide.id} guide={guide} onClick={onSelect} />
        ))}
      </div>
    </section>
  );
}

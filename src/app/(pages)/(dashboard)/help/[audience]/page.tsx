"use client";

import { notFound, useParams } from "next/navigation";
import { ArticleCard } from "@/components/help/ArticleCard";
import { guidesForAudience } from "@/lib/help/data";
import type { Audience } from "@/lib/help/types";

const AUDIENCE_LABELS: Record<Audience, string> = {
  owner: "Property owners",
  agent: "Agents",
  guest: "Guests",
};

const PLURAL_TO_AUDIENCE: Record<string, Audience> = {
  owners: "owner",
  agents: "agent",
  guests: "guest",
};

export default function HelpCategoryPage() {
  const { audience: param } = useParams<{ audience: string }>();
  const audience = param ? PLURAL_TO_AUDIENCE[param] : undefined;

  if (!audience) notFound();

  const guides = guidesForAudience(audience);
  const label = AUDIENCE_LABELS[audience];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">
          Help Center
        </p>
        <h1 className="font-serif text-2xl md:text-3xl font-semibold text-ink leading-tight">
          {label}
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          {guides.length} {guides.length === 1 ? "guide" : "guides"} for{" "}
          {label.toLowerCase()}.
        </p>
      </header>
      <div className="space-y-3">
        {guides.map((guide) => (
          <ArticleCard key={guide.id} guide={guide} />
        ))}
      </div>
    </div>
  );
}

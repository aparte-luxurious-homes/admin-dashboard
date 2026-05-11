"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ArticleView } from "@/components/help/ArticleView";
import { getGuideBySlug } from "@/lib/help/data";
import type { Audience } from "@/lib/help/types";

const PLURAL_TO_AUDIENCE: Record<string, Audience> = {
  owners: "owner",
  agents: "agent",
  guests: "guest",
};

export default function HelpArticlePage() {
  const { audience: param, slug } = useParams<{ audience: string; slug: string }>();
  const audience = param ? PLURAL_TO_AUDIENCE[param] : undefined;

  if (!audience || !slug) notFound();

  const guide = getGuideBySlug(audience, slug);
  if (!guide) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
      <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
        <Link href="/help" className="hover:text-primary">Help Center</Link>{" "}
        <span aria-hidden>›</span>{" "}
        <Link href={`/help/${param}`} className="hover:text-primary">
          {audience[0].toUpperCase() + audience.slice(1)}s
        </Link>
      </nav>
      <ArticleView guide={guide} surface="page" />
    </div>
  );
}

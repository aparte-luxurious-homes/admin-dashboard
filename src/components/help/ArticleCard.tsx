"use client";

import type { Guide } from "@/lib/help/types";
import { urlOf } from "@/lib/help/data";
import { HelpLink } from "./Link";

interface ArticleCardProps {
  guide: Guide;
  /**
   * If provided, the card acts as a button (used inside the drawer to swap
   * to article view). If omitted, the card is a router link to urlOf(guide)
   * (used on the public help pages).
   */
  onClick?: (guide: Guide) => void;
}

export function ArticleCard({ guide, onClick }: ArticleCardProps) {
  const body = (
    <>
      <h3 className="font-serif text-base font-semibold text-ink leading-snug">
        {guide.title}
      </h3>
      <p className="mt-1 text-sm text-gray-700 leading-relaxed line-clamp-2">
        {guide.summary}
      </p>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-soft text-teal">
          {guide.audience}
        </span>
        <span className="text-xs text-gray-500">{guide.estimated_time}</span>
      </div>
    </>
  );

  const cardClasses =
    "w-full text-left rounded-xl border border-gray-200 bg-white p-4 hover:border-teal hover:shadow-sm transition focus:outline-none focus:ring-2 focus:ring-teal/40";

  if (onClick) {
    return (
      <button type="button" onClick={() => onClick(guide)} className={cardClasses}>
        {body}
      </button>
    );
  }

  return (
    <HelpLink to={urlOf(guide)} className={`block ${cardClasses}`}>
      {body}
    </HelpLink>
  );
}

"use client";

import type { Faq, Guide } from "@/lib/help/types";
import { getGuide, urlOf } from "@/lib/help/data";
import { HelpLink } from "./Link";
import { trackHelpEvent } from "@/lib/help/analytics";

interface FaqAccordionProps {
  faqs: Faq[];
  defaultOpen?: string[];
  /**
   * When provided, the "Read full guide" CTA opens the guide in the drawer
   * via onRelatedGuide(guide). Otherwise the CTA navigates to the public
   * article URL.
   */
  onRelatedGuide?: (guide: Guide) => void;
}

export function FaqAccordion({ faqs, defaultOpen, onRelatedGuide }: FaqAccordionProps) {
  if (faqs.length === 0) {
    return (
      <p className="text-gray-500 text-sm py-6 text-center">
        No questions match that filter.
      </p>
    );
  }

  return (
    <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
      {faqs.map((faq) => {
        const related = faq.related_guide_id ? getGuide(faq.related_guide_id) : null;
        return (
          <details
            key={faq.id}
            open={defaultOpen?.includes(faq.id)}
            className="group px-5 py-4"
            onToggle={(e) => {
              if ((e.currentTarget as HTMLDetailsElement).open) {
                trackHelpEvent("help_article_viewed", {
                  article_id: faq.id,
                  surface: "faq",
                });
              }
            }}
          >
            <summary className="flex cursor-pointer list-none items-start justify-between gap-4 outline-none focus-visible:ring-2 focus-visible:ring-teal/40 rounded">
              <span className="font-semibold text-ink text-[15px] leading-snug">
                {faq.question}
              </span>
              <span
                aria-hidden
                className="mt-0.5 shrink-0 text-gray-400 transition-transform group-open:rotate-180"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </span>
            </summary>
            <div className="mt-3 text-sm text-gray-700 leading-relaxed">
              {faq.answer}
              {related && (
                <div className="mt-3">
                  {onRelatedGuide ? (
                    <button
                      type="button"
                      onClick={() => onRelatedGuide(related)}
                      className="text-sm font-semibold text-teal hover:underline"
                    >
                      Read the full guide →
                    </button>
                  ) : (
                    <HelpLink to={urlOf(related)} className="text-sm font-semibold text-teal hover:underline">
                      Read the full guide →
                    </HelpLink>
                  )}
                </div>
              )}
            </div>
          </details>
        );
      })}
    </div>
  );
}

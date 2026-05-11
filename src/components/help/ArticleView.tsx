"use client";

import { useEffect } from "react";
import type { Guide } from "@/lib/help/types";
import { trackHelpEvent } from "@/lib/help/analytics";
import { HelpfulWidget } from "./HelpfulWidget";
import { RelatedGuides } from "./RelatedGuides";
import { VideoEmbed } from "./VideoEmbed";

interface ArticleViewProps {
  guide: Guide;
  /** Surface label for analytics: "drawer" | "page". Defaults to "page". */
  surface?: "drawer" | "page";
  /** When set, related cards open inside the drawer instead of navigating. */
  onRelatedSelect?: (guide: Guide) => void;
}

export function ArticleView({ guide, surface = "page", onRelatedSelect }: ArticleViewProps) {
  useEffect(() => {
    trackHelpEvent("help_article_viewed", { article_id: guide.id, surface });
  }, [guide.id, surface]);

  const { long_form } = guide;

  return (
    <article className="text-gray-800">
      {/* Meta */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-soft text-teal">
          {guide.audience}
        </span>
        <span className="text-xs text-gray-500">{guide.estimated_time}</span>
      </div>

      {surface === "page" && (
        <h1 className="font-serif text-2xl font-semibold text-ink mb-3 leading-tight">
          {guide.title}
        </h1>
      )}

      {/* Walkthrough video */}
      {guide.video_url && <VideoEmbed url={guide.video_url} title={guide.title} />}

      {/* Intro */}
      <p className="text-gray-700 leading-relaxed mb-5">{long_form.intro}</p>

      {/* Prerequisites */}
      {long_form.prerequisites && long_form.prerequisites.length > 0 && (
        <aside className="bg-teal-soft border border-teal/20 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-bold text-ink mb-2">Before you start</h3>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            {long_form.prerequisites.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </aside>
      )}

      {/* Sections */}
      {long_form.sections.map((section, i) => (
        <section key={i} className="mb-6">
          <h2 className="font-serif text-base font-semibold text-teal mb-2">
            {section.heading}
          </h2>
          {section.body && (
            <p className="text-sm text-gray-700 leading-relaxed mb-2">{section.body}</p>
          )}
          {section.substeps && section.substeps.length > 0 && (
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-2">
              {section.substeps.map((step, j) => (
                <li key={j}>{step}</li>
              ))}
            </ul>
          )}
          {section.images && section.images.length > 0 && (
            <div className="mt-4 space-y-4">
              {section.images.map((img, j) => (
                <figure key={j}>
                  <img
                    src={img.url}
                    alt={img.alt}
                    loading="lazy"
                    className="w-full h-auto rounded-lg border border-gray-200"
                  />
                  {img.caption && (
                    <figcaption className="mt-2 text-xs text-gray-500 italic">
                      {img.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          )}
        </section>
      ))}

      {/* Tips */}
      {long_form.tips && long_form.tips.length > 0 && (
        <aside className="bg-[#fff8e6] border border-[#f0e0a8] rounded-lg p-4 mb-6">
          <h3 className="text-sm font-bold text-ink mb-2">Tips</h3>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            {long_form.tips.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </aside>
      )}

      {/* Next steps */}
      {long_form.next_steps && (
        <p className="text-sm text-gray-700 italic mb-6">{long_form.next_steps}</p>
      )}

      <HelpfulWidget articleId={guide.id} />

      {long_form.related && long_form.related.length > 0 && (
        <RelatedGuides ids={long_form.related} onSelect={onRelatedSelect} />
      )}
    </article>
  );
}

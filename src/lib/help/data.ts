import guidesJson from "@/content/guides.json";
import faqsJson from "@/content/faqs.json";
import type {
  Audience,
  Faq,
  FaqAudience,
  FaqsManifest,
  Guide,
  GuidesManifest,
} from "./types";

const guidesManifest = guidesJson as GuidesManifest;
const faqsManifest = faqsJson as FaqsManifest;

export const allGuides: Guide[] = guidesManifest.guides;
export const allFaqs: Faq[] = faqsManifest.faqs;

export function getGuide(id: string): Guide | undefined {
  return allGuides.find((g) => g.id === id);
}

export function getGuideBySlug(audience: Audience, slug: string): Guide | undefined {
  // The "slug" is the guide id with the `<audience>-<NN>-` prefix dropped.
  // owner-01-list-property -> list-property
  return allGuides.find(
    (g) =>
      g.audience === audience &&
      g.id.replace(/^[a-z]+-\d+-/, "") === slug,
  );
}

export function guidesForAudience(audience: Audience): Guide[] {
  return allGuides.filter((g) => g.audience === audience);
}

export function slugOf(guide: Guide): string {
  return guide.id.replace(/^[a-z]+-\d+-/, "");
}

export function urlOf(guide: Guide): string {
  return `/help/${guide.audience}s/${slugOf(guide)}`;
}

export function getFaq(id: string): Faq | undefined {
  return allFaqs.find((f) => f.id === id);
}

export function faqsForAudience(audience: FaqAudience): Faq[] {
  if (audience === "all") return allFaqs;
  return allFaqs.filter((f) => f.audience === audience || f.audience === "all");
}

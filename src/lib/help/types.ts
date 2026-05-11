// Mirrors the schema of guides.json + faqs.json.
// Keep in sync if either schema evolves.

export type Audience = "owner" | "agent" | "guest";

export type Category =
  | "listing"
  | "calendar"
  | "payouts"
  | "bookings"
  | "earnings"
  | "booking";

export interface ShortForm {
  intro: string;
  steps: string[];
  tip?: string;
  warning?: string;
}

export interface ImageRef {
  url: string;
  alt: string;
  caption?: string;
}

export interface LongFormSection {
  heading: string;
  body?: string;
  substeps?: string[];
  /** Screenshots/illustrations for this section. Rendered after body + substeps. */
  images?: ImageRef[];
}

export interface LongForm {
  intro: string;
  prerequisites?: string[];
  sections: LongFormSection[];
  tips?: string[];
  next_steps?: string;
  related?: string[];
}

export interface Guide {
  id: string;
  audience: Audience;
  category: Category;
  title: string;
  summary: string;
  estimated_time: string;
  /**
   * Optional short walkthrough video shown above the intro. The provider is
   * inferred from the URL: loom.com → Loom iframe, youtube.com|youtu.be →
   * YouTube iframe, anything else → HTML5 <video>.
   */
  video_url?: string;
  short_form: ShortForm;
  long_form: LongForm;
}

export interface GuidesManifest {
  version: string;
  generated_at: string;
  platform: string;
  guide_count: number;
  guides: Guide[];
}

export type FaqAudience = Audience | "all";

export interface Faq {
  id: string;
  audience: FaqAudience;
  question: string;
  answer: string;
  related_guide_id?: string;
}

export interface FaqsManifest {
  version: string;
  generated_at: string;
  faqs: Faq[];
}

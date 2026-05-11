// Lightweight analytics stub. Swap `console.log` for the real SDK
// (PostHog / Mixpanel / Segment) when one is chosen.

type EventName =
  | "help_opened"
  | "help_searched"
  | "help_article_viewed"
  | "help_helpful_voted"
  | "help_contact_clicked"
  | "help_dismissed";

interface EventProps {
  [key: string]: string | number | boolean | undefined;
}

export function trackHelpEvent(name: EventName, props: EventProps = {}): void {
  if (typeof window === "undefined") return;
  console.log(`[help-analytics] ${name}`, props);
  // window.posthog?.capture(name, props);
}

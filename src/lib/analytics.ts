// Shared analytics config + helpers for the admin dashboard.
//
// GA4 is loaded via @next/third-parties' <GoogleAnalytics>; Microsoft Clarity
// via a local <Clarity> script component. Everything is gated on THREE things:
//   1. the relevant ID env var is present, AND
//   2. NEXT_PUBLIC_NODE_ENV === "production" (excludes dev + staging), AND
//   3. the visitor has granted consent (see <AnalyticsProvider>).
// No analytics script loads until all three hold, so no cookies are set before
// the visitor accepts.

import { sendGAEvent } from "@next/third-parties/google";

export const GA_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
export const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

const IS_PROD = process.env.NEXT_PUBLIC_NODE_ENV === "production";

/** GA *could* run in this environment (id present + production). */
export const GA_CONFIGURED = Boolean(GA_ID) && IS_PROD;
/** Clarity *could* run in this environment (id present + production). */
export const CLARITY_CONFIGURED = Boolean(CLARITY_ID) && IS_PROD;
/** Either analytics is configured — controls whether the consent banner shows. */
export const ANALYTICS_CONFIGURED = GA_CONFIGURED || CLARITY_CONFIGURED;

// --- Consent (localStorage) -------------------------------------------------

export type ConsentValue = "granted" | "denied";

const CONSENT_KEY = "aparte_analytics_consent";

export function getConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(value: ConsentValue): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONSENT_KEY, value);
  } catch {
    /* ignore — private mode / storage disabled */
  }
}

/**
 * Reset the stored choice so the consent banner is shown again. Callers should
 * reload the page afterwards: on reload <AnalyticsProvider> re-reads consent as
 * undecided, so already-loaded analytics scripts stop running (consent
 * withdrawal) and the banner re-appears for a fresh choice.
 */
export function clearConsent(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CONSENT_KEY);
  } catch {
    /* ignore — private mode / storage disabled */
  }
}

export function isConsentGranted(): boolean {
  return getConsent() === "granted";
}

// --- Event helpers ----------------------------------------------------------

/** Emit a custom GA4 event. The reusable helper for product instrumentation. */
export function trackEvent(
  name: string,
  params: Record<string, unknown> = {}
): void {
  if (!GA_CONFIGURED || !isConsentGranted()) return;
  sendGAEvent("event", name, params);
}

/** Tag the current Clarity session with a custom event name. */
export function clarityEvent(name: string): void {
  if (!CLARITY_CONFIGURED || !isConsentGranted()) return;
  if (typeof window === "undefined") return;
  window.clarity?.("event", name);
}

/** Set a custom Clarity tag (key/value) on the current session. */
export function claritySet(key: string, value: string): void {
  if (!CLARITY_CONFIGURED || !isConsentGranted()) return;
  if (typeof window === "undefined") return;
  window.clarity?.("set", key, value);
}

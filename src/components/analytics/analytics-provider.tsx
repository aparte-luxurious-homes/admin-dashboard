"use client";

import { Suspense, useEffect, useState } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import {
  GA_ID,
  GA_CONFIGURED,
  CLARITY_CONFIGURED,
  ANALYTICS_CONFIGURED,
  getConsent,
  setConsent,
  type ConsentValue,
} from "@/lib/analytics";
import Clarity from "./clarity";
import PageViewTracker from "./page-view-tracker";
import ConsentBanner from "./consent-banner";

/**
 * Single mount point for third-party analytics (GA4 + Microsoft Clarity).
 *
 * Gated on production env + configured IDs + visitor consent. Rendered once from
 * the root layout. No analytics script loads until the visitor accepts:
 *   - not configured (dev/preview/no ID) → render nothing
 *   - configured + undecided            → show the consent banner
 *   - configured + declined             → render nothing
 *   - configured + granted              → mount GA4 + Clarity + page-view tracker
 */
export default function AnalyticsProvider() {
  // `undefined` = not yet read from localStorage (avoids a hydration mismatch
  // between the server render and the client's stored choice).
  const [consent, setConsentState] = useState<ConsentValue | null | undefined>(
    undefined
  );

  useEffect(() => {
    setConsentState(getConsent());
  }, []);

  if (!ANALYTICS_CONFIGURED) return null;
  if (consent === undefined) return null;

  const accept = () => {
    setConsent("granted");
    setConsentState("granted");
  };
  const decline = () => {
    setConsent("denied");
    setConsentState("denied");
  };

  if (consent === null) {
    return <ConsentBanner onAccept={accept} onDecline={decline} />;
  }

  if (consent === "denied") return null;

  // consent === "granted"
  return (
    <>
      {GA_CONFIGURED && GA_ID && <GoogleAnalytics gaId={GA_ID} />}
      {CLARITY_CONFIGURED && <Clarity />}
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
  );
}

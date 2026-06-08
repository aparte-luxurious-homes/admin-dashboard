"use client";

import Script from "next/script";
import { CLARITY_CONFIGURED, CLARITY_ID } from "@/lib/analytics";

/**
 * Microsoft Clarity loader for the admin dashboard.
 *
 * ⚠️ PII: this dashboard renders customer KYC, NIN/BVN, wallet balances and
 * financial transactions. Clarity MUST be configured in the Clarity project
 * dashboard with masking mode = "Mask" (mask all text + inputs) — that control
 * lives server-side on the recording and cannot be fully set from code. As
 * defense in depth, sensitive regions in the app are also annotated with
 * `data-clarity-mask`. Do not loosen either control.
 *
 * Consent + production gating is handled by <AnalyticsProvider>; this component
 * only renders once mounting is approved.
 */
export default function Clarity() {
  if (!CLARITY_CONFIGURED || !CLARITY_ID) return null;

  return (
    <Script id="ms-clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window,document,"clarity","script","${CLARITY_ID}");`}
    </Script>
  );
}

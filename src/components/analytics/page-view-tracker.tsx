"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { sendGAEvent } from "@next/third-parties/google";

/**
 * Emits a GA4 page_view on client-side route changes.
 *
 * <GoogleAnalytics> fires the INITIAL page_view itself (via its config call), so
 * this tracker skips its first effect run and only emits on SUBSEQUENT SPA
 * navigations — otherwise the first page would be counted twice.
 *
 * Must be rendered inside <Suspense> because useSearchParams() opts the subtree
 * into client rendering.
 */
export default function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    if (!pathname || typeof window === "undefined") return;

    const query = searchParams?.toString();
    const path = query ? `${pathname}?${query}` : pathname;
    sendGAEvent("event", "page_view", {
      page_path: path,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  return null;
}

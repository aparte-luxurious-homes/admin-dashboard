"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useHelpStore } from "@/lib/help/store";
import { trackHelpEvent } from "@/lib/help/analytics";

export function DeepLinkBridge() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const open = useHelpStore((s) => s.open);

  useEffect(() => {
    const guideId = params?.get("help");
    if (!guideId) return;
    open(guideId);
    trackHelpEvent("help_opened", {
      surface: "drawer",
      source: "deep-link",
      article_id: guideId,
    });

    // Strip the `help` param from the URL.
    if (!params || !pathname) return;
    const next = new URLSearchParams(params.toString());
    next.delete("help");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [params, pathname, open, router]);

  return null;
}

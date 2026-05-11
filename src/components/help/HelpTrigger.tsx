"use client";

import { usePathname } from "next/navigation";
import { useHelpStore } from "@/lib/help/store";
import { trackHelpEvent } from "@/lib/help/analytics";
import { useAuth } from "@/src/hooks/useAuth";

export function HelpTrigger() {
  const pathname = usePathname();
  const { user } = useAuth();
  const open = useHelpStore((s) => s.open);
  const isOpen = useHelpStore((s) => s.isOpen);

  // Authenticated only. Hide while drawer is open or while on /help/*.
  if (!user) return null;
  if (isOpen) return null;
  if (pathname?.startsWith("/help")) return null;

  return (
    <button
      type="button"
      onClick={() => {
        open();
        trackHelpEvent("help_opened", { surface: "drawer", source: "fab" });
      }}
      aria-label="Open help"
      className="fixed bottom-20 right-4 md:bottom-4 z-50 h-14 w-14 rounded-full bg-teal text-white text-2xl font-bold shadow-lg hover:bg-teal/90 focus:outline-none focus:ring-4 focus:ring-teal/40 transition"
    >
      ?
    </button>
  );
}

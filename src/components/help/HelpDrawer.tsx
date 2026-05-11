"use client";

import { Drawer } from "vaul";
import { useEffect } from "react";
import { useHelpStore } from "@/lib/help/store";
import { trackHelpEvent } from "@/lib/help/analytics";
import { getGuide } from "@/lib/help/data";
import type { Guide } from "@/lib/help/types";
import { ArticleView } from "./ArticleView";
import { HelpHome } from "./HelpHome";

export function HelpDrawer() {
  const { isOpen, activeGuideId, open, close, setActive } = useHelpStore();

  // Keyboard shortcut: "?" toggles the drawer (when not focused in an input).
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key !== "?" || isOpen) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        (target?.isContentEditable ?? false)
      ) {
        return;
      }
      e.preventDefault();
      open();
      trackHelpEvent("help_opened", { surface: "drawer", source: "keyboard" });
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, open]);

  const activeGuide: Guide | undefined = activeGuideId ? getGuide(activeGuideId) : undefined;

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(o) => {
        if (!o) {
          trackHelpEvent("help_dismissed", { surface: "drawer", method: "user" });
          close();
        }
      }}
      snapPoints={[0.4, 0.75, 0.95]}
      shouldScaleBackground
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-[60]" />
        <Drawer.Content
          aria-label="Help"
          className="fixed bottom-0 left-0 right-0 z-[60] flex flex-col bg-white rounded-t-2xl max-h-[95vh] outline-none"
        >
          {/* Drag handle */}
          <div
            className="mx-auto mt-2 mb-3 h-1.5 w-12 rounded-full bg-gray-300"
            aria-hidden
          />

          {/* Header */}
          <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              {activeGuide && (
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  className="text-gray-500 hover:text-ink p-1 -m-1"
                  aria-label="Back to help home"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
              )}
              <Drawer.Title className="font-serif text-lg font-semibold text-ink">
                {activeGuide ? activeGuide.title : "Help"}
              </Drawer.Title>
            </div>
            <button
              type="button"
              onClick={close}
              className="text-gray-500 hover:text-ink text-2xl leading-none p-2 -m-2"
              aria-label="Close help"
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {activeGuide ? (
              <ArticleView
                guide={activeGuide}
                surface="drawer"
                onRelatedSelect={(g) => setActive(g.id)}
              />
            ) : (
              <HelpHome
                onSelect={(g) => setActive(g.id)}
                autoFocusSearch
              />
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

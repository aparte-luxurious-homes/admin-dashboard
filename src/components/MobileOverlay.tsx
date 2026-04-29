'use client'

import { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";

export default function MobileOverlay() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show once per session
    if (sessionStorage.getItem("mobileBannerDismissed")) return;
    setIsVisible(true);
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem("mobileBannerDismissed", "1");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] md:hidden animate-fadeIn">
      <div className="bg-primary text-white px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Mobile experience is here!</p>
          <p className="text-xs text-white/70 mt-0.5">
            Navigate with the bar below. Some features work best on desktop.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1.5 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Dismiss"
        >
          <IoClose size={18} />
        </button>
      </div>
    </div>
  );
}

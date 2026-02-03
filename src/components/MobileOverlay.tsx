'use client'

import Image from "next/image";
import { useState, useEffect } from "react";

export default function MobileOverlay() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the overlay in the last 24 hours
    const dismissedAt = localStorage.getItem('mobileOverlayDismissed');
    if (dismissedAt) {
      const dismissedTime = new Date(dismissedAt).getTime();
      const now = new Date().getTime();
      const hoursSinceDismissed = (now - dismissedTime) / (1000 * 60 * 60);

      // Show overlay again after 24 hours
      if (hoursSinceDismissed < 24) {
        setIsVisible(false);
        return;
      }
    }

    // Show overlay on mobile devices
    setIsVisible(true);
  }, []);

  const handleDismiss = () => {
    // Store dismissal time in localStorage
    localStorage.setItem('mobileOverlayDismissed', new Date().toISOString());
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] md:hidden bg-gradient-to-br from-black/95 via-primary/90 to-black/95 flex flex-col items-center justify-center px-6 text-center animate-fadeIn">
      {/* Logo with pulse animation */}
      <div className="animate-pulse mb-8">
        <Image
          src="/svg/logo_text_white.svg"
          alt="Aparte Logo"
          height={120}
          width={120}
          priority
        />
      </div>

      {/* Icon */}
      <div className="mb-6 bg-white/10 rounded-full p-4">
        <svg
          className="w-12 h-12 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </div>

      {/* Title */}
      <h2 className="text-white text-2xl font-bold mb-4">
        Best Viewed on Desktop
      </h2>

      {/* Description */}
      <p className="text-white/90 text-base mb-2 max-w-sm leading-relaxed">
        For the optimal experience and full functionality, we recommend using Aparte Dashboard on a laptop or desktop computer.
      </p>

      <p className="text-white/70 text-sm mb-10 max-w-sm">
        You can still use the dashboard on mobile, but some features may be limited.
      </p>

      {/* Action Button */}
      <button
        onClick={handleDismiss}
        className="px-8 py-3 bg-white hover:bg-white/90 text-primary font-semibold rounded-lg 
                   transition-all duration-200 transform hover:scale-105 active:scale-95
                   shadow-lg hover:shadow-xl min-h-[48px] min-w-[200px]"
      >
        Continue on Mobile
      </button>

      {/* Dismiss hint */}
      <p className="text-white/50 text-xs mt-6">
        This message won't show again for 24 hours
      </p>
    </div>
  );
} 
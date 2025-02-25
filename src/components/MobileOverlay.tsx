'use client'

import Image from "next/image";
import { useState } from "react";

export default function MobileOverlay() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] md:hidden bg-black/90 flex flex-col items-center justify-center px-6 text-center">
      <div className="animate-pulse mb-6">
        <Image
          src="/svg/logo_text_white.svg"
          alt="logo"
          height={100}
          width={100}
          priority
        />
      </div>
      
      <h2 className="text-white text-xl font-semibold mb-4">
        Optimized for Desktop
      </h2>
      
      <p className="text-white/80 text-sm mb-8">
        While you can use Aparte Dashboard on mobile, we recommend using a laptop or PC for the best experience and full functionality.
      </p>

      <button
        onClick={() => setIsVisible(false)}
        className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-200"
      >
        Continue on Mobile
      </button>
    </div>
  );
} 
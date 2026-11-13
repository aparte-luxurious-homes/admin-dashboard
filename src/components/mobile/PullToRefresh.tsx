"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useIsMobile } from "@/src/hooks/useIsMobile";

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: React.ReactNode;
}

const THRESHOLD = 60;

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isPulling = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const el = containerRef.current;
    if (!el || isRefreshing) return;
    // Only activate when scrolled to top
    if (el.scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
    isPulling.current = true;
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling.current || isRefreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      // Dampen the pull distance
      setPullDistance(Math.min(delta * 0.4, 80));
    }
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(THRESHOLD * 0.6);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, isRefreshing, onRefresh]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !isMobile) return;

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: true });
    el.addEventListener("touchend", handleTouchEnd);

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isMobile, handleTouchStart, handleTouchMove, handleTouchEnd]);

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-all duration-200"
        style={{ height: pullDistance > 0 ? pullDistance : 0 }}
      >
        <div
          className={`w-6 h-6 border-2 border-primary border-t-transparent rounded-full ${
            isRefreshing ? "animate-spin" : ""
          }`}
          style={{
            opacity: Math.min(pullDistance / THRESHOLD, 1),
            transform: `rotate(${(pullDistance / THRESHOLD) * 360}deg)`,
          }}
        />
      </div>
      {children}
    </div>
  );
}

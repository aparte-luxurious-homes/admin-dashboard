"use client";

import { useState } from "react";
import { useIsMobile } from "@/src/hooks/useIsMobile";
import { Icon } from "@iconify/react";

interface CollapsibleSectionProps {
  title: string;
  icon?: string;
  defaultOpen?: boolean;
  colorClass?: string;
  children: React.ReactNode;
}

export default function CollapsibleSection({
  title,
  icon,
  defaultOpen = false,
  colorClass = "bg-gray-50",
  children,
}: CollapsibleSectionProps) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // On desktop, always render expanded with no toggle
  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-3 ${colorClass} transition-colors`}
      >
        <div className="flex items-center gap-2">
          {icon && <Icon icon={icon} className="text-base text-gray-600" />}
          <span className="text-sm font-semibold text-gray-800">{title}</span>
        </div>
        <Icon
          icon="solar:alt-arrow-down-bold"
          className={`text-base text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`transition-all duration-200 overflow-hidden ${
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

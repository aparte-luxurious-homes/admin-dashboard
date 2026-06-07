"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

function toTitleCase(segment: string): string {
  return segment
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

// Section-only path segments — no `page.tsx` exists at these paths under
// src/app/(pages)/(dashboard)/, so rendering them as <Link> causes Next.js
// to prefetch a non-existent route and 404. Render as plain text instead.
// Sync with the dashboard route tree if a new section is added.
const NON_NAVIGABLE_SEGMENTS = new Set<string>([
  "booking-management",
  "notifications",
  "property-management",
  "transactions",
  "user-management",
]);

export default function AutoBreadcrumb(): React.JSX.Element {
  const pathname = usePathname();
  const segments = (pathname || "/").split("/").filter(Boolean);

  const crumbs = segments.map((seg, idx) => {
    const href = "/" + segments.slice(0, idx + 1).join("/");
    const isLast = idx === segments.length - 1;
    const isNavigable = !NON_NAVIGABLE_SEGMENTS.has(seg);
    const label = toTitleCase(seg);
    return (
      <span key={href} className="inline-flex items-center text-sm">
        {!isLast && isNavigable ? (
          <Link href={href} className="text-zinc-600 hover:text-primary no-underline">
            {label}
          </Link>
        ) : (
          <span className={isLast ? "text-primary font-medium" : "text-zinc-600"}>
            {label}
          </span>
        )}
        {!isLast && <span className="px-2 text-zinc-400">›</span>}
      </span>
    );
  });

  if (segments.length === 0) {
    return (
      <div className="text-sm text-zinc-600">
        <span className="text-primary font-medium">Dashboard</span>
      </div>
    );
  }

  return (
    <nav aria-label="Breadcrumb" className="truncate">
      {crumbs}
    </nav>
  );
}



"use client";

import Link from "next/link";
import { HelpHome } from "@/components/help/HelpHome";

export default function HelpHomePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <header className="mb-6">
        <h1 className="font-serif text-2xl md:text-3xl font-semibold text-ink leading-tight">
          How can we help?
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Browse guides by role, or jump straight to the{" "}
          <Link href="/help/faq" className="text-primary font-semibold hover:underline">
            FAQ
          </Link>
          .
        </p>
      </header>
      <HelpHome />
    </div>
  );
}

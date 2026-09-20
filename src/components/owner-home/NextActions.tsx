"use client";

import Link from "next/link";

import type { OwnerAction } from "@/src/lib/request-handlers/ownerHomeMgt";

/**
 * Everything waiting on the owner that is not urgent (the urgent ones are in
 * the bar above the calendar).
 *
 * With nothing pending this renders one line rather than disappearing: a panel
 * that vanishes teaches owners not to look for it (spec section 9).
 */
export default function NextActions({ items }: { items: OwnerAction[] }) {
    const rest = items.filter((i) => i.severity !== "URGENT");

    return (
        <section className="bg-white border border-gray-200 rounded-xl">
            <header className="px-5 pt-4 pb-3">
                <h2 className="text-[15px] font-semibold text-gray-900">Next</h2>
            </header>

            {rest.length === 0 ? (
                <p className="px-5 pb-6 pt-2 text-center text-sm text-gray-500">
                    Nothing needs you today.
                </p>
            ) : (
                rest.map((item, index) => (
                    <div
                        key={`${item.kind}-${index}`}
                        className="flex flex-wrap items-center gap-3 border-t border-gray-100 px-5 py-3.5"
                    >
                        <div className="min-w-0 flex-1">
                            <b className="block text-sm font-semibold text-gray-900">{item.title}</b>
                            <span className="mt-0.5 block text-[13px] text-gray-600">{item.detail}</span>
                        </div>
                        <Link
                            href={item.cta_href}
                            className={`shrink-0 rounded-lg px-3.5 py-2 text-[13px] font-semibold max-sm:w-full max-sm:text-center ${
                                item.severity === "INFO"
                                    ? "border border-gray-200 text-[#028090] hover:bg-[#028090]/5"
                                    : "bg-[#028090] text-white hover:bg-[#016171]"
                            }`}
                        >
                            {item.cta_label}
                        </Link>
                    </div>
                ))
            )}
        </section>
    );
}

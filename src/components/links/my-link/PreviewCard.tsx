"use client";

import { Icon } from "@iconify/react";

/**
 * What the top of the public page will look like with the values in the
 * form — the same tokens the page uses (teal #028090, the serif display face
 * substituted by the browser's Georgia here), so a host can judge a headline
 * before saving it.
 */
export default function PreviewCard({
    displayName,
    profileImage,
    coverImage,
    isVerified,
    headline,
    showWhatsapp,
    propertyCount,
}: {
    displayName: string;
    profileImage: string | null;
    coverImage: string | null;
    isVerified: boolean;
    headline: string;
    showWhatsapp: boolean;
    propertyCount: number;
}) {
    const initials = displayName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join("");

    return (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-100 text-xs text-gray-500 flex items-center gap-2">
                <Icon icon="lucide:smartphone" width="14" height="14" />
                Preview
            </div>
            <div className="p-3">
                <div className="relative h-24 rounded-xl overflow-hidden bg-[#01515f]">
                    {coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={coverImage} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <div className="h-full w-full bg-gradient-to-br from-[#01515f] via-[#028090] to-[#05a3b5]" />
                    )}
                </div>
                <div className="-mt-8 ml-3 h-16 w-16 rounded-full ring-4 ring-white bg-[#e6f1f3] overflow-hidden flex items-center justify-center">
                    {profileImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={profileImage} alt="" className="h-full w-full object-cover" />
                    ) : (
                        <span className="font-serif text-xl font-semibold text-[#028090]">{initials || "A"}</span>
                    )}
                </div>
                <p className="mt-2 font-serif text-xl font-semibold leading-tight text-[#0d1b1e]">{displayName}</p>
                {isVerified && (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#e6f1f3] px-2 py-0.5 text-[11px] font-semibold text-[#028090]">
                        ✓ Verified host
                    </span>
                )}
                <p className={`mt-2 text-sm leading-snug ${headline ? "text-gray-700" : "text-gray-400 italic"}`}>
                    {headline || "Your headline goes here"}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                    {propertyCount} {propertyCount === 1 ? "place" : "places"} to stay on Aparte
                </p>
                <div className="mt-3 flex gap-2">
                    {showWhatsapp && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white">
                            <Icon icon="ic:baseline-whatsapp" width="14" height="14" /> WhatsApp
                        </span>
                    )}
                    <span className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-[#0d1b1e]">
                        Share this page
                    </span>
                </div>
            </div>
        </div>
    );
}

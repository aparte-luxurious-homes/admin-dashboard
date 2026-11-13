"use client";

import { useRef } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import { getApiErrorMessage } from "@/src/lib/apiError";
import { UploadBlogImage } from "@/src/lib/request-handlers/blogMgt";

export default function FeaturedImageField({
    url,
    alt,
    onUrl,
    onAlt,
    disabled = false,
}: {
    url: string | null;
    alt: string;
    onUrl: (url: string | null) => void;
    onAlt: (alt: string) => void;
    disabled?: boolean;
}) {
    const input = useRef<HTMLInputElement>(null);
    const { mutate: upload, isPending } = UploadBlogImage();

    const pick = (file: File | undefined) => {
        if (!file) return;
        upload(file, {
            onSuccess: (uploaded) => onUrl(uploaded),
            onError: (err) => toast.error(getApiErrorMessage(err, "Could not upload the image")),
            onSettled: () => {
                if (input.current) input.current.value = "";
            },
        });
    };

    return (
        <div className="space-y-2">
            <div className="relative aspect-[16/9] w-full rounded-xl border border-dashed border-gray-300 bg-gray-50 overflow-hidden">
                {url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt={alt} className="w-full h-full object-cover" />
                ) : (
                    <button
                        type="button"
                        disabled={disabled || isPending}
                        onClick={() => input.current?.click()}
                        className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-sm text-gray-500 hover:bg-gray-100"
                    >
                        <Icon icon={isPending ? "line-md:loading-loop" : "lucide:image-up"} width={28} />
                        {isPending ? "Uploading..." : "Upload featured image"}
                        <span className="text-xs text-gray-400">JPG, PNG or WEBP, up to 10 MB. Wide images work best.</span>
                    </button>
                )}
            </div>
            {url && !disabled && (
                <div className="flex gap-2">
                    <button
                        type="button"
                        disabled={isPending}
                        onClick={() => input.current?.click()}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                        {isPending ? "Uploading..." : "Replace"}
                    </button>
                    <button
                        type="button"
                        onClick={() => onUrl(null)}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Remove
                    </button>
                </div>
            )}
            <label className="block">
                <span className="text-xs font-medium text-gray-600">Image description (alt text)</span>
                <input
                    value={alt}
                    disabled={disabled}
                    onChange={(e) => onAlt(e.target.value)}
                    maxLength={300}
                    placeholder="What the picture shows, e.g. Living room of a two-bedroom flat in Lekki"
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
            </label>
            <input
                ref={input}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => pick(e.target.files?.[0])}
            />
        </div>
    );
}

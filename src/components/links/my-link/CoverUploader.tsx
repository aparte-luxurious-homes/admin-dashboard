"use client";

import { useRef } from "react";
import { toast } from "react-hot-toast";
import { Icon } from "@iconify/react";

import { DeleteCatalogCover, UploadCatalogCover } from "@/src/lib/request-handlers/linksMgt";

import { errorMessage, secondaryButton } from "./shared";

const ACCEPT = "image/jpeg,image/png,image/webp";
const MAX_BYTES = 10 * 1024 * 1024;

/**
 * The banner across the top of the public page. Without one the page builds
 * a strip from the host's own listing photos, so this is a personalisation,
 * not a requirement — the helper text says so.
 */
export default function CoverUploader({ coverImage }: { coverImage: string | null }) {
    const input = useRef<HTMLInputElement>(null);
    const upload = UploadCatalogCover();
    const remove = DeleteCatalogCover();
    const busy = upload.isPending || remove.isPending;

    const onFile = (file: File | undefined) => {
        if (!file) return;
        if (!ACCEPT.split(",").includes(file.type)) {
            toast.error("Use a JPG, PNG or WEBP image");
            return;
        }
        if (file.size > MAX_BYTES) {
            toast.error("That image is over 10MB — export a smaller copy");
            return;
        }
        upload.mutate(file, {
            onSuccess: () => toast.success("Cover updated"),
            onError: (err: any) => toast.error(errorMessage(err, "Couldn't upload that image")),
        });
        if (input.current) input.current.value = "";
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cover photo</label>
            <div className="relative aspect-[3/1] w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                {coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coverImage} alt="Your page's cover" className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-gray-400">
                        <Icon icon="lucide:image" width="24" height="24" />
                        <span className="text-xs">A strip of your listing photos shows here until you add one</span>
                    </div>
                )}
                {busy && <div className="absolute inset-0 bg-white/60 animate-pulse" />}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
                <input
                    ref={input}
                    type="file"
                    accept={ACCEPT}
                    className="hidden"
                    onChange={(e) => onFile(e.target.files?.[0])}
                />
                <button type="button" onClick={() => input.current?.click()} disabled={busy} className={secondaryButton}>
                    <Icon icon="lucide:upload" width="15" height="15" />
                    {coverImage ? "Replace cover" : "Add a cover"}
                </button>
                {coverImage && (
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                            remove.mutate(undefined, {
                                onSuccess: () => toast.success("Cover removed"),
                                onError: (err: any) => toast.error(errorMessage(err, "Couldn't remove the cover")),
                            })
                        }
                        className={secondaryButton}
                    >
                        <Icon icon="lucide:trash-2" width="15" height="15" />
                        Remove
                    </button>
                )}
            </div>
            <p className="mt-2 text-xs text-gray-500">
                Wide photos work best — about three times wider than tall. JPG, PNG or WEBP, up to 10MB.
            </p>
        </div>
    );
}

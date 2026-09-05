/**
 * Mobile (esp. iOS Safari) file-input helpers.
 *
 * Clearing `input.value` after a pick can invalidate the original File
 * references on iOS. Always clone before clearing. Prefer JPEG/PNG/WebP in
 * `accept` so iOS converts HEIC to JPEG for the web.
 */

/** Prefer formats the API/Cloudinary accept; nudges iOS off HEIC. */
export const IMAGE_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif";

export const VIDEO_ACCEPT = "video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm";

const EXT_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
};

function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

/** Clone so clearing the input cannot neuter the File on iOS. */
export function cloneFile(file: File): File {
  const type =
    file.type ||
    EXT_MIME[extOf(file.name)] ||
    "application/octet-stream";
  return new File([file], file.name, {
    type,
    lastModified: file.lastModified,
  });
}

export function cloneFilesFromList(
  list: FileList | File[] | null | undefined,
): File[] {
  if (!list) return [];
  return Array.from(list).map(cloneFile);
}

export function isVideoFile(file: File): boolean {
  if (file.type.startsWith("video/")) return true;
  const ext = extOf(file.name);
  return ext === "mp4" || ext === "mov" || ext === "webm";
}

export function isHeicFile(file: File): boolean {
  const t = file.type.toLowerCase();
  if (t === "image/heic" || t === "image/heif") return true;
  const ext = extOf(file.name);
  return ext === "heic" || ext === "heif";
}

/** Axios timeout for multipart media (phone photos are large + slow networks). */
export const MEDIA_UPLOAD_TIMEOUT_MS = 120_000;

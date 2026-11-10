import type { BlogStatus } from "@/src/lib/request-handlers/blogMgt";

export const STATUS_LABEL: Record<BlogStatus, string> = {
    DRAFT: "Draft",
    SCHEDULED: "Scheduled",
    PUBLISHED: "Published",
    UNPUBLISHED: "Unpublished",
};

export const STATUS_STYLE: Record<BlogStatus, string> = {
    DRAFT: "bg-gray-100 text-gray-700",
    SCHEDULED: "bg-sky-50 text-sky-700",
    PUBLISHED: "bg-emerald-50 text-emerald-700",
    UNPUBLISHED: "bg-amber-50 text-amber-700",
};

/** "OPERATIONS_ADMIN" -> "Operations admin" */
export const roleLabel = (role?: string | null) =>
    role ? role.charAt(0) + role.slice(1).toLowerCase().replace(/_/g, " ") : "";

/** Dates are shown in Nigerian time whatever the viewer's computer says. */
export const LAGOS_TZ = "Africa/Lagos";

export function formatDateTime(iso: string | null | undefined): string {
    if (!iso) return "";
    return new Date(iso).toLocaleString("en-NG", {
        timeZone: LAGOS_TZ,
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}

export function formatDate(iso: string | null | undefined): string {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("en-NG", {
        timeZone: LAGOS_TZ,
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

/**
 * Lagos is UTC+1 all year (no daylight saving), so a wall-clock time the
 * writer picks converts to UTC by subtracting one hour, independent of where
 * their computer is.
 */
export function lagosLocalToIso(local: string): string {
    // local: "YYYY-MM-DDTHH:mm" from <input type="datetime-local">
    return new Date(`${local}:00+01:00`).toISOString();
}

export function isoToLagosLocal(iso: string): string {
    const d = new Date(new Date(iso).getTime() + 60 * 60 * 1000);
    return d.toISOString().slice(0, 16);
}

export function slugify(text: string): string {
    return text
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        // Same as the API: "What's new" is whats-new, not what-s-new.
        .replace(/['’‘`]/g, "")
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 120)
        .replace(/-+$/g, "");
}

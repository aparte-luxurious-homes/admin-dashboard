import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import axiosRequest from "../api";
import { API_ROUTES } from "../routes/endpoints";
import type { CatalogAnalytics, CatalogConfig, CatalogShareKit, HostLinkProperty } from "../types";

export type { CatalogShareKit } from "../types";

enum LinksRequestKeys {
    myCatalog = "myCatalog",
    myCatalogAnalytics = "myCatalogAnalytics",
    myLinkProperties = "myLinkProperties",
}

/** The CustomResponse envelope arrives one level deeper under axios. */
export function unwrapKit<T>(data: any): T | undefined {
    return data?.data?.data ?? data?.data;
}

export function GetMyCatalog(enabled: boolean = true) {
    return useQuery({
        queryKey: [LinksRequestKeys.myCatalog],
        queryFn: () => axiosRequest.get(API_ROUTES.links.myCatalog),
        staleTime: 1000 * 60 * 5,
        enabled,
        // A user with no handle yet is a 200 with `handle: null`, not an error —
        // don't retry-storm on the genuine failures either.
        retry: 1,
    });
}

export function UpdateMyCatalog() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: {
            handle?: string;
            is_catalog_published?: boolean;
            /** Partial: only the keys sent change; null clears one. */
            catalog_config?: CatalogConfig;
        }) => axiosRequest.patch(API_ROUTES.links.myCatalog, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [LinksRequestKeys.myCatalog] });
        },
    });
}

/** Multipart upload of the page's banner. The axios instance drops the JSON
 * Content-Type for FormData bodies, so the browser sets the boundary. */
export function UploadCatalogCover() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (file: File) => {
            const form = new FormData();
            form.append("file", file);
            return axiosRequest.post(API_ROUTES.links.myCatalogCover, form, {
                headers: { "Content-Type": "multipart/form-data" },
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [LinksRequestKeys.myCatalog] });
        },
    });
}

export function DeleteCatalogCover() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => axiosRequest.delete(API_ROUTES.links.myCatalogCover),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [LinksRequestKeys.myCatalog] });
        },
    });
}

export function GetMyCatalogAnalytics(window: string = "30d", enabled: boolean = true) {
    return useQuery<CatalogAnalytics | undefined>({
        queryKey: [LinksRequestKeys.myCatalogAnalytics, window],
        queryFn: async () =>
            unwrapKit<CatalogAnalytics>(
                await axiosRequest.get(API_ROUTES.links.myCatalogAnalytics(window))
            ),
        staleTime: 1000 * 60 * 5,
        enabled,
    });
}

export function GetMyLinkProperties(enabled: boolean = true) {
    return useQuery<HostLinkProperty[]>({
        queryKey: [LinksRequestKeys.myLinkProperties],
        queryFn: async () =>
            unwrapKit<HostLinkProperty[]>(await axiosRequest.get(API_ROUTES.links.myProperties)) ??
            [],
        staleTime: 1000 * 60,
        enabled,
    });
}

/**
 * Fetch the catalog QR as a blob and hand it to the browser as a download.
 *
 * Not a plain <a href> to the endpoint: the QR route requires the JWT, which
 * lives in a cookie the browser would send only on a same-site request — and
 * the API is on a different origin. Going through the axios instance reuses
 * the Authorization header every other call gets.
 */
export async function downloadCatalogQr(userId: string, handle: string, size = 1024) {
    const response = await axiosRequest.get(API_ROUTES.links.catalogQr(userId, size), {
        responseType: "blob",
    });
    const url = URL.createObjectURL(response.data as Blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `aparte-${handle}-qr.png`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    // Revoke on the next tick — revoking synchronously can cancel the download
    // in some browsers before it has read the blob.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * The same QR as an on-screen preview: an object URL that is revoked when
 * the component unmounts or the handle changes.
 */
export function useCatalogQrPreview(userId?: string, handle?: string | null, size = 320) {
    const [src, setSrc] = useState<string | null>(null);

    useEffect(() => {
        if (!userId || !handle) {
            setSrc(null);
            return;
        }
        let objectUrl: string | null = null;
        let cancelled = false;
        axiosRequest
            .get(API_ROUTES.links.catalogQr(userId, size), { responseType: "blob" })
            .then((response) => {
                if (cancelled) return;
                objectUrl = URL.createObjectURL(response.data as Blob);
                setSrc(objectUrl);
            })
            .catch(() => {
                if (!cancelled) setSrc(null);
            });
        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [userId, handle, size]);

    return src;
}

// ---------------------------------------------------------------------------
// Per-property publication
//
// A property appears on a catalog only when it is BOTH verified AND
// link-published. The endpoint to flip it has existed since the links service
// shipped; nothing in this dashboard called it, so every verified listing
// stayed invisible on its owner's public page. Reported 2026-09-05 as an
// agent catalog rendering with zero properties despite having verified ones.
// ---------------------------------------------------------------------------

export interface PropertyShareKit {
    property_id: string;
    slug: string | null;
    is_link_published: boolean;
    is_verified: boolean;
    /** The public booking page. Null until a slug exists. */
    direct_url: string | null;
    qr_url: string | null;
}

export function GetPropertyShareKit(propertyId?: string, enabled = true) {
    return useQuery({
        queryKey: ["propertyShareKit", propertyId],
        queryFn: () =>
            axiosRequest.get(API_ROUTES.links.propertyShareKit(propertyId!)),
        enabled: Boolean(propertyId) && enabled,
        staleTime: 1000 * 60,
        retry: 1,
    });
}

export function UpdatePropertyLink(propertyId?: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: {
            is_link_published?: boolean;
            slug?: string;
            link_config?: Record<string, unknown>;
        }) => axiosRequest.patch(API_ROUTES.links.propertyLink(propertyId!), payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["propertyShareKit", propertyId] });
            // The catalog's property_count is derived from published properties,
            // so the share card on the dashboard is now stale too — and so is
            // the page editor's listings table.
            queryClient.invalidateQueries({ queryKey: [LinksRequestKeys.myCatalog] });
            queryClient.invalidateQueries({ queryKey: [LinksRequestKeys.myLinkProperties] });
        },
    });
}

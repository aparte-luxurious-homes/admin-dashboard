import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosRequest from "../api";
import { API_ROUTES } from "../routes/endpoints";

enum LinksRequestKeys {
    myCatalog = "myCatalog",
    myCatalogAnalytics = "myCatalogAnalytics",
}

export interface CatalogShareKit {
    handle: string | null;
    is_catalog_published: boolean;
    /** The handle may be changed exactly once. False means it is now fixed. */
    can_change_handle: boolean;
    handle_changed_at: string | null;
    catalog_url: string | null;
    referral_code: string | null;
    property_count: number;
    share_templates?: Record<string, string>;
    qr_url: string | null;
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
            catalog_config?: Record<string, unknown>;
        }) => axiosRequest.patch(API_ROUTES.links.myCatalog, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [LinksRequestKeys.myCatalog] });
        },
    });
}

export function GetMyCatalogAnalytics(window: string = "30d", enabled: boolean = true) {
    return useQuery({
        queryKey: [LinksRequestKeys.myCatalogAnalytics, window],
        queryFn: () => axiosRequest.get(API_ROUTES.links.myCatalogAnalytics(window)),
        staleTime: 1000 * 60 * 5,
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

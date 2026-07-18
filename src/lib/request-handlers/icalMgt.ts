import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosRequest from "../api";
import { API_ROUTES } from "../routes/endpoints";

export enum IcalRequestKeys {
    outboundUrl = "getOutboundUrl",
    inboundFeeds = "getInboundFeeds",
    platformFeeds = "getPlatformFeeds",
    conflicts = "getConflicts",
    externalBookings = "getExternalBookings",
}

// ---------------------------------------------------------
// OWNER HOOKS
// ---------------------------------------------------------

export function GetOutboundUrl(unitId: string | number) {
    return useQuery({
        queryKey: [IcalRequestKeys.outboundUrl, unitId],
        queryFn: () => axiosRequest.get(API_ROUTES.ical.units.outbound(unitId)),
        refetchOnWindowFocus: false,
    });
}

export function RotateOutboundUrl() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (unitId: string | number) => axiosRequest.post(API_ROUTES.ical.units.outboundRotate(unitId)),
        onSuccess: (_, unitId) => {
            queryClient.invalidateQueries({ queryKey: [IcalRequestKeys.outboundUrl, unitId] });
        },
    });
}

export function GetInboundFeeds(unitId: string | number) {
    return useQuery({
        queryKey: [IcalRequestKeys.inboundFeeds, unitId],
        queryFn: () => axiosRequest.get(API_ROUTES.ical.units.feeds(unitId)),
        refetchOnWindowFocus: true,
    });
}

export function AddInboundFeed() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ unitId, payload }: { unitId: string | number, payload: { url: string, label: string } }) =>
            axiosRequest.post(API_ROUTES.ical.units.feeds(unitId), payload),
        onSuccess: (_, { unitId }) => {
            queryClient.invalidateQueries({ queryKey: [IcalRequestKeys.inboundFeeds, unitId] });
        },
    });
}

export function SyncFeed() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ unitId, feedId }: { unitId: string | number, feedId: string | number }) =>
            axiosRequest.post(API_ROUTES.ical.units.syncFeed(unitId, feedId)),
        onSuccess: (_, { unitId }) => {
            queryClient.invalidateQueries({ queryKey: [IcalRequestKeys.inboundFeeds, unitId] });
            queryClient.invalidateQueries({ queryKey: [IcalRequestKeys.externalBookings, unitId] });
        },
    });
}

export function DeleteFeed() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ unitId, feedId }: { unitId: string | number, feedId: string | number }) =>
            axiosRequest.delete(API_ROUTES.ical.units.feedAction(unitId, feedId)),
        onSuccess: (_, { unitId }) => {
            queryClient.invalidateQueries({ queryKey: [IcalRequestKeys.inboundFeeds, unitId] });
            queryClient.invalidateQueries({ queryKey: [IcalRequestKeys.externalBookings, unitId] });
        },
    });
}

export function GetExternalBookings(unitId: string | number, enabled: boolean = true) {
    return useQuery({
        queryKey: [IcalRequestKeys.externalBookings, unitId],
        queryFn: () => axiosRequest.get(API_ROUTES.ical.units.externalBookings(unitId)),
        refetchOnWindowFocus: true,
        enabled,
    });
}

// ---------------------------------------------------------
// ADMIN HOOKS
// ---------------------------------------------------------

export function GetPlatformFeeds(direction?: string, page = 1, size = 20) {
    return useQuery({
        queryKey: [IcalRequestKeys.platformFeeds, direction, page, size],
        queryFn: () => {
            let url = `${API_ROUTES.ical.admin.feeds}?page=${page}&size=${size}`;
            if (direction) url += `&direction=${direction}`;
            return axiosRequest.get(url);
        },
        refetchOnWindowFocus: true,
    });
}

export function ForcePollFeed() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (feedId: string | number) => axiosRequest.post(API_ROUTES.ical.admin.forcePoll(feedId)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [IcalRequestKeys.platformFeeds] });
        },
    });
}

export function DisableFeed() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (feedId: string | number) => axiosRequest.patch(API_ROUTES.ical.admin.disable(feedId)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [IcalRequestKeys.platformFeeds] });
        },
    });
}

export function EnableFeed() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (feedId: string | number) => axiosRequest.patch(API_ROUTES.ical.admin.enable(feedId)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [IcalRequestKeys.platformFeeds] });
        },
    });
}

export function GetConflicts(status?: string, page = 1, size = 20) {
    return useQuery({
        queryKey: [IcalRequestKeys.conflicts, status, page, size],
        queryFn: () => {
            let url = `${API_ROUTES.ical.admin.conflicts}?page=${page}&size=${size}`;
            if (status) url += `&status=${status}`;
            return axiosRequest.get(url);
        },
        refetchOnWindowFocus: true,
    });
}

export function ResolveConflict() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (conflictId: string | number) => axiosRequest.post(API_ROUTES.ical.admin.resolveConflict, { conflict_id: conflictId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [IcalRequestKeys.conflicts] });
        },
    });
}

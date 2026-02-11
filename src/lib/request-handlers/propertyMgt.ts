import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosRequest from "../api";
import { API_ROUTES } from "../routes/endpoints";
import { IAssignAmenity, IAssignProperty, ICreateProperty, IUpdateProperty, IUpdatePropertyVerification, IUploadPropertyMedia } from "@/src/components/properties-mgt/types";
import { UserRole } from "../enums";

enum PropertyRequestKeys {
    allProperties = "getAllPropertiesView",
    singleProperty = "getSinglePropertyView",
    propertyMedia = "uploadPropertyMedia",
    propertyAmenities = "assignPropertyAmenities",
    getAmenities = "getAmenities",
    createAmenities = "getAmenities",
    featureProperty = "featureProperty",
    createProperty = "createProperty",
    propertyVerification = "propertyVerification",
    deleteProperty = "deleteProperty",
    assignToProperty = "assignToProperty",
    getPropertyVerification = "getPropertyVerification",
    getAllVerifications = "getAllVerifications",
    getPropertiesVerifications = "getPropertiesVerifications",
}

export function GetAllProperties(page = 1, limit = 10, searchTerm = '', role?: UserRole, id?: string | number) {
    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: searchTerm,
    });
    if (role) params.append('role', role);
    if (typeof id === 'number') params.append('user', String(id));

    return useQuery({
        queryKey: [PropertyRequestKeys.allProperties, page, limit, searchTerm, role ?? null, id ?? null],
        queryFn: () => axiosRequest.get(API_ROUTES.propertyManagement.properties.base, {
            params: {
                page,
                limit,
                search: searchTerm,
                role,
                user: id
            }
        }),
        refetchOnWindowFocus: true,
    });
}


export function GetSingleProperty(propertyId: string | number) {
    return useQuery({
        queryKey: [PropertyRequestKeys.singleProperty, propertyId],
        queryFn: () => axiosRequest.get(API_ROUTES.propertyManagement.properties.details(propertyId)),
        refetchOnWindowFocus: true,
        staleTime: Infinity,
        refetchInterval: 10000 * 60 * 5,
    });
}


export function GetAllVerifications(page: number = 1, limit: number = 10, _searchQuery: string = '', _role?: UserRole) {
    const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
    });

    return useQuery({
        queryKey: [PropertyRequestKeys.getAllVerifications, page, limit],
        queryFn: () => axiosRequest.get(`${API_ROUTES.verifications.base}?${queryParams.toString()}`),
        refetchOnWindowFocus: true,
        staleTime: Infinity,
        refetchInterval: 10000 * 60 * 5,
    });
}

export function GetPropertyVerification(verificationId: string | number) {
    return useQuery({
        queryKey: [PropertyRequestKeys.getPropertyVerification, verificationId],
        queryFn: () => axiosRequest.get(API_ROUTES.verifications.details(verificationId)),
        refetchOnWindowFocus: true,
        staleTime: Infinity,
        refetchInterval: 10000 * 60 * 5,
    });
}

export function GetPropertyVerifications(page: number = 1, limit: number = 10, searchQuery: string = '', propertyId: string | number, role?: UserRole) {
    const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: searchQuery,
    });

    if (role !== undefined) {
        queryParams.append('role', String(role));
    }

    return useQuery({
        queryKey: [PropertyRequestKeys.getPropertiesVerifications, page, limit, searchQuery, propertyId, role],
        // Use global verifications endpoint and filter by property via query param
        queryFn: () => axiosRequest.get(`${API_ROUTES.verifications.base}?${queryParams.toString()}&property=${propertyId}`),
        refetchOnWindowFocus: true,
        staleTime: Infinity,
        refetchInterval: 10000 * 60 * 5,
    });
}


export function UpdatePropertyVerification() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ propertyId, payload }: { propertyId: string | number, payload: IUpdatePropertyVerification }) =>
            axiosRequest.put(API_ROUTES.propertyManagement.properties.verify(propertyId), payload),

        onSuccess: (values) => {
            console.log(values)
        },

        onSettled: (values) => {
            if (values?.data?.data?.property?.id) {
                queryClient.invalidateQueries({ queryKey: [PropertyRequestKeys.singleProperty, values.data.data.property.id] });
            }
            if (values?.data?.data?.verification?.id) {
                queryClient.invalidateQueries({ queryKey: [PropertyRequestKeys.getPropertyVerification, values.data.data.verification.id] });
            }
            queryClient.invalidateQueries({ queryKey: [PropertyRequestKeys.propertyVerification] });
        },
    });
}

export function GetAmenities() {
    return useQuery({
        queryKey: [PropertyRequestKeys.getAmenities],
        queryFn: () => axiosRequest.get(API_ROUTES.propertyManagement.amenities.base),
    });
}


export function CreateAmenity() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ name }: { name: string }) =>
            axiosRequest.post(API_ROUTES.propertyManagement.amenities.base, { name }),

        onSuccess: () => {
            // Invalidate the specific property query so it refetches
            queryClient.invalidateQueries({ queryKey: [PropertyRequestKeys.createAmenities] });
        },
    });
}


export function CreateProperty() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ payload }: { payload: ICreateProperty }) =>
            axiosRequest.post(API_ROUTES.propertyManagement.properties.base, payload),

        onSuccess: () => {
            // Invalidate the specific property query so it refetches
            queryClient.invalidateQueries({ queryKey: [PropertyRequestKeys.createProperty] });
        },
    });
}


export function AssignToProperty(propertyId: string | number) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ payload }: { payload: IAssignProperty }) =>
            axiosRequest.post(API_ROUTES.admin.properties.assign(propertyId), payload),

        onSuccess: (values) => {
            console.log(values)
            // Invalidate the specific property query so it refetches
            queryClient.invalidateQueries({ queryKey: [PropertyRequestKeys.assignToProperty] });
            queryClient.invalidateQueries({ queryKey: [PropertyRequestKeys.singleProperty, propertyId] });
            queryClient.invalidateQueries({ queryKey: [PropertyRequestKeys.getPropertyVerification, values?.data?.data?.VerificationBadge?.id] });
            queryClient.invalidateQueries({ queryKey: [PropertyRequestKeys.allProperties] });
        },
    });
}


export function UpdateProperty() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ propertyId, payload }: { propertyId: string | number, payload: IUpdateProperty }) =>
            axiosRequest.put(API_ROUTES.propertyManagement.properties.details(propertyId), payload),

        onSuccess: (_, { propertyId }) => {
            // Invalidate the specific property query so it refetches
            queryClient.invalidateQueries({ queryKey: [PropertyRequestKeys.singleProperty, propertyId] });
            queryClient.invalidateQueries({ queryKey: [PropertyRequestKeys.allProperties] });
        },
    });
}

export function DeleteProperty() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ propertyId }: { propertyId: string | number }) =>
            axiosRequest.delete(API_ROUTES.propertyManagement.properties.details(propertyId)),

        onSuccess: (_, { propertyId }) => {
            // Invalidate the specific property query so it refetches
            queryClient.invalidateQueries({ queryKey: [PropertyRequestKeys.deleteProperty, propertyId] });
            queryClient.invalidateQueries({ queryKey: [PropertyRequestKeys.allProperties] });
        },
    });
}


export function AssignPropertyAmenities() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ propertyId, payload }: { propertyId: string | number, payload: IAssignAmenity }) =>
            axiosRequest.post(API_ROUTES.propertyManagement.properties.amenities(propertyId), payload),

        onSuccess: (_, { propertyId }) => {
            // Invalidate the specific property query so it refetches
            queryClient.invalidateQueries({ queryKey: [PropertyRequestKeys.propertyAmenities, propertyId] });
            queryClient.invalidateQueries({ queryKey: [PropertyRequestKeys.singleProperty, propertyId] });
            queryClient.invalidateQueries({ queryKey: [PropertyRequestKeys.allProperties] });
        },
    });
}


export function FeatureProperty() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ propertyId }: { propertyId: string | number }) =>
            axiosRequest.put(API_ROUTES.admin.properties.feature(propertyId)),

        onSuccess: (_, { propertyId }) => {
            // Invalidate the specific property query so it refetches
            queryClient.invalidateQueries({ queryKey: [PropertyRequestKeys.featureProperty, propertyId] });
            queryClient.invalidateQueries({ queryKey: [PropertyRequestKeys.singleProperty, propertyId] });
            queryClient.invalidateQueries({ queryKey: [PropertyRequestKeys.allProperties] });
        },
    });
}


export function UploadPropertyMedia() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ propertyId, payload }: { propertyId: string | number, payload: FormData }) =>
            axiosRequest.post(
                API_ROUTES.propertyManagement.properties.media(propertyId),
                payload,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    }
                },

            ),

        onSuccess: (_, { propertyId }) => {
            // Invalidate the specific property query so it refetches
            queryClient.invalidateQueries({ queryKey: [PropertyRequestKeys.propertyMedia, propertyId] });
            queryClient.invalidateQueries({ queryKey: [PropertyRequestKeys.singleProperty, propertyId] });
            queryClient.invalidateQueries({ queryKey: [PropertyRequestKeys.allProperties] });
        },
    });
}

export function DeletePropertyMedia() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ propertyId, mediaId }: { propertyId: string | number, mediaId: string | number }) =>
            axiosRequest.delete(API_ROUTES.propertyManagement.properties.deleteMedia(propertyId, mediaId)),

        onSuccess: (_, { propertyId }) => {
            queryClient.invalidateQueries({ queryKey: [PropertyRequestKeys.singleProperty, propertyId] });
            queryClient.invalidateQueries({ queryKey: [PropertyRequestKeys.allProperties] });
        },
    });
}
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosRequest from "../api";
import { API_ROUTES } from "../routes/endpoints";
import { IAssignAmenity, ICreateProperty, IUpdateProperty, IUpdatePropertyVerification, IUploadPropertyMedia } from "@/src/components/properties-mgt/types";

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
}

export function GetAllProperties(page=1, limit=10, searchTerm='') {
    return useQuery({
        queryKey: [PropertyRequestKeys.allProperties, page, limit, searchTerm], 
        queryFn: () => axiosRequest.get(
            `${API_ROUTES.propertyManagement.properties.base}?page=${page}&limit=${limit}&search=${searchTerm}`
        ),
        refetchOnWindowFocus: true,
        staleTime: Infinity,
        refetchInterval: 10000 * 60 * 5,
    });
}


export function GetSingleProperty(propertyId: number) {
    return useQuery({
        queryKey: [PropertyRequestKeys.singleProperty, propertyId], 
        queryFn: () => axiosRequest.get(API_ROUTES.propertyManagement.properties.details(propertyId)),
        refetchOnWindowFocus: true,
        staleTime: Infinity,
        refetchInterval: 10000 * 60 * 5,
    });
}


export function UpdatePropertyVerification() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ propertyId, payload }: { propertyId: number, payload: IUpdatePropertyVerification }) =>
        axiosRequest.put(API_ROUTES.propertyManagement.properties.verify(propertyId), payload),

        onSuccess: () => {
            // Invalidate the specific property query so it refetches
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
        mutationFn: ({payload}: { payload: ICreateProperty }) =>
        axiosRequest.post(API_ROUTES.propertyManagement.properties.base, payload),

        onSuccess: () => {
            // Invalidate the specific property query so it refetches
            queryClient.invalidateQueries({ queryKey: [PropertyRequestKeys.createProperty] });
        },
    });
}


export function UpdateProperty() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({propertyId, payload}: {propertyId: number, payload: IUpdateProperty}) =>
        axiosRequest.put(API_ROUTES.propertyManagement.properties.details(propertyId), payload),

        onSuccess: (_, { propertyId }) => {
            // Invalidate the specific property query so it refetches
            queryClient.invalidateQueries({ queryKey: [PropertyRequestKeys.singleProperty, propertyId] });
        },
    });
}

export function DeleteProperty() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ propertyId }: { propertyId: number }) =>
        axiosRequest.delete(API_ROUTES.propertyManagement.properties.details(propertyId)),

        onSuccess: (_, { propertyId }) => {
            // Invalidate the specific property query so it refetches
            queryClient.invalidateQueries({ queryKey: [PropertyRequestKeys.deleteProperty, propertyId] });
        },
    });
}


export function AssignPropertyAmenities() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({propertyId, payload}: {propertyId: number, payload: IAssignAmenity}) =>
        axiosRequest.post(API_ROUTES.propertyManagement.properties.amenities(propertyId), payload),

        onSuccess: (_, { propertyId }) => {
            // Invalidate the specific property query so it refetches
            queryClient.invalidateQueries({ queryKey: [PropertyRequestKeys.propertyAmenities, propertyId] });
        },
    });
}


export function FeatureProperty() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ propertyId }: { propertyId: number }) =>
        axiosRequest.put(API_ROUTES.admin.properties.feature(propertyId)),

        onSuccess: (_, { propertyId }) => {
            // Invalidate the specific property query so it refetches
            queryClient.invalidateQueries({ queryKey: [PropertyRequestKeys.featureProperty, propertyId] });
        },
    });
}


export function UploadPropertyMedia() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({propertyId, payload}: {propertyId: number, payload: FormData}) =>
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
        },
    });
}
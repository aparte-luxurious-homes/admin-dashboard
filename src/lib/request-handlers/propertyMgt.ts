import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosRequest from "../api";
import { API_ROUTES } from "../routes/endpoints";
import { IUpdateProperty } from "@/src/components/properties-mgt/types";

enum PropertyRequestKeys {
    allProperties = "getAllPropertiesView",
    singleProperty = "getSinglePropertyView",
}

export function getAllProperties(page=1, limit=10) {
    return useQuery({
        queryKey: [PropertyRequestKeys.allProperties, page, limit], 
        queryFn: () => axiosRequest.get(
            `${API_ROUTES.propertyManagement.properties.base}?page=${page}&limit=${limit}`
        ),
        refetchOnWindowFocus: true,
        staleTime: Infinity,
        refetchInterval: 1000 * 60 * 1,
    });
}


export function getSingleProperty(propertyId: number) {
    return useQuery({
        queryKey: [PropertyRequestKeys.singleProperty, propertyId], 
        queryFn: () => axiosRequest.get(API_ROUTES.propertyManagement.properties.details(propertyId)),
        refetchOnWindowFocus: true,
        staleTime: Infinity,
        refetchInterval: 1000 * 60 * 1,
    });
}

export function useUpdateProperty() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({propertyId, payload}: {propertyId: number, payload: IUpdateProperty}) =>
        axiosRequest.put(API_ROUTES.propertyManagement.properties.details(propertyId), payload),

        onSuccess: (response, { propertyId }) => {
            // Invalidate the specific property query so it refetches
            queryClient.invalidateQueries({ queryKey: [PropertyRequestKeys.singleProperty, propertyId] });
        },
    });
}
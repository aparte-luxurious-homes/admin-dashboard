import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosRequest from "../api";
import { API_ROUTES } from "../routes/endpoints";
import { IUpdatePropertyUnit } from "@/src/components/properties-mgt/types";

enum PropertyRequestKeys {
    allUnits = "getAllUnitsView",
    singleUnit = "getSingleUnitsView",
}

export function GetAllPropertyUnits(page=1, limit=10) {
    return useQuery({
        queryKey: [PropertyRequestKeys.allUnits, page, limit], 
        queryFn: () => axiosRequest.get(
            `${API_ROUTES.propertyManagement.properties.units.base}?page=${page}&limit=${limit}`
        ),
        refetchOnWindowFocus: true,
        staleTime: Infinity,
        refetchInterval: 1000 * 60 * 1,
    });
}


export function GetSinglePropertyUnit(propertyId: number, unitId: number) {
    return useQuery({
        queryKey: [PropertyRequestKeys.singleUnit, propertyId, unitId], 
        queryFn: () => axiosRequest.get(API_ROUTES.propertyManagement.properties.units.details(propertyId, unitId)),
        refetchOnWindowFocus: true,
        staleTime: Infinity,
        refetchInterval: 1000 * 60 * 1,
    });
}

export function UseUpdatePropertyUnit() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({propertyId, unitId, payload}: {propertyId: number, unitId: number, payload: IUpdatePropertyUnit}) =>
        axiosRequest.patch(API_ROUTES.propertyManagement.properties.units.details(propertyId, unitId), payload),

        onSuccess: (_, { propertyId, unitId }) => {
            // Invalidate the specific property query so it refetches
            queryClient.invalidateQueries({ queryKey: [PropertyRequestKeys.singleUnit, propertyId, unitId] });
        },
    });
}
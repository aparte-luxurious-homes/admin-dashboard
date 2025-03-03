import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosRequest from "../api";
import { API_ROUTES } from "../routes/endpoints";
import { IAssignAmenity, ICreatePropertyUnit, IUpdatePropertyUnit } from "@/src/components/properties-mgt/types";

enum PropertyUnitRequestKeys {
    allUnits = "getAllUnitsView",
    singleUnit = "getSingleUnitsView",
    unitMedia = "uploadUnitMedia",
    assignAmenities = "assigneAmenities",
    createUnit = "createUnit",
}

export function GetAllPropertyUnits(page=1, limit=10) {
    return useQuery({
        queryKey: [PropertyUnitRequestKeys.allUnits, page, limit], 
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
        queryKey: [PropertyUnitRequestKeys.singleUnit, propertyId, unitId], 
        queryFn: () => axiosRequest.get(API_ROUTES.propertyManagement.properties.units.details(propertyId, unitId)),
        refetchOnWindowFocus: true,
        staleTime: Infinity,
        refetchInterval: 1000 * 60 * 1,
    });
}

export function CreatePropertyUnit() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({propertyId, payload}: {propertyId: number, payload: ICreatePropertyUnit[]}) =>
        axiosRequest.post(API_ROUTES.propertyManagement.properties.units.base(propertyId), { units: payload } ),

        onSuccess: (_, { propertyId }) => {
            // Invalidate the specific property query so it refetches
            queryClient.invalidateQueries({ queryKey: [PropertyUnitRequestKeys.createUnit, propertyId ] });
        },
    });
}


export function UpdatePropertyUnit() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({propertyId, unitId, payload}: {propertyId: number, unitId: number, payload: IUpdatePropertyUnit}) =>
        axiosRequest.patch(API_ROUTES.propertyManagement.properties.units.details(propertyId, unitId), payload),

        onSuccess: (_, { propertyId, unitId }) => {
            // Invalidate the specific property query so it refetches
            queryClient.invalidateQueries({ queryKey: [PropertyUnitRequestKeys.singleUnit, propertyId, unitId] });
        },
    });
}


export function AssignUnitAmenities() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ propertyId, unitId, payload }: { propertyId: number, unitId: number, payload: IAssignAmenity }) =>
        axiosRequest.post(API_ROUTES.propertyManagement.properties.units.amenities(propertyId, unitId), payload),

        onSuccess: (_, { propertyId, unitId }) => {
            // Invalidate the specific property query so it refetches
            queryClient.invalidateQueries({ queryKey: [PropertyUnitRequestKeys.assignAmenities, propertyId, unitId] });
        },
    });
}


export function UploadPropertyUnitMedia() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({propertyId, unitId, payload}: {propertyId: number, unitId: number, payload: FormData}) =>
        axiosRequest.post(
            API_ROUTES.propertyManagement.properties.units.media(propertyId, unitId), 
            payload, 
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                }
            },

        ),

        onSuccess: (_, { propertyId }) => {
            // Invalidate the specific property query so it refetches
            queryClient.invalidateQueries({ queryKey: [PropertyUnitRequestKeys.unitMedia, propertyId] });
        },
    });
}
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosRequest from "../api";
import { API_ROUTES } from "../routes/endpoints";
import { IAssignAmenity, ICreatePropertyUnit, IUpdatePropertyUnit, ICreateAvailabilityPayload } from "@/src/components/properties-mgt/types";

enum PropertyUnitRequestKeys {
    allUnits = "getAllUnitsView",
    singleUnit = "getSingleUnitsView",
    unitMedia = "uploadUnitMedia",
    assignAmenities = "assigneAmenities",
    createUnit = "createUnit",
    deleteUnit = "deleteUnit",
    availability = "unitAvailability",
}

export function GetAllPropertyUnits(page = 1, limit = 10) {
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


export function GetSinglePropertyUnit(propertyId: string | number, unitId: string | number) {
    return useQuery({
        queryKey: [PropertyUnitRequestKeys.singleUnit, propertyId, unitId],
        queryFn: async () => {
            // Fetch the property details which includes all units
            const response = await axiosRequest.get(API_ROUTES.propertyManagement.properties.details(propertyId));

            // Extract the specific unit from the units array
            const property = response.data?.data;
            const unit = property?.units?.find((u: any) => String(u.id) === String(unitId));

            if (!unit) {
                throw new Error(`Unit with ID ${unitId} not found in property ${propertyId}`);
            }

            // Return in the same format as the original endpoint would
            return {
                ...response,
                data: {
                    ...response.data,
                    data: unit
                }
            };
        },
        refetchOnWindowFocus: true,
        staleTime: Infinity,
        refetchInterval: 1000 * 60 * 1,
    });
}

export function CreatePropertyUnit() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ propertyId, payload }: { propertyId: string, payload: ICreatePropertyUnit[] }) =>
            axiosRequest.post(API_ROUTES.propertyManagement.properties.units.base(propertyId), { units: payload }),

        onSuccess: (_, { propertyId }) => {
            // Invalidate the specific property query so it refetches
            queryClient.invalidateQueries({ queryKey: [PropertyUnitRequestKeys.createUnit, propertyId] });
        },
    });
}


export function UpdatePropertyUnit() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ propertyId, unitId, payload }: { propertyId: string | number, unitId: string | number, payload: IUpdatePropertyUnit }) =>
            axiosRequest.patch(API_ROUTES.propertyManagement.properties.units.details(propertyId, unitId), payload),

        onSuccess: (_, { propertyId, unitId }) => {
            // Invalidate the specific property query so it refetches
            queryClient.invalidateQueries({ queryKey: [PropertyUnitRequestKeys.singleUnit, propertyId, unitId] });
        },
    });
}


export function DeletePropertyUnit() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ propertyId, unitId }: { propertyId: string | number, unitId: string | number }) =>
            axiosRequest.delete(API_ROUTES.propertyManagement.properties.units.details(propertyId, unitId)),

        onSuccess: (_, { propertyId, unitId }) => {
            // Invalidate the specific property query so it refetches
            queryClient.invalidateQueries({ queryKey: [PropertyUnitRequestKeys.deleteUnit, propertyId, unitId] });
        },
    });
}


export function AssignUnitAmenities() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ propertyId, unitId, payload }: { propertyId: string | number, unitId: string | number, payload: IAssignAmenity }) =>
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
        mutationFn: ({ propertyId, unitId, payload }: { propertyId: string | number, unitId: string | number, payload: FormData }) =>
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


export function GetUnitAvailability(propertyId: string | number, unitId: string | number, startDate?: string, endDate?: string) {
    return useQuery({
        queryKey: [PropertyUnitRequestKeys.availability, propertyId, unitId, startDate, endDate],
        queryFn: () => {
            let url = API_ROUTES.propertyManagement.properties.units.availability(propertyId, unitId);
            const params = new URLSearchParams();
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);
            if (params.toString()) url += `?${params.toString()}`;
            return axiosRequest.get(url);
        },
        refetchOnWindowFocus: true,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}


export function CreateUnitAvailability() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ propertyId, unitId, payload }: { propertyId: string, unitId: string | number, payload: ICreateAvailabilityPayload }) =>
            axiosRequest.post(API_ROUTES.propertyManagement.properties.units.availability(propertyId, unitId), payload),

        onSuccess: (_, { propertyId, unitId }) => {
            // Invalidate availability queries
            queryClient.invalidateQueries({ queryKey: [PropertyUnitRequestKeys.availability, propertyId, unitId] });
            queryClient.invalidateQueries({ queryKey: [PropertyUnitRequestKeys.singleUnit, propertyId, unitId] });
        },
    });
}
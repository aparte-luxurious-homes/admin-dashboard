import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosRequest from "../api";
import { API_ROUTES } from "../routes/endpoints";
import { UserRole } from "../enums";
import {
    Permission,
    PermissionCreatePayload,
    PermissionUpdatePayload,
    RolePermissionsResponse,
} from "../types/permissions";

export enum PermissionsQK {
    list = "permissions:list",
    role = "permissions:role",
}

const FIVE_MIN = 5 * 60 * 1000;

const unwrap = <T,>(response: { data: any }): T => {
    const body = response?.data;
    if (body && typeof body === "object" && "data" in body && body.data !== undefined) {
        return body.data as T;
    }
    return body as T;
};

export function GetAllPermissions(limit = 500) {
    return useQuery({
        queryKey: [PermissionsQK.list, limit],
        queryFn: async () => {
            const response = await axiosRequest.get(API_ROUTES.permissions.base, {
                params: { limit },
            });
            return unwrap<Permission[]>(response);
        },
        staleTime: FIVE_MIN,
        refetchOnWindowFocus: false,
    });
}

export function GetRolePermissions(role: UserRole | undefined, enabled = true) {
    return useQuery({
        queryKey: [PermissionsQK.role, role],
        queryFn: async () => {
            const response = await axiosRequest.get(
                API_ROUTES.permissions.rolePermissions(role as string)
            );
            return unwrap<RolePermissionsResponse>(response);
        },
        enabled: enabled && !!role,
        staleTime: FIVE_MIN,
    });
}

export function CreatePermission() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (payload: PermissionCreatePayload) => {
            const response = await axiosRequest.post(API_ROUTES.permissions.base, payload);
            return unwrap<Permission>(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [PermissionsQK.list] });
        },
    });
}

export function UpdatePermission() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            permissionId,
            payload,
        }: {
            permissionId: string;
            payload: PermissionUpdatePayload;
        }) => {
            const response = await axiosRequest.patch(
                API_ROUTES.permissions.details(permissionId),
                payload
            );
            return unwrap<Permission>(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [PermissionsQK.list] });
        },
    });
}

export function DeletePermission() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ permissionId }: { permissionId: string }) =>
            axiosRequest.delete(API_ROUTES.permissions.details(permissionId)),
        onSuccess: () => {
            // Cascade clears role_permissions for every role — invalidate both prefixes.
            queryClient.invalidateQueries({ queryKey: [PermissionsQK.list] });
            queryClient.invalidateQueries({ queryKey: [PermissionsQK.role] });
        },
    });
}

export function AssignPermissionToRole() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ role, permissionId }: { role: UserRole; permissionId: string }) =>
            axiosRequest.post(API_ROUTES.permissions.assignToRole(role, permissionId)),
        onSuccess: (_data, vars) => {
            queryClient.invalidateQueries({ queryKey: [PermissionsQK.role, vars.role] });
        },
    });
}

export function RemovePermissionFromRole() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ role, permissionId }: { role: UserRole; permissionId: string }) =>
            axiosRequest.delete(API_ROUTES.permissions.removeFromRole(role, permissionId)),
        onSuccess: (_data, vars) => {
            queryClient.invalidateQueries({ queryKey: [PermissionsQK.role, vars.role] });
        },
    });
}

export function SeedPermissions() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const response = await axiosRequest.post(API_ROUTES.permissions.seed);
            return unwrap<{
                message: string;
                permissions: { created: number; existing: number; total: number };
                role_assignments: Record<string, number | string>;
            }>(response);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [PermissionsQK.list] });
            queryClient.invalidateQueries({ queryKey: [PermissionsQK.role] });
        },
    });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosRequest from "../api";
import { API_ROUTES } from "../routes/endpoints";
import { UserRole } from "../enums";

enum UsersRequestKeys {
    getAllUsers = "getAllUsers",
    createUser = "createUser",
    updateUser = "updateUser",
    deleteUser = "deleteUser",
    assignableRoles = "assignableRoles",
    kycHistory = "kycHistory",
    kycQueue = "kycQueue",
    updateKyc = "updateKyc",
    uploadKycOnBehalf = "uploadKycOnBehalf",
}

export function GetAllUsers(page = 1, size = 10, searchQuery = '', role: UserRole | string = '', isVerified: string = '') {
    return useQuery({
        queryKey: [UsersRequestKeys.getAllUsers, page, size, searchQuery, role, isVerified],
        queryFn: () => axiosRequest.get(API_ROUTES.admin.users.base, {
            params: {
                page,
                size,
                search: searchQuery,
                role,
                is_verified: isVerified
            }
        }),
        refetchOnWindowFocus: true,
    });
}

export function OnboardUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ payload }: { payload: any }) =>
            axiosRequest.post(API_ROUTES.admin.users.onboard, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [UsersRequestKeys.getAllUsers] });
        },
    });
}

export function CreateUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ payload }: { payload: any }) =>
            axiosRequest.post(API_ROUTES.admin.users.base, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [UsersRequestKeys.getAllUsers] });
        },
    });
}

export function UpdateUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ userId, payload }: { userId: string, payload: any }) =>
            axiosRequest.put(API_ROUTES.admin.users.userByUuid(userId), payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [UsersRequestKeys.getAllUsers] });
        },
    });
}

export function DeleteUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ userId }: { userId: string | number }) =>
            axiosRequest.delete(API_ROUTES.admin.users.userByUuid(userId)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [UsersRequestKeys.getAllUsers] });
        },
    });
}

export function GetAssignableRoles() {
    return useQuery({
        queryKey: [UsersRequestKeys.assignableRoles],
        queryFn: () => axiosRequest.get(API_ROUTES.admin.users.roles),
    });
}

// ----------------------------------------------------------------------------
// KYC: history + queue + update
// ----------------------------------------------------------------------------

export function GetKycHistory(userId: string | number, enabled = true) {
    return useQuery({
        queryKey: [UsersRequestKeys.kycHistory, userId],
        queryFn: () => axiosRequest.get(API_ROUTES.admin.users.kycHistory(userId)),
        enabled: enabled && !!userId,
    });
}

export function GetKycQueue(params: {
    page?: number;
    size?: number;
    role?: string;
    age_min_days?: number;
    sort?: 'age_desc' | 'age_asc';
}) {
    const { page = 1, size = 20, role = '', age_min_days, sort = 'age_desc' } = params || {};
    return useQuery({
        queryKey: [UsersRequestKeys.kycQueue, page, size, role, age_min_days, sort],
        queryFn: () => axiosRequest.get(API_ROUTES.admin.kycQueue, {
            params: { page, size, role, age_min_days, sort },
        }),
        refetchOnWindowFocus: true,
    });
}

export function UpdateUserKyc() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ userId, payload }: {
            userId: string | number;
            payload: { status: 'PENDING' | 'VERIFIED' | 'REJECTED'; rejection_reason?: string };
        }) => axiosRequest.patch(API_ROUTES.admin.users.updateKyc(userId), payload),
        onSuccess: (_data, vars) => {
            queryClient.invalidateQueries({ queryKey: [UsersRequestKeys.kycHistory, vars.userId] });
            queryClient.invalidateQueries({ queryKey: [UsersRequestKeys.kycQueue] });
            queryClient.invalidateQueries({ queryKey: [UsersRequestKeys.getAllUsers] });
        },
    });
}

// Admin-on-behalf KYC document upload. Mirrors the self-serve upload contract
// but the endpoint expects multipart/form-data with `document_type`, `file`,
// and an optional `notes` field. Backend gates access to {SUPER_ADMIN, ADMIN,
// OPERATIONS_ADMIN} via require_roles.
export function UploadKycOnBehalf() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ userId, documentType, file, notes }: {
            userId: string | number;
            documentType: string;
            file: File;
            notes?: string;
        }) => {
            const form = new FormData();
            form.append("document_type", documentType);
            form.append("file", file);
            if (notes) form.append("notes", notes);
            return axiosRequest.post(
                API_ROUTES.admin.users.uploadKycOnBehalf(userId),
                form,
                { headers: { "Content-Type": "multipart/form-data" } },
            );
        },
        onSuccess: (_data, vars) => {
            // Refresh the user detail + KYC timeline + queue so the new
            // PENDING document shows up immediately.
            queryClient.invalidateQueries({ queryKey: [UsersRequestKeys.kycHistory, vars.userId] });
            queryClient.invalidateQueries({ queryKey: [UsersRequestKeys.kycQueue] });
            queryClient.invalidateQueries({ queryKey: [UsersRequestKeys.getAllUsers] });
        },
    });
}

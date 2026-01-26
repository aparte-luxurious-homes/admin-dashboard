import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosRequest from "../api";
import { API_ROUTES } from "../routes/endpoints";
import { UserRole } from "../enums";

enum UsersRequestKeys {
    getAllUsers = "getAllUsers",
    createUser = "createUser",
    updateUser = "updateUser",
    deleteUser = "deleteUser",
}

export function GetAllUsers(page = 1, size = 10, searchQuery = '', role: UserRole | string = '', isVerified: string = '') {
    const queryParams = new URLSearchParams({
        page: String(page),
        size: String(size),
        search: searchQuery,
        role: String(role ?? ''),
        is_verified: String(isVerified ?? ''),
    });

    return useQuery({
        queryKey: [UsersRequestKeys.getAllUsers, page, size, searchQuery, role, isVerified],
        queryFn: () => axiosRequest.get(`${API_ROUTES.admin.users.base}?${queryParams.toString()}`),
        refetchOnWindowFocus: true,
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

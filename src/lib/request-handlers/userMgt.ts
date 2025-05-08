import { useQuery } from "@tanstack/react-query";
import axiosRequest from "../api";
import { API_ROUTES } from "../routes/endpoints";
import { UserRole } from "../enums";

enum UsersRequestKeys {
    getAllUsers = "getAllUsers",
}

export function GetAllUsers(page=1, limit=10, searchQuery = '', role?: UserRole) {
    const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: searchQuery,
    });

    if (role !== undefined) {
        queryParams.append('role', String(role));
    }

    return useQuery({
        queryKey: [UsersRequestKeys.getAllUsers, page, limit, searchQuery], 
        queryFn: () => axiosRequest.get(`${API_ROUTES.admin.users.base}?${queryParams.toString()}`),
        refetchOnWindowFocus: true,
    });
}

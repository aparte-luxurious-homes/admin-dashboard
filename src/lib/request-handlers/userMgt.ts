import { useQuery } from "@tanstack/react-query";
import axiosRequest from "../api";
import { API_ROUTES } from "../routes/endpoints";

enum UsersRequestKeys {
    getAllUsers = "getAllUsers",
}

export function GetAllUsers(page=1, limit=10, searchQuery = '') {
    return useQuery({
        queryKey: [UsersRequestKeys.getAllUsers, page, limit, searchQuery], 
        queryFn: () => axiosRequest.get(
            `${API_ROUTES.admin.users.base}?page=${page}&limit=${limit}&search=${searchQuery}`
        ),
        refetchOnWindowFocus: true,
    });
}

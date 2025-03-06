import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosRequest from "../api";
import { API_ROUTES } from "../routes/endpoints";


enum BookingRequestKeys {
    getAllBookings = "getAllBookings" 
}

export function GetAllBookings(page=1, limit=10) {
    return useQuery({
        queryKey: [BookingRequestKeys.getAllBookings, page, limit], 
        queryFn: () => axiosRequest.get(
            `${API_ROUTES.bookings.base}?page=${page}&limit=${limit}`
        ),
        refetchOnWindowFocus: true,
    });
}
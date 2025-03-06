import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosRequest from "../api";
import { API_ROUTES } from "../routes/endpoints";


enum BookingRequestKeys {
    getAllBookings = "getAllBookings",
    getBookingDetails = "getBookingDetails",
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


export function GetBookingDetails(bookingId: number) {
    return useQuery({
        queryKey: [BookingRequestKeys.getAllBookings], 
        queryFn: () => axiosRequest.get(
            `${API_ROUTES.bookings.details(bookingId)}`
        ),
        refetchOnWindowFocus: true,
    });
}
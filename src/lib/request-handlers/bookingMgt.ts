import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosRequest from "../api";
import { API_ROUTES } from "../routes/endpoints";
import { ICreateBooking, IUpdateBooking } from "@/src/components/booking-mgt/types";


enum BookingRequestKeys {
    getAllBookings = "getAllBookings",
    getBookingDetails = "getBookingDetails",
    updateBookingDetails = "updateBookingDetails",
    createBooking = "createBooking",
}

export function GetAllBookings(page = 1, limit = 10, searchQuery = '', unitId?: number) {
    const queryParams = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: searchQuery,
    });

    if (unitId !== undefined) {
        queryParams.append('unit', String(unitId));
    }

    return useQuery({
        queryKey: [BookingRequestKeys.getAllBookings, page, limit, searchQuery, unitId], 
        queryFn: () => axiosRequest.get(`${API_ROUTES.bookings.base}?${queryParams.toString()}`),
        refetchOnWindowFocus: true,
    });
}


export function GetBookingDetails(bookingId: string) {
    return useQuery({
        queryKey: [BookingRequestKeys.createBooking], 
        queryFn: () => axiosRequest.get(
            `${API_ROUTES.bookings.details(bookingId)}`,

        ),
        refetchOnWindowFocus: true,
    });
}


export function CreateBooking() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ payload }: { payload: ICreateBooking }) =>
        axiosRequest.post(API_ROUTES.bookings.base, payload),

        onSuccess: () => {
            // Invalidate the specific property query so it refetches
            queryClient.invalidateQueries({ queryKey: [BookingRequestKeys.createBooking] });
        },
    });
}


export function UpdateBookingDetails() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ bookingId, payload }: { bookingId: number, payload: IUpdateBooking }) =>
        axiosRequest.put(API_ROUTES.bookings.details(String(bookingId)), payload),

        onSuccess: () => {
            // Invalidate the specific property query so it refetches
            queryClient.invalidateQueries({ queryKey: [BookingRequestKeys.updateBookingDetails] });
        },
    });
}
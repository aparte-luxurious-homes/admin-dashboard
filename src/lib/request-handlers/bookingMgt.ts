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

export function GetAllBookings(page=1, limit=10, searchQuery = '') {
    return useQuery({
        queryKey: [BookingRequestKeys.getAllBookings, page, limit, searchQuery], 
        queryFn: () => axiosRequest.get(
            `${API_ROUTES.bookings.base}?page=${page}&limit=${limit}&search=${searchQuery}`
        ),
        refetchOnWindowFocus: true,
    });
}


export function GetBookingDetails(bookingId: number) {
    return useQuery({
        queryKey: [BookingRequestKeys.createBooking], 
        queryFn: () => axiosRequest.post(
            `${API_ROUTES.bookings.base}`,

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
        axiosRequest.put(API_ROUTES.bookings.details(bookingId), payload),

        onSuccess: () => {
            // Invalidate the specific property query so it refetches
            queryClient.invalidateQueries({ queryKey: [BookingRequestKeys.updateBookingDetails] });
        },
    });
}
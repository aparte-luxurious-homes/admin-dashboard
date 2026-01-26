import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosRequest from "../api";
import { API_ROUTES } from "../routes/endpoints";
import { ICreateBooking, IUpdateBooking } from "@/src/components/booking-mgt/types";

enum BookingRequestKeys {
    getAllBookings = "getAllBookings",
    getBookingDetails = "getBookingDetails",
    updateBookingDetails = "updateBookingDetails",
    createBooking = "createBooking",
    deleteBooking = "deleteBooking",
}

export function GetAllBookings(page = 1, limit = 10, searchQuery = '', unitId?: string | number) {
    const queryParams = new URLSearchParams({
        page: String(page),
        size: String(limit),
        search: searchQuery,
    });

    if (unitId !== undefined) {
        queryParams.append('unit_id', String(unitId));
    }

    return useQuery({
        queryKey: [BookingRequestKeys.getAllBookings, page, limit, searchQuery, unitId],
        queryFn: () => axiosRequest.get(`${API_ROUTES.bookings.base}?${queryParams.toString()}`),
        refetchOnWindowFocus: true,
    });
}

export function GetBookingDetails(bookingId: string) {
    return useQuery({
        queryKey: [BookingRequestKeys.getBookingDetails, bookingId],
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
            queryClient.invalidateQueries({ queryKey: [BookingRequestKeys.getAllBookings] });
        },
    });
}

export function UpdateBookingDetails() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ bookingId, payload }: { bookingId: string | number, payload: IUpdateBooking }) =>
            axiosRequest.put(API_ROUTES.bookings.details(String(bookingId)), payload),

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [BookingRequestKeys.updateBookingDetails] });
            queryClient.invalidateQueries({ queryKey: [BookingRequestKeys.getAllBookings] });
        },
    });
}

export function DeleteBooking() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ bookingId }: { bookingId: string | number }) =>
            axiosRequest.delete(API_ROUTES.bookings.details(String(bookingId))),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [BookingRequestKeys.getAllBookings] });
        },
    });
}
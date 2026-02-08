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
    retryBookingPayment = "retryBookingPayment",
    uploadPaymentProof = "uploadPaymentProof",
}

export function UploadPaymentProof() {
    return useMutation({
        mutationFn: ({ payload }: { payload: FormData }) =>
            axiosRequest.post(`${API_ROUTES.bookings.base}/upload-payment-proof`, payload, {
                headers: {
                    // This will be overridden by transformRequest
                    "Content-Type": "multipart/form-data"
                },
                transformRequest: (data, headers) => {
                    // Delete the Content-Type header so the browser can set it with the correct boundary
                    if (headers) {
                        delete headers['Content-Type'];
                    }
                    return data;
                },
            }),
    });
}

export function GetAllBookings(
    page = 1,
    limit = 10,
    searchQuery = '',
    unitId?: string | number,
    propertyId?: string | number,
    status?: string,
    startDateFrom?: string,
    startDateTo?: string
) {
    const queryParams = new URLSearchParams({
        page: String(page),
        size: String(limit),
        search: searchQuery,
    });

    if (unitId !== undefined) {
        queryParams.append('unit_id', String(unitId));
    }

    if (propertyId !== undefined) {
        queryParams.append('property_id', String(propertyId));
    }

    if (status) {
        queryParams.append('status', status);
    }

    if (startDateFrom) {
        queryParams.append('start_date_from', startDateFrom);
    }

    if (startDateTo) {
        queryParams.append('start_date_to', startDateTo);
    }

    return useQuery({
        queryKey: [BookingRequestKeys.getAllBookings, page, limit, searchQuery, unitId, propertyId, status, startDateFrom, startDateTo],
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
        mutationFn: ({ bookingId, cancellationReason }: { bookingId: string | number, cancellationReason?: string }) =>
            axiosRequest.delete(API_ROUTES.bookings.details(String(bookingId)), {
                data: { cancellation_reason: cancellationReason || 'Deleted by admin' }
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [BookingRequestKeys.getAllBookings] });
        },
    });
}

export function RetryBookingPayment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ bookingId }: { bookingId: string | number }) =>
            axiosRequest.post(`${API_ROUTES.bookings.details(String(bookingId))}/retry-payment`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [BookingRequestKeys.getAllBookings] });
            queryClient.invalidateQueries({ queryKey: [BookingRequestKeys.getBookingDetails] });
        },
    });
}

export function CheckInBooking() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ bookingId }: { bookingId: string | number }) =>
            axiosRequest.post(`${API_ROUTES.bookings.details(String(bookingId))}/check-in`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [BookingRequestKeys.getAllBookings] });
            queryClient.invalidateQueries({ queryKey: [BookingRequestKeys.getBookingDetails] });
        },
    });
}

export function CheckOutBooking() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ bookingId }: { bookingId: string | number }) =>
            axiosRequest.post(`${API_ROUTES.bookings.details(String(bookingId))}/check-out`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [BookingRequestKeys.getAllBookings] });
            queryClient.invalidateQueries({ queryKey: [BookingRequestKeys.getBookingDetails] });
        },
    });
}

export function RefundCautionFee() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ bookingId }: { bookingId: string | number }) =>
            axiosRequest.post(`${API_ROUTES.bookings.details(String(bookingId))}/refund-caution`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [BookingRequestKeys.getAllBookings] });
            queryClient.invalidateQueries({ queryKey: [BookingRequestKeys.getBookingDetails] });
        },
    });
}

export function RequestCancellation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ bookingId, cancellationReason }: { bookingId: string | number, cancellationReason: string }) =>
            axiosRequest.post(`${API_ROUTES.bookings.details(String(bookingId))}/request-cancellation`, { cancellation_reason: cancellationReason }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [BookingRequestKeys.getAllBookings] });
            queryClient.invalidateQueries({ queryKey: [BookingRequestKeys.getBookingDetails] });
        },
    });
}

export function ApproveCancellation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ bookingId }: { bookingId: string | number }) =>
            axiosRequest.post(`${API_ROUTES.bookings.details(String(bookingId))}/approve-cancellation`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [BookingRequestKeys.getAllBookings] });
            queryClient.invalidateQueries({ queryKey: [BookingRequestKeys.getBookingDetails] });
        },
    });
}
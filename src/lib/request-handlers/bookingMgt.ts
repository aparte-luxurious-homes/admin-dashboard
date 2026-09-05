import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosRequest from "../api";
import { API_ROUTES } from "../routes/endpoints";
import {
  ICreateBooking,
  IUpdateBooking,
} from "@/src/components/booking-mgt/types";

enum BookingRequestKeys {
  getAllBookings = "getAllBookings",
  getBookingDetails = "getBookingDetails",
  updateBookingDetails = "updateBookingDetails",
  createBooking = "createBooking",
  deleteBooking = "deleteBooking",
  retryBookingPayment = "retryBookingPayment",
  uploadPaymentProof = "uploadPaymentProof",
  approvalPendingCount = "approvalPendingCount",
}

export function GetApprovalPendingCount() {
  return useQuery({
    queryKey: [BookingRequestKeys.approvalPendingCount],
    queryFn: () =>
      axiosRequest.get(
        `${API_ROUTES.bookings.base}?status=APPROVAL_PENDING&page=1&size=1`,
      ),
    select: (resp: any): number => {
      const total = resp?.data?.data?.total ?? resp?.data?.total ?? 0;
      return typeof total === "number" ? total : Number(total) || 0;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function UploadPaymentProof() {
  return useMutation({
    mutationFn: ({ payload }: { payload: FormData }) =>
      axiosRequest.post(
        `${API_ROUTES.bookings.base}/upload-payment-proof`,
        payload,
        {
          headers: {
            // This will be overridden by transformRequest
            "Content-Type": "multipart/form-data",
          },
          transformRequest: (data, headers) => {
            // Delete the Content-Type header so the browser can set it with the correct boundary
            if (headers) {
              delete headers["Content-Type"];
            }
            return data;
          },
        },
      ),
  });
}

export function GuestLookup(search?: string) {
  // Uses the /bookings/guests/directory endpoint — broader scope than the
  // referrer-restricted /bookings/guest-lookup. Returns {id, first_name,
  // email, phone} only so agents can book on behalf of any guest, not just
  // their own referrals. Response shape nests {meta, data} inside `data`.
  return useQuery({
    queryKey: ["guestDirectory", search],
    queryFn: () =>
      axiosRequest.get(
        `${API_ROUTES.bookings.guestsDirectory}?search=${encodeURIComponent(search!)}&size=10`,
      ),
    enabled: !!search && search.length >= 2,
    select: (resp: any) => {
      // Normalize to the shape CreateBookingView expects: { data: { data: Guest[] } }
      const inner = resp?.data?.data;
      const guests = Array.isArray(inner?.data)
        ? inner.data
        : Array.isArray(inner)
          ? inner
          : [];
      return { data: { data: guests } };
    },
  });
}

export function GetAllBookings(
  page = 1,
  limit = 10,
  searchQuery = "",
  unitId?: string | number,
  propertyId?: string | number,
  status?: string,
  startDateFrom?: string,
  startDateTo?: string,
  sortBy?: string,
) {
  const queryParams = new URLSearchParams({
    page: String(page),
    size: String(limit),
    search: searchQuery,
  });

  if (sortBy) {
    queryParams.append("sort_by", sortBy);
  }

  if (unitId !== undefined) {
    queryParams.append("unit_id", String(unitId));
  }

  if (propertyId !== undefined) {
    queryParams.append("property_id", String(propertyId));
  }

  if (status) {
    queryParams.append("status", status);
  }

  if (startDateFrom) {
    queryParams.append("start_date_from", startDateFrom);
  }

  if (startDateTo) {
    queryParams.append("start_date_to", startDateTo);
  }

  return useQuery({
    queryKey: [
      BookingRequestKeys.getAllBookings,
      page,
      limit,
      searchQuery,
      unitId,
      propertyId,
      status,
      startDateFrom,
      startDateTo,
      // Part of the key: without it, changing the sort shows the previous
      // ordering from cache until the refetch lands.
      sortBy,
    ],
    queryFn: () =>
      axiosRequest.get(`${API_ROUTES.bookings.base}?${queryParams.toString()}`),
    refetchOnWindowFocus: true,
  });
}

export function GetBookingDetails(bookingId: string) {
  return useQuery({
    queryKey: [BookingRequestKeys.getBookingDetails, bookingId],
    queryFn: () =>
      axiosRequest.get(`${API_ROUTES.bookings.details(bookingId)}`),
    refetchOnWindowFocus: true,
  });
}

export function CreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload }: { payload: ICreateBooking }) =>
      axiosRequest.post(API_ROUTES.bookings.base, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [BookingRequestKeys.getAllBookings],
      });
    },
  });
}

export function UpdateBookingDetails() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      bookingId,
      payload,
    }: {
      bookingId: string | number;
      payload: IUpdateBooking;
    }) =>
      axiosRequest.put(API_ROUTES.bookings.details(String(bookingId)), payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [BookingRequestKeys.updateBookingDetails],
      });
      queryClient.invalidateQueries({
        queryKey: [BookingRequestKeys.getAllBookings],
      });
    },
  });
}

export function DeleteBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      bookingId,
      cancellationReason,
    }: {
      bookingId: string | number;
      cancellationReason?: string;
    }) =>
      axiosRequest.delete(API_ROUTES.bookings.details(String(bookingId)), {
        data: { cancellation_reason: cancellationReason || "Deleted by admin" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [BookingRequestKeys.getAllBookings],
      });
    },
  });
}

export function RetryBookingPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId }: { bookingId: string | number }) =>
      axiosRequest.post(
        `${API_ROUTES.bookings.details(String(bookingId))}/retry-payment`,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [BookingRequestKeys.getAllBookings],
      });
      queryClient.invalidateQueries({
        queryKey: [BookingRequestKeys.getBookingDetails],
      });
    },
  });
}

// Admin remediation: attach a gateway-side payment reference (copied from
// Paystack/Monnify/Flutterwave dashboard) to a stuck booking and finalize it.
// Use when RetryBookingPayment can't resolve because the booking is stuck on
// an abandoned alternate payment-link reference. Backend gates this to
// {SUPER_ADMIN, ADMIN, OPERATIONS_ADMIN}.
export function ReconcileBookingPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      bookingId,
      provider,
      payment_reference,
    }: {
      bookingId: string | number;
      provider: "PAYSTACK" | "MONNIFY" | "FLUTTERWAVE";
      payment_reference: string;
    }) =>
      axiosRequest.post(API_ROUTES.bookings.reconcilePayment(bookingId), {
        provider,
        payment_reference,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [BookingRequestKeys.getAllBookings],
      });
      queryClient.invalidateQueries({
        queryKey: [BookingRequestKeys.getBookingDetails],
      });
    },
  });
}

export function ResendPaymentLink() {
  const queryClient = useQueryClient();
  return useMutation({
    // `notify=false` returns a fresh checkout URL without emailing or
    // SMSing the guest — used by the "Pay on Behalf" flow where the
    // agent is handling payment themselves.
    mutationFn: ({
      bookingId,
      notify = true,
    }: {
      bookingId: string | number;
      notify?: boolean;
    }) =>
      axiosRequest.post(
        `${API_ROUTES.bookings.details(String(bookingId))}/payment-link/resend?notify=${notify ? "true" : "false"}`,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [BookingRequestKeys.getAllBookings],
      });
      queryClient.invalidateQueries({
        queryKey: [BookingRequestKeys.getBookingDetails],
      });
    },
  });
}

export function CheckInBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId }: { bookingId: string | number }) =>
      axiosRequest.post(
        `${API_ROUTES.bookings.details(String(bookingId))}/check-in`,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [BookingRequestKeys.getAllBookings],
      });
      queryClient.invalidateQueries({
        queryKey: [BookingRequestKeys.getBookingDetails],
      });
    },
  });
}

export function CheckOutBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId }: { bookingId: string | number }) =>
      axiosRequest.post(
        `${API_ROUTES.bookings.details(String(bookingId))}/check-out`,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [BookingRequestKeys.getAllBookings],
      });
      queryClient.invalidateQueries({
        queryKey: [BookingRequestKeys.getBookingDetails],
      });
    },
  });
}

export function RefundCautionFee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      bookingId,
      payload,
    }: {
      bookingId: string | number;
      payload: { should_refund: boolean; notes?: string };
    }) =>
      axiosRequest.post(
        `${API_ROUTES.bookings.details(String(bookingId))}/refund-caution`,
        payload,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [BookingRequestKeys.getAllBookings],
      });
      queryClient.invalidateQueries({
        queryKey: [BookingRequestKeys.getBookingDetails],
      });
    },
  });
}

export function RequestCancellation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      bookingId,
      cancellationReason,
    }: {
      bookingId: string | number;
      cancellationReason: string;
    }) =>
      axiosRequest.post(
        `${API_ROUTES.bookings.details(String(bookingId))}/request-cancellation`,
        { cancellation_reason: cancellationReason },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [BookingRequestKeys.getAllBookings],
      });
      queryClient.invalidateQueries({
        queryKey: [BookingRequestKeys.getBookingDetails],
      });
    },
  });
}

export function ApproveCancellation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId }: { bookingId: string | number }) =>
      axiosRequest.post(
        `${API_ROUTES.bookings.details(String(bookingId))}/approve-cancellation`,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [BookingRequestKeys.getAllBookings],
      });
      queryClient.invalidateQueries({
        queryKey: [BookingRequestKeys.getBookingDetails],
      });
    },
  });
}

export function ApproveBookingRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId }: { bookingId: string | number }) =>
      axiosRequest.post(API_ROUTES.bookings.approveRequest(String(bookingId))),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [BookingRequestKeys.getAllBookings],
      });
      queryClient.invalidateQueries({
        queryKey: [BookingRequestKeys.getBookingDetails],
      });
    },
  });
}

export function RejectBookingRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      bookingId,
      reason,
    }: {
      bookingId: string | number;
      reason?: string;
    }) =>
      axiosRequest.post(API_ROUTES.bookings.rejectRequest(String(bookingId)), {
        reason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [BookingRequestKeys.getAllBookings],
      });
      queryClient.invalidateQueries({
        queryKey: [BookingRequestKeys.getBookingDetails],
      });
    },
  });
}

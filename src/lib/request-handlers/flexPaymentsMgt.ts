import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { flexPaymentsApi } from "../flexPaymentsApi";
import { FlexPaymentListParams } from "../types/flexPayments";

export const flexPaymentKeys = {
    all: ["flexPayments"] as const,
    list: (params: FlexPaymentListParams) => ["flexPayments", "list", params] as const,
};

/** Admin monitoring list. */
export function GetFlexPayments(params: FlexPaymentListParams) {
    return useQuery({
        queryKey: flexPaymentKeys.list(params),
        queryFn: () => flexPaymentsApi.listPlans(params),
        placeholderData: keepPreviousData,
        // Not-connected is a constant, not a blip; don't hammer it.
        retry: false,
    });
}

export function ResendContributorInvitation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ planId, contributorId }: { planId: string; contributorId: string }) =>
            flexPaymentsApi.resendInvitation(planId, contributorId),
        // The booking payload carries the plan, so refresh bookings too.
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: flexPaymentKeys.all });
            qc.invalidateQueries({ queryKey: ["getBookingDetails"] });
        },
    });
}

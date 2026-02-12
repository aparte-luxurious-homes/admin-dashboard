import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosRequest from "../api";
import { API_ROUTES } from "../routes/endpoints"; // Ensure endpoints are defined

// Keys for caching
export enum FinanceRequestKeys {
    getAllTransactions = "getAllTransactions",
    getTransactionDetails = "getTransactionDetails",
    approveRefund = "approveRefund",
}

export interface ApproveRefundPayload {
    refund_method: string;
    notes?: string;
    refund_proof?: string;
}

export function ApproveRefund() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ transactionId, payload }: { transactionId: string, payload: ApproveRefundPayload }) =>
            axiosRequest.post(API_ROUTES.transactions.approveRefund(transactionId), payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [FinanceRequestKeys.getAllTransactions] });
            queryClient.invalidateQueries({ queryKey: [FinanceRequestKeys.getTransactionDetails] });
        },
    });
}

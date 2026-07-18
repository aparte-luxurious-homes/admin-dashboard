import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosRequest from "../api";
import { API_ROUTES } from "../routes/endpoints"; // Ensure endpoints are defined

// Keys for caching
export enum FinanceRequestKeys {
    getAllTransactions = "getAllTransactions",
    getTransactionDetails = "getTransactionDetails",
    approveRefund = "approveRefund",
    approveWithdrawal = "approveWithdrawal",
    updateWallet = "updateWallet",
}

export interface UpdateWalletPayload {
    action: "CREDIT" | "DEBIT";
    amount: string;
    reason: string;
    comment?: string;
}

export function UpdateWallet() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ walletId, payload }: { walletId: string; payload: UpdateWalletPayload }) =>
            axiosRequest.patch(API_ROUTES.wallet.update(walletId), payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [FinanceRequestKeys.getAllTransactions] });
        },
    });
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
export function ApproveWithdrawal() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ walletId, payload }: { walletId: string, payload: any }) =>
            axiosRequest.post(API_ROUTES.wallet.approveWithdrawal(walletId), payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [FinanceRequestKeys.getAllTransactions] });
            queryClient.invalidateQueries({ queryKey: [FinanceRequestKeys.getTransactionDetails] });
        },
    });
}

export function VerifyPayoutAccount() {
    return useMutation({
        mutationFn: ({ walletId, accountId }: { walletId: string; accountId: string }) =>
            axiosRequest.post(API_ROUTES.wallet.payoutAccounts.verify(walletId, accountId)),
    });
}

export function DeletePayoutAccount() {
    return useMutation({
        mutationFn: ({ walletId, accountId }: { walletId: string; accountId: string }) =>
            axiosRequest.delete(API_ROUTES.wallet.payoutAccounts.details(walletId, accountId)),
    });
}

export interface UpdatePayoutAccountPayload {
    account_name?: string;
    bank_name?: string;
    bank_code?: string;
    account_number?: string;
}

export function UpdatePayoutAccount() {
    return useMutation({
        mutationFn: ({ walletId, accountId, payload }: { walletId: string; accountId: string; payload: UpdatePayoutAccountPayload }) =>
            axiosRequest.patch(API_ROUTES.wallet.payoutAccounts.details(walletId, accountId), payload),
    });
}

export interface RejectWithdrawalPayload {
    transaction_id: string;
    reason?: string;
}

export function RejectWithdrawal() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ walletId, payload }: { walletId: string, payload: RejectWithdrawalPayload }) =>
            axiosRequest.post(API_ROUTES.wallet.rejectWithdrawal(walletId), payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [FinanceRequestKeys.getAllTransactions] });
            queryClient.invalidateQueries({ queryKey: [FinanceRequestKeys.getTransactionDetails] });
        },
    });
}

export interface ReverseWithdrawalPayload {
    transaction_id: string;
    reason: string;
    skip_provider_check: boolean;
}

// Reverse a withdrawal that did NOT pay out (AWAITING_AUTHORIZATION / PENDING /
// SUCCESSFUL). Refunds amount + fee. By default the backend verifies the payout
// did not settle with the provider; skip_provider_check bypasses that guard for
// incidents already confirmed with the provider.
export function ReverseWithdrawal() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ walletId, payload }: { walletId: string, payload: ReverseWithdrawalPayload }) =>
            axiosRequest.post(API_ROUTES.wallet.reverseWithdrawal(walletId), payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [FinanceRequestKeys.getAllTransactions] });
            queryClient.invalidateQueries({ queryKey: [FinanceRequestKeys.getTransactionDetails] });
        },
    });
}

export function AuthorizeDisbursement() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ walletId, payload }: { walletId: string, payload: { transaction_id: string; otp: string } }) =>
            axiosRequest.post(API_ROUTES.wallet.authorizeDisbursement(walletId), payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [FinanceRequestKeys.getAllTransactions] });
            queryClient.invalidateQueries({ queryKey: [FinanceRequestKeys.getTransactionDetails] });
        },
    });
}

export function ResendDisbursementOtp() {
    return useMutation({
        mutationFn: ({ walletId, payload }: { walletId: string, payload: { transaction_id: string } }) =>
            axiosRequest.post(API_ROUTES.wallet.resendDisbursementOtp(walletId), payload),
    });
}

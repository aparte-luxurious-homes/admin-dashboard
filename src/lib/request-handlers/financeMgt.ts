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
    adjustmentRequests = "adjustmentRequests",
}

/** Where an agent sends money to fund their wallet by bank transfer. */
export interface OfflineFundingDetails {
    enabled: boolean;
    currency?: string;
    account_name?: string;
    account_number?: string;
    bank_name?: string;
    /** The agent's own email: what staff match the transfer to. */
    identifier?: string | null;
    /** Digits only, or null when no business line is configured. */
    whatsapp_number?: string | null;
}

/**
 * Served by the API rather than written into the page, so the wallet page and
 * the dashboard can never show two different account numbers.
 */
export function GetOfflineFunding(enabled: boolean = true) {
    const query = useQuery({
        queryKey: ["offlineFunding"],
        queryFn: () => axiosRequest.get(API_ROUTES.wallet.offlineFunding),
        // Bank details do not change during a session.
        staleTime: 1000 * 60 * 30,
        enabled,
        retry: 1,
    });
    const body = query.data?.data;
    const details: OfflineFundingDetails | undefined = body?.data ?? undefined;
    return { ...query, details };
}

/**
 * A manual credit or debit. The API refuses one without a reason AND either a
 * reference number or a receipt (upload it first with UploadAdjustmentReceipt).
 */
export interface UpdateWalletPayload {
    action: "CREDIT" | "DEBIT";
    amount: string;
    reason: string;
    reference_number?: string;
    receipt_url?: string;
    comment?: string;
}

export type AdjustmentStatus =
    | "PENDING" | "APPLYING" | "APPROVED" | "REJECTED" | "CANCELLED" | "FAILED";

export interface AdjustmentPerson {
    id: string;
    name: string;
    email: string;
    role: string;
}

export interface AdjustmentRequest {
    id: string;
    wallet_id: string;
    wallet_holder: AdjustmentPerson | null;
    action: "CREDIT" | "DEBIT";
    amount: string;
    currency: string;
    reason: string;
    reference_number: string | null;
    receipt_url: string | null;
    comment: string | null;
    status: AdjustmentStatus;
    requested_by: AdjustmentPerson | null;
    requested_by_role: string | null;
    decided_by: AdjustmentPerson | null;
    decided_at: string | null;
    decision_note: string | null;
    transaction_id: string | null;
    apply_error: string | null;
    created_at: string | null;
    /** Only on the PATCH response: true when it was applied at once. */
    applied?: boolean;
}

export interface AdjustmentRequestList {
    items: AdjustmentRequest[];
    total: number;
    page: number;
    size: number;
    /** Approvers only (null for requesters): the whole queue, whatever the filter. */
    pending_total: number | null;
    oldest_pending_at: string | null;
    can_approve: boolean;
}

/**
 * 200 means an admin's adjustment was applied; 202 means it was filed for
 * approval and the balance has not moved. Read `data.applied` to tell them apart.
 */
export function UpdateWallet() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ walletId, payload }: { walletId: string; payload: UpdateWalletPayload }) => {
            const response = await axiosRequest.patch(API_ROUTES.wallet.update(walletId), payload);
            return response?.data?.data as AdjustmentRequest;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [FinanceRequestKeys.getAllTransactions] });
            queryClient.invalidateQueries({ queryKey: [FinanceRequestKeys.adjustmentRequests] });
        },
    });
}

/** Stage a receipt before the adjustment is submitted; returns its URL. */
export function UploadAdjustmentReceipt() {
    return useMutation({
        mutationFn: async (file: File) => {
            const form = new FormData();
            form.append("file", file);
            const response = await axiosRequest.post(API_ROUTES.wallet.adjustmentReceipts, form, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return response?.data?.data?.url as string;
        },
    });
}

export interface AdjustmentRequestFilters {
    status?: AdjustmentStatus;
    walletId?: string;
    page?: number;
    size?: number;
}

/** Approvers see every request; operations and support see their own. */
export function GetAdjustmentRequests(filters: AdjustmentRequestFilters = {}, enabled = true) {
    const { status, walletId, page = 1, size = 20 } = filters;
    return useQuery({
        queryKey: [FinanceRequestKeys.adjustmentRequests, status ?? "ALL", walletId ?? "", page, size],
        queryFn: async () => {
            const response = await axiosRequest.get(API_ROUTES.wallet.adjustmentRequests, {
                params: { status, wallet_id: walletId, page, size },
            });
            return response?.data?.data as AdjustmentRequestList;
        },
        enabled,
        staleTime: 30 * 1000,
        refetchOnWindowFocus: true,
    });
}

function useAdjustmentDecision(route: (id: string) => string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, note }: { id: string; note?: string }) => {
            const response = await axiosRequest.post(route(id), note ? { note } : {});
            return response?.data?.data as AdjustmentRequest;
        },
        // Settle on error too: a 409 FAILED approval still changed the row.
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: [FinanceRequestKeys.adjustmentRequests] });
            queryClient.invalidateQueries({ queryKey: [FinanceRequestKeys.getAllTransactions] });
        },
    });
}

export const ApproveAdjustment = () => useAdjustmentDecision(API_ROUTES.wallet.approveAdjustment);
export const RejectAdjustment = () => useAdjustmentDecision(API_ROUTES.wallet.rejectAdjustment);
export const CancelAdjustment = () => useAdjustmentDecision(API_ROUTES.wallet.cancelAdjustment);

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

export interface RetryWithdrawalPayload {
    transaction_id: string;
    note?: string;
}

// Re-send a reversed (FAILED + refunded) withdrawal to the same payout account.
// Re-debits amount + current fee and approves it in one step. The backend refuses
// admin-rejected withdrawals, never-refunded ones, and double retries (409).
export function RetryWithdrawal() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ walletId, payload }: { walletId: string, payload: RetryWithdrawalPayload }) =>
            axiosRequest.post(API_ROUTES.wallet.retryWithdrawal(walletId), payload),
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

// Re-query the provider for ONE withdrawal and apply the result. The
// counterpart to Reverse: Reverse assumes the payout did not happen and
// refunds, this asks the provider what actually happened and acts on the
// answer. Reverse 409s while a payout is genuinely in flight, so before this
// existed a stuck-PENDING row had no operator action at all.
export function RefreshWithdrawalStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ walletId, transactionId }: { walletId: string, transactionId: string }) =>
            axiosRequest.post(API_ROUTES.wallet.refreshWithdrawalStatus(walletId, transactionId)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [FinanceRequestKeys.getAllTransactions] });
            queryClient.invalidateQueries({ queryKey: [FinanceRequestKeys.getTransactionDetails] });
        },
    });
}

// Bulk equivalent — runs the reconciliation sweep across every stuck payout.
// Gated on verify_job_token_or_admin server-side, so an admin JWT is accepted.
export function RunDisbursementSweep() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => axiosRequest.post(API_ROUTES.wallet.reconcileDisbursementsJob),
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

/**
 * Flexible-payments data adapter: the ONLY module that knows how payment-plan
 * data is fetched or changed (api-v1 services/payment_plans). Hooks and
 * components go through `flexPaymentsApi` and never call axios directly.
 */
import axiosRequest from "./api";
import { API_ROUTES } from "./routes/endpoints";
import { FlexPaymentListParams, FlexPaymentListResult } from "./types/flexPayments";

export interface FlexPaymentsApi {
    listPlans(params: FlexPaymentListParams): Promise<FlexPaymentListResult>;
    /** Re-send a contributor's payment link. */
    resendInvitation(planId: string, contributorId: string): Promise<void>;
    /** Every plan matching the filters, as the API's CSV. */
    exportPlans(params: Omit<FlexPaymentListParams, "page" | "limit">): Promise<Blob>;
}

/** Kept so screens written against the placeholder keep compiling. */
export class FlexPaymentsNotConnectedError extends Error {
    constructor() {
        super("The payments service isn't connected yet.");
        this.name = "FlexPaymentsNotConnectedError";
    }
}

/** Query params the API understands; "ALL" / "NONE" mean "no filter". */
function filters(params: Omit<FlexPaymentListParams, "page" | "limit">) {
    return {
        ...(params.search ? { search: params.search } : {}),
        ...(params.kind && params.kind !== "ALL" ? { kind: params.kind } : {}),
        ...(params.status && params.status !== "ALL" ? { status: params.status } : {}),
        ...(params.attention && params.attention !== "NONE" ? { attention: params.attention } : {}),
    };
}

export const flexPaymentsApi: FlexPaymentsApi = {
    async listPlans(params) {
        const res = await axiosRequest.get(API_ROUTES.admin.paymentPlans.base, {
            params: { page: params.page, limit: params.limit, ...filters(params) },
        });
        const data = res.data?.data ?? {};
        return { items: data.items ?? [], total: data.total ?? 0 };
    },
    async resendInvitation(planId, contributorId) {
        await axiosRequest.post(API_ROUTES.admin.paymentPlans.resend(planId, contributorId));
    },
    async exportPlans(params) {
        const res = await axiosRequest.get(API_ROUTES.admin.paymentPlans.export, {
            params: filters(params),
            responseType: "blob",
        });
        return res.data as Blob;
    },
};

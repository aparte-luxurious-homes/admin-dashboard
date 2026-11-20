/**
 * Flexible-payments data adapter — the ONLY module that knows how payment-plan
 * data is fetched or changed.
 *
 * The backend contract for payment plans hasn't been agreed, so there is no
 * network implementation (and no entries in `API_ROUTES`). Every call rejects
 * with `FlexPaymentsNotConnectedError`, which the UI shows as an error state.
 *
 * When the spec arrives: implement `FlexPaymentsApi` against axios, map the
 * responses onto the types in `types/flexPayments.ts`, export it as
 * `flexPaymentsApi`, and flip `FLEX_PAYMENTS_API_CONNECTED` in
 * `lib/flexPayments.ts`. Hooks and components don't change.
 */
import { FlexPaymentListParams, FlexPaymentListResult } from "./types/flexPayments";

export interface FlexPaymentsApi {
    listPlans(params: FlexPaymentListParams): Promise<FlexPaymentListResult>;
    /** Re-send a contributor's payment link. */
    resendInvitation(planId: string, contributorId: string): Promise<void>;
}

export class FlexPaymentsNotConnectedError extends Error {
    constructor() {
        super("The payments service isn't connected yet.");
        this.name = "FlexPaymentsNotConnectedError";
    }
}

const reject = () => Promise.reject(new FlexPaymentsNotConnectedError());

export const flexPaymentsApi: FlexPaymentsApi = {
    listPlans: reject,
    resendInvitation: reject,
};

import { FLEX_STATUS_LABEL } from "@/src/lib/flexPayments";
import { FlexPaymentStatus } from "@/src/lib/types/flexPayments";

const STYLES: Record<FlexPaymentStatus, string> = {
    [FlexPaymentStatus.PENDING]: "bg-gray-100 text-gray-700",
    [FlexPaymentStatus.PROCESSING]: "bg-blue-100 text-blue-800",
    [FlexPaymentStatus.PARTIALLY_PAID]: "bg-amber-100 text-amber-800",
    [FlexPaymentStatus.FULLY_PAID]: "bg-green-100 text-green-800",
    [FlexPaymentStatus.FAILED]: "bg-red-100 text-red-700",
    [FlexPaymentStatus.EXPIRED]: "bg-orange-100 text-orange-800",
    [FlexPaymentStatus.REFUNDED]: "bg-purple-100 text-purple-800",
};

/** Payment status — a separate axis from the booking's own status chip. */
export default function FlexPaymentStatusChip({ status }: { status: FlexPaymentStatus }) {
    return (
        <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}>
            {FLEX_STATUS_LABEL[status]}
        </span>
    );
}

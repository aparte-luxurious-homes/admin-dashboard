"use client";

import TransactionListView from "@/src/components/transactions/TransactionListView";
import { API_ROUTES } from "@/src/lib/routes/endpoints";

// Map each transaction to the existing per-category detail page so we
// don't have to maintain a separate `/transactions/all/[id]` route.
const resolveRowHref = (tx: { id: string; transaction_type?: string; action?: string }) => {
  const type = (tx.transaction_type || "").toUpperCase();
  const action = (tx.action || "").toUpperCase();

  if (type === "WITHDRAWAL") return `/transactions/withdrawals/${tx.id}`;
  if (type === "REFUND") return `/transactions/refunds/${tx.id}`;
  if (type === "BOOKING" && action === "DEBIT") return `/transactions/booking-withdrawals/${tx.id}`;
  // PAYMENT, BOOKING (CREDIT), ADJUSTMENT, DISPUTE, and any other type
  // share the generic detail view rendered under /transactions/payments/[id].
  return `/transactions/payments/${tx.id}`;
};

const AllTransactions = () => {
  return (
    <TransactionListView
      title="All Transactions"
      description="Complete overview of all transactions with summary totals"
      basePath="/transactions/all"
      apiUrl={API_ROUTES.transactions.base}
      resolveRowHref={resolveRowHref}
    />
  );
};

export default AllTransactions;

"use client";

import TransactionListView from "@/src/components/transactions/TransactionListView";
import { API_ROUTES } from "@/src/lib/routes/endpoints";

const Refunds = () => {
  return (
    <TransactionListView
      title="Refund History"
      description="Monitor and manage all processed refunds and reversals"
      basePath="/transactions/refunds"
      apiUrl={API_ROUTES.transactions.base}
      filters={{
        tx_type: "REFUND"
      }}
    />
  );
};

export default Refunds;

"use client";

import TransactionListView from "@/src/components/transactions/TransactionListView";
import { API_ROUTES } from "@/src/lib/routes/endpoints";

const Payments = () => {
  return (
    <TransactionListView
      title="Payment History"
      description="Track and monitor all incoming payments and transactions"
      basePath="/transactions/payments"
      apiUrl={API_ROUTES.transactions.base}
      filters={{
        tx_type: "PAYMENT,BOOKING"
      }}
    />
  );
};

export default Payments;

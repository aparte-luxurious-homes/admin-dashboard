"use client";

import TransactionListView from "@/src/components/transactions/TransactionListView";
import { API_ROUTES } from "@/src/lib/routes/endpoints";

const Withdrawals = () => {
  return (
    <TransactionListView
      title="Withdrawal Requests"
      description="Manage and monitor user withdrawal requests and payouts"
      basePath="/transactions/withdrawals"
      apiUrl={API_ROUTES.transactions.base}
      filters={{
        tx_type: "WITHDRAWAL"
      }}
    />
  );
};

export default Withdrawals;

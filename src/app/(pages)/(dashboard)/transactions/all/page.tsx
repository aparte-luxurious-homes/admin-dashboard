"use client";

import TransactionListView from "@/src/components/transactions/TransactionListView";
import { API_ROUTES } from "@/src/lib/routes/endpoints";

const AllTransactions = () => {
  return (
    <TransactionListView
      title="All Transactions"
      description="Complete overview of all transactions with summary totals"
      basePath="/transactions/all"
      apiUrl={API_ROUTES.transactions.base}
    />
  );
};

export default AllTransactions;

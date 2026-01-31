"use client";

import TransactionDetailView from "@/src/components/transactions/TransactionDetailView";

const WithdrawalInfoPage = () => {
  return (
    <TransactionDetailView
      title="Withdrawal Info"
      backLink="/transactions/withdrawals"
      backLinkName="All Withdrawals"
    />
  );
};

export default WithdrawalInfoPage;

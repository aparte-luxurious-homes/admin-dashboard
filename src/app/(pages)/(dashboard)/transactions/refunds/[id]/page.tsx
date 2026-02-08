"use client";

import TransactionDetailView from "@/src/components/transactions/TransactionDetailView";

const RefundInfoPage = () => {
  return (
    <TransactionDetailView
      title="Refund Info"
      backLink="/transactions/refunds"
      backLinkName="All Refunds"
    />
  );
};

export default RefundInfoPage;

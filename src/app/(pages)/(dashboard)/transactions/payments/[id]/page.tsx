"use client";

import TransactionDetailView from "@/src/components/transactions/TransactionDetailView";

const PaymentInfoPage = () => {
  return (
    <TransactionDetailView
      title="Payment Info"
      backLink="/transactions/payments"
      backLinkName="All Payments"
    />
  );
};

export default PaymentInfoPage;

"use client";

import TransactionDetailView from "@/src/components/transactions/TransactionDetailView";

const BookingWithdrawalInfoPage = () => {
  return (
    <TransactionDetailView
      title="Booking Withdrawal Info"
      backLink="/transactions/booking-withdrawals"
      backLinkName="All Booking Withdrawals"
    />
  );
};

export default BookingWithdrawalInfoPage;

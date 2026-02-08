"use client";

import TransactionListView from "@/src/components/transactions/TransactionListView";
import { API_ROUTES } from "@/src/lib/routes/endpoints";

const BookingWithdrawals = () => {
  return (
    <TransactionListView
      title="Booking Payouts"
      description="Monitor withdrawals and payouts related to specific bookings"
      basePath="/transactions/booking-withdrawals"
      apiUrl={API_ROUTES.transactions.base}
      filters={{
        tx_type: "BOOKING",
        action: "DEBIT"
      }}
    />
  );
};

export default BookingWithdrawals;

"use client";

import Grid from "@mui/material/Grid2";
import StatsCard from "@/src/components/statcard/statcard";

interface Wallet {
  id: string;
  balance: string | number;
  currency: string;
}

interface TotalStats {
  lastMonthAmount?: number;
  percentageChange?: string;
}

interface TotalPropertiesStats {
  lastMonthTotal?: number;
  percentageChange?: string;
}

interface DashboardKpiRowProps {
  isOwner: boolean;
  isAgent: boolean;
  wallet: Wallet | null;
  totalRevenue?: TotalStats;
  totalPayments?: TotalStats;
  totalProperties?: TotalPropertiesStats;
}

const pct = (s?: string) => parseFloat(s ?? "0") || 0;

const DashboardKpiRow = ({
  isOwner,
  isAgent,
  wallet,
  totalRevenue,
  totalPayments,
  totalProperties,
}: DashboardKpiRowProps) => {
  const showWallet = isOwner || isAgent;
  const colSize = showWallet ? 3 : 4;

  return (
    <Grid container spacing={2}>
      {showWallet && (
        <Grid size={{ xs: 12, sm: 6, md: 3, lg: 3 }}>
          <StatsCard
            title="Wallet Balance"
            amount={`₦${wallet ? (parseFloat(wallet.balance as string) || 0).toLocaleString() : "0.00"}`}
            percentage={0}
            isIncrease={true}
          />
        </Grid>
      )}
      <Grid size={{ xs: 12, sm: 6, md: colSize, lg: colSize }}>
        <StatsCard
          title="Total Revenue"
          amount={`₦${(totalRevenue?.lastMonthAmount ?? 0).toLocaleString()}`}
          percentage={pct(totalRevenue?.percentageChange)}
          isIncrease={pct(totalRevenue?.percentageChange) > 0}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: colSize, lg: colSize }}>
        <StatsCard
          title="Total Payments Processed"
          amount={`₦${(totalPayments?.lastMonthAmount ?? 0).toLocaleString()}`}
          percentage={pct(totalPayments?.percentageChange)}
          isIncrease={pct(totalPayments?.percentageChange) > 0}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: colSize, lg: colSize }}>
        <StatsCard
          title="Total Property Listed"
          amount={`${(totalProperties?.lastMonthTotal ?? 0).toLocaleString()}`}
          percentage={pct(totalProperties?.percentageChange)}
          isIncrease={pct(totalProperties?.percentageChange) > 0}
        />
      </Grid>
    </Grid>
  );
};

export default DashboardKpiRow;

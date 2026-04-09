import { FaChartPie } from "react-icons/fa";
import { formatMoney } from "@/src/lib/utils";
import { NormalizedBooking } from "./utils";

interface BookingRevenueSplitProps {
  booking: NormalizedBooking;
}

export default function BookingRevenueSplit({ booking }: BookingRevenueSplitProps) {
  const split = booking.revenueSplit;
  if (!split) return null;

  const hasAgent = split.agent_amount > 0;
  const platformPercent = hasAgent
    ? split.percentages.platform
    : split.percentages.platform + split.percentages.agent;

  return (
    <div className="border border-zinc-200 rounded-xl overflow-hidden">
      <div className="px-4 sm:px-5 py-3 bg-emerald-50 border-b border-emerald-100">
        <h2 className="text-sm sm:text-base font-semibold text-emerald-800 flex items-center gap-2">
          <FaChartPie />
          Revenue Split
        </h2>
      </div>
      <div className="p-4 sm:p-5">
        <div className="space-y-2">
          <div className="flex justify-between items-center py-1 text-xs sm:text-sm">
            <div>
              <span className="text-zinc-600 block">Owner</span>
              <span className="text-[10px] text-zinc-400">({split.percentages.owner}%)</span>
            </div>
            <span className="font-medium text-zinc-800">{formatMoney(split.owner_amount)}</span>
          </div>
          {hasAgent && (
            <div className="flex justify-between items-center py-1 text-xs sm:text-sm">
              <div>
                <span className="text-zinc-600 block">Agent</span>
                <span className="text-[10px] text-zinc-400">({split.percentages.agent}%)</span>
              </div>
              <span className="font-medium text-zinc-800">{formatMoney(split.agent_amount)}</span>
            </div>
          )}
          <div className="flex justify-between items-center py-1 text-xs sm:text-sm">
            <div>
              <span className="text-zinc-600 block">Platform</span>
              <span className="text-[10px] text-zinc-400">({platformPercent}%)</span>
            </div>
            <span className="font-medium text-zinc-800">{formatMoney(split.platform_amount)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-t border-zinc-200 mt-2 text-sm">
            <span className="font-semibold text-zinc-800">Total</span>
            <span className="font-bold text-emerald-600">{formatMoney(booking.totalPrice)}</span>
          </div>
        </div>
        <div className="mt-3 p-2 bg-zinc-50 rounded-lg border border-zinc-100 italic text-[10px] text-zinc-500">
          Auto-calculated and credited upon confirmation
        </div>
      </div>
    </div>
  );
}

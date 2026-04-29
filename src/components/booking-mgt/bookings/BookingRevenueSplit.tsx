import { FaChartPie } from "react-icons/fa";
import { formatMoney } from "@/src/lib/utils";
import { NormalizedBooking } from "./utils";

interface BookingRevenueSplitProps {
  booking: NormalizedBooking;
}

export default function BookingRevenueSplit({ booking }: BookingRevenueSplitProps) {
  const split = booking.revenueSplit;
  if (!split) return null;

  // Backwards-compat: older responses may not include these fields.
  const referrerAmount = split.referrer_amount ?? 0;
  const referrerPct = split.percentages.referrer ?? 0;
  const splittingBase = split.splitting_base;
  const ownerOnConfirm = split.stages?.on_confirmation.owner;
  const ownerOnCheckIn = split.stages?.on_check_in.owner;

  const showAgent = split.agent_amount > 0;
  const showReferrer = referrerAmount > 0;

  return (
    <div className="border border-zinc-200 rounded-xl overflow-hidden">
      <div className="px-4 sm:px-5 py-3 bg-emerald-50 border-b border-emerald-100">
        <h2 className="text-sm sm:text-base font-semibold text-emerald-800 flex items-center gap-2">
          <FaChartPie />
          Revenue Split
        </h2>
      </div>
      <div className="p-4 sm:p-5">
        {splittingBase !== undefined && (
          <div className="flex justify-between items-center pb-3 mb-2 border-b border-zinc-100 text-xs sm:text-sm">
            <span className="text-zinc-500">Splitting base <span className="text-[10px] text-zinc-400">(total − caution fee)</span></span>
            <span className="font-medium text-zinc-700">{formatMoney(splittingBase)}</span>
          </div>
        )}

        <div className="space-y-2">
          {/* Owner */}
          <div className="flex justify-between items-start py-1 text-xs sm:text-sm">
            <div>
              <span className="text-zinc-600 block">Owner</span>
              <span className="text-[10px] text-zinc-400">({split.percentages.owner}%)</span>
              {ownerOnConfirm !== undefined && ownerOnCheckIn !== undefined && (
                <span className="text-[10px] text-zinc-400 block mt-0.5">
                  {ownerOnConfirm}% on confirmation • {ownerOnCheckIn}% on check-in
                </span>
              )}
            </div>
            <span className="font-medium text-zinc-800">{formatMoney(split.owner_amount)}</span>
          </div>

          {/* Agent */}
          {showAgent && (
            <div className="flex justify-between items-center py-1 text-xs sm:text-sm">
              <div>
                <span className="text-zinc-600 block">Agent</span>
                <span className="text-[10px] text-zinc-400">({split.percentages.agent}%)</span>
              </div>
              <span className="font-medium text-zinc-800">{formatMoney(split.agent_amount)}</span>
            </div>
          )}

          {/* Referrer */}
          {showReferrer && (
            <div className="flex justify-between items-center py-1 text-xs sm:text-sm">
              <div>
                <span className="text-zinc-600 block">Referrer</span>
                <span className="text-[10px] text-zinc-400">({referrerPct}%)</span>
              </div>
              <span className="font-medium text-zinc-800">{formatMoney(referrerAmount)}</span>
            </div>
          )}

          {/* Platform */}
          <div className="flex justify-between items-center py-1 text-xs sm:text-sm">
            <div>
              <span className="text-zinc-600 block">Platform</span>
              <span className="text-[10px] text-zinc-400">({split.percentages.platform}%)</span>
            </div>
            <span className="font-medium text-zinc-800">{formatMoney(split.platform_amount)}</span>
          </div>

          <div className="flex justify-between items-center py-2 border-t border-zinc-200 mt-2 text-sm">
            <span className="font-semibold text-zinc-800">Total</span>
            <span className="font-bold text-emerald-600">{formatMoney(booking.totalPrice)}</span>
          </div>
        </div>

        <div className="mt-3 p-2 bg-zinc-50 rounded-lg border border-zinc-100 italic text-[10px] text-zinc-500">
          Owner receives 10% on confirmation and 80% on check-in. Other shares are credited at confirmation.
        </div>
      </div>
    </div>
  );
}

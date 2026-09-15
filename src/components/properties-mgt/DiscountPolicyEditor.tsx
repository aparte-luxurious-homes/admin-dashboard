"use client";

import { Icon } from "@iconify/react";
import { DiscountType, IDiscountPolicy, IDiscountTier } from "./types";
import CustomCheckbox from "@/components/ui/customCheckbox";
import CustomDropdown from "@/components/ui/customDropdown";
import { TrashIcon } from "@/src/components/icons";

export const DISCOUNT_TYPES = [
  { label: "Percentage (%)", value: DiscountType.PERCENTAGE },
  { label: "Fixed Amount", value: DiscountType.FIXED },
];

/**
 * The tier editor for one discount policy.
 *
 * Lives here rather than inside StepDiscounts because it now has two hosts:
 * the property-level step (formik-bound) and the unit drawer (local state).
 * The API resolves a unit's policy as "its own, else the property's", so the
 * two are the same object edited at two levels — and the editor for them
 * should be the same component, or they drift on tier limits, the type
 * restriction and the empty-tier guard.
 *
 * Uncontrolled-value API (`value` / `onChange`) rather than a formik prop, so
 * neither host has to be formik.
 */

interface DiscountPolicyEditorProps {
  title: string;
  description: string;
  value?: IDiscountPolicy | null;
  onChange: (next: IDiscountPolicy | null) => void;
  allowedTypes?: { label: string; value: DiscountType }[];
  /** Tighter spacing for the unit drawer, which is a narrow column. */
  compact?: boolean;
  /**
   * Rendered when the policy is off — used by the unit editor to explain that
   * "off" means the property's policy applies, not that nothing applies.
   */
  inheritNote?: string;
}

export default function DiscountPolicyEditor({
  title,
  description,
  value,
  onChange,
  allowedTypes = DISCOUNT_TYPES,
  compact = false,
  inheritNote,
}: DiscountPolicyEditorProps) {
  // `value` can arrive undefined — a wizard draft restored from localStorage
  // saved before this step existed, a unit with no override, or a property the
  // API returns with no policy. Ticking "Enable" then created `{is_active:true}`
  // with NO tiers array, and every read was written `value?.tiers.length`,
  // which guards `value` but NOT `tiers`. The next render hit
  // `undefined.length` and took the screen down.
  //
  // Normalised once here rather than by scattering more `?.`: optional
  // chaining one level too shallow is exactly what caused that, and adding
  // more of it invites the same mistake at the next field.
  const tiers: IDiscountTier[] = value?.tiers ?? [];
  const isActive = Boolean(value?.is_active);
  const discountType =
    value?.discount_type ?? allowedTypes[0]?.value ?? DiscountType.PERCENTAGE;

  const patch = (next: Partial<IDiscountPolicy>) =>
    onChange({ is_active: isActive, discount_type: discountType, tiers, ...next });

  const setActive = (checked: boolean) => {
    // Turning a policy off clears the override entirely rather than leaving
    // `{is_active:false}` behind. On a unit that is the difference between
    // "inherit the property's policy" and "explicitly no policy" — the API
    // reads a null column as inherit, so anything else pins the unit to
    // nothing and silently opts it out of the listing's offer.
    if (!checked) {
      onChange(null);
      return;
    }
    onChange({ is_active: true, discount_type: discountType, tiers });
  };

  const addTier = () => {
    if (tiers.length >= 4) return;
    patch({ tiers: [...tiers, { min_nights: 1, value: 0 }] });
  };

  const removeTier = (index: number) =>
    patch({ tiers: tiers.filter((_, i) => i !== index) });

  const updateTier = (index: number, field: keyof IDiscountTier, v: any) => {
    const next = [...tiers];
    next[index] = { ...next[index], [field]: v };
    patch({ tiers: next });
  };

  return (
    <div
      className={`bg-white border border-zinc-100 rounded-2xl shadow-sm ${
        compact ? "p-4 space-y-4" : "mb-4 mt-4 p-5 sm:p-6 md:p-7 space-y-5"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3
            className={`font-bold text-zinc-800 flex items-center gap-2 ${
              compact ? "text-sm" : "text-base"
            }`}
          >
            <Icon icon="solar:tag-price-bold-duotone" className="text-primary" />
            {title}
          </h3>
          <p className={`text-zinc-500 mt-1 ${compact ? "text-xs" : "text-sm"}`}>
            {description}
          </p>
        </div>
        {/* CustomCheckbox hands back the new boolean, not a change event —
            reading e.target.checked off it yielded undefined. */}
        <CustomCheckbox checked={isActive} onChange={setActive} label="Enable" />
      </div>

      {!isActive && inheritNote && (
        <p className="text-xs text-zinc-400 italic">{inheritNote}</p>
      )}

      {isActive && (
        <div className="space-y-6 pt-4 border-t border-zinc-100">
          {allowedTypes.length > 1 && (
            <div className="w-full sm:w-1/2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1.5 ml-0.5">
                Discount Type
              </label>
              {/* CustomDropdown's API is selected/handleSelection over a flat
                  option list, not value/onChange over {label,value} pairs. */}
              <CustomDropdown
                options={allowedTypes.map((t) => t.label)}
                selected={
                  allowedTypes.find((t) => t.value === discountType)?.label ??
                  "Select Type"
                }
                handleSelection={(label: string) => {
                  const match = allowedTypes.find((t) => t.label === label);
                  if (match) patch({ discount_type: match.value });
                }}
              />
            </div>
          )}

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block ml-0.5">
              Discount Tiers (Max 4)
            </label>
            {tiers.length === 0 ? (
              // Not merely empty state: the API rejects an active policy with
              // no tiers, because every surface that advertises an offer keys
              // on `is_active` and would badge a listing that then quotes full
              // price. Say so here rather than letting the save 422.
              <div className="text-sm text-amber-700 py-3 px-3 text-center bg-amber-50 rounded-xl border border-amber-200 border-dashed">
                Add at least one tier, or turn this policy off.
              </div>
            ) : (
              <div className="space-y-3">
                {tiers.map((tier, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 bg-zinc-50 p-3 rounded-xl border border-zinc-200"
                  >
                    <div className="flex-1">
                      <label className="text-xs text-zinc-500 mb-1 block">
                        Min Nights
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={
                          tier.min_nights === ("" as any)
                            ? ""
                            : String(tier.min_nights ?? "")
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          updateTier(
                            index,
                            "min_nights",
                            val === "" ? ("" as any) : Number(val),
                          );
                        }}
                        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-zinc-500 mb-1 block">
                        Discount Value{" "}
                        {discountType === DiscountType.PERCENTAGE
                          ? "(%)"
                          : "(Amount)"}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step={
                          discountType === DiscountType.PERCENTAGE ? "0.01" : "1"
                        }
                        value={
                          tier.value === ("" as any)
                            ? ""
                            : String(tier.value ?? "")
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          updateTier(
                            index,
                            "value",
                            val === "" ? ("" as any) : Number(val),
                          );
                        }}
                        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                      />
                    </div>
                    <div className="pt-5">
                      <button
                        type="button"
                        onClick={() => removeTier(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tiers.length < 4 && (
              <button
                type="button"
                onClick={addTier}
                className="text-sm font-semibold text-primary flex items-center gap-1.5 hover:bg-primary/5 px-3 py-2 rounded-lg transition-colors"
              >
                <Icon icon="solar:add-circle-bold-duotone" className="text-lg" />
                Add Tier
              </button>
            )}
          </div>

          {/* The platform caps a single tier at MAX_DISCOUNT_RATIO of the
              nightly rate (50% by default) and silently applies the cap at
              booking time, so a tier above it is not an error — it just does
              not do what it says. Worth saying out loud in the editor. */}
          <p className="text-[11px] text-zinc-400">
            Discounts are capped at half the nightly rate. A larger value is
            reduced to the cap when a guest books.
          </p>
        </div>
      )}
    </div>
  );
}

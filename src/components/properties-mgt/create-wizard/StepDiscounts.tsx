"use client";

import { Icon } from "@iconify/react";
import { DiscountType, IDiscountPolicy, IDiscountTier } from "../types";
import CustomCheckbox from "@/components/ui/customCheckbox";
import CustomDropdown from "@/components/ui/customDropdown";
import { TrashIcon } from "@/src/components/icons";

interface StepDiscountsProps {
  formik: any;
}

const DISCOUNT_TYPES = [
  { label: "Percentage (%)", value: DiscountType.PERCENTAGE },
  { label: "Fixed Amount", value: DiscountType.FIXED },
];

interface DiscountPolicyEditorProps {
  title: string;
  description: string;
  policy: IDiscountPolicy;
  fieldPrefix: string;
  formik: any;
  allowedTypes?: { label: string; value: DiscountType }[];
}

function DiscountPolicyEditor({
  title,
  description,
  policy,
  fieldPrefix,
  formik,
  allowedTypes = DISCOUNT_TYPES,
}: DiscountPolicyEditorProps) {
  // `policy` can arrive undefined — a wizard draft restored from localStorage
  // that was saved before this step existed, or a property the API returns
  // with no policy set. Ticking "Enable Policy" then made formik create
  // `{ is_active: true }` with NO tiers array, and every read below was
  // written `policy?.tiers.length`, which guards `policy` but NOT `tiers`.
  // The next render hit `undefined.length` and took the screen down.
  //
  // Normalised once here rather than by scattering more `?.`: optional
  // chaining one level too shallow is exactly what caused this, and adding
  // more of it invites the same mistake at the next field.
  const tiers: IDiscountTier[] = policy?.tiers ?? [];
  const isActive = Boolean(policy?.is_active);
  const discountType = policy?.discount_type ?? DiscountType.PERCENTAGE;

  const addTier = () => {
    if (tiers.length >= 4) return;
    formik.setFieldValue(`${fieldPrefix}.tiers`, [...tiers, { min_nights: 1, value: 0 }]);
  };

  const removeTier = (index: number) => {
    formik.setFieldValue(
      `${fieldPrefix}.tiers`,
      tiers.filter((_, i) => i !== index),
    );
  };

  const updateTier = (index: number, field: keyof IDiscountTier, value: any) => {
    const newTiers = [...tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    formik.setFieldValue(`${fieldPrefix}.tiers`, newTiers);
  };

  /** Enabling a policy must also give it the shape the editor expects. */
  const setActive = (checked: boolean) => {
    if (checked && !policy?.tiers) {
      formik.setFieldValue(fieldPrefix, {
        is_active: true,
        discount_type: discountType,
        tiers: [],
      });
      return;
    }
    formik.setFieldValue(`${fieldPrefix}.is_active`, checked);
  };

  return (
    <div className="mb-4 mt-4 bg-white border border-zinc-100 rounded-2xl p-5 sm:p-6 md:p-7 space-y-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-bold text-zinc-800 flex items-center gap-2">
            <Icon icon="solar:tag-price-bold-duotone" className="text-primary" />
            {title}
          </h3>
          <p className="text-sm text-zinc-500 mt-1">{description}</p>
        </div>
        {/* CustomCheckbox hands back the new boolean, not a change event —
            reading e.target.checked off it yielded undefined. */}
        <CustomCheckbox
          checked={isActive}
          onChange={setActive}
          label="Enable Policy"
        />
      </div>

      {isActive && (
        <div className="space-y-6 pt-4 border-t border-zinc-100">
          <div className="w-full sm:w-1/2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1.5 ml-0.5">
              Discount Type
            </label>
            {/* CustomDropdown's API is selected/handleSelection over a flat
                option list, not value/onChange over {label,value} pairs. It
                renders each option directly, so labels go in and the matching
                DiscountType is mapped back out. */}
            <CustomDropdown
              options={allowedTypes.map((t) => t.label)}
              selected={
                allowedTypes.find((t) => t.value === discountType)?.label ??
                "Select Type"
              }
              handleSelection={(label: string) => {
                const match = allowedTypes.find((t) => t.label === label);
                if (match) {
                  formik.setFieldValue(`${fieldPrefix}.discount_type`, match.value);
                }
              }}
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block ml-0.5">
              Discount Tiers (Max 4)
            </label>
            {tiers.length === 0 ? (
              <div className="text-sm text-zinc-500 py-4 text-center bg-zinc-50 rounded-xl border border-zinc-200 border-dashed">
                No discount tiers added yet.
              </div>
            ) : (
              <div className="space-y-3">
                {tiers.map((tier, index) => (
                  <div key={index} className="flex items-center gap-3 bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                    <div className="flex-1">
                      <label className="text-xs text-zinc-500 mb-1 block">Min Nights</label>
                      <input
                        type="number"
                        min="1"
                        value={tier.min_nights === ("" as any) ? "" : String(tier.min_nights ?? "")}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateTier(index, "min_nights", val === "" ? ("" as any) : Number(val));
                        }}
                        className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-zinc-500 mb-1 block">
                        Discount Value {discountType === DiscountType.PERCENTAGE ? "(%)" : "(Amount)"}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step={discountType === DiscountType.PERCENTAGE ? "0.01" : "1"}
                        value={tier.value === ("" as any) ? "" : String(tier.value ?? "")}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateTier(index, "value", val === "" ? ("" as any) : Number(val));
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
        </div>
      )}
    </div>
  );
}

export default function StepDiscounts({ formik }: StepDiscountsProps) {
  return (
    <div className="max-w-3xl mx-auto pb-24 md:pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-zinc-800 flex items-center gap-3">
          Pricing & Discounts
        </h2>
        <p className="text-sm sm:text-base text-zinc-500 mt-2 leading-relaxed">
          Configure automated discounts for long stays and booking extensions.
        </p>
      </div>

      <DiscountPolicyEditor
        title="Long-Stay Discount"
        description="Automatically apply discounts when guests book for longer periods (Fixed Amount only)."
        policy={formik.values.long_stay_discount_policy}
        fieldPrefix="long_stay_discount_policy"
        formik={formik}
        allowedTypes={[{ label: "Fixed Amount", value: DiscountType.FIXED }]}
      />

      <DiscountPolicyEditor
        title="Extension Discount"
        description="Offer special rates for guests who extend their current stay (Percentage only)."
        policy={formik.values.extension_discount_policy}
        fieldPrefix="extension_discount_policy"
        formik={formik}
        allowedTypes={[{ label: "Percentage (%)", value: DiscountType.PERCENTAGE }]}
      />
    </div>
  );
}

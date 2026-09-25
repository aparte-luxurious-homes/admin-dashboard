"use client";

import { DiscountType, IDiscountPolicy } from "../types";
import DiscountPolicyEditor from "../DiscountPolicyEditor";

interface StepDiscountsProps {
  formik: any;
}

/**
 * Property-wide discount policies.
 *
 * These are the listing's defaults. Any unit may override either of them in
 * the unit drawer, and the API resolves per unit — so what is set here applies
 * to every unit that has not said otherwise, not to the property as an
 * indivisible thing.
 *
 * Who these reach depends on who is saving. An owner or an admin sets the live
 * policy; an agent's save is recorded as a proposal for the owner to approve,
 * per the two-party rule in the PRD. The API decides that from the caller's
 * role — there is nothing to choose here.
 */
export default function StepDiscounts({ formik }: StepDiscountsProps) {
  const bind = (field: string) => ({
    value: formik.values[field] as IDiscountPolicy | null,
    // The editor clears to null when a policy is switched off. Formik keeps
    // that verbatim; the API reads null as "no policy".
    onChange: (next: IDiscountPolicy | null) =>
      formik.setFieldValue(field, next),
  });

  return (
    <div className="max-w-3xl mx-auto pb-24 md:pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-zinc-800 flex items-center gap-3">
          Pricing &amp; Discounts
        </h2>
        <p className="text-sm sm:text-base text-zinc-500 mt-2 leading-relaxed">
          Configure automated discounts for long stays and booking extensions.
          Individual units can override these on the Units step.
        </p>
      </div>

      <DiscountPolicyEditor
        title="Long-Stay Discount"
        description="Automatically apply discounts when guests book for longer periods (Fixed Amount only)."
        allowedTypes={[{ label: "Fixed Amount", value: DiscountType.FIXED }]}
        {...bind("long_stay_discount_policy")}
      />

      <DiscountPolicyEditor
        title="Extension Discount"
        description="Offer special rates for guests who extend their current stay (Percentage only)."
        allowedTypes={[{ label: "Percentage (%)", value: DiscountType.PERCENTAGE }]}
        {...bind("extension_discount_policy")}
      />
    </div>
  );
}

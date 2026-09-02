"use client";

import { useState } from "react";
import CustomModal from "../../ui/CustomModal";
import { IDiscountPolicy, IProperty, DiscountType } from "../types";
import { ReviewDiscountProposal } from "@/src/lib/request-handlers/propertyMgt";
import toast from "react-hot-toast";
import Spinner from "../../ui/Spinner";
import { Icon } from "@iconify/react";

interface DiscountProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: IProperty;
}

function DiscountPolicyDiff({
  title,
  currentPolicy,
  proposedPolicy,
}: {
  title: string;
  currentPolicy?: IDiscountPolicy;
  proposedPolicy?: IDiscountPolicy;
}) {
  if (!proposedPolicy) return null;

  return (
    <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-4">
      <h4 className="text-sm font-bold text-zinc-800 flex items-center gap-2">
        <Icon icon="solar:tag-price-bold-duotone" className="text-primary" />
        {title}
      </h4>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider">Current</p>
          {!currentPolicy?.is_active || currentPolicy?.tiers?.length === 0 ? (
            <p className="text-sm text-zinc-400">No active policy</p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-zinc-600">Type: {currentPolicy.discount_type}</p>
              <div className="space-y-1">
                {currentPolicy.tiers.map((tier, idx) => (
                  <div key={idx} className="text-xs text-zinc-600 bg-white p-2 rounded border border-zinc-100">
                    {tier.min_nights}+ nights: {tier.value}{currentPolicy.discount_type === DiscountType.PERCENTAGE ? '%' : ' flat'}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-bold text-primary mb-2 uppercase tracking-wider flex items-center gap-1">
            <Icon icon="solar:star-bold" className="text-amber-500" /> Proposed
          </p>
          {!proposedPolicy.is_active || proposedPolicy.tiers?.length === 0 ? (
            <p className="text-sm text-red-500 font-semibold">Disable policy</p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-zinc-800 font-medium">Type: {proposedPolicy.discount_type}</p>
              <div className="space-y-1">
                {proposedPolicy.tiers.map((tier, idx) => (
                  <div key={idx} className="text-xs text-zinc-800 font-medium bg-primary/5 p-2 rounded border border-primary/20">
                    {tier.min_nights}+ nights: {tier.value}{proposedPolicy.discount_type === DiscountType.PERCENTAGE ? '%' : ' flat'}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DiscountProposalModal({
  isOpen,
  onClose,
  property,
}: DiscountProposalModalProps) {
  const { mutate: reviewProposal, isPending } = ReviewDiscountProposal();

  const hasProposedLongStay = !!property.proposed_long_stay_discount_policy;
  const hasProposedExtension = !!property.proposed_extension_discount_policy;

  if (!hasProposedLongStay && !hasProposedExtension) return null;

  const handleReview = (action: 'approve' | 'reject') => {
    reviewProposal(
      { propertyId: property.id, payload: { action } },
      {
        onSuccess: () => {
          toast.success(`Discount proposal ${action}d successfully`);
          onClose();
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.detail || `Failed to ${action} proposal`);
        },
      }
    );
  };

  return (
    <CustomModal isOpen={isOpen} onClose={onClose} title="Review Proposed Discounts">
      <div className="p-4 sm:p-6 space-y-6">
        <div>
          <p className="text-sm text-zinc-600 leading-relaxed">
            An admin has proposed new discount policies for <strong>{property.name}</strong>. 
            Please review the changes below. If you reject this proposal, your current pricing will remain unchanged.
          </p>
        </div>

        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
          {hasProposedLongStay && (
            <DiscountPolicyDiff
              title="Long-Stay Discount"
              currentPolicy={property.long_stay_discount_policy}
              proposedPolicy={property.proposed_long_stay_discount_policy}
            />
          )}

          {hasProposedExtension && (
            <DiscountPolicyDiff
              title="Extension Discount"
              currentPolicy={property.extension_discount_policy}
              proposedPolicy={property.proposed_extension_discount_policy}
            />
          )}
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-zinc-100">
          <button
            onClick={() => handleReview('reject')}
            disabled={isPending}
            className="flex-1 h-11 border border-red-200 bg-red-50 text-red-600 text-sm font-bold rounded-xl hover:bg-red-100 transition-all disabled:opacity-50"
          >
            Reject Changes
          </button>
          <button
            onClick={() => handleReview('approve')}
            disabled={isPending}
            className="flex-1 h-11 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center"
          >
            {isPending ? <Spinner width="20" height="20" color="#fff" /> : "Approve Changes"}
          </button>
        </div>
      </div>
    </CustomModal>
  );
}

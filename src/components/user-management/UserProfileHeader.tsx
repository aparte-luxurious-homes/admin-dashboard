"use client";

import React from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { UserDetail, Wallet, RoleConfig } from "./user-detail.types";
import Badge from "@/src/components/badge";
import Button from "@/src/components/button";

interface UserProfileHeaderProps {
  user: UserDetail;
  wallet: Wallet | null;
  roleConfig: RoleConfig;
  onEditProfile: () => void;
  onEditWallet: () => void;
}

const KYC_COLORS: Record<string, string> = {
  VERIFIED: "bg-green-100 text-green-700 border-green-200",
  PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
};

function formatCurrency(value: string | number, currency: string) {
  return `${currency} ${Number(value).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "--";
  try {
    return new Date(dateStr).toLocaleDateString("en-NG", {
      month: "short",
      year: "numeric",
      day: "numeric",
    });
  } catch {
    return "--";
  }
}

function formatRole(role: string) {
  return role.replace(/_/g, " ");
}

const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({
  user,
  wallet,
  roleConfig,
  onEditProfile,
  onEditWallet,
}) => {
  const fullName =
    [user.profile.firstName, user.profile.lastName].filter(Boolean).join(" ") || "Unnamed User";
  const contactParts = [user.email, user.phone].filter(Boolean);
  const kycStatus = user.profile.kycStatus || "PENDING";
  const kycColor = KYC_COLORS[kycStatus] || KYC_COLORS.PENDING;

  return (
    <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-6 mb-6">
      {/* Top row: Avatar + Identity + Edit button */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-start">
        {/* Avatar */}
        <div
          className={`relative w-20 h-20 rounded-full overflow-hidden flex-shrink-0 border-[3px] ${
            user.isActive ? "border-green-400" : "border-gray-300"
          }`}
        >
          {user.profile.profileImage ? (
            <Image
              src={user.profile.profileImage}
              alt={fullName}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <Icon icon="solar:user-bold-duotone" width="40" className="text-gray-400" />
            </div>
          )}
        </div>

        {/* Identity */}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-gray-900 truncate">{fullName}</h2>
          <p className="text-sm text-gray-500 truncate mt-0.5">
            {contactParts.join("  |  ")}
          </p>

          {/* Status badges */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase bg-primary/10 text-primary border border-primary/20">
              {formatRole(user.role)}
            </span>
            <Badge status={user.isActive} />
            <span className="text-xs text-gray-400">|</span>
            <Badge status={user.isVerified} />
            <span className="text-xs text-gray-400">|</span>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold border ${kycColor}`}
            >
              KYC: {kycStatus}
            </span>
          </div>
        </div>

        {/* Edit button */}
        <div className="flex-shrink-0">
          <Button
            buttonName={
              <>
                <Icon icon="mdi:pencil" className="mr-2" />
                Edit Profile
              </>
            }
            onClick={onEditProfile}
            variant="primary"
          />
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-5" />

      {/* Quick stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Wallet Balance */}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Wallet Balance
          </p>
          {wallet ? (
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold text-primary">
                {formatCurrency(wallet.balance, wallet.currency)}
              </p>
              <button
                onClick={onEditWallet}
                className="p-1 rounded-md hover:bg-primary/10 text-gray-400 hover:text-primary transition-colors"
                title="Edit Wallet"
              >
                <Icon icon="mdi:pencil-outline" width="14" />
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No wallet</p>
          )}
        </div>

        {/* Pending Cash */}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Pending Cash
          </p>
          <p className="text-sm font-medium text-gray-900">
            {wallet
              ? formatCurrency(wallet.pendingCash, wallet.currency)
              : "--"}
          </p>
        </div>

        {/* Joined */}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Joined
          </p>
          <p className="text-sm font-medium text-gray-900">
            {formatDate(user.createdAt)}
          </p>
        </div>

        {/* Rating */}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Rating
          </p>
          <div className="flex items-center gap-1">
            {user.profile.averageRating != null ? (
              <>
                <Icon icon="mdi:star" width="16" className="text-yellow-400" />
                <p className="text-sm font-medium text-gray-900">
                  {Number(user.profile.averageRating).toFixed(1)}/5
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400">No ratings</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileHeader;

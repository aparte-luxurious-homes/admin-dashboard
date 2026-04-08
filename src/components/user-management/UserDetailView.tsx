"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import BreadCrumb from "@/src/components/breadcrumb";
import { EditWalletModal } from "@/src/components/finance-mgt/modals/EditWalletModal";
import KycStatusEditor from "./KycStatusEditor";
import UserProfileHeader from "./UserProfileHeader";
import UserDetailsPanel from "./UserDetailsPanel";
import UserEditDrawer from "./UserEditDrawer";
import { useUserDetail } from "./useUserDetail";
import { RoleConfig } from "./user-detail.types";

interface UserDetailViewProps {
  roleConfig: RoleConfig;
}

function DetailSkeleton() {
  return (
    <div className="space-y-6 mt-6">
      {/* Header skeleton */}
      <div className="bg-gray-50/50 rounded-2xl border border-gray-100 p-6">
        <div className="flex gap-4 items-start">
          <Skeleton className="w-20 h-20 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 my-5" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-28" />
            </div>
          ))}
        </div>
      </div>
      {/* Details skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}

const UserDetailView: React.FC<UserDetailViewProps> = ({ roleConfig }) => {
  const params = useParams();
  const id = params?.id as string | undefined;

  const { user, wallet, isLoading, refetch, refetchWallet, updateUser, isUpdating, createWallet, isCreatingWallet } =
    useUserDetail(id);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [showEditWallet, setShowEditWallet] = useState(false);

  const fullName = user
    ? [user.profile.firstName, user.profile.lastName].filter(Boolean).join(" ") || user.email
    : "";

  return (
    <>
      <div className="p-[20px] mr-5 ml-5 mt-5 mb-100 border border-[#D9D9D9] rounded-[15px] bg-white shadow-md min-h-[calc(100vh-150px)]">
        <BreadCrumb
          description=""
          active={roleConfig.breadcrumbActive}
          link_one={roleConfig.breadcrumbLink}
          link_one_name={roleConfig.breadcrumbLinkName}
        />

        <div className="flex justify-between items-center mb-6 mt-2">
          <h3 className="font-semibold">{roleConfig.label} Info</h3>
        </div>

        {isLoading ? (
          <DetailSkeleton />
        ) : user ? (
          <>
            <UserProfileHeader
              user={user}
              wallet={wallet}
              roleConfig={roleConfig}
              onEditProfile={() => setIsEditOpen(true)}
              onEditWallet={() => setShowEditWallet(true)}
              onCreateWallet={createWallet}
              isCreatingWallet={isCreatingWallet}
            />
            <UserDetailsPanel user={user} />
            <KycStatusEditor
              userId={String(id)}
              currentStatus={user.profile.kycStatus || "PENDING"}
              onUpdate={refetch}
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <p className="text-lg font-medium">User not found</p>
          </div>
        )}
      </div>

      <UserEditDrawer
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        user={user}
        roleConfig={roleConfig}
        onSave={(formData) => updateUser(formData, roleConfig)}
        isSaving={isUpdating}
      />

      {wallet && (
        <EditWalletModal
          isOpen={showEditWallet}
          onClose={() => setShowEditWallet(false)}
          walletId={wallet.id}
          currentBalance={wallet.balance}
          currentPendingCash={wallet.pendingCash}
          currency={wallet.currency}
          userName={fullName}
          onSuccess={refetchWallet}
        />
      )}
    </>
  );
};

export default UserDetailView;

"use client";

import React, { useEffect } from "react";
import { Icon } from "@iconify/react";
import UserEditForm from "./UserEditForm";
import { UserDetail, RoleConfig } from "./user-detail.types";

interface UserEditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserDetail | null;
  roleConfig: RoleConfig;
  onSave: (formData: any) => Promise<void>;
  isSaving: boolean;
}

const UserEditDrawer: React.FC<UserEditDrawerProps> = ({
  isOpen,
  onClose,
  user,
  roleConfig,
  onSave,
  isSaving,
}) => {
  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!user) return null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-hidden flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Icon icon="mdi:account-edit" width="20" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              Edit {roleConfig.label} Profile
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Icon icon="mdi:close" width="20" />
          </button>
        </div>

        {/* Form content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <UserEditForm
            initialData={{
              firstName: user.profile.firstName || "",
              lastName: user.profile.lastName || "",
              email: user.email || "",
              phone: user.phone || "",
              gender: user.profile.gender || "",
              role: user.role || "",
              bio: user.profile.bio || "",
              is_active: user.isActive,
              isVerified: user.isVerified,
            }}
            showRoleSelector={true}
            isSaving={isSaving}
            onCancel={onClose}
            onSave={async (formData: any) => {
              try {
                await onSave(formData);
                onClose();
              } catch {
                // Error already toasted in hook
              }
            }}
          />
        </div>
      </div>
    </>
  );
};

export default UserEditDrawer;

"use client"

import UserManagementView from "@/src/components/user-management/UserManagementView";

const Owner = () => {
  return (
    <UserManagementView
      role="OWNER"
      title="Owner Management"
      description="Manage and monitor all your platform owners"
      basePath="/user-management/owners"
    />
  );
};

export default Owner;

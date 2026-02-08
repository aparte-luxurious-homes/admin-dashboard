"use client"

import UserManagementView from "@/src/components/user-management/UserManagementView";

const Guest = () => {
  return (
    <UserManagementView
      role="GUEST"
      title="Guest Management"
      description="Manage and monitor all your platform guests"
      basePath="/user-management/guests"
    />
  );
};

export default Guest;

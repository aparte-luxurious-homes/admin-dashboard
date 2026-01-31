"use client"

import UserManagementView from "@/src/components/user-management/UserManagementView";

const Agent = () => {
  return (
    <UserManagementView
      role="AGENT"
      title="Agent Management"
      description="Manage and monitor all your platform agents"
      basePath="/user-management/agents"
    />
  );
};

export default Agent;

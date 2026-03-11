"use client"

import UserManagementView from "@/src/components/user-management/UserManagementView";

const Admin = () => {
    return (
        <UserManagementView
            role="ADMIN,SUPER_ADMIN,OPERATIONS_ADMIN,SUPPORT_ADMIN,ANALYST"
            title="Admin Management"
            description="Manage and monitor platform administrators"
            basePath="/user-management/admins"
        />
    );
};

export default Admin;
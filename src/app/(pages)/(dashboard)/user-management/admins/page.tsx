"use client"

import UserManagementView from "@/src/components/user-management/UserManagementView";

const Admin = () => {
    return (
        <UserManagementView
            role="OPERATIONS_ADMIN,SUPPORT_ADMIN,ANALYST,ADMIN,SUPER_ADMIN"
            title="Admin Management"
            description="Manage and monitor platform administrators"
            basePath="/user-management/admins"
        />
    );
};

export default Admin;
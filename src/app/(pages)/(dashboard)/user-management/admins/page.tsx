"use client"

import UserManagementView from "@/src/components/user-management/UserManagementView";

const Admin = () => {
    return (
        <UserManagementView
            role="ADMIN"
            title="Admin Management"
            description="Manage and monitor platform administrators"
            basePath="/user-management/admins"
        />
    );
};

export default Admin;
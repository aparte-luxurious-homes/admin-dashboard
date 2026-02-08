import { UserRole } from "../enums";

export interface Permission {
    id: string;
    name: string;
    description: string | null;
    resource: string;
    action: string;
    created_at: string;
    updated_at: string;
}

export interface RolePermission {
    id: string;
    role: UserRole;
    permission_id: string;
    created_at: string;
    permission: Permission;
}

export interface RolePermissionsResponse {
    role: UserRole;
    permissions: Permission[];
    total: number;
}

export interface PermissionSeedResponse {
    message: string;
    permissions: {
        created: number;
        existing: number;
        total: number;
    };
    role_assignments: Record<string, number | string>;
}

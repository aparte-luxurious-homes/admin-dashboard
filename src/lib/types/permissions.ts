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

/**
 * A key permissions may be assigned to. Superset of UserRole: "identity" keys
 * mirror users.role, while "standing" keys (SILVER_AGENT, GOLD_AGENT,
 * AREA_MANAGER, REGIONAL_LEAD) are derived — held in addition to an identity
 * role and never written to users.role. See services/permissions/enums.py.
 */
export interface AssignableRole {
    key: string;
    label: string;
    kind: "identity" | "standing";
    /** Why a standing key cannot be assigned to a user directly. Null for identity. */
    derived_from: string | null;
}

export interface RolePermission {
    id: string;
    role: string;
    permission_id: string;
    created_at: string;
    permission: Permission;
}

export interface RolePermissionsResponse {
    role: string;
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

export interface PermissionCreatePayload {
    name: string;
    description?: string | null;
    resource: string;
    action: string;
}

export interface PermissionUpdatePayload {
    description?: string | null;
}

"use client";

import UserDetailView from "@/src/components/user-management/UserDetailView";
import { RoleConfig } from "@/src/components/user-management/user-detail.types";

const ROLE_CONFIG: RoleConfig = {
  role: "ADMIN",
  label: "Admin",
  breadcrumbActive: "Admin info",
  breadcrumbLink: "/user-management/admins",
  breadcrumbLinkName: "All Admins",
  successMessage: "Admin profile updated successfully",
};

export default function AdminDetailPage() {
  return <UserDetailView roleConfig={ROLE_CONFIG} />;
}

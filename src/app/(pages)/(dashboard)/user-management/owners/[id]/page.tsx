"use client";

import UserDetailView from "@/src/components/user-management/UserDetailView";
import { RoleConfig } from "@/src/components/user-management/user-detail.types";

const ROLE_CONFIG: RoleConfig = {
  role: "OWNER",
  label: "Property Owner",
  breadcrumbActive: "Property Owner info",
  breadcrumbLink: "/user-management/owners",
  breadcrumbLinkName: "Owners",
  successMessage: "Owner profile updated successfully",
};

export default function OwnerDetailPage() {
  return <UserDetailView roleConfig={ROLE_CONFIG} />;
}

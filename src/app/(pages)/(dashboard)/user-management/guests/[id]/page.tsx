"use client";

import UserDetailView from "@/src/components/user-management/UserDetailView";
import { RoleConfig } from "@/src/components/user-management/user-detail.types";

const ROLE_CONFIG: RoleConfig = {
  role: "GUEST",
  label: "Guest",
  breadcrumbActive: "Guest info",
  breadcrumbLink: "/user-management/guests",
  breadcrumbLinkName: "Guests",
  successMessage: "Guest profile updated successfully",
};

export default function GuestDetailPage() {
  return <UserDetailView roleConfig={ROLE_CONFIG} />;
}

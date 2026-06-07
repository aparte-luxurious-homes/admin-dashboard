import UserDetailView from "@/src/components/user-management/UserDetailView";
import { RoleConfig } from "@/src/components/user-management/user-detail.types";

const ROLE_CONFIG: RoleConfig = {
  role: "AGENT",
  label: "Agent",
  breadcrumbActive: "Agent info",
  breadcrumbLink: "/user-management/agents",
  breadcrumbLinkName: "All Agents",
  successMessage: "Agent profile updated successfully",
};

export default function AgentDetailPage() {
  return <UserDetailView roleConfig={ROLE_CONFIG} />;
}

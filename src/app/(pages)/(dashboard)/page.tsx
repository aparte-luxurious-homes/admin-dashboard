"use client";

import dynamic from "next/dynamic";

import Loader from "@/src/components/loader";
import { usePermissions } from "@/src/hooks/usePermissions";
import OwnerHome from "@/src/components/owner-home/OwnerHome";

/**
 * Whoever lands on the dashboard root gets the home built for their role.
 *
 * The admin and agent home is loaded on demand rather than imported: it pulls
 * in the charts and the MUI data grid, and an owner on a phone should not wait
 * for code their page never renders (owner home spec, section 10).
 */
const AdminAgentHome = dynamic(
  () => import("@/src/components/dashboard/AdminAgentHome"),
  { ssr: false, loading: () => <Loader /> }
);

const DashboardHome = () => {
  const { isOwner } = usePermissions();
  return isOwner ? <OwnerHome /> : <AdminAgentHome />;
};

export default DashboardHome;

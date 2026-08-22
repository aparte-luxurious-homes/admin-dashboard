"use client"

import SettingCard from "@/src/components/settings-card/settingscard";
import Grid from "@mui/material/Grid2";
import { useAuth } from "@/src/hooks/useAuth";
import { MdOutlineAccountCircle, MdSecurity, MdPayments } from "react-icons/md";
import { IoGitNetworkOutline } from "react-icons/io5";
import { UserRole } from "@/src/lib/enums";

const SettingsPage = () => {
  const { user } = useAuth();

  const settingsOptions = [
    {
      title: "Personal info",
      description: "Profile details & identity verification",
      route: "/settings/personal-info",
      icon: <MdOutlineAccountCircle size={32} />,
    },
    {
      title: "Login & security",
      description: "Update your password",
      route: "/settings/login-security",
      icon: <MdSecurity size={32} />,
    },
    {
      title: "Payments & payouts",
      description: "Configure payment gateways & payouts",
      route: "/settings/payments-payouts",
      icon: <MdPayments size={32} />,
    },
    // Platform-wide kill switch. Conditionally rendered rather than CSS-hidden,
    // so it is absent from the DOM entirely for anyone but a super admin — the
    // API enforces the same restriction, this only keeps the card out of sight.
    ...(user?.role === UserRole.SUPER_ADMIN
      ? [{
          title: "Network events",
          description: "Enable or disable the Agent Network platform-wide",
          route: "/settings/network-events",
          icon: <IoGitNetworkOutline size={32} />,
        }]
      : []),
  ];

  return (
    <>
      <div className="p-4 sm:p-[20px] mx-2 sm:mx-5 mt-5 mb-100 border border-[#D9D9D9] rounded-[15px] bg-white shadow-md min-h-[calc(100vh-150px)]">
        <h1 className="text-2xl sm:text-3xl font-bold">Account</h1>
        <p className="mb-10">Hi {user?.profile?.firstName}, <strong>{user?.email}</strong></p>
        <Grid container spacing={3}>
          {settingsOptions.map((option) => (
            <Grid key={option.title} size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
              <SettingCard {...option} />
            </Grid>
          ))}
        </Grid>
      </div>
    </>
  );
};

export default SettingsPage;

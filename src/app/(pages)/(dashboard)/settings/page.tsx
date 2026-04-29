"use client"

import SettingCard from "@/src/components/settings-card/settingscard";
import Grid from "@mui/material/Grid2";
import { useAuth } from "@/src/hooks/useAuth";
import { Icon } from "@iconify/react";
import { UserRole } from "@/src/lib/enums";

// KYC verification is self-serve for any authenticated user with a real
// trust-surface on the platform (AGENT, OWNER, GUEST). Admin roles don't
// need to upload their own KYC — their identity is vetted during onboarding.
const KYC_ALLOWED_ROLES: UserRole[] = [UserRole.AGENT, UserRole.OWNER, UserRole.GUEST];

const SettingsPage = () => {
  const { user } = useAuth();
  const showKyc = !!user?.role && KYC_ALLOWED_ROLES.includes(user.role as UserRole);

  const settingsOptions = [
    {
      title: "Personal info",
      description: "Provide personal details",
      route: "/settings/personal-info",
      icon: <Icon icon="carbon:user-profile" width="32" height="32" />,
    },
    {
      title: "Login & security",
      description: "Update your password",
      route: "/settings/login-security",
      icon: <Icon icon="mdi:security" width="32" height="32" />,
    },
    {
      title: "Payments & payouts",
      description: "Configure payment gateways & payouts",
      route: "/settings/payments-payouts",
      icon: <Icon icon="material-symbols:payments" width="32" height="32" />,
    },
    ...(showKyc
      ? [{
          title: "KYC Verification",
          description: "Upload identity, address, or ownership documents",
          route: "/settings/kyc",
          icon: <Icon icon="mdi:shield-check-outline" width="32" height="32" />,
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

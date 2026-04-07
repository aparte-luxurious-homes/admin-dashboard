"use client"

import SettingCard from "@/src/components/settings-card/settingscard";
import Grid from "@mui/material/Grid2";
import { useAuth } from "@/src/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { useTourContext } from "@/src/lib/tour";
import { UserRole } from "@/src/lib/enums";

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
];

const SettingsPage = () => {
  const { user, isFetching } = useAuth();
  const { restartTour } = useTourContext();
  const router = useRouter();
  const showTourCard = user?.role === UserRole.OWNER || user?.role === UserRole.AGENT;

  const handleRestartTour = () => {
    router.push("/");
    restartTour();
  };

  return (
    <>
      <div className="p-[20px] mr-5 ml-5 mt-5 mb-100 border border-[#D9D9D9] rounded-[15px] bg-white shadow-md min-h-[calc(100vh-150px)]">
        <h1 className="text-3xl font-bold">Account</h1>
        <p className="mb-10">Hi {user?.profile?.firstName}, <strong>{user?.email}</strong></p>
        <Grid container spacing={3}>
          {settingsOptions.map((option) => (
            <Grid key={option.title} size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
              <SettingCard {...option} />
            </Grid>
          ))}
          {showTourCard && (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
              <div
                onClick={handleRestartTour}
                className="p-4 border rounded-lg cursor-pointer hover:bg-gray-100 transition"
              >
                <div className="text-3xl">
                  <Icon icon="mdi:compass-outline" width="32" height="32" />
                </div>
                <h2 className="text-lg font-semibold mt-6">Take a Tour</h2>
                <p className="text-sm text-gray-600">Restart the guided dashboard walkthrough</p>
              </div>
            </Grid>
          )}
        </Grid>
      </div>
    </>
  );
};

export default SettingsPage;

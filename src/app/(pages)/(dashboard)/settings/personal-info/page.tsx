"use client";

import BreadCrumb from "@/src/components/breadcrumb";
import { useAuth } from "@/src/hooks/useAuth";
import Grid from "@mui/material/Grid2";
import { useState } from "react";
import Button from "@/src/components/button";
import InputGroup from "@/src/components/formcomponent/InputGroup";

const PersonalInfoPage = () => {
  const { user, isFetching } = useAuth();
  const [personalInfo, setPersonalInfo] = useState<{ [key: string]: string }>(
    {}
  );

  const handleTextChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setPersonalInfo({ ...personalInfo, [name]: value });
  };
  console.log(isFetching ? "Fetching User" : user);
  return (
    <>
      <div className="p-[30px] mt-10 mb-100 border border-[#D9D9D9] rounded-[15px] bg-white shadow-md min-h-[calc(100vh-150px)]">
        <BreadCrumb
          description=""
          active="Personal info"
          link_one="/settings"
          link_one_name="Settings"
        />
        <div className="mt-0">
          <h3 className="mb-[50px] mt-[10px] font-semibold">Personal Info</h3>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
              <InputGroup
                label="Legal Name"
                required
                defaultValue={`${user?.profile?.firstName || ""} ${user?.profile?.lastName || ""}`}
                onChange={handleTextChange}
                inputType="text"
                inputName="name"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
              <InputGroup
                label="Preferred First Name"
                required
                defaultValue={user?.profile?.firstName || ""}
                onChange={handleTextChange}
                inputType="text"
                inputName="firstName"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
              <InputGroup
                label="Email Address"
                required
                defaultValue={user?.email}
                onChange={handleTextChange}
                inputType="email"
                inputName="email"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
              <InputGroup
                label="Phone Number"
                required
                defaultValue={user?.phone || ""}
                onChange={handleTextChange}
                inputType="text"
                inputName="phoneNumber"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
              <InputGroup
                label="Identity Verification"
                required
                defaultValue={user?.verificationToken || ""}
                onChange={handleTextChange}
                inputType="text"
                inputName="verification"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
              <InputGroup
                label="Address"
                required
                defaultValue={user?.profile?.address}
                onChange={handleTextChange}
                inputType="text"
                inputName="address"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
              <InputGroup
                label="Date Joined"
                required
                disabled
                defaultValue={user?.createdAt?.substring(0, 10)}
                onChange={handleTextChange}
                inputType="date"
                inputName="date"
              />
            </Grid>
          </Grid>
          <div className="mt-10 flex justify-center">
            <div className="w-1/3">
              <Button
                variant="primaryoutline"
                buttonSize="full"
                color="btnfontprimary"
                buttonName="Edit Profile"
              />
            </div>
          </div>
        </div>
      </div>
      ;
    </>
  );
};

export default PersonalInfoPage;

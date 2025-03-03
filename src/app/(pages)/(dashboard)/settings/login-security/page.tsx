"use client";

import BreadCrumb from "@/src/components/breadcrumb";
import { useState } from "react";
import Grid from "@mui/material/Grid2";
import Button from "@/src/components/button";
import InputGroup from "@/src/components/formcomponent/InputGroup";

const LoginandSecurity = () => {
  const [resetInfo, setResetInfo] = useState<{ [key: string]: string }>(
    {}
  );
  const handleTextChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setResetInfo({ ...resetInfo, [name]: value });
  };
  return (
    <>
      <div className="p-[30px] mt-10 mb-100 border border-[#D9D9D9] rounded-[15px] bg-white shadow-md min-h-[calc(100vh-150px)]">
        <BreadCrumb
          description=""
          active="Login and Security"
          link_one="/settings"
          link_one_name="Settings"
        />
        <div className="mt-0">
          <h3 className="mb-[50px] mt-[10px] font-semibold">Reset Password</h3>
          <div className="w-1/3 md:w-full">
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12 }}>
                <InputGroup
                  label="Email"
                  required
                  disabled={!!resetInfo?.phone}
                  onChange={handleTextChange}
                  inputType="email"
                  inputName="email"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12 }}>
                <InputGroup
                  label="Phone Number"
                  required
                  disabled={!!resetInfo?.email}
                  onChange={handleTextChange}
                  inputType="text"
                  inputName="phone"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12 }}>
                <InputGroup
                  label="New Password"
                  required
                  onChange={handleTextChange}
                  inputType="text"
                  inputName="password"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12 }}>
                <InputGroup
                  label="Confirm New Password"
                  required
                  onChange={handleTextChange}
                  inputType="text"
                  inputName="password_confirmation"
                />
              </Grid>
            </Grid>
          </div>
          <div className="mt-10 flex justify-center">
            <div className="w-1/3">
              <Button
                variant="primaryoutline"
                buttonSize="full"
                color="btnfontprimary"
                buttonName="Send OTP"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginandSecurity;

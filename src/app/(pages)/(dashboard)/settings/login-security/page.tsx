"use client";

import BreadCrumb from "@/src/components/breadcrumb";
import { useState, useRef  } from "react";
import Grid from "@mui/material/Grid2";
import Button from "@/src/components/button";
import InputGroup from "@/src/components/formcomponent/InputGroup";
import Modal from "@/src/components/modal/Modal";

const LoginandSecurity = () => {
  const [resetInfo, setResetInfo] = useState<{ [key: string]: string }>({});
  const [isOpen, setIsOpen] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<HTMLInputElement[]>([]);
  const handleVerifyOTP = () => {
    if (otp.length === 6) {
      setIsOpen(false);
      alert("OTP Verified! Proceed to reset password.");
    } else {
      alert("Enter a valid 6-digit OTP.");
    }
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return; // Allow only single digit numbers

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move focus to next input if a digit is entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

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
          <div className="w-full md:w-1/3">
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
            <div className="w-full md:w-1/3">
              <Button
                variant="primaryoutline"
                buttonSize="full"
                color="btnfontprimary"
                buttonName="Send OTP"
                onClick={() => setIsOpen(true)}
              />
            </div>
          </div>
          {/* OTP Modal */}
          {isOpen && (
            <Modal
              isOpen={true}
              onClose={() => setIsOpen(false)}
              title="Enter OTP"
              content={
                <div className="flex flex-col gap-4">
                  <div className="flex justify-center items-center gap-2 mb-5 mt-5">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        type="text"
                        maxLength={1}
                        ref={(el) => {
                          if (el) inputRefs.current[index] = el;
                        }}
                        className="border p-2 rounded-md w-10 text-center text-lg font-bold"
                        value={digit}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                      />
                    ))}
                  </div>
                  <Button
                    variant="primaryoutline"
                    buttonSize="full"
                    color="btnfontprimary"
                    buttonName="Verify OTP"
                    onClick={handleVerifyOTP}
                  />
                </div>
              }
            />
          )}
        </div>
      </div>
    </>
  );
};

export default LoginandSecurity;

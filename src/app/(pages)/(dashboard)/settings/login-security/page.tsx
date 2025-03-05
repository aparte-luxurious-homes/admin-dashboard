"use client";

import BreadCrumb from "@/src/components/breadcrumb";
import { useState, useRef } from "react";
import Grid from "@mui/material/Grid2";
import Button from "@/src/components/button";
import axiosRequest from "@/src/lib/api";
import { toast } from "react-hot-toast";
import Cookies from "js-cookie";
import { BASE_API_URL, API_ROUTES } from "@/src/lib/routes/endpoints";
import InputGroup from "@/src/components/formcomponent/InputGroup";
import useValidator from "@/src/hooks/useValidator";
import Modal from "@/src/components/modal/Modal";

const LoginandSecurity = () => {
  const [resetInfo, setResetInfo] = useState<{ [key: string]: string }>({});
  const [isOpen, setIsOpen] = useState(false);
  const [validator, triggerValidation] = useValidator();
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const inputRefs = useRef<HTMLInputElement[]>([]);
  // const handleVerifyOTP = () => {
  //   if (otp.length === 6) {
  //     setIsOpen(false);
  //     alert("OTP Verified! Proceed to reset password.");
  //   } else {
  //     alert("Enter a valid 6-digit OTP.");
  //   }
  // };

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;

    let newOtp = otp.split("");
    newOtp[index] = value;
    setOtp(newOtp.join(""));

    // Move focus to next input if a digit is entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePasswordReset = async () => {
    try {
      // Trigger validation before proceeding
      triggerValidation();

      // Checking validation errors
      if (!validator.allValid()) {
        return;
      }

      if (!otp || otp.length !== 6) {
        toast.error("OTP must be exactly 6 digits.", {
          duration: 3000,
          style: {
            maxWidth: "500px",
            width: "max-content",
          },
        });
        return;
      }

      setResetLoading(true);

      const response = await axiosRequest.post(
        `${BASE_API_URL}${API_ROUTES.auth.passwordReset}`,
        { ...resetInfo, otp: otp }
      );

      toast.success(response?.data?.message, {
        duration: 3000,
        style: {
          maxWidth: "500px",
          width: "max-content",
        },
      });
      Cookies.remove("token");
      window.location.href = "/auth/login";
      setIsOpen(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message, {
        duration: 4000,
        style: {
          maxWidth: "500px",
          width: "max-content",
        },
      });
    } finally {
      setResetLoading(false);
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };
  const handleRequestOtp = async () => {
    try {
      triggerValidation();

      if (!validator.allValid()) {
        return;
      }
      const { email, phone } = resetInfo;

      if (!email && !phone) {
        toast.error("Please enter either an email or phone number.", {
          duration: 6000,
          style: {
            maxWidth: "500px",
            width: "max-content",
          },
        });
        return;
      }
      setLoading(true);
      // Only include the email or number has a value
      const requestBody = email ? { email } : { phone };

      const response = await axiosRequest.post(
        `${BASE_API_URL}${API_ROUTES.auth.requestPasswordReset}`,
        requestBody
      );
      toast(response?.data?.message, {
        duration: 3000,
        style: {
          maxWidth: "500px",
          width: "max-content",
        },
      });

      console.log("OTP Sent:", response.data);
      setIsOpen(true);
    } catch (error: any) {
      toast.error(error?.response?.data?.message, {
        duration: 4000,
        style: {
          maxWidth: "500px",
          width: "max-content",
        },
      });
    } finally {
      setLoading(false);
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
                {validator.message("password", resetInfo?.password, "required|min:8")}
              </Grid>
              <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12 }}>
                <InputGroup
                  label="Confirm New Password"
                  required
                  onChange={handleTextChange}
                  inputType="text"
                  inputName="password_confirmation"
                />
                {validator.message("password", resetInfo?.password_confirmation, "required|min:8")}
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
                isLoading={loading}
                onClick={handleRequestOtp}
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
                    {Array.from({ length: 6 }).map((_, index) => (
                      <input
                        key={index}
                        type="text"
                        maxLength={1}
                        ref={(el) => {
                          if (el) inputRefs.current[index] = el;
                        }}
                        className="border p-2 rounded-md w-10 text-center text-lg font-bold"
                        value={otp[index] || ""}
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
                    isLoading={resetLoading}
                    onClick={handlePasswordReset}
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

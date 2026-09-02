"use client";

import { MESSAGES } from '@/src/lib/messages';
import BreadCrumb from "@/src/components/breadcrumb";
import { useState, useRef } from "react";
import Grid from "@mui/material/Grid2";
import Button from "@/src/components/button";
import axiosRequest from "@/src/lib/api";
import { toast } from "react-hot-toast";
import Cookies from "js-cookie";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import InputGroup from "@/src/components/formcomponent/InputGroup";
import useValidator from "@/src/hooks/useValidator";
import Modal from "@/src/components/modal/Modal";
import { Icon } from "@iconify/react";

const LoginandSecurity = () => {
  const [resetInfo, setResetInfo] = useState<{ [key: string]: string }>({});
  const [isOpen, setIsOpen] = useState(false);
  const [validator, triggerValidation] = useValidator();
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const inputRefs = useRef<HTMLInputElement[]>([]);
  
  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordMatchError, setPasswordMatchError] = useState("");

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = otp.split("");
    newOtp[index] = value;
    setOtp(newOtp.join(""));

    // Move focus to next input if a digit is entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const validatePasswordMatch = () => {
    if (resetInfo.password && resetInfo.password_confirmation) {
      return resetInfo.password === resetInfo.password_confirmation;
    }
    return true;
  };
  const handlePasswordReset = async () => {
    try {
      // Trigger validation before proceeding
      triggerValidation();

      // Check if passwords match
      if (!validatePasswordMatch()) {
        toast.error(MESSAGES.MSG_PASSWORDS_DO_NOT_MATCH, {
          duration: 3000,
          style: {
            maxWidth: "500px",
            width: "max-content",
          },
        });
        return;
      }

      // Checking validation errors
      if (!validator.allValid()) {
        return;
      }

      if (!otp || otp.length !== 6) {
        toast.error(MESSAGES.MSG_OTP_MUST_BE_EXACTLY_6_DIGITS, {
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
        `${API_ROUTES.auth.passwordReset}`,
        { ...resetInfo, otp }
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

      // Check if passwords match before sending OTP
      if (!validatePasswordMatch()) {
        toast.error(MESSAGES.MSG_PASSWORDS_DO_NOT_MATCH, {
          duration: 6000,
          style: {
            maxWidth: "500px",
            width: "max-content",
          },
        });
        return;
      }

      if (!validator.allValid()) {
        return;
      }
      
      const { email, phone } = resetInfo;

      if (!email && !phone) {
        toast.error(MESSAGES.MSG_PLEASE_ENTER_EITHER_AN_EMAIL_OR_PHONE_NU, {
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
        `${API_ROUTES.auth.requestPasswordReset}`,
        requestBody
      );
      toast.success(response?.data?.message, {
        duration: 3000,
        style: {
          maxWidth: "500px",
          width: "max-content",
        },
      });

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
    const sanitized = (name === "password" || name === "password_confirmation")
      ? value.replace(/\s/g, '')
      : value;
    setResetInfo((prev) => ({ ...prev, [name]: sanitized }));
    
    // Validate password match when either password field changes
    if (name === "password" || name === "password_confirmation") {
      setTimeout(validatePasswordMatch, 0);
    }
  };

  return (
    <>
      <div className="p-3 sm:p-4 md:p-5 mr-2 sm:mr-3 md:mr-4 lg:mr-5 ml-2 sm:ml-3 md:ml-4 lg:ml-5 mt-2 sm:mt-3 md:mt-4 lg:mt-5 mb-4 sm:mb-5 border border-[#D9D9D9] rounded-xl sm:rounded-2xl bg-white shadow-sm min-h-[calc(100vh-120px)]">
        <BreadCrumb
          description=""
          active="Login and Security"
          link_one="/settings"
          link_one_name="Settings"
        />
        <div className="mt-2 sm:mt-3 md:mt-4">
          <h3 className="mb-3 sm:mb-4 mt-2 sm:mt-3 text-base sm:text-lg md:text-xl font-semibold">
            Reset Password
          </h3>
          
          {/* Tip Banner - Mobile Optimized */}
          <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg sm:rounded-md">
            <p className="text-xs sm:text-sm text-blue-700 flex items-start gap-1.5">
              <span className="font-medium shrink-0">💡 Tip:</span>
              <span>
                Reset using email or phone.{" "}
                <span className="font-medium">Email recommended</span> for faster
                delivery.
              </span>
            </p>
          </div>

          {/* Form - Responsive Width */}
          <div className="w-full md:w-2/3 lg:w-1/2 xl:w-1/3">
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <InputGroup
                  label="Email"
                  required
                  disabled={!!resetInfo?.phone}
                  onChange={handleTextChange}
                  inputType="email"
                  inputName="email"
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <InputGroup
                  label="Phone Number"
                  required
                  disabled={!!resetInfo?.email}
                  onChange={handleTextChange}
                  inputType="text"
                  inputName="phone"
                />
              </Grid>
              
              {/* New Password with Eye Icon */}
              <Grid size={{ xs: 12 }}>
                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-bold text-zinc-500 uppercase tracking-wider ml-1">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={resetInfo.password || ""}
                      onChange={handleTextChange}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 sm:py-3 pr-10 text-sm sm:text-base focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                      tabIndex={-1}
                    >
                      <Icon
                        icon={
                          showPassword
                            ? "solar:eye-bold-duotone"
                            : "solar:eye-closed-bold-duotone"
                        }
                        className="text-lg sm:text-xl"
                      />
                    </button>
                  </div>
                  <div className="text-xs sm:text-sm text-red-500 min-h-[20px]">
                    {validator.message(
                      "password",
                      resetInfo?.password,
                      "required|min:8"
                    )}
                  </div>
                </div>
              </Grid>

              {/* Confirm New Password with Eye Icon */}
              <Grid size={{ xs: 12 }}>
                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-bold text-zinc-500 uppercase tracking-wider ml-1">
                    Confirm New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="password_confirmation"
                      value={resetInfo.password_confirmation || ""}
                      onChange={handleTextChange}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 sm:py-3 pr-10 text-sm sm:text-base focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                      tabIndex={-1}
                    >
                      <Icon
                        icon={
                          showConfirmPassword
                            ? "solar:eye-bold-duotone"
                            : "solar:eye-closed-bold-duotone"
                        }
                        className="text-lg sm:text-xl"
                      />
                    </button>
                  </div>

                  {/* Validation Messages */}
                  <div className="space-y-1">
                    <div className="text-xs sm:text-sm text-red-500 min-h-[20px]">
                      {validator.message(
                        "password_confirmation",
                        resetInfo?.password_confirmation,
                        "required|min:8"
                      )}
                    </div>
                    {resetInfo.password &&
                      resetInfo.password_confirmation &&
                      resetInfo.password !== resetInfo.password_confirmation && (
                        <div className="text-xs sm:text-sm text-red-500 flex items-center gap-1">
                          <Icon
                            icon="solar:danger-circle-bold-duotone"
                            className="text-sm"
                          />
                          Passwords do not match
                        </div>
                    )}
                    {resetInfo.password &&
                      resetInfo.password_confirmation &&
                      resetInfo.password === resetInfo.password_confirmation && (
                        <div className="text-xs sm:text-sm text-green-500 flex items-center gap-1">
                          <Icon
                            icon="solar:check-circle-bold-duotone"
                            className="text-sm"
                          />
                          Passwords match
                        </div>
                      )}
                  </div>
                </div>
              </Grid>
            </Grid>
          </div>

          {/* Submit Button - Centered */}
          <div className="mt-6 sm:mt-8 md:mt-10 flex justify-center">
            <div className="w-full md:w-2/3 lg:w-1/2 xl:w-1/3">
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
                <div className="flex flex-col gap-3 sm:gap-4 p-2 sm:p-3">
                  <p className="text-xs sm:text-sm text-zinc-500 text-center">
                    Enter the 6-digit code sent to your{" "}
                    {resetInfo.email ? "email" : "phone"}
                  </p>
                  <div className="flex justify-center items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 mt-2 sm:mt-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <input
                        key={index}
                        type="text"
                        maxLength={1}
                        ref={(el) => {
                          if (el) inputRefs.current[index] = el;
                        }}
                        className="border border-zinc-200 p-1.5 sm:p-2 rounded-lg w-8 sm:w-10 h-8 sm:h-10 text-center text-sm sm:text-base font-bold focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none"
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
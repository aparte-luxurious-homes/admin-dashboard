"use client";

import BreadCrumb from "@/src/components/breadcrumb";
import { useAuth } from "@/src/hooks/useAuth";
import Grid from "@mui/material/Grid2";
import { useEffect, useMemo, useState } from "react";
import Button from "@/src/components/button";
import { toast } from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import axiosRequest from "@/src/lib/api";
import InputGroup from "@/src/components/formcomponent/InputGroup";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import { IoCopyOutline, IoCheckmarkOutline } from "react-icons/io5";
import KycVerification from "@/src/components/settings/KycVerification";
import { humanizeProfileField } from "@/src/components/shared/IncompleteProfileDialog";
import { UserRole } from "@/src/lib/enums";

// KYC verification is self-serve for AGENT/OWNER/GUEST. Admin roles' identity
// is vetted during onboarding, so we don't render the upload widget for them.
const KYC_ALLOWED_ROLES: UserRole[] = [UserRole.AGENT, UserRole.OWNER, UserRole.GUEST];

const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
];

const ReferralCodeBox = ({ code }: { code: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="flex items-center gap-3 mt-1">
      <span className="font-mono font-bold text-xl tracking-widest text-primary">{code}</span>
      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-primary text-primary text-sm font-medium hover:bg-primary/5 transition-colors"
      >
        {copied ? <IoCheckmarkOutline className="text-green-500" /> : <IoCopyOutline />}
        <span className={copied ? 'text-green-500' : ''}>{copied ? 'Copied!' : 'Copy'}</span>
      </button>
    </div>
  );
};

const PersonalInfoPage = () => {
  const { user, isFetching } = useAuth();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const fromIncomplete = searchParams.get("from") === "incomplete";

  const [isEditing, setIsEditing] = useState(false);
  const [personalInfo, setPersonalInfo] = useState<{ [key: string]: string }>({});

  // Server-reported missing fields (HOST_REQUIRED_PROFILE_FIELDS set).
  const missingFields = useMemo<string[]>(
    () => user?.missingProfileFields ?? user?.missing_profile_fields ?? [],
    [user],
  );
  const showKyc = !!user?.role && KYC_ALLOWED_ROLES.includes(user.role as UserRole);

  // Seed gender + dob from the user so unchanged fields aren't blanked out
  // by a partial-update payload (the backend treats Form(None) as "skip").
  useEffect(() => {
    if (!user) return;
    setPersonalInfo((prev) => ({
      ...prev,
      ...(user.profile?.gender && !prev.gender ? { gender: user.profile.gender } : {}),
      ...(user.profile?.dob && !prev.dob ? { dob: user.profile.dob } : {}),
    }));
  }, [user]);

  const handleEditProfile = () => {
    setIsEditing(true);
    const formData = new FormData();
    Object.entries(personalInfo).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        formData.append(key, String(value));
      }
    });

    axiosRequest
      .put(API_ROUTES.profile.update, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => {
        setIsEditing(false);
        toast.success(res?.data?.message || "Profile updated.", {
          duration: 3000,
          style: { maxWidth: "500px", width: "max-content" },
        });
        // Refresh useAuth().user so missingProfileFields reflects the new state.
        queryClient.invalidateQueries({ queryKey: ["authUser"] });
      })
      .catch((err) => {
        setIsEditing(false);
        const detail = err?.response?.data?.detail;
        const msg =
          (typeof detail === "string" ? detail : detail?.message) ||
          err?.response?.data?.message ||
          "Failed to update profile";
        toast.error(msg, {
          duration: 4000,
          style: { maxWidth: "500px", width: "max-content" },
        });
      });
  };

  const handleTextChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setPersonalInfo({ ...personalInfo, [name]: value });
  };

  // InputGroup uses `defaultValue`, which is read once at mount and never
  // refreshed. If we render the form before `user` resolves, every input
  // captures an empty string and ignores the user data when it arrives.
  // Gate the entire form on user being present so the InputGroups mount
  // with the correct initial values.
  if (!user) {
    return (
      <div className="p-[30px] mt-10 mb-100 border border-[#D9D9D9] rounded-[15px] bg-white shadow-md min-h-[400px] flex items-center justify-center">
        <p className="text-zinc-500 text-sm">
          {isFetching ? "Loading your profile…" : "Profile unavailable."}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="p-[30px] mt-10 mb-100 border border-[#D9D9D9] rounded-[15px] bg-white shadow-md">
        <BreadCrumb
          description=""
          active="Personal info"
          link_one="/settings"
          link_one_name="Settings"
        />

        {fromIncomplete && missingFields.length > 0 && (
          <div className="mt-4 mb-2 border border-amber-300 bg-amber-50 text-amber-900 rounded-lg p-4">
            <p className="font-semibold mb-1">Complete your profile to continue</p>
            <p className="text-sm mb-2">
              The following details are still needed before you can list properties
              or onboard guests:
            </p>
            <ul className="list-disc pl-5 text-sm space-y-0.5">
              {missingFields.map((field) => (
                <li key={field}>{humanizeProfileField(field)}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-0">
          <h3 className="mb-[50px] mt-[10px] font-semibold">Personal Info</h3>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
              <InputGroup
                label="First Name"
                required
                defaultValue={user?.profile?.firstName || ""}
                onChange={handleTextChange}
                inputType="text"
                inputName="first_name"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
              <InputGroup
                label="Last Name"
                required
                defaultValue={user?.profile?.lastName || ""}
                onChange={handleTextChange}
                inputType="text"
                inputName="last_name"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
              <InputGroup
                label="Email Address"
                required
                disabled
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
                inputName="phone"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
              <InputGroup
                label="Date of Birth"
                required
                defaultValue={user?.profile?.dob || ""}
                onChange={handleTextChange}
                inputType="date"
                inputName="dob"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-zinc-700 mb-1">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  name="gender"
                  defaultValue={user?.profile?.gender || ""}
                  onChange={handleTextChange}
                  className="border border-zinc-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Select…</option>
                  {GENDER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
              <InputGroup
                label="Address"
                defaultValue={user?.profile?.address || ""}
                onChange={handleTextChange}
                inputType="text"
                inputName="address"
              />
            </Grid>
          </Grid>

          {user?.profile?.referral_code && (
            <div className="mt-8 p-5 rounded-xl border border-dashed border-primary/50 bg-primary/5">
              <p className="text-sm text-zinc-500 mb-1 font-medium">Your Referral Code</p>
              <ReferralCodeBox code={user.profile.referral_code} />
              <p className="text-xs text-zinc-400 mt-2">
                Share this code with guests. When they book using it, you earn 2% of the booking value.
              </p>
            </div>
          )}

          <div className="mt-10 flex justify-center">
            <div className="w-full sm:w-1/3">
              <Button
                variant="primaryoutline"
                buttonSize="full"
                color="btnfontprimary"
                buttonName="Save Changes"
                onClick={handleEditProfile}
                isLoading={isEditing}
              />
            </div>
          </div>
        </div>
      </div>

      {showKyc && (
        <div
          id="kyc"
          className="p-[30px] mt-6 mb-20 border border-[#D9D9D9] rounded-[15px] bg-white shadow-md scroll-mt-24"
        >
          <h3 className="font-semibold text-lg mb-1">Identity Verification</h3>
          <p className="text-sm text-zinc-500 mb-4">
            Upload identity, address, or ownership documents. Admins review each
            submission; once approved your account is marked verified.
          </p>
          <KycVerification embedded />
        </div>
      )}
    </>
  );
};

export default PersonalInfoPage;

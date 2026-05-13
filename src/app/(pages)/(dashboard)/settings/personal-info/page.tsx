"use client";

import BreadCrumb from "@/src/components/breadcrumb";
import { useAuth, fetchUser } from "@/src/hooks/useAuth";
import { setUser } from "@/src/lib/slices/authSlice";
import { useDispatch } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import Grid from "@mui/material/Grid2";
import { useEffect, useMemo, useState } from "react";
import Button from "@/src/components/button";
import { toast } from "react-hot-toast";
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

interface FormState {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  address: string;
}

const emptyForm: FormState = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  dob: "",
  gender: "",
  address: "",
};

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
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const fromIncomplete = searchParams.get("from") === "incomplete";

  // useAuth() only fetches when Redux's `user` is empty (gated by
  // `enabled: !!token && !user`). On first arrival to this page, the
  // persisted Redux user is often stale (no phone/dob/gender). Force a
  // fresh /profile fetch + dispatch so the form shows current server state.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fresh = await fetchUser();
        if (!cancelled) dispatch(setUser(fresh));
      } catch {
        // Silently ignore — useAuth's polling will catch up on its own.
      }
    })();
    return () => {
      cancelled = true;
    };
    // Only on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [isEditing, setIsEditing] = useState(false);
  // Controlled form state — single source of truth. Synced from `user` via
  // the effect below so the form rehydrates when React Query refetches.
  const [form, setForm] = useState<FormState>(emptyForm);

  // Server-reported missing fields (HOST_REQUIRED_PROFILE_FIELDS set).
  const missingFields = useMemo<string[]>(
    () => user?.missingProfileFields ?? user?.missing_profile_fields ?? [],
    [user],
  );
  const showKyc = !!user?.role && KYC_ALLOWED_ROLES.includes(user.role as UserRole);

  // Hydrate from server profile whenever user data changes (initial load,
  // refetch after save, etc.). The form fields stay in sync because they
  // bind to `form` (controlled), not `defaultValue` (uncontrolled).
  useEffect(() => {
    if (!user) return;
    setForm({
      first_name: user.profile?.firstName || user.profile?.first_name || "",
      last_name: user.profile?.lastName || user.profile?.last_name || "",
      email: user.email || "",
      phone: user.phone || "",
      dob: user.profile?.dob || "",
      gender: user.profile?.gender || "",
      address: user.profile?.address || "",
    });
  }, [user]);

  const handleEditProfile = () => {
    setIsEditing(true);
    const formData = new FormData();
    // Skip email (server-side disabled) and empty fields so the partial
    // update doesn't blank out columns the user didn't touch.
    (Object.entries(form) as [keyof FormState, string][]).forEach(([key, value]) => {
      if (key === "email") return;
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        formData.append(key, String(value));
      }
    });

    axiosRequest
      .put(API_ROUTES.profile.update, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then(async (res) => {
        setIsEditing(false);
        toast.success(res?.data?.message || "Profile updated.", {
          duration: 3000,
          style: { maxWidth: "500px", width: "max-content" },
        });
        // useAuth's query is gated by `enabled: !!token && !user`, so
        // invalidate alone won't refetch — push fresh data into Redux
        // explicitly so the form (and missingProfileFields) reflect the
        // values the server just persisted.
        try {
          const fresh = await fetchUser();
          dispatch(setUser(fresh));
          queryClient.setQueryData(["authUser"], fresh);
        } catch {
          // Best-effort — next poll interval will catch up.
        }
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

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
                value={form.first_name}
                onChange={handleChange}
                inputType="text"
                inputName="first_name"
                placeHolder="Enter your first name"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
              <InputGroup
                label="Last Name"
                required
                value={form.last_name}
                onChange={handleChange}
                inputType="text"
                inputName="last_name"
                placeHolder="Enter your last name"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
              <InputGroup
                label="Email Address"
                required
                disabled
                value={form.email}
                onChange={handleChange}
                inputType="email"
                inputName="email"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
              <InputGroup
                label="Phone Number"
                required
                value={form.phone}
                onChange={handleChange}
                inputType="text"
                inputName="phone"
                placeHolder="+234 801 234 5678"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
              <InputGroup
                label="Date of Birth"
                required
                value={form.dob}
                onChange={handleChange}
                inputType="date"
                inputName="dob"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
              <div className="flex flex-col">
                <label className="text-[#101928] mb-0 text-sm font-medium mt-1">
                  Gender <span className="text-[#DD514D] text-base ml-[3px]">*</span>
                </label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="w-full h-[46px] box-border pl-2.5 pr-2.5 border border-[#d1d5db] mt-1 rounded-lg bg-white text-[#667185] text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
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
                value={form.address}
                onChange={handleChange}
                inputType="text"
                inputName="address"
              />
            </Grid>
          </Grid>

          {user.profile?.referral_code && (
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

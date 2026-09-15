"use client";

import React, { useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { HiOutlineCloudUpload } from "react-icons/hi";
import toast from "react-hot-toast";
import type { IUser } from "@/src/lib/types";
import { KycDocumentType, SubmitAgentKyc } from "@/src/lib/request-handlers/kycMgt";
import { apiErrorMessage } from "@/src/lib/request-handlers/userMgt";

const DOC_TYPE_OPTIONS: { value: KycDocumentType; label: string }[] = [
  { value: KycDocumentType.INTERNATIONAL_PASSPORT, label: "International Passport" },
  { value: KycDocumentType.DRIVERS_LICENSE, label: "Driver's License" },
  { value: KycDocumentType.NIN, label: "National Identity Number (NIN) slip" },
];

const ALLOWED_MIME = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
const MAX_FILE_BYTES = 10 * 1024 * 1024;
// Country is locked to Nigeria across listing and profile flows.
const COUNTRY = "Nigeria";

type FormState = {
  firstName: string;
  lastName: string;
  dob: string;
  documentType: KycDocumentType;
  address: string;
  city: string;
  state: string;
};
type FieldErrors = Partial<Record<keyof FormState | "file", string>>;

/** Latest date of birth that is 18 today, as YYYY-MM-DD. */
function latestAdultDob(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().slice(0, 10);
}

function validate(form: FormState, file: File | null): FieldErrors {
  const errors: FieldErrors = {};
  const required: [keyof FormState, string][] = [
    ["firstName", "First name is required"],
    ["lastName", "Last name is required"],
    ["dob", "Date of birth is required"],
    ["address", "Address is required"],
    ["city", "City / town is required"],
    ["state", "State is required"],
  ];
  for (const [key, message] of required) {
    if (!String(form[key] ?? "").trim()) errors[key] = message;
  }
  if (form.dob && form.dob > latestAdultDob()) errors.dob = "You must be at least 18 years old";
  if (!file) errors.file = "Upload your identification document";
  return errors;
}

function Field({ label, htmlFor, error, children }: {
  label: string; htmlFor: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1" role="alert">{error}</p>}
    </div>
  );
}

const inputClass = (error?: string) =>
  `w-full h-11 px-3 border rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
    error ? "border-red-400" : "border-gray-300"
  }`;

interface Props {
  user: IUser;
  onSubmitted?: () => void;
  onCancel?: () => void;
}

/** PRD §5 agent KYC form, in the dashboard. Posts to /profile/agent-kyc, which the approval gate leaves open. */
const AgentKycForm: React.FC<Props> = ({ user, onSubmitted, onCancel }) => {
  const p = user.profile;
  const [form, setForm] = useState<FormState>({
    firstName: p?.firstName ?? "",
    lastName: p?.lastName ?? "",
    dob: p?.dob ?? "",
    documentType: KycDocumentType.INTERNATIONAL_PASSPORT,
    address: p?.address ?? "",
    city: p?.city ?? "",
    state: p?.state ?? "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submit = SubmitAgentKyc();

  const setField = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((errs) => ({ ...errs, [key]: undefined }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0];
    if (!picked) return;
    if (!ALLOWED_MIME.includes(picked.type)) {
      setErrors((errs) => ({ ...errs, file: "Unsupported file type. Use JPG, PNG, WEBP, or PDF." }));
      event.target.value = "";
      return;
    }
    if (picked.size > MAX_FILE_BYTES) {
      setErrors((errs) => ({ ...errs, file: "File too large. Max 10MB." }));
      event.target.value = "";
      return;
    }
    setFile(picked);
    setErrors((errs) => ({ ...errs, file: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate(form, file);
    setErrors(found);
    if (Object.keys(found).length > 0 || !file) {
      toast.error("Please complete all required fields.");
      return;
    }
    submit.mutate(
      {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        dob: form.dob,
        documentType: form.documentType,
        file,
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        country: COUNTRY,
      },
      {
        onSuccess: () => {
          toast.success("KYC Submitted Successfully");
          setFile(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
          onSubmitted?.();
        },
        onError: (err) => toast.error(apiErrorMessage(err, "Submission failed. Please try again.")),
      },
    );
  };

  const busy = submit.isPending;

  return (
    <form data-testid="agent-kyc-form" onSubmit={handleSubmit} noValidate className="text-left space-y-6">
      <fieldset disabled={busy}>
        <legend className="text-sm font-semibold text-gray-900 mb-3">Personal information</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="First name" htmlFor="kyc-first-name" error={errors.firstName}>
            <input id="kyc-first-name" className={inputClass(errors.firstName)} value={form.firstName}
              onChange={setField("firstName")} autoComplete="given-name" />
          </Field>
          <Field label="Last name" htmlFor="kyc-last-name" error={errors.lastName}>
            <input id="kyc-last-name" className={inputClass(errors.lastName)} value={form.lastName}
              onChange={setField("lastName")} autoComplete="family-name" />
          </Field>
          <Field label="Date of birth" htmlFor="kyc-dob" error={errors.dob}>
            <input id="kyc-dob" type="date" max={latestAdultDob()} className={inputClass(errors.dob)}
              value={form.dob} onChange={setField("dob")} />
          </Field>
        </div>
      </fieldset>

      <fieldset disabled={busy}>
        <legend className="text-sm font-semibold text-gray-900 mb-3">Identification</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Document type" htmlFor="kyc-doc-type">
            <select id="kyc-doc-type" className={inputClass()} value={form.documentType}
              onChange={setField("documentType")}>
              {DOC_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Document (JPG / PNG / WEBP / PDF, max 10MB)" htmlFor="agent-kyc-file-input" error={errors.file}>
            <input ref={fileInputRef} id="agent-kyc-file-input" type="file" className="sr-only"
              accept={ALLOWED_MIME.join(",")} onChange={handleFileChange} />
            <label
              htmlFor="agent-kyc-file-input"
              className={`flex items-center justify-center gap-2 h-11 px-4 rounded-lg border-2 border-dashed cursor-pointer text-sm font-medium ${
                file
                  ? "border-primary/60 bg-primary/5 text-primary"
                  : errors.file
                    ? "border-red-400 text-red-600"
                    : "border-gray-300 text-gray-600 hover:border-primary hover:text-primary"
              }`}
            >
              <HiOutlineCloudUpload className="text-lg" />
              <span className="truncate max-w-[220px]">{file ? file.name : "Choose a file"}</span>
            </label>
          </Field>
        </div>
      </fieldset>

      <fieldset disabled={busy}>
        <legend className="text-sm font-semibold text-gray-900 mb-3">Address</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Address" htmlFor="kyc-address" error={errors.address}>
              <input id="kyc-address" className={inputClass(errors.address)} value={form.address}
                onChange={setField("address")} autoComplete="street-address" />
            </Field>
          </div>
          <Field label="City / Town" htmlFor="kyc-city" error={errors.city}>
            <input id="kyc-city" className={inputClass(errors.city)} value={form.city}
              onChange={setField("city")} autoComplete="address-level2" />
          </Field>
          <Field label="State / Region" htmlFor="kyc-state" error={errors.state}>
            <input id="kyc-state" className={inputClass(errors.state)} value={form.state}
              onChange={setField("state")} autoComplete="address-level1" />
          </Field>
          <Field label="Country" htmlFor="kyc-country">
            <input id="kyc-country" className={`${inputClass()} bg-gray-50 text-gray-500`} value={COUNTRY} readOnly />
          </Field>
        </div>
      </fieldset>

      <div className="flex flex-wrap justify-end gap-3">
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={busy}
            className="h-10 px-5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50">
            Cancel
          </button>
        )}
        <button type="submit" disabled={busy}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">
          <Icon icon={busy ? "mdi:loading" : "mdi:send"} className={busy ? "animate-spin" : ""} />
          {busy ? "Submitting…" : "Submit KYC for review"}
        </button>
      </div>
    </form>
  );
};

export default AgentKycForm;

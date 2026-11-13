"use client";

import { MESSAGES } from '@/src/lib/messages';
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Icon } from "@iconify/react";
import { HiOutlineCloudUpload } from "react-icons/hi";
import Spinner from "@/src/components/ui/Spinner";
import BreadCrumb from "@/src/components/breadcrumb";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import {
  GetMyKycDocuments,
  UploadMyKycDocument,
  KycDocumentType,
  KycDocStatus,
  IKycDocument,
} from "@/src/lib/request-handlers/kycMgt";

const DOC_TYPE_OPTIONS: { value: KycDocumentType; label: string; group: string }[] = [
  { value: KycDocumentType.INTERNATIONAL_PASSPORT, label: "International Passport", group: "Identity" },
  { value: KycDocumentType.DRIVERS_LICENSE, label: "Driver's License", group: "Identity" },
  { value: KycDocumentType.NIN, label: "National Identity Number", group: "Identity" },
  // { value: KycDocumentType.UTILITY_BILL, label: "Utility Bill", group: "Address" },
  // { value: KycDocumentType.POWER_BILL, label: "Power Bill", group: "Address" },
  // { value: KycDocumentType.TENANCY_AGREEMENT, label: "Tenancy Agreement", group: "Address" },
  // { value: KycDocumentType.TITLE_DEED, label: "Title Deed", group: "Ownership" },
  // { value: KycDocumentType.CERTIFICATE_OF_OCCUPANCY, label: "Certificate of Occupancy", group: "Ownership" },
];

const STATUS_STYLES: Record<KycDocStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  VERIFIED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
};

const ALLOWED_MIME = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];

function StatusBadge({ status }: { status: KycDocStatus }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full border ${STATUS_STYLES[status]}`}>
      {status}
    </span>
  );
}

function DocTypeLabel({ type }: { type: KycDocumentType }) {
  const found = DOC_TYPE_OPTIONS.find((o) => o.value === type);
  return <>{found ? found.label : type}</>;
}

function DocCard({ doc }: { doc: IKycDocument }) {
  const isPdf = doc.document_url.toLowerCase().includes(".pdf");
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4 flex gap-4 items-start">
      <div className="w-16 h-16 flex-shrink-0 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center overflow-hidden">
        {isPdf ? (
          <Icon icon="mdi:file-pdf-box" className="text-red-500" width="36" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={doc.document_url} alt="KYC document" className="w-full h-full object-cover" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-zinc-900 truncate">
            <DocTypeLabel type={doc.document_type} />
          </p>
          <StatusBadge status={doc.status} />
        </div>
        <p className="text-[11px] text-zinc-500 mt-1">
          Uploaded {new Date(doc.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
        </p>
        {doc.status === KycDocStatus.REJECTED && doc.rejection_reason && (
          <p className="text-xs text-red-600 mt-2 bg-red-50 border border-red-100 rounded-md px-2 py-1.5">
            <span className="font-semibold">Reason:</span> {doc.rejection_reason}
          </p>
        )}
        <a
          href={doc.document_url}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-xs font-semibold text-primary hover:underline mt-2"
        >
          View document →
        </a>
      </div>
    </div>
  );
}

interface KycVerificationProps {
  /**
   * When true, suppresses the internal BreadCrumb so the component can be
   * embedded inside another settings page (e.g. /settings/personal-info)
   * without showing a duplicate breadcrumb trail.
   */
  embedded?: boolean;
}

export default function KycVerification({ embedded = false }: KycVerificationProps = {}) {
  const router = useRouter();
  const { data, isLoading } = GetMyKycDocuments();
  const { mutate: upload, isPending: uploading } = UploadMyKycDocument();
  const [docType, setDocType] = useState<KycDocumentType>(KycDocumentType.INTERNATIONAL_PASSPORT);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_MIME.includes(file.type)) {
      toast.error(MESSAGES.MSG_UNSUPPORTED_FILE_TYPE_USE_JPG_PNG_WEBP_O);
      event.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(MESSAGES.MSG_FILE_TOO_LARGE_MAX_10MB);
      event.target.value = "";
      return;
    }
    setSelectedFile(file);
  };

  const handleSubmit = () => {
    if (!selectedFile) {
      toast.error(MESSAGES.MSG_PICK_A_FILE_FIRST);
      return;
    }
    upload(
      { file: selectedFile, documentType: docType },
      {
        onSuccess: () => {
          toast.success(MESSAGES.MSG_DOCUMENT_UPLOADED_AWAITING_ADMIN_REVIEW);
          setSelectedFile(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.detail || MESSAGES.MSG_UPLOAD_FAILED);
        },
      },
    );
  };

  const docs = data?.items ?? [];
  const profileStatus = data?.profile_kyc_status ?? null;

  return (
    <div className={embedded ? "w-full" : "p-4 sm:p-6 md:p-8 w-full max-w-5xl mx-auto"}>
      {!embedded && (
        <BreadCrumb
          description=""
          active="KYC Verification"
          link_one={PAGE_ROUTES.dashboard.settings.base}
          link_one_name="Settings"
        />
      )}

      <div className="flex items-start justify-between gap-4 mt-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">KYC Verification</h1>
          <p className="text-sm text-zinc-500 mt-1 max-w-xl">
            Upload your identity, address, or ownership documents. An admin will review each submission; once approved your account is marked verified.
          </p>
        </div>
        {profileStatus && (
          <div className="flex-shrink-0">
            <StatusBadge status={profileStatus} />
          </div>
        )}
      </div>

      {/* Upload form */}
      <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5 sm:p-6 mb-8">
        <h2 className="text-base font-semibold text-zinc-900 mb-4 flex items-center gap-2">
          <Icon icon="material-symbols:upload-file-outline" className="text-primary" />
          New submission
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
              Document Type
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as KycDocumentType)}
              className="w-full h-11 px-3 border border-zinc-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              disabled={uploading}
            >
              {["Identity", "Address", "Ownership"].map((group) => (
                <optgroup key={group} label={group}>
                  {DOC_TYPE_OPTIONS.filter((o) => o.group === group).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
              File (JPG / PNG / WEBP / PDF, max 10MB)
            </label>
            <input
              ref={fileInputRef}
              id="kyc-file-input"
              type="file"
              className="hidden"
              accept={ALLOWED_MIME.join(",")}
              onChange={handleFileChange}
              disabled={uploading}
            />
            <label
              htmlFor="kyc-file-input"
              className={`flex items-center justify-center gap-2 h-11 px-4 rounded-lg border-2 border-dashed cursor-pointer transition-colors text-sm font-medium ${
                uploading
                  ? "border-zinc-200 text-zinc-400 cursor-not-allowed"
                  : selectedFile
                    ? "border-primary/60 bg-primary/5 text-primary"
                    : "border-zinc-300 text-zinc-600 hover:border-primary hover:text-primary"
              }`}
            >
              <HiOutlineCloudUpload className="text-lg" />
              <span className="truncate max-w-[240px]">
                {selectedFile ? selectedFile.name : "Choose a file"}
              </span>
            </label>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={uploading || !selectedFile}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:bg-zinc-300 disabled:cursor-not-allowed"
          >
            {uploading ? <Spinner /> : <Icon icon="mdi:cloud-upload" />}
            {uploading ? "Uploading..." : "Submit for review"}
          </button>
        </div>
      </section>

      {/* Existing submissions */}
      <section>
        <h2 className="text-base font-semibold text-zinc-900 mb-3">
          Your submissions ({docs.length})
        </h2>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner color="#124452" />
          </div>
        ) : docs.length === 0 ? (
          <div className="bg-white border border-dashed border-zinc-300 rounded-2xl p-10 text-center">
            <Icon icon="solar:documents-broken" className="mx-auto text-5xl text-zinc-300 mb-3" />
            <p className="text-sm text-zinc-500">
              No documents uploaded yet. Start with an ID document above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {docs.map((doc) => (
              <DocCard key={doc.id} doc={doc} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

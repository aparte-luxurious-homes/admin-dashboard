"use client";

import Image from "next/image";
import { MdCopyAll } from "react-icons/md";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";

import { IoLocationOutline } from "react-icons/io5";
import { formatDate, maskId } from "@/src/lib/utils";
import { VerificationBadge } from "../../badge";
import { CalendarIcon } from "../../icons";
import {
  IProperty,
  IPropertyVerification,
  PropertyVerificationStatus,
} from "../types";
import { useAuth } from "@/src/hooks/useAuth";
import {
  AssignToProperty,
  GetPropertyVerification,
  UpdatePropertyDocumentStatus,
  UpdatePropertyVerification,
  UploadVerificationMedia,
} from "@/src/lib/request-handlers/propertyMgt";
import VerificationHistoryTimeline from "./VerificationHistoryTimeline";
import { HiOutlineCloudUpload } from "react-icons/hi";
import { UserRole } from "@/src/lib/enums";
import { useFormik } from "formik";
import { useDispatch } from "react-redux";
import { showAlert } from "@/src/lib/slices/alertDialogSlice";
import CustomModal from "../../ui/CustomModal";
import { GetAllUsers } from "@/src/lib/request-handlers/userMgt";
import { IUser } from "@/src/lib/types";
import toast from "react-hot-toast";
import AdjustableFilterDropdown from "../../ui/AdjustableFilterDropdown";
import Spinner from "../../ui/Spinner";
import Loader from "../../loader";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";

export default function VerificationDetails({
  propertyId,
  verificationId,
}: {
  propertyId: string | number;
  verificationId: string | number;
}) {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editFromUrlRef = useRef(false);
  const { user } = useAuth();
  const { mutate: assignAgent, isPending: assignmentLoading } =
    AssignToProperty(propertyId);
  const { mutate: updateVerification, isPending: verificationUdateLoading } =
    UpdatePropertyVerification();
  const { mutate: uploadEvidence, isPending: evidenceUploading } =
    UploadVerificationMedia();
  const { data: verificationData, isLoading: verificationLoading } =
    GetPropertyVerification(verificationId);
  const [verification, setVerification] =
    useState<IPropertyVerification | null>(null);
  const [property, setProperty] = useState<IProperty | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [agentSearchTerm, setAgentSearchTerm] = useState<string>("");
  // Verification evidence — URLs the agent has already uploaded for this
  // verification. Seeded from the server on load and appended-to as the
  // agent uploads more. The Verify button is gated on length >= 2.
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);

  const { data: agentsList, isLoading: agentsLoading } = GetAllUsers(
    1,
    12,
    agentSearchTerm,
    UserRole.AGENT,
  );
  const [agents, setAgents] = useState<IUser[]>(agentsList?.data?.data?.data);
  const [selectedAgent, setSelectedAgent] = useState<IUser | null>(null);
  const [showAgentSelection, setShowAgentSelecteion] = useState(false);
  const [skipKycCheck, setSkipKycCheck] = useState(false);
  const [skipDocumentCheck, setSkipDocumentCheck] = useState(false);
  // Reject flow uses its own modal so admins (who can't enter editMode) can
  // still capture a rejection reason. The reason is required server-side.
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  // Approve flow gets its own modal too, so override-check toggles are an
  // explicit confirm step rather than a hidden sticky setting.
  const [showApproveModal, setShowApproveModal] = useState(false);
  // Tabbed layout — each tab is a focused review surface so admins can
  // jump straight to what they need rather than scroll the whole page.
  type TabId = "overview" | "owner" | "documents" | "evidence" | "activity";
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  // Per-document inline actions in the Documents tab. Approve fires
  // immediately; Reject opens a small modal so the admin can capture the
  // required reason before the request goes out.
  const { mutate: updateDoc, isPending: docUpdating } =
    UpdatePropertyDocumentStatus();
  const [docMutatingId, setDocMutatingId] = useState<string | null>(null);
  const [docRejectingId, setDocRejectingId] = useState<string | null>(null);
  const [docRejectReason, setDocRejectReason] = useState<string>("");

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      feedback: verification?.feedback ?? "",
    },
    onSubmit: async () => {
      updateVerification(
        {
          propertyId,
          payload: {
            feedback: formik.values.feedback,
            status: verification?.status ?? PropertyVerificationStatus.PENDING,
            evidence_urls: evidenceUrls,
          },
        },
        {
          onSuccess: () => {
            toast.success("Property verification updated successfuly", {
              duration: 6000,
              style: {
                maxWidth: "500px",
                width: "max-content",
              },
            });
            setEditMode(false);
          },
          onError: (error) =>
            toast.error("Something went wrong", {
              duration: 6000,
              style: {
                maxWidth: "500px",
                width: "max-content",
              },
            }),
        },
      );
    },
  });

  const submitRejection = () => {
    const reason = rejectReason.trim();
    if (!reason) return;
    updateVerification(
      {
        propertyId,
        payload: {
          feedback: reason,
          status: PropertyVerificationStatus.REJECTED,
        },
      },
      {
        onSuccess: () => {
          setShowRejectModal(false);
          setRejectReason("");
          formik.setFieldValue("feedback", reason);
          toast.success("Property verification rejected", {
            duration: 6000,
            style: { maxWidth: "500px", width: "max-content" },
          });
        },
        onError: (err: any) => {
          const detail = err?.response?.data?.detail;
          const msg = Array.isArray(detail)
            ? detail[0]?.msg || "Failed to reject verification"
            : typeof detail === "string"
              ? detail
              : "Failed to reject verification";
          toast.error(msg, {
            duration: 6000,
            style: { maxWidth: "500px", width: "max-content" },
          });
        },
      },
    );
  };

  const handleRejection = () => {
    // Open the dedicated reject modal — captures the required reason
    // inline so admins (who can't enter editMode) still have a path to
    // reject. The textarea seeds with whatever's already in the feedback
    // field so partially-typed feedback isn't lost.
    setRejectReason(formik.values.feedback || "");
    setShowRejectModal(true);
  };

  const handleDocApprove = (docId: string) => {
    setDocMutatingId(docId);
    updateDoc(
      {
        propertyId,
        documentId: docId,
        payload: {
          status: PropertyVerificationStatus.VERIFIED,
          feedback: "",
        } as any,
      },
      {
        onSuccess: () => {
          toast.success("Document marked verified", {
            duration: 4000,
            style: { maxWidth: "500px", width: "max-content" },
          });
        },
        onError: (err: any) => {
          const detail = err?.response?.data?.detail;
          const msg = Array.isArray(detail)
            ? detail[0]?.msg || "Failed to update document"
            : typeof detail === "string"
              ? detail
              : "Failed to update document";
          toast.error(msg, {
            duration: 6000,
            style: { maxWidth: "500px", width: "max-content" },
          });
        },
        onSettled: () => setDocMutatingId(null),
      },
    );
  };

  const submitDocRejection = () => {
    if (!docRejectingId) return;
    const reason = docRejectReason.trim();
    if (!reason) return;
    setDocMutatingId(docRejectingId);
    updateDoc(
      {
        propertyId,
        documentId: docRejectingId,
        payload: {
          status: PropertyVerificationStatus.REJECTED,
          feedback: reason,
        } as any,
      },
      {
        onSuccess: () => {
          setDocRejectingId(null);
          setDocRejectReason("");
          toast.success("Document rejected", {
            duration: 4000,
            style: { maxWidth: "500px", width: "max-content" },
          });
        },
        onError: (err: any) => {
          const detail = err?.response?.data?.detail;
          const msg = Array.isArray(detail)
            ? detail[0]?.msg || "Failed to reject document"
            : typeof detail === "string"
              ? detail
              : "Failed to reject document";
          toast.error(msg, {
            duration: 6000,
            style: { maxWidth: "500px", width: "max-content" },
          });
        },
        onSettled: () => setDocMutatingId(null),
      },
    );
  };

  const handleVerification = () => {
    dispatch(
      showAlert({
        title: "Are you sure?",
        description: "This will verify this property.",
        confirmText: "Verify",
        cancelText: "Cancel",
        onConfirm: () =>
          updateVerification(
            {
              propertyId,
              payload: {
                feedback: formik.values.feedback,
                status: PropertyVerificationStatus.VERIFIED,
                skip_kyc_check: skipKycCheck,
                skip_document_check: skipDocumentCheck,
                evidence_urls: evidenceUrls,
              },
            },
            {
              onSuccess: () =>
                toast.success("Property verification updated successfuly", {
                  duration: 6000,
                  style: {
                    maxWidth: "500px",
                    width: "max-content",
                  },
                }),
              onError: (error: any) =>
                toast.error(
                  error?.response?.data?.detail || "Failed to verify property",
                  {
                    duration: 6000,
                    style: {
                      maxWidth: "500px",
                      width: "max-content",
                    },
                  },
                ),
            },
          ),
      }),
    );
  };

  const submitApproval = () => {
    updateVerification(
      {
        propertyId,
        payload: {
          feedback: formik.values.feedback,
          status: PropertyVerificationStatus.VERIFIED,
          skip_kyc_check: skipKycCheck,
          skip_document_check: skipDocumentCheck,
        },
      },
      {
        onSuccess: () => {
          setShowApproveModal(false);
          toast.success("Property verification approved", {
            duration: 6000,
            style: { maxWidth: "500px", width: "max-content" },
          });
        },
        onError: (err: any) => {
          const detail = err?.response?.data?.detail;
          const msg = Array.isArray(detail)
            ? detail[0]?.msg || "Failed to approve verification"
            : typeof detail === "string"
              ? detail
              : "Failed to approve verification";
          toast.error(msg, {
            duration: 6000,
            style: { maxWidth: "500px", width: "max-content" },
          });
        },
      },
    );
  };

  const handleApproval = (_name?: string) => {
    // Open the approve confirmation modal — override checks live there now,
    // so admins make an explicit acknowledgement before approving with a
    // bypass instead of leaving a sticky toggle on by accident.
    setShowApproveModal(true);
  };

  const handleAgentSelection = (email: string) => {
    const filteredUsers = agents?.filter((el) => {
      if (el?.email === email) return el;
    });
    setSelectedAgent(filteredUsers[0]);
  };

  const handleAgentAssignment = (agentId: number) => {
    assignAgent(
      {
        payload: { agent_id: String(agentId) },
      },
      {
        onSuccess: () => {
          toast.success("Agent assigned successfully", {
            duration: 6000,
            style: {
              maxWidth: "500px",
              width: "max-content",
            },
          });

          setShowAgentSelecteion(false);
        },
        onError: (error: any) => {
          toast.error(
            error.status === 409
              ? "Agent already assigned with pending verification"
              : "Something went wrong",
            {
              duration: 6000,
              style: {
                maxWidth: "500px",
                width: "max-content",
              },
            },
          );
        },
      },
    );
  };

  useEffect(() => {
    setAgents(agentsList?.data?.data?.data);
  }, [agentsList]);

  useEffect(() => {
    setVerification(verificationData?.data?.data);
    setProperty(verificationData?.data?.data?.property);
    setSelectedAgent(verificationData?.data?.data?.property?.agent);
    setEvidenceUrls(
      Array.isArray(verificationData?.data?.data?.evidence_urls)
        ? verificationData.data.data.evidence_urls
        : [],
    );

    // Handle ?edit=true from URL (only once, only for agents)
    if (
      verificationData?.data?.data &&
      !editFromUrlRef.current &&
      searchParams?.get("edit") === "true"
    ) {
      editFromUrlRef.current = true;
      if (
        user?.role === UserRole.AGENT &&
        verificationData?.data?.data?.status ===
          PropertyVerificationStatus.PENDING
      ) {
        setEditMode(true);
      }
    }
  }, [verificationData, verificationId, searchParams, user?.role]);

  const handleEvidenceUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    if (evidenceUrls.length + files.length > 10) {
      toast.error("Maximum 10 evidence files per verification");
      return;
    }
    uploadEvidence(
      { propertyId, files },
      {
        onSuccess: (resp: any) => {
          const urls: string[] = resp?.data?.data?.urls || [];
          if (urls.length === 0) {
            toast.error("Upload succeeded but no URLs returned");
            return;
          }
          setEvidenceUrls((prev) => [...prev, ...urls]);
          toast.success(`${urls.length} file(s) uploaded`);
          // reset the input so the same filename can be re-selected
          event.target.value = "";
        },
        onError: (err: any) => {
          toast.error(
            err?.response?.data?.detail || "Failed to upload evidence",
          );
          event.target.value = "";
        },
      },
    );
  };

  const removeEvidenceUrl = (url: string) => {
    setEvidenceUrls((prev) => prev.filter((u) => u !== url));
  };

  const isAgent = user?.role === UserRole.AGENT;
  const agentVerifyBlocked = isAgent && evidenceUrls.length < 2;

  if (verificationLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] w-full">
        <Loader />
      </div>
    );
  }

  // ── At-a-glance summary computations ──────────────────────────────────
  // Single panel that answers "is this safe to approve?" without scrolling.
  const ownerKycStatus = property?.owner?.profile?.kycStatus || "PENDING";
  const ownerKycVerified = ownerKycStatus === "VERIFIED";
  const propertyDocs = property?.documents || [];
  const docsVerified = propertyDocs.filter(
    (d: any) => d.status === "VERIFIED",
  ).length;
  const docsRejected = propertyDocs.filter(
    (d: any) => d.status === "REJECTED",
  ).length;
  const hasAdminApproval = !!property?.isVerified;
  const showAwaitingAdmin =
    verification?.status === PropertyVerificationStatus.VERIFIED &&
    !hasAdminApproval;

  // Tab visibility: agents on PENDING get a focused experience but admins
  // see everything across all tabs.
  const tabs: Array<{
    id: TabId;
    label: string;
    icon: string;
    count?: number | string;
  }> = [
    { id: "overview", label: "Overview", icon: "mdi:home-outline" },
    { id: "owner", label: "Owner & KYC", icon: "mdi:account-tie-outline" },
    {
      id: "documents",
      label: "Documents",
      icon: "mdi:file-document-outline",
      count: propertyDocs.length || undefined,
    },
    {
      id: "evidence",
      label: "On-site Evidence",
      icon: "mdi:camera-outline",
      count: evidenceUrls.length || undefined,
    },
    { id: "activity", label: "Activity", icon: "mdi:history" },
  ];

  const isVerificationAdmin =
    user?.role === UserRole.ADMIN ||
    user?.role === UserRole.SUPER_ADMIN ||
    user?.role === UserRole.OPERATIONS_ADMIN;
  const canApprove =
    verification?.status === PropertyVerificationStatus.PENDING &&
    isVerificationAdmin;
  const canReject =
    verification?.status !== PropertyVerificationStatus.REJECTED &&
    (isVerificationAdmin || user?.role === UserRole.AGENT);
  const canReassign =
    user?.role !== UserRole.OWNER && user?.role !== UserRole.AGENT;
  const canVerifyAsAgent =
    verification?.status === PropertyVerificationStatus.PENDING &&
    user?.role === UserRole.AGENT;

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 xl:p-10 w-full max-w-[1600px] mx-auto">
      <div className="w-full border border-zinc-500/20 bg-white rounded-xl sm:rounded-2xl min-h-[50vh] overflow-hidden">
        {/* ── Sticky decision bar ────────────────────────────────── */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-zinc-200">
          <div className="px-4 sm:px-6 md:px-8 lg:px-10 py-3 sm:py-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 lg:gap-6">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <VerificationBadge
                    status={
                      verification?.status ?? PropertyVerificationStatus.PENDING
                    }
                  />
                  {showAwaitingAdmin && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                      Awaiting admin approval
                    </span>
                  )}
                  {verification?.rewardReversedAt && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                      Reward reversed
                    </span>
                  )}
                </div>
                <h2
                  className="text-lg sm:text-xl lg:text-2xl font-semibold text-zinc-900 mt-1 truncate"
                  title={property?.name}
                >
                  {property?.name || "Verification Details"}
                </h2>
                <p className="text-xs sm:text-sm text-zinc-500 mt-0.5 flex items-center gap-1.5">
                  <IoLocationOutline className="flex-shrink-0" />
                  <span className="truncate">{property?.address || "—"}</span>
                </p>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3 lg:flex-shrink-0">
                {canReassign && (
                  <button
                    type="button"
                    onClick={() => setShowAgentSelecteion(true)}
                    className="px-3 sm:px-4 py-2 text-sm font-medium rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700"
                  >
                    {property?.agent ? "Re-assign agent" : "Assign agent"}
                  </button>
                )}
                {canReject && (
                  <button
                    type="button"
                    disabled={verificationLoading || verificationUdateLoading}
                    onClick={() => handleRejection()}
                    className="px-3 sm:px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    Reject
                  </button>
                )}
                {canApprove && (
                  <button
                    type="button"
                    disabled={verificationLoading || verificationUdateLoading}
                    onClick={() => handleApproval()}
                    className="px-3 sm:px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-60"
                  >
                    Approve
                  </button>
                )}
                {canVerifyAsAgent && (
                  <button
                    type="button"
                    disabled={
                      verificationLoading ||
                      verificationUdateLoading ||
                      agentVerifyBlocked
                    }
                    onClick={() => handleVerification()}
                    title={
                      agentVerifyBlocked
                        ? "Upload at least 2 evidence files first"
                        : undefined
                    }
                    className="px-3 sm:px-4 py-2 text-sm font-medium rounded-lg border border-primary text-primary hover:bg-primary hover:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Verify (on-site)
                  </button>
                )}
              </div>
            </div>

            {/* At-a-glance summary */}
            <div className="mt-3 sm:mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <div className="px-3 py-2 rounded-lg border border-zinc-100 bg-zinc-50/50">
                <p className="text-[10px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Owner KYC
                </p>
                <div className="mt-0.5">
                  <span
                    className={`text-xs sm:text-sm font-semibold ${ownerKycVerified ? "text-green-700" : "text-yellow-700"}`}
                  >
                    {ownerKycStatus}
                  </span>
                </div>
              </div>
              <div className="px-3 py-2 rounded-lg border border-zinc-100 bg-zinc-50/50">
                <p className="text-[10px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Documents
                </p>
                <p className="text-xs sm:text-sm font-semibold text-zinc-800 mt-0.5">
                  {docsVerified} verified{" "}
                  <span className="text-zinc-400 font-normal">
                    / {propertyDocs.length || 0}
                  </span>
                  {docsRejected > 0 && (
                    <span className="text-red-600 ml-1.5">
                      ({docsRejected} rejected)
                    </span>
                  )}
                </p>
              </div>
              <div className="px-3 py-2 rounded-lg border border-zinc-100 bg-zinc-50/50">
                <p className="text-[10px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  On-site evidence
                </p>
                <p
                  className={`text-xs sm:text-sm font-semibold mt-0.5 ${evidenceUrls.length >= 2 ? "text-green-700" : "text-yellow-700"}`}
                >
                  {evidenceUrls.length} item
                  {evidenceUrls.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="px-3 py-2 rounded-lg border border-zinc-100 bg-zinc-50/50">
                <p className="text-[10px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Last updated
                </p>
                <p className="text-xs sm:text-sm font-semibold text-zinc-800 mt-0.5">
                  {verification?.verificationDate
                    ? formatDate(verification.verificationDate)
                    : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Tab nav */}
          <div className="px-2 sm:px-4 md:px-6 lg:px-8 overflow-x-auto">
            <nav className="flex gap-1 min-w-max">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                      isActive
                        ? "border-primary text-primary"
                        : "border-transparent text-zinc-600 hover:text-zinc-900 hover:border-zinc-300"
                    }`}
                  >
                    <span>{tab.label}</span>
                    {typeof tab.count === "number" && tab.count > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-xs bg-zinc-100 text-zinc-700">
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* ── Tab content begins ────────────────────────────────── */}
        {activeTab === "overview" && (
          <>
            {/* Main Content Section */}
            <section className="flex flex-col lg:flex-row justify-between gap-4 sm:gap-6 w-full p-4 sm:p-6 md:p-8 lg:p-10">
              {/* Image Slider */}
              <div
                className={`${user?.role !== UserRole.AGENT ? "w-full lg:w-[70%]" : "w-full"} relative`}
              >
                <Swiper
                  loop={true}
                  modules={[Navigation, Autoplay]}
                  spaceBetween={5}
                  slidesPerView={1}
                  navigation
                  autoplay
                  className="rewind rounded-xl overflow-hidden"
                >
                  {property?.media && property?.media.length > 0 ? (
                    property?.media?.map((el: any, index: any) => {
                      const isVideo =
                        (el.media_type || el.mediaType) === "VIDEO";
                      const src =
                        el.media_url || el.mediaUrl || "/png/placeholder.png";
                      return (
                        <SwiperSlide key={index}>
                          <div className="relative aspect-[16/9] w-full">
                            {isVideo ? (
                              <video
                                src={src}
                                controls
                                muted
                                preload="metadata"
                                className="w-full h-full object-cover rounded-xl"
                              />
                            ) : (
                              <Image
                                alt={`${property?.name}_img_${index}`}
                                src={src}
                                className="object-cover rounded-xl"
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 60vw"
                                priority={index === 0}
                              />
                            )}
                          </div>
                        </SwiperSlide>
                      );
                    })
                  ) : (
                    <SwiperSlide>
                      <div className="relative aspect-[16/9] w-full">
                        <Image
                          alt={`img_`}
                          src={`/png/sample_properties.png`}
                          className="object-cover rounded-xl"
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 60vw"
                        />
                      </div>
                    </SwiperSlide>
                  )}
                </Swiper>
              </div>

              {/* Agent Info (Desktop Sidebar) */}
              {user?.role !== UserRole.AGENT && (
                <div className="w-full lg:w-[30%] flex flex-col gap-y-3 sm:gap-y-4">
                  <div className="size-full flex flex-col justify-center items-center bg-background rounded-xl p-4 sm:p-6 border border-zinc-100">
                    <p className="text-sm sm:text-base text-zinc-800 font-medium text-center mb-2">
                      Assigned agent
                    </p>
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-xl overflow-hidden my-2 sm:my-3 border-2 border-white shadow-lg">
                      <Image
                        alt={`agent_img`}
                        src={
                          (selectedAgent?.profile?.profileImage ||
                            selectedAgent?.profile?.profile_image) ??
                          `/png/sample_owner.png`
                        }
                        className="object-cover"
                        fill
                        sizes="(max-width: 768px) 96px, 128px"
                      />
                    </div>
                    <p className="text-sm sm:text-base text-zinc-800 font-medium text-center mb-1 px-2">
                      {selectedAgent?.profile?.firstName
                        ? `${selectedAgent?.profile?.firstName} ${selectedAgent?.profile?.lastName}`
                        : selectedAgent?.firstName
                          ? `${selectedAgent?.firstName} ${selectedAgent?.lastName}`
                          : selectedAgent?.email || "--/--"}
                    </p>
                    <p className="text-xs sm:text-sm text-zinc-500 font-medium text-center break-all px-2">
                      {selectedAgent?.email ?? "--/--"}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2 sm:gap-3 w-full">
                    <button
                      type="button"
                      onClick={() => {
                        const agentId = selectedAgent?.id;
                        if (agentId) {
                          router.push(
                            PAGE_ROUTES.dashboard.userManagement.agents.details(
                              agentId,
                            ),
                          );
                        }
                      }}
                      className="flex-1 text-center cursor-pointer rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base font-medium text-white bg-zinc-500 hover:bg-zinc-600 disabled:hover:bg-zinc-500 disabled:opacity-75 disabled:cursor-not-allowed transition-colors"
                    >
                      View Agent
                    </button>
                    {user?.role !== UserRole.OWNER && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowAgentSelecteion(true);
                        }}
                        className="flex-1 text-center cursor-pointer bg-primary/90 rounded-lg px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base font-medium text-white hover:bg-primary disabled:hover:bg-primary/90 disabled:opacity-75 disabled:cursor-not-allowed transition-colors"
                      >
                        Re-assign
                      </button>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* Property Title */}
            <section className="w-full px-4 sm:px-6 md:px-8 lg:px-10 pb-2 sm:pb-3">
              <div className="w-full flex justify-between">
                <div className="w-full flex flex-col">
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-semibold text-zinc-800">
                    {property?.name}
                  </h3>
                  <div className="flex gap-1.5 sm:gap-2 items-center mt-1 sm:mt-2 text-sm sm:text-base text-zinc-600">
                    <IoLocationOutline className="flex-shrink-0" />
                    <p className="text-xs sm:text-sm">
                      {property?.address || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Property Details Grid */}
            <section className="px-4 sm:px-6 md:px-8 lg:px-10 pb-4 sm:pb-6">
              {/* Desktop: Horizontal scrollable cards */}
              <div className="hidden lg:block overflow-x-auto pb-2">
                <div className="flex items-center gap-4 min-w-max">
                  {/* Property ID with Copy */}
                  <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-zinc-100 hover:border-primary/20 transition-all shadow-sm hover:shadow">
                    <p className="text-sm text-zinc-500 font-medium whitespace-nowrap">
                      Property ID:
                    </p>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-zinc-900">
                        APRT25-{property?.id}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(
                            `APRT25-${property?.id}`,
                          );
                          toast.success("ID copied!", { duration: 1500 });
                        }}
                        className="text-zinc-400 hover:text-primary transition-colors"
                      >
                        <MdCopyAll className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-zinc-100 hover:border-primary/20 transition-all shadow-sm hover:shadow">
                    <p className="text-sm text-zinc-500 font-medium whitespace-nowrap">
                      Status:
                    </p>
                    <VerificationBadge
                      status={
                        verification?.status ??
                        PropertyVerificationStatus.REJECTED
                      }
                    />
                  </div>

                  {/* Verification Date */}
                  <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-zinc-100 hover:border-primary/20 transition-all shadow-sm hover:shadow">
                    <p className="text-sm text-zinc-500 font-medium whitespace-nowrap">
                      Verified:
                    </p>
                    <div className="flex items-center gap-1.5">
                      <CalendarIcon color="#a6a4a4" className="w-4 h-4" />
                      <p className="text-sm font-medium text-zinc-900 whitespace-nowrap">
                        {verification?.verificationDate
                          ? formatDate(verification?.verificationDate)
                          : "--/--"}
                      </p>
                    </div>
                  </div>

                  {/* Property Type */}
                  <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-zinc-100 hover:border-primary/20 transition-all shadow-sm hover:shadow">
                    <p className="text-sm text-zinc-500 font-medium whitespace-nowrap">
                      Type:
                    </p>
                    <p className="text-sm font-semibold text-zinc-900 capitalize whitespace-nowrap">
                      {property?.propertyType?.toLowerCase() || "N/A"}
                    </p>
                  </div>

                  {/* Owner */}
                  <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-zinc-100 hover:border-primary/20 transition-all shadow-sm hover:shadow">
                    <p className="text-sm text-zinc-500 font-medium whitespace-nowrap">
                      Owner:
                    </p>
                    <p className="text-sm text-teal-700 font-medium cursor-pointer hover:text-teal-800 hover:underline flex items-center gap-1">
                      <span>
                        {property?.owner?.profile?.firstName
                          ? `${property?.owner?.profile?.firstName} ${property?.owner?.profile?.lastName || ""}`
                          : property?.owner?.firstName
                            ? `${property?.owner?.firstName} ${property?.owner?.lastName || ""}`
                            : property?.owner?.email || "--/--"}
                      </span>
                      <span className="text-teal-400/50 text-xs">↗</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Mobile/Tablet: Grid layout */}
              <div className="lg:hidden grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-white px-3 py-2.5 rounded-xl border border-zinc-100 shadow-sm">
                  <p className="text-xs text-zinc-500 font-medium mb-1">
                    Property ID
                  </p>
                  <p className="text-sm font-semibold text-zinc-900 truncate">
                    APRT25-{property?.id}
                  </p>
                </div>
                <div className="bg-white px-3 py-2.5 rounded-xl border border-zinc-100 shadow-sm">
                  <p className="text-xs text-zinc-500 font-medium mb-1">
                    Status
                  </p>
                  <VerificationBadge
                    status={
                      verification?.status ?? PropertyVerificationStatus.PENDING
                    }
                  />
                </div>
                <div className="bg-white px-3 py-2.5 rounded-xl border border-zinc-100 shadow-sm">
                  <p className="text-xs text-zinc-500 font-medium mb-1">
                    Verified
                  </p>
                  <p className="text-sm font-medium text-zinc-900">
                    {verification?.verificationDate
                      ? formatDate(verification.verificationDate)
                      : "--/--"}
                  </p>
                </div>
                <div className="bg-white px-3 py-2.5 rounded-xl border border-zinc-100 shadow-sm">
                  <p className="text-xs text-zinc-500 font-medium mb-1">Type</p>
                  <p className="text-sm font-semibold text-zinc-900 capitalize">
                    {property?.propertyType?.toLowerCase() || "N/A"}
                  </p>
                </div>
                <div className="bg-white px-3 py-2.5 rounded-xl border border-zinc-100 shadow-sm col-span-2 sm:col-span-1">
                  <p className="text-xs text-zinc-500 font-medium mb-1">
                    Owner
                  </p>
                  <p className="text-sm text-teal-700 font-medium truncate">
                    {property?.owner?.profile?.firstName
                      ? `${property.owner.profile.firstName} ${property.owner.profile.lastName || ""}`
                      : property?.owner?.email || "--/--"}
                  </p>
                </div>
              </div>

              {/* Amenities - common for all screens */}
              {property?.amenities && property?.amenities.length > 0 && (
                <div className="mt-5 lg:mt-6 pt-4 lg:pt-5 border-t border-zinc-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-4 bg-primary/60 rounded-full"></div>
                    <p className="text-xs lg:text-sm font-semibold text-zinc-700 uppercase tracking-wider">
                      Amenities
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {property?.amenities.map((el, index) => (
                      <div
                        key={index}
                        className="group relative px-3 py-1.5 lg:px-4 lg:py-2 bg-gradient-to-br from-zinc-50 to-white rounded-lg lg:rounded-xl border border-zinc-200 text-xs lg:text-sm text-zinc-700 hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-default"
                      >
                        <span className="relative z-10 font-medium">
                          {el.name}
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 rounded-lg lg:rounded-xl transition-opacity"></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </>
        )}

        {activeTab === "owner" && (
          /* KYC Details */
          <section className="w-full px-4 sm:px-6 md:px-8 lg:px-10 pt-6 pb-4 sm:pb-5">
            <p className="text-sm sm:text-base font-medium text-zinc-900 mb-2">
              Owner KYC Details
            </p>
            {property?.owner?.profile ? (
              <div className="p-4 sm:p-5 bg-background/70 rounded-xl space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">KYC Status</p>
                    <VerificationBadge
                      status={property.owner.profile.kycStatus || "PENDING"}
                    />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">BVN</p>
                    <p
                      data-clarity-mask="true"
                      className="text-sm font-medium text-zinc-800"
                    >
                      {property.owner.profile.bvn
                        ? maskId(property.owner.profile.bvn)
                        : "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 mb-1">NIN</p>
                    <p
                      data-clarity-mask="true"
                      className="text-sm font-medium text-zinc-800"
                    >
                      {property.owner.profile.nin
                        ? maskId(property.owner.profile.nin)
                        : "Not provided"}
                    </p>
                  </div>
                  {property.owner.profile.kycProvider && (
                    <div>
                      <p className="text-xs text-zinc-500 mb-1">Provider</p>
                      <p className="text-sm font-medium text-zinc-800 capitalize">
                        {property.owner.profile.kycProvider}
                      </p>
                    </div>
                  )}
                </div>
                {property.owner.kycDocuments &&
                  property.owner.kycDocuments.length > 0 && (
                    <div className="pt-3 border-t border-zinc-200">
                      <p className="text-xs text-zinc-500 mb-2">
                        KYC Documents
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {property.owner.kycDocuments.map(
                          (doc: any, i: number) => (
                            <div
                              key={i}
                              className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-zinc-100"
                            >
                              <div>
                                <p className="text-xs font-medium text-zinc-800 capitalize">
                                  {doc.documentType
                                    ?.replace(/_/g, " ")
                                    ?.toLowerCase()}
                                </p>
                                <VerificationBadge status={doc.status} />
                              </div>
                              <a
                                href={doc.documentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-primary hover:underline"
                              >
                                View
                              </a>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
              </div>
            ) : (
              <div className="p-4 sm:p-5 bg-background/70 rounded-xl">
                <p className="text-sm text-zinc-400 italic">
                  No KYC information available
                </p>
              </div>
            )}
          </section>
        )}

        {activeTab === "documents" && (
          /* Property Documents — admins can approve / reject each doc
                   inline. Rejection captures a required reason in a small
                   modal; backend validates and writes a per-doc history row. */
          <section className="w-full px-4 sm:px-6 md:px-8 lg:px-10 pt-6 pb-4 sm:pb-5">
            <div className="flex items-baseline justify-between mb-2">
              <p className="text-sm sm:text-base font-medium text-zinc-900">
                Property Documents
              </p>
              {isVerificationAdmin && (
                <p className="text-xs text-zinc-500">
                  Click the buttons on each card to approve or reject.
                </p>
              )}
            </div>
            {property?.documents && property.documents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {property.documents.map((doc: any, index: number) => {
                  const docId = String(doc.id);
                  const docStatus = String(doc.status || "PENDING");
                  const isMutatingThis = docUpdating && docMutatingId === docId;
                  const canActOnDoc =
                    isVerificationAdmin &&
                    verification?.status !==
                      PropertyVerificationStatus.REJECTED;
                  return (
                    <div
                      key={index}
                      className="p-4 bg-background/70 rounded-xl border border-zinc-100"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-zinc-800 capitalize">
                            {doc.documentType
                              ?.replace(/_/g, " ")
                              ?.toLowerCase()}
                          </p>
                          <div className="mt-1">
                            <VerificationBadge status={doc.status} />
                          </div>
                          {doc.rejectionReason && (
                            <p className="text-xs text-red-500 mt-1">
                              {doc.rejectionReason}
                            </p>
                          )}
                        </div>
                        <a
                          href={doc.documentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-primary hover:underline shrink-0"
                        >
                          View
                        </a>
                      </div>
                      {canActOnDoc && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-100">
                          {docStatus !== "VERIFIED" && (
                            <button
                              type="button"
                              disabled={isMutatingThis}
                              onClick={() => handleDocApprove(docId)}
                              className="flex-1 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                            >
                              {isMutatingThis ? <Spinner /> : "Approve"}
                            </button>
                          )}
                          {docStatus !== "REJECTED" && (
                            <button
                              type="button"
                              disabled={isMutatingThis}
                              onClick={() => {
                                setDocRejectingId(docId);
                                setDocRejectReason(doc.rejectionReason || "");
                              }}
                              className="flex-1 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 sm:p-5 bg-background/70 rounded-xl">
                <p className="text-sm text-zinc-400 italic">
                  No documents uploaded
                </p>
              </div>
            )}
          </section>
        )}

        {activeTab === "activity" && (
          <>
            {/* Feedback Section — saved comments + editable on PENDING. */}
            <section className="w-full px-4 sm:px-6 md:px-8 lg:px-10 pt-6 pb-4 sm:pb-5">
              <p className="text-sm sm:text-base font-medium text-zinc-900 mb-2">
                {user?.id === property?.agent?.id ? "Your" : "Reviewer"}{" "}
                feedback
                {verification?.status ===
                  PropertyVerificationStatus.PENDING && (
                  <span className="ml-2 text-xs font-normal text-zinc-500">
                    (optional for approval, required for rejection)
                  </span>
                )}
              </p>
              {(() => {
                const canEditFeedback =
                  verification?.status === PropertyVerificationStatus.PENDING &&
                  (user?.role === UserRole.ADMIN ||
                    user?.role === UserRole.SUPER_ADMIN ||
                    user?.role === UserRole.OPERATIONS_ADMIN ||
                    editMode);
                if (!canEditFeedback) {
                  return (
                    <div className="p-4 sm:p-5 md:p-6 bg-background/70 min-h-[10rem] sm:min-h-[12rem] w-full rounded-xl">
                      <p className="text-sm sm:text-base">
                        {verification?.feedback ?? (
                          <em className="text-zinc-400">No comments yet</em>
                        )}
                      </p>
                    </div>
                  );
                }
                return (
                  <div className="relative mt-2">
                    <span className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 text-xs sm:text-sm text-zinc-400">{`${formik.values.feedback.length}/500`}</span>
                    <textarea
                      id="description"
                      maxLength={500}
                      rows={6}
                      placeholder={
                        "Add a note for the owner — what looked good, what needs work..."
                      }
                      value={formik.values.feedback}
                      onChange={(e) =>
                        formik.setFieldValue("feedback", e.target.value)
                      }
                      className="w-full border border-zinc-300 bg-background/70 rounded-xl p-3 sm:p-4 text-sm sm:text-base focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    />
                  </div>
                );
              })()}
            </section>

            {/* Override Checks moved into the Approve modal — admins now
                    confirm any bypass at decision time rather than via a sticky
                    sidebar toggle that's easy to leave on by accident. */}
          </>
        )}

        {/* On-site Verification Evidence — agents upload >=2 photos/videos */}
        {activeTab === "evidence" &&
          verification?.status !== PropertyVerificationStatus.REJECTED && (
            <section className="mt-4 sm:mt-6 w-full px-4 sm:px-6 md:px-8 lg:px-10">
              <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-zinc-900">
                      On-site Verification Evidence
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1 max-w-xl">
                      {isAgent
                        ? "Upload at least 2 photos or videos taken on-site (images up to 10MB, videos up to 50MB). The Verify button unlocks once 2 are attached."
                        : "Photos and videos the agent uploaded during their on-site visit."}
                    </p>
                  </div>
                  <span
                    className={`flex-shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${
                      evidenceUrls.length >= 2
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {evidenceUrls.length} / 2 min
                  </span>
                </div>

                {evidenceUrls.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                    {evidenceUrls.map((url) => {
                      const isVideo = /\.(mp4|mov|webm|quicktime)(\?|$)/i.test(
                        url,
                      );
                      return (
                        <div
                          key={url}
                          className="relative group aspect-square rounded-lg overflow-hidden border border-zinc-100 bg-zinc-50"
                        >
                          {isVideo ? (
                            <video
                              src={url}
                              className="w-full h-full object-cover"
                              controls
                              preload="metadata"
                            />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={url}
                              alt="Evidence"
                              className="w-full h-full object-cover"
                            />
                          )}
                          {isAgent &&
                            verification?.status ===
                              PropertyVerificationStatus.PENDING && (
                              <button
                                type="button"
                                onClick={() => removeEvidenceUrl(url)}
                                className="absolute top-1.5 right-1.5 bg-red-600/90 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove"
                              >
                                ×
                              </button>
                            )}
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            View
                          </a>
                        </div>
                      );
                    })}
                  </div>
                )}

                {isAgent &&
                  verification?.status ===
                    PropertyVerificationStatus.PENDING && (
                    <div className="flex items-center gap-3">
                      <input
                        id="verification-evidence-upload"
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/webm"
                        className="hidden"
                        onChange={handleEvidenceUpload}
                        disabled={
                          evidenceUploading || evidenceUrls.length >= 10
                        }
                      />
                      <label
                        htmlFor="verification-evidence-upload"
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                          evidenceUploading || evidenceUrls.length >= 10
                            ? "border-zinc-200 text-zinc-400 bg-zinc-50 cursor-not-allowed"
                            : "border-primary text-primary hover:bg-primary hover:text-white"
                        }`}
                      >
                        {evidenceUploading ? (
                          <Spinner />
                        ) : (
                          <HiOutlineCloudUpload className="text-lg" />
                        )}
                        {evidenceUploading
                          ? "Uploading..."
                          : evidenceUrls.length === 0
                            ? "Upload photos / videos"
                            : "Add more"}
                      </label>
                      {evidenceUrls.length >= 10 && (
                        <span className="text-xs text-zinc-500">
                          Max 10 files reached
                        </span>
                      )}
                    </div>
                  )}
              </div>
            </section>
          )}

        {/* Verification activity timeline — lives in the Activity tab. */}
        {activeTab === "activity" && (
          <section className="w-full px-4 sm:px-6 md:px-8 lg:px-10 pb-2">
            {verification?.id && (
              <VerificationHistoryTimeline
                propertyId={String(propertyId)}
                verificationId={String(verification.id)}
              />
            )}
          </section>
        )}

        {/* Action buttons moved to the sticky decision bar at the top.
                    Agent Save action stays here when editMode is on so the agent
                    flow is unchanged for them. */}
        {editMode && (
          <section className="my-6 sm:my-8 w-full px-4 sm:px-6 md:px-8 lg:px-10 pb-4 sm:pb-6">
            <div className="w-full flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 items-center">
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="w-full sm:w-auto rounded-lg px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base font-medium text-white bg-zinc-500 hover:bg-zinc-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => formik.handleSubmit()}
                disabled={verificationLoading || verificationUdateLoading}
                className="w-full sm:w-auto border border-primary bg-transparent text-primary/90 hover:text-white hover:bg-primary/90 rounded-lg px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-base font-medium disabled:opacity-75"
              >
                Save
              </button>
            </div>
          </section>
        )}

        {/* Agent Assignment Modal */}
        <CustomModal
          isOpen={showAgentSelection}
          onClose={() => {
            setShowAgentSelecteion(false);
            setSelectedAgent(verificationData?.data?.data?.property?.agent);
          }}
          title="Assign agent to property"
        >
          <div className="w-full p-2 sm:p-3">
            {!selectedAgent ? (
              <div className="relative my-3">
                <label
                  htmlFor="city"
                  className="text-sm sm:text-base font-medium text-zinc-700 mb-1 block"
                >
                  Search agents
                </label>
                <AdjustableFilterDropdown
                  placeholder={`E.g. Abiola Graham`}
                  options={agents?.map((el) => el?.email)}
                  handleSelection={(val) => handleAgentSelection(val)}
                  searchTerm={agentSearchTerm}
                  setSearchTerm={setAgentSearchTerm}
                  isLoading={agentsLoading}
                />
              </div>
            ) : (
              <div>
                <div className="my-4 sm:my-6">
                  <div className="flex gap-3 sm:gap-4 items-center rounded-xl mt-2 p-3 bg-background/50">
                    <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-white shadow-md">
                      <Image
                        alt="agent-image"
                        src={
                          (selectedAgent?.profile?.profileImage ||
                            selectedAgent?.profile?.profile_image) ??
                          "/png/sample_profile.png"
                        }
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-medium text-zinc-900 truncate">
                        {selectedAgent?.profile?.firstName
                          ? `${selectedAgent?.profile?.firstName} ${selectedAgent?.profile?.lastName}`
                          : selectedAgent?.firstName
                            ? `${selectedAgent?.firstName} ${selectedAgent?.lastName}`
                            : selectedAgent?.email || "--/--"}
                      </p>
                      <p className="text-xs sm:text-sm text-zinc-500 truncate">{`${selectedAgent?.email}`}</p>
                    </div>
                  </div>
                </div>
                <p className="text-sm sm:text-base text-zinc-700 font-normal my-3 sm:my-4">
                  You're about to{" "}
                  {selectedAgent?.id ===
                  verificationData?.data?.data?.property?.assignedAgent
                    ? "re-assign"
                    : "assign"}{" "}
                  <strong className="text-zinc-900">
                    {selectedAgent?.profile?.firstName
                      ? `${selectedAgent?.profile?.firstName} ${selectedAgent?.profile?.lastName}`
                      : selectedAgent?.firstName
                        ? `${selectedAgent?.firstName} ${selectedAgent?.lastName}`
                        : selectedAgent?.email || "this agent"}
                  </strong>{" "}
                  to this property.
                </p>
                <p className="text-sm sm:text-base font-medium text-zinc-900 mb-4">
                  Are you sure?
                </p>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4 mt-4 sm:mt-6 w-full">
                  <button
                    type="button"
                    onClick={() => setSelectedAgent(null)}
                    disabled={assignmentLoading}
                    className="w-full sm:w-1/2 font-medium rounded-lg px-4 py-2 text-sm sm:text-base bg-zinc-600 text-white hover:bg-zinc-700 disabled:hover:bg-zinc-600 disabled:opacity-75 disabled:cursor-not-allowed transition-colors"
                  >
                    Change
                  </button>
                  <button
                    onClick={() => handleAgentAssignment(selectedAgent?.id)}
                    disabled={assignmentLoading}
                    type="button"
                    className="w-full sm:w-1/2 rounded-lg px-4 py-2 text-sm sm:text-base font-medium bg-primary/90 text-white hover:bg-primary disabled:hover:bg-primary/90 disabled:opacity-75 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {assignmentLoading ? <Spinner /> : "Assign"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </CustomModal>

        <CustomModal
          isOpen={showRejectModal}
          onClose={() => setShowRejectModal(false)}
          title="Reject verification"
        >
          <div className="space-y-4 p-1">
            <p className="text-sm text-gray-600">
              The owner will see this reason in their dashboard and email so
              they know what to fix before resubmitting.
            </p>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Reason for rejection <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Proof of ownership document is unclear — please re-upload a higher-resolution scan."
                rows={5}
                maxLength={500}
                autoFocus
                className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none ${
                  rejectReason.trim()
                    ? "border-gray-300 bg-white"
                    : "border-red-200 bg-red-50/40"
                }`}
              />
              <div className="flex justify-between text-xs">
                {rejectReason.trim() ? (
                  <span className="text-gray-500">
                    Be specific — vague reasons cause back-and-forth.
                  </span>
                ) : (
                  <span className="text-red-600">A reason is required.</span>
                )}
                <span className="text-gray-400">{rejectReason.length}/500</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                }}
                disabled={verificationUdateLoading}
                className="w-full sm:flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitRejection}
                disabled={verificationUdateLoading || !rejectReason.trim()}
                className="w-full sm:flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {verificationUdateLoading ? <Spinner /> : "Confirm rejection"}
              </button>
            </div>
          </div>
        </CustomModal>

        {/* Approve confirmation modal — collects override-check
                    acknowledgements explicitly so admins can't accidentally
                    leave a bypass on. */}
        <CustomModal
          isOpen={showApproveModal}
          onClose={() => setShowApproveModal(false)}
          title="Approve this verification?"
        >
          <div className="space-y-4 p-1">
            <div className="space-y-2 text-sm">
              <p className="text-zinc-700">
                Approving will mark the property as verified, make it visible to
                guests, and credit the agent who performed the on-site check (if
                a verification reward is configured).
              </p>
            </div>

            {/* Pre-check summary */}
            <div className="rounded-lg border border-zinc-100 bg-zinc-50/50 p-3 space-y-1.5">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Pre-check
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-700">Owner KYC</span>
                <span
                  className={`font-semibold ${ownerKycVerified ? "text-green-700" : "text-yellow-700"}`}
                >
                  {ownerKycStatus}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-700">
                  Verified ownership documents
                </span>
                <span
                  className={`font-semibold ${docsVerified > 0 ? "text-green-700" : "text-yellow-700"}`}
                >
                  {docsVerified} / {propertyDocs.length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-700">On-site evidence</span>
                <span
                  className={`font-semibold ${evidenceUrls.length >= 2 ? "text-green-700" : "text-yellow-700"}`}
                >
                  {evidenceUrls.length} item
                  {evidenceUrls.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>

            {/* Override toggles — visible only to admins, with a clear
                            warning when toggled on. */}
            {isVerificationAdmin && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
                <p className="text-sm font-semibold text-amber-900 flex items-center gap-1.5">
                  Bypass requirements (use with care)
                </p>
                <label className="flex items-start gap-2 cursor-pointer text-sm text-amber-900">
                  <input
                    type="checkbox"
                    checked={skipKycCheck}
                    onChange={(e) => setSkipKycCheck(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span>
                    Skip owner KYC check (the owner is not yet KYC-verified).
                  </span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer text-sm text-amber-900">
                  <input
                    type="checkbox"
                    checked={skipDocumentCheck}
                    onChange={(e) => setSkipDocumentCheck(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span>
                    Skip ownership-document check (no verified docs uploaded).
                  </span>
                </label>
                {(skipKycCheck || skipDocumentCheck) && (
                  <p className="text-xs text-amber-800 bg-amber-100 border border-amber-200 rounded px-2 py-1.5 mt-1">
                    This bypass will be recorded on the verification log and
                    visible in the audit trail.
                  </p>
                )}
              </div>
            )}

            {/* Optional approval note */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Note (optional)
              </label>
              <textarea
                value={formik.values.feedback}
                onChange={(e) =>
                  formik.setFieldValue("feedback", e.target.value)
                }
                placeholder="Anything the owner should know? (saved on the verification record)"
                rows={3}
                maxLength={500}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none bg-white"
              />
              <p className="text-xs text-gray-400 text-right">
                {formik.values.feedback.length}/500
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                disabled={verificationUdateLoading}
                className="w-full sm:flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitApproval}
                disabled={verificationUdateLoading}
                className="w-full sm:flex-1 px-4 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {verificationUdateLoading ? <Spinner /> : "Confirm approval"}
              </button>
            </div>
          </div>
        </CustomModal>

        {/* Per-document reject modal — captures the required reason
                    before the PATCH fires. Backend validator double-protects. */}
        <CustomModal
          isOpen={!!docRejectingId}
          onClose={() => {
            setDocRejectingId(null);
            setDocRejectReason("");
          }}
          title="Reject this document"
        >
          <div className="space-y-4 p-1">
            <p className="text-sm text-gray-600">
              The owner will see this reason next to the document so they know
              what to fix before re-uploading.
            </p>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={docRejectReason}
                onChange={(e) => setDocRejectReason(e.target.value)}
                placeholder="e.g. Document is blurry — please re-upload at higher resolution."
                rows={4}
                maxLength={500}
                autoFocus
                className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm resize-none ${
                  docRejectReason.trim()
                    ? "border-gray-300 bg-white"
                    : "border-red-200 bg-red-50/40"
                }`}
              />
              <div className="flex justify-between text-xs">
                {docRejectReason.trim() ? (
                  <span className="text-gray-500">
                    Specific reasons help the owner fix it on the first try.
                  </span>
                ) : (
                  <span className="text-red-600">A reason is required.</span>
                )}
                <span className="text-gray-400">
                  {docRejectReason.length}/500
                </span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDocRejectingId(null);
                  setDocRejectReason("");
                }}
                disabled={docUpdating}
                className="w-full sm:flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitDocRejection}
                disabled={docUpdating || !docRejectReason.trim()}
                className="w-full sm:flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {docUpdating ? <Spinner /> : "Confirm rejection"}
              </button>
            </div>
          </div>
        </CustomModal>
      </div>
    </div>
  );
}

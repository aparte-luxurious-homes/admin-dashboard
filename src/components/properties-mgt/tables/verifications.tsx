"use client";

import { MESSAGES } from '@/src/lib/messages';
import { useEffect, useRef, useState } from "react";
import {
  ArrowIcon,
  DotsIcon,
  FilterIcon,
  PrinterIcon,
  SearchIcon,
} from "../../icons";
import { useRouter } from "next/navigation";
import { IPropertyVerification, PropertyVerificationStatus } from "../types";
import {
  GetAllVerifications,
  UpdatePropertyVerification,
} from "@/src/lib/request-handlers/propertyMgt";
import Loader from "../../loader";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import { VerificationBadge } from "../../badge";
import { formatDate } from "@/src/lib/utils";
import TablePagination from "../../TablePagination";
import { LuEye } from "react-icons/lu";
import { HiOutlinePencilAlt } from "react-icons/hi";
import { MdOutlineVerified } from "react-icons/md";
import { ImCancelCircle } from "react-icons/im";
import { useAuth } from "@/src/hooks/useAuth";
import { UserRole } from "@/src/lib/enums";
import { Icon } from "@iconify/react/dist/iconify.js";
import { MdCopyAll, MdCheck } from "react-icons/md";
import toast from "react-hot-toast";
import CustomModal from "../../ui/CustomModal";
import { useDispatch } from "react-redux";
import { showAlert } from "@/src/lib/slices/alertDialogSlice";

export default function AllVerificationsTable() {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const router = useRouter();
  const modalRef = useRef(null);
  const [page, setPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const {
    data: verificationList,
    isLoading: verificationsLoading,
    refetch,
  } = GetAllVerifications(
    page,
    10,
    searchTerm,
    statusFilter || undefined,
    user?.role || UserRole.GUEST,
  );
  const [verifications, setVerifications] = useState<IPropertyVerification[]>(
    verificationList?.data?.data?.data,
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { mutate: updateVerification, isPending: verificationUpdating } =
    UpdatePropertyVerification();

  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [modalPosition, setModalPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  // Modal states for verify/reject
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedVerification, setSelectedVerification] =
    useState<IPropertyVerification | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [skipKycCheck, setSkipKycCheck] = useState(false);
  const [skipDocumentCheck, setSkipDocumentCheck] = useState(false);

  const handleCopyId = async (id: string | number, event: React.MouseEvent) => {
    event.stopPropagation();
    const idToCopy = `APRT25-${id}`;
    try {
      await navigator.clipboard.writeText(idToCopy);
      setCopiedId(String(id));
      toast.success(MESSAGES.MSG_ID_COPIED, { duration: 1500 });
      setTimeout(() => setCopiedId(null), 1500);
    } catch (err) {
      toast.error(MESSAGES.MSG_COPY_FAILED);
    }
  };

  const handleVerify = () => {
    if (!selectedVerification) return;

    const propertyId =
      selectedVerification?.propertyId ??
      selectedVerification?.property_id ??
      selectedVerification?.property?.id;

    dispatch(
      showAlert({
        title: "Verify Property?",
        description: "This will mark this property as verified and approved.",
        confirmText: "Verify",
        cancelText: "Cancel",
        onConfirm: () => {
          updateVerification(
            {
              propertyId,
              payload: {
                feedback: feedbackText || MESSAGES.MSG_PROPERTY_VERIFIED_SUCCESSFULLY,
                status: PropertyVerificationStatus.VERIFIED,
                skip_kyc_check: skipKycCheck,
                skip_document_check: skipDocumentCheck,
              },
            },
            {
              onSuccess: () => {
                toast.success(MESSAGES.MSG_PROPERTY_VERIFIED_SUCCESSFULLY, {
                  duration: 6000,
                  style: {
                    maxWidth: "500px",
                    width: "max-content",
                  },
                });
                setShowVerifyModal(false);
                setFeedbackText("");
                setSkipKycCheck(false);
                setSkipDocumentCheck(false);
                setSelectedVerification(null);
                refetch();
              },
              onError: (error: any) => {
                toast.error(
                  error?.response?.data?.detail || "Failed to verify property",
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
        },
      }),
    );
  };

  const handleReject = () => {
    if (!selectedVerification) return;

    const propertyId =
      selectedVerification?.propertyId ??
      selectedVerification?.property_id ??
      selectedVerification?.property?.id;

    if (!feedbackText.trim()) {
      toast.error(MESSAGES.MSG_PLEASE_PROVIDE_FEEDBACK_FOR_REJECTION);
      return;
    }

    dispatch(
      showAlert({
        title: "Reject Verification?",
        description: "This will reject the property verification request.",
        confirmText: "Reject",
        cancelText: "Cancel",
        onConfirm: () => {
          updateVerification(
            {
              propertyId,
              payload: {
                feedback: feedbackText,
                status: PropertyVerificationStatus.REJECTED,
              },
            },
            {
              onSuccess: () => {
                toast.success(MESSAGES.MSG_PROPERTY_VERIFICATION_REJECTED, {
                  duration: 6000,
                  style: {
                    maxWidth: "500px",
                    width: "max-content",
                  },
                });
                setShowRejectModal(false);
                setFeedbackText("");
                setSelectedVerification(null);
                refetch();
              },
              onError: (error: any) => {
                toast.error(
                  error?.response?.data?.detail ||
                    error?.response?.data?.message ||
                    "Failed to reject property",
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
        },
      }),
    );
  };

  const openVerifyModal = (verification: IPropertyVerification) => {
    setSelectedVerification(verification);
    setFeedbackText("");
    setSkipKycCheck(false);
    setSkipDocumentCheck(false);
    setShowVerifyModal(true);
    setSelectedRow(null);
  };

  const openRejectModal = (verification: IPropertyVerification) => {
    setSelectedVerification(verification);
    setFeedbackText("");
    setShowRejectModal(true);
    setSelectedRow(null);
  };

  const canVerify = [
    UserRole.AGENT,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.OPERATIONS_ADMIN,
  ].includes(user?.role as UserRole);
  const selectedStatus =
    selectedRow !== null ? verifications?.[selectedRow]?.status : null;
  const showVerifyReject =
    canVerify && selectedStatus === PropertyVerificationStatus.PENDING;

  const detailButtons = [
    {
      label: "View",
      Icon: <LuEye />,
      onClick: () => {
        const pId =
          verifications[selectedRow!]?.propertyId ??
          verifications[selectedRow!]?.property_id ??
          verifications[selectedRow!]?.property?.id;
        router.push(
          PAGE_ROUTES.dashboard.propertyManagement.allProperties.verifications.details(
            pId,
            verifications[selectedRow!]?.id,
          ),
        );
        setSelectedRow(null);
      },
    },
    {
      label: "Edit",
      Icon: <HiOutlinePencilAlt />,
      onClick: () => {
        const pId =
          verifications[selectedRow!]?.propertyId ??
          verifications[selectedRow!]?.property_id ??
          verifications[selectedRow!]?.property?.id;
        router.push(
          `${PAGE_ROUTES.dashboard.propertyManagement.allProperties.verifications.details(pId, verifications[selectedRow!]?.id)}?edit=true`,
        );
        setSelectedRow(null);
      },
    },
    ...(showVerifyReject
      ? [
          {
            label: "Verify",
            Icon: <MdOutlineVerified />,
            onClick: () => {
              if (selectedRow !== null) {
                openVerifyModal(verifications[selectedRow]);
              }
            },
          },
          {
            label: "Reject",
            Icon: <ImCancelCircle className="size-3.5" />,
            onClick: () => {
              if (selectedRow !== null) {
                openRejectModal(verifications[selectedRow]);
              }
            },
          },
        ]
      : []),
  ];

  // Handle click outside modal
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modalRef.current &&
        !(modalRef.current as HTMLElement).contains(event.target as Node)
      ) {
        setSelectedRow(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDotsClick = (event: React.MouseEvent, index: number) => {
    event.stopPropagation();
    setSelectedRow(index);

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setModalPosition({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
    });
  };

  useEffect(() => {
    setVerifications(verificationList?.data?.data?.data);
  }, [verificationList]);

  return (
    <>
      <div className="w-full p-3 sm:p-4 md:p-6 lg:p-8 xl:p-10">
        <div className="w-full border border-zinc-500/20 bg-white rounded-xl sm:rounded-2xl px-3 sm:px-4 md:px-6 py-4 sm:py-5 md:py-6 lg:py-7 min-h-[70vh] flex flex-col items-center">
          {/* Header Section */}
          <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-5">
            <div className="w-full flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 flex-wrap">
              <p className="text-lg sm:text-xl md:text-2xl font-medium shrink-0">
                Verifications
              </p>
              <div className="relative w-full sm:w-[220px] md:w-[280px]">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="border border-zinc-500/20 bg-background rounded-lg w-full h-9 sm:h-10 pl-9 pr-3 text-xs sm:text-sm"
                  placeholder="Search property..."
                />
                <SearchIcon
                  className="absolute top-1/2 -translate-y-1/2 left-3 w-4 sm:w-5"
                  color="black"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="border border-zinc-500/20 bg-background rounded-lg h-9 sm:h-10 px-3 text-xs sm:text-sm w-full sm:w-auto"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="VERIFIED">Verified</option>
                <option value="REJECTED">Rejected</option>
              </select>
              {(searchTerm || statusFilter) && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("");
                    setPage(1);
                  }}
                  className="flex items-center gap-1 text-xs sm:text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
                >
                  <Icon icon="lucide:x" width="14" height="14" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Table Section */}
          {verificationsLoading ? (
            <div className="flex items-center justify-center min-h-[400px] w-full">
              <Loader />
            </div>
          ) : verifications && verifications.length > 0 ? (
            <div className="w-full mt-2 sm:mt-4 overflow-x-auto">
              <div className="min-w-[1000px] lg:min-w-full">
                <table className="w-full border-collapse">
                  <thead className="">
                    <tr className="text-teal-600 text-[10px] sm:text-xs">
                      <th className="bg-[#0280901A] h-8 sm:h-10 px-2 sm:px-3 md:px-4 rounded-tl-xl rounded-bl-xl font-medium text-left w-[180px]">
                        Property ID
                      </th>
                      <th className="bg-[#0280901A] h-8 sm:h-10 px-2 sm:px-3 md:px-4 font-medium text-left w-[200px]">
                        Property name
                      </th>
                      <th className="bg-[#0280901A] h-8 sm:h-10 px-2 sm:px-3 md:px-4 font-medium text-left w-[200px]">
                        Feedback
                      </th>
                      <th className="bg-[#0280901A] h-8 sm:h-10 px-2 sm:px-3 md:px-4 font-medium text-left w-[150px]">
                        Assigned agent
                      </th>
                      <th className="bg-[#0280901A] h-8 sm:h-10 px-2 sm:px-3 md:px-4 font-medium text-left w-[120px]">
                        Created on
                      </th>
                      <th className="bg-[#0280901A] h-8 sm:h-10 px-2 sm:px-3 md:px-4 font-medium text-left w-[120px]">
                        Verified on
                      </th>
                      <th className="bg-[#0280901A] h-8 sm:h-10 px-2 sm:px-3 md:px-4 font-medium text-center w-[100px]">
                        Status
                      </th>
                      <th className="bg-[#0280901A] h-8 sm:h-10 px-2 sm:px-3 md:px-4 rounded-tr-xl rounded-br-xl w-[50px]"></th>
                    </tr>
                  </thead>
                  <tbody className="text-[11px] sm:text-xs md:text-sm">
                    {verifications?.map((verification, index) => {
                      const propertyId =
                        verification?.propertyId ??
                        verification?.property_id ??
                        verification?.property?.id;
                      const formattedId = propertyId
                        ? `APRT25-${propertyId}`
                        : "--/--";

                      return (
                        <tr
                          key={index}
                          className="hover:bg-background/50 cursor-pointer transition-colors"
                          onClick={() => {
                            router.push(
                              PAGE_ROUTES.dashboard.propertyManagement.allProperties.verifications.details(
                                propertyId,
                                verification?.id,
                              ),
                            );
                          }}
                        >
                          <td className="px-2 sm:px-3 md:px-4 py-3 sm:py-4 border-b border-b-gray-200">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs sm:text-sm font-medium truncate max-w-[100px] sm:max-w-[120px]">
                                {formattedId}
                              </span>
                              {propertyId && (
                                <button
                                  onClick={(e) => handleCopyId(propertyId, e)}
                                  className="text-gray-400 hover:text-primary transition-colors flex-shrink-0"
                                >
                                  {copiedId === String(propertyId) ? (
                                    <MdCheck className="text-green-500 text-sm" />
                                  ) : (
                                    <MdCopyAll className="text-sm" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-2 sm:px-3 md:px-4 py-3 sm:py-4 border-b border-b-gray-200">
                            <p className="text-xs sm:text-sm truncate max-w-[120px] sm:max-w-[150px] md:max-w-[180px]">
                              {verification?.property?.name || "--/--"}
                            </p>
                          </td>
                          <td className="px-2 sm:px-3 md:px-4 py-3 sm:py-4 border-b border-b-gray-200">
                            <p className="text-xs sm:text-sm truncate max-w-[120px] sm:max-w-[150px] md:max-w-[180px]">
                              {verification?.feedback ?? (
                                <em className="text-zinc-400">No comments</em>
                              )}
                            </p>
                          </td>
                          <td className="px-2 sm:px-3 md:px-4 py-3 sm:py-4 border-b border-b-gray-200">
                            <p className="text-xs sm:text-sm font-medium truncate max-w-[100px] sm:max-w-[120px]">
                              {`${verification?.agent?.profile?.firstName ?? verification?.agent?.firstName ?? "--"} ${verification?.agent?.profile?.lastName ?? verification?.agent?.lastName ?? ""}`}
                            </p>
                          </td>
                          <td className="px-2 sm:px-3 md:px-4 py-3 sm:py-4 border-b border-b-gray-200">
                            <p className="text-xs sm:text-sm whitespace-nowrap">
                              {verification?.createdAt ||
                              verification?.created_at
                                ? formatDate(
                                    verification?.createdAt ??
                                      verification?.created_at!,
                                  )
                                : "--/--"}
                            </p>
                          </td>
                          <td className="px-2 sm:px-3 md:px-4 py-3 sm:py-4 border-b border-b-gray-200">
                            <p className="text-xs sm:text-sm whitespace-nowrap">
                              {verification?.verificationDate ||
                              verification?.verification_date
                                ? formatDate(
                                    verification?.verificationDate ??
                                      verification?.verification_date!,
                                  )
                                : "--/--"}
                            </p>
                          </td>
                          <td className="px-2 sm:px-3 md:px-4 py-3 sm:py-4 border-b border-b-gray-200 text-center">
                            <div className="inline-block">
                              <VerificationBadge
                                status={verification?.status}
                              />
                            </div>
                          </td>
                          <td className="px-2 sm:px-3 md:px-4 py-3 sm:py-4 border-b border-b-gray-200">
                            <div
                              className="flex justify-center items-center w-fit cursor-pointer hover:bg-gray-100 rounded-lg p-1 transition-colors"
                              onClick={(event) => handleDotsClick(event, index)}
                            >
                              <DotsIcon className="w-4 sm:w-5" color="gray" />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : verifications && verifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 sm:py-12 md:py-16 w-full">
              <div className="w-fit mb-3">
                <Icon
                  icon="hugeicons:album-not-found-01"
                  width="32"
                  height="32"
                  className="sm:w-10 sm:h-10 text-gray-400"
                />
              </div>
              <p className="text-center text-gray-500 text-xs sm:text-sm">
                No verifications found
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 sm:py-12 md:py-16 w-full">
              <div className="w-fit mb-3">
                <Icon
                  icon="mynaui:danger-octagon"
                  width="32"
                  height="32"
                  className="sm:w-10 sm:h-10 text-red-600"
                />
              </div>
              <p className="text-center text-gray-500 text-xs sm:text-sm">
                Error loading verifications
              </p>
            </div>
          )}
        </div>

        {/* Context Menu Modal */}
        {selectedRow !== null && modalPosition && (
          <div
            ref={modalRef}
            className="absolute bg-white shadow-xl rounded-lg z-50 border border-gray-200 overflow-hidden min-w-[120px]"
            style={{ top: modalPosition.top, left: modalPosition.left }}
          >
            {detailButtons.map((button, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm cursor-pointer transition-colors
                                    ${
                                      button.label === "Reject"
                                        ? "hover:bg-red-50 hover:text-red-600"
                                        : button.label === "Verify"
                                          ? "hover:bg-green-50 hover:text-green-600"
                                          : "hover:bg-gray-50"
                                    } border-b last:border-b-0 border-gray-100`}
                onClick={button.onClick}
              >
                <span
                  className={`${button.label === "Reject" ? "text-red-500" : button.label === "Verify" ? "text-green-500" : "text-gray-500"}`}
                >
                  {button.Icon}
                </span>
                <span className="font-medium">{button.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!verificationsLoading &&
          verificationList &&
          verifications &&
          verifications.length > 0 && (
            <div className="mt-4 sm:mt-6 w-full">
              <TablePagination
                total={verificationList?.data?.data?.meta?.total ?? 0}
                currentPage={page}
                setPage={setPage}
                firstPage={verificationList?.data?.data?.meta?.firstPage ?? 1}
                itemsPerPage={10}
              />
            </div>
          )}
      </div>

      {/* Verify Modal */}
      <CustomModal
        isOpen={showVerifyModal}
        onClose={() => {
          setShowVerifyModal(false);
          setFeedbackText("");
          setSkipKycCheck(false);
          setSkipDocumentCheck(false);
          setSelectedVerification(null);
        }}
        title="Verify Property"
      >
        <div className="w-full p-4">
          {selectedVerification && (
            <>
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Property:</span>{" "}
                  {selectedVerification?.property?.name || "N/A"}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  ID: APRT25-
                  {selectedVerification?.propertyId ??
                    selectedVerification?.property_id ??
                    selectedVerification?.property?.id}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Feedback / Notes{" "}
                  <span className="text-zinc-400 text-xs">(optional)</span>
                </label>
                <textarea
                  rows={4}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Add any verification notes or comments..."
                  className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-200 focus:border-green-500 outline-none transition-all"
                />
                <p className="text-xs text-zinc-400 mt-1">
                  {feedbackText.length}/500 characters
                </p>
              </div>

              {(user?.role === UserRole.ADMIN ||
                user?.role === UserRole.SUPER_ADMIN ||
                user?.role === UserRole.OPERATIONS_ADMIN) && (
                <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <p className="text-sm font-medium text-amber-800 mb-2">
                    Override Checks
                  </p>
                  <label className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={skipKycCheck}
                      onChange={(e) => setSkipKycCheck(e.target.checked)}
                      className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-sm text-amber-700">
                      Skip owner KYC verification check
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={skipDocumentCheck}
                      onChange={(e) => setSkipDocumentCheck(e.target.checked)}
                      className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-sm text-amber-700">
                      Skip document verification check
                    </span>
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowVerifyModal(false);
                    setFeedbackText("");
                    setSkipKycCheck(false);
                    setSkipDocumentCheck(false);
                    setSelectedVerification(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-zinc-700 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerify}
                  disabled={verificationUpdating}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {verificationUpdating ? (
                    <div className="w-4 h-4">
                      <Loader />
                    </div>
                  ) : (
                    <MdOutlineVerified />
                  )}
                  {verificationUpdating ? "Verifying..." : "Confirm Verify"}
                </button>
              </div>
            </>
          )}
        </div>
      </CustomModal>

      {/* Reject Modal */}
      <CustomModal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setFeedbackText("");
          setSelectedVerification(null);
        }}
        title="Reject Property Verification"
      >
        <div className="w-full p-4">
          {selectedVerification && (
            <>
              <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                <p className="text-sm text-amber-800">
                  <span className="font-semibold">Property:</span>{" "}
                  {selectedVerification?.property?.name || "N/A"}
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  ID: APRT25-
                  {selectedVerification?.propertyId ??
                    selectedVerification?.property_id ??
                    selectedVerification?.property?.id}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Rejection Feedback <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Please provide reason for rejection..."
                  className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-200 focus:border-red-500 outline-none transition-all"
                  required
                />
                <p className="text-xs text-zinc-400 mt-1">
                  {feedbackText.length}/500 characters
                </p>
                {!feedbackText.trim() && (
                  <p className="text-xs text-red-500 mt-1">
                    Feedback is required for rejection
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setFeedbackText("");
                    setSelectedVerification(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-zinc-700 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={verificationUpdating || !feedbackText.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {verificationUpdating ? (
                    <div className="w-4 h-4">
                      <Loader />
                    </div>
                  ) : (
                    <ImCancelCircle />
                  )}
                  {verificationUpdating ? "Rejecting..." : "Confirm Reject"}
                </button>
              </div>
            </>
          )}
        </div>
      </CustomModal>
    </>
  );
}

"use client";

import {
  useAllExtensions,
  useApproveExtension,
  useRejectExtension,
  useCancelExtension,
} from "@/src/hooks/useExtensions";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Icon } from "@iconify/react";
import { DotsIcon, SearchIcon } from "@/src/components/icons";
import TablePagination from "@/src/components/TablePagination";
import { ExtensionStatus } from "@/src/lib/enums";
import { useRef, useEffect } from "react";
import { usePermissions } from "@/src/hooks/usePermissions";
import { useRouter } from "next/navigation";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import { formatMoney, formatDate } from "@/src/lib/utils";

const ExtensionsView = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ExtensionStatus | "">("");
  const pageSize = 10;
  const router = useRouter();
  const { isAdmin, isOwner } = usePermissions();
  const approveMutation = useApproveExtension();
  const rejectMutation = useRejectExtension();
  const cancelMutation = useCancelExtension();

  const queryClient = useQueryClient();

  const { data, isLoading } = useAllExtensions({
    page,
    size: pageSize,
  });

  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [modalPosition, setModalPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleDotsClick = (event: React.MouseEvent, index: number) => {
    event.stopPropagation();
    setSelectedRow(index);
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setModalPosition({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX - 100,
    });
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setSelectedRow(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const extensions = data?.items || [];
  const totalCount = data?.total || 0;

  const handleAction = async (
    action: "approve" | "reject" | "cancel",
    ext: any,
  ) => {
    const payload = { bookingId: ext.booking_id, extensionId: ext.id };

    const config = {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["all-extensions"] });
        setSelectedRow(null);
      },
    };

    if (action === "approve") {
      if (
        confirm("Are you sure you want to approve this extension stay request?")
      ) {
        approveMutation.mutate(payload, config);
      }
    } else if (action === "reject") {
      const reason = prompt("Enter reason for rejection:");
      if (reason) {
        rejectMutation.mutate({ ...payload, reason }, config);
      }
    } else if (action === "cancel") {
      if (
        confirm("Are you sure you want to cancel this extension stay request?")
      ) {
        cancelMutation.mutate(payload, config);
      }
    }
  };

  const getStatusStyle = (status: ExtensionStatus) => {
    switch (status) {
      case ExtensionStatus.PENDING_PAYMENT:
        return "bg-amber-100 text-amber-700 ring-1 ring-amber-600/20";
      case ExtensionStatus.AWAITING_OWNER_APPROVAL:
        return "bg-purple-100 text-purple-700 ring-1 ring-purple-600/20";
      case ExtensionStatus.APPROVED:
        return "bg-blue-100 text-blue-700 ring-1 ring-blue-600/20";
      case ExtensionStatus.CONFIRMED:
        return "bg-green-100 text-green-700 ring-1 ring-green-600/20";
      case ExtensionStatus.REJECTED:
        return "bg-red-100 text-red-700 ring-1 ring-red-600/20";
      case ExtensionStatus.CANCELLED:
        return "bg-gray-100 text-gray-700 ring-1 ring-gray-600/20";
      default:
        return "bg-gray-100 text-gray-700 ring-1 ring-gray-600/20";
    }
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gray-50/50">
          <div className="flex justify-between items-center gap-4 flex-wrap mb-6">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Stay Extensions
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage guest requests to extend their stay period
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 max-w-full sm:max-w-md relative">
              <input
                type="text"
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                placeholder="Search by Extension ID..."
              />
              <SearchIcon
                className="absolute top-[50%] -translate-y-1/2 left-3 w-5"
                color="#9CA3AF"
              />
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as ExtensionStatus);
                  setPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white min-w-[150px]"
              >
                <option value="">All Statuses</option>
                {Object.values(ExtensionStatus).map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
              <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 shadow-sm">
                Total Requests:{" "}
                <span className="text-primary">{totalCount}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          {isLoading ? (
            <div className="p-8 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : extensions.length > 0 ? (
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 uppercase tracking-wider text-[10px] font-bold text-gray-700">
                <tr>
                  <th className="px-6 py-4">Ext ID</th>
                  <th className="px-6 py-4">Booking ID</th>
                  <th className="px-6 py-4">New End Date</th>
                  <th className="px-6 py-4 text-center">Nights</th>
                  <th className="px-6 py-4 font-bold">Amount</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4">Requested On</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {extensions.map((ext: any, index: number) => (
                  <tr
                    key={ext.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer group"
                    onClick={() =>
                      router.push(
                        PAGE_ROUTES.dashboard.bookingManagement.bookings.details(
                          ext.booking_id,
                        ),
                      )
                    }
                  >
                    <td className="px-6 py-4 font-bold text-primary truncate max-w-[120px]">
                      {ext.extension_id || ext.id.substring(0, 8)}
                    </td>
                    <td className="px-6 py-4 text-gray-600 truncate max-w-[120px] font-mono text-[10px]">
                      {ext.booking_id}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {formatDate(ext.new_end_date)}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-zinc-500">
                      {ext.extra_nights}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      {formatMoney(ext.extension_amount)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusStyle(ext.status)}`}
                      >
                        {ext.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {new Date(ext.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div
                        className="flex justify-end items-center"
                        onClick={(e) => handleDotsClick(e, index)}
                      >
                        <div className="w-8 h-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center transition-colors">
                          <DotsIcon className="w-5 cursor-pointer text-gray-400 group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white">
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                <Icon
                  icon="solar:calendar-search-bold"
                  width="32"
                  height="32"
                  className="text-gray-300"
                />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No extension requests found
              </h3>
              <p className="text-sm text-gray-500">
                Wait for guests to request more time or check back later
              </p>
            </div>
          )}
        </div>

        {!isLoading && extensions.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/30">
            <TablePagination
              total={totalCount}
              currentPage={page}
              setPage={setPage}
              itemsPerPage={pageSize}
              firstPage={1}
            />
          </div>
        )}
      </div>

      {/* Context Menu */}
      {selectedRow !== null && modalPosition && (
        <div
          ref={modalRef}
          className="fixed bg-white shadow-2xl rounded-xl z-[100] border border-gray-200 overflow-hidden min-w-[200px] animate-in fade-in zoom-in-95 duration-150"
          style={{ top: modalPosition.top, left: modalPosition.left }}
        >
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Options
            </span>
          </div>
          <button
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 cursor-pointer text-sm text-gray-700 transition-colors border-b border-zinc-100 group"
            onClick={(e) => {
              e.stopPropagation();
              const ext = extensions[selectedRow];
              router.push(
                PAGE_ROUTES.dashboard.bookingManagement.bookings.details(
                  ext.booking_id,
                ),
              );
              setSelectedRow(null);
            }}
          >
            <Icon
              icon="solar:eye-bold"
              className="text-zinc-400 group-hover:text-primary transition-colors"
              width="18"
            />
            <span>View Details</span>
          </button>

          {(isAdmin || isOwner) &&
            extensions[selectedRow].status ===
              ExtensionStatus.AWAITING_OWNER_APPROVAL && (
              <>
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50 cursor-pointer text-sm font-semibold text-green-600 transition-colors border-b border-zinc-100 group"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction("approve", extensions[selectedRow]);
                  }}
                >
                  <Icon
                    icon="solar:check-circle-bold"
                    className="text-green-400 group-hover:text-green-600 transition-colors"
                    width="18"
                  />
                  <span>Approve Request</span>
                </button>
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 cursor-pointer text-sm font-semibold text-red-600 transition-colors border-b border-zinc-100 group"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction("reject", extensions[selectedRow]);
                  }}
                >
                  <Icon
                    icon="solar:close-circle-bold"
                    className="text-red-400 group-hover:text-red-600 transition-colors"
                    width="18"
                  />
                  <span>Reject Request</span>
                </button>
              </>
            )}

          {isAdmin &&
            [
              ExtensionStatus.APPROVED,
              ExtensionStatus.PENDING_PAYMENT,
              ExtensionStatus.AWAITING_OWNER_APPROVAL,
            ].includes(extensions[selectedRow].status) && (
              <button
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-amber-50 cursor-pointer text-sm font-semibold text-amber-600 transition-colors group"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction("cancel", extensions[selectedRow]);
                }}
              >
                <Icon
                  icon="solar:trash-bin-trash-bold"
                  className="text-amber-400 group-hover:text-amber-600 transition-colors"
                  width="18"
                />
                <span>Cancel Stay</span>
              </button>
            )}
        </div>
      )}
    </div>
  );
};

export default ExtensionsView;

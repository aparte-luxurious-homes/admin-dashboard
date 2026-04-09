"use client";

import { useAdminDisputes, useMyDisputes, useUpdateDisputeStatus } from "@/src/hooks/useDisputes";
import { useState } from "react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Icon } from "@iconify/react";
import { DotsIcon, FilterIcon, SearchIcon } from "@/src/components/icons";
import TablePagination from "@/src/components/TablePagination";
import { DisputeStatus, DisputeCategory } from "@/src/lib/enums";
import { useRef, useEffect } from "react";
import { usePermissions } from "@/src/hooks/usePermissions";
import { useRouter } from "next/navigation";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";

import { toast } from "react-hot-toast";

const DisputesView = () => {
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState<DisputeStatus | "">("");
    const pageSize = 10;
    const router = useRouter();
    const { isAdmin, isOwner, isAgent } = usePermissions();

    const adminQuery = useAdminDisputes({
        page,
        size: pageSize,
        status: statusFilter || undefined,
    });

    const myQuery = useMyDisputes({
        page,
        size: pageSize,
        status: statusFilter || undefined,
    });

    const { data, isLoading } = isAdmin ? adminQuery : myQuery;

    const [selectedRow, setSelectedRow] = useState<number | null>(null);
    const [modalPosition, setModalPosition] = useState<{ top: number; left: number } | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    const handleDotsClick = (event: React.MouseEvent, index: number) => {
        event.stopPropagation();
        setSelectedRow(index);
        const rect = (event.target as HTMLElement).getBoundingClientRect();
        setModalPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX - 100 });
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                setSelectedRow(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const disputes = data?.items || [];
    const totalCount = data?.total || 0;

    const getStatusStyles = (status: DisputeStatus) => {
        switch (status) {
            case DisputeStatus.OPEN:
                return "bg-blue-100 text-blue-700 ring-1 ring-inset ring-blue-600/20";
            case DisputeStatus.UNDER_REVIEW:
                return "bg-purple-100 text-purple-700 ring-1 ring-inset ring-purple-600/20";
            case DisputeStatus.AWAITING_EVIDENCE:
                return "bg-amber-100 text-amber-700 ring-1 ring-inset ring-amber-600/20";
            case DisputeStatus.RESOLVED:
                return "bg-green-100 text-green-700 ring-1 ring-inset ring-green-600/20";
            case DisputeStatus.CLOSED:
                return "bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-600/20";
            default:
                return "bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-600/20";
        }
    };

    return (
        <div className="p-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gray-50/50">
                    <div className="flex justify-between items-center gap-4 flex-wrap mb-6">
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">Dispute Management</h1>
                            <p className="text-sm text-gray-500 mt-1">Review and resolve booking-related issues and cleanup requests</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex-1 max-w-md relative">
                            <input
                                type="text"
                                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                                placeholder="Search by Dispute ID..."
                            />
                            <SearchIcon className="absolute top-[50%] -translate-y-1/2 left-3 w-5" color="#9CA3AF" />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value as DisputeStatus);
                                setPage(1);
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white min-w-[150px]"
                        >
                            <option value="">All Statuses</option>
                            {Object.values(DisputeStatus).map((status) => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                        <div className="ml-auto bg-white px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 shadow-sm">
                            Total Disputes: <span className="text-primary">{totalCount}</span>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-8 space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : disputes.length > 0 ? (
                        <table className="w-full text-left border-collapse text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200 uppercase tracking-wider text-xs font-semibold text-gray-700">
                                <tr>
                                    <th className="px-6 py-4">Dispute ID</th>
                                    <th className="px-6 py-4">Booking ID</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4">Raised On</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {disputes.map((dispute: any, index: number) => (
                                    <tr 
                                        key={dispute.id} 
                                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                                        onClick={() => router.push(PAGE_ROUTES.dashboard.bookingManagement.bookingDisputes.details(dispute.id))}
                                    >
                                        <td className="px-6 py-4 font-bold text-primary truncate max-w-[120px]">
                                            {dispute.dispute_id || dispute.id.substring(0, 8)}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 truncate max-w-[120px]">
                                            {dispute.booking_id}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-800">
                                            {dispute.category.replace(/_/g, " ")}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusStyles(dispute.status)}`}>
                                                {dispute.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-xs">
                                            {new Date(dispute.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end items-center" onClick={(e) => handleDotsClick(e, index)}>
                                                <DotsIcon className="w-5 cursor-pointer hover:text-primary transition-colors text-gray-400" />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 bg-white">
                            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                                <Icon icon="hugeicons:album-not-found-01" width="32" height="32" className="text-gray-300" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No disputes found</h3>
                            <p className="text-sm text-gray-500">All calm! No issues currently reported on the platform</p>
                        </div>
                    )}
                </div>

                {!isLoading && disputes.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
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
                    className="fixed bg-white shadow-xl rounded-lg z-50 border border-gray-200 overflow-hidden min-w-[150px] animate-in fade-in slide-in-from-right-2 duration-100"
                    style={{ top: modalPosition.top, left: modalPosition.left }}
                >
                    <button
                        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 transition-colors border-b border-gray-100 group"
                        onClick={(e) => {
                            e.stopPropagation();
                            const dispute = disputes[selectedRow];
                            router.push(PAGE_ROUTES.dashboard.bookingManagement.bookingDisputes.details(dispute.id));
                            setSelectedRow(null);
                        }}
                    >
                        <Icon icon="mdi:eye" className="text-gray-400 group-hover:text-primary" width="18" />
                        <span>View Details</span>
                    </button>
                    {isAdmin && (
                        <button
                            className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm font-medium text-amber-600 transition-colors border-b border-gray-100 group last:border-b-0"
                            onClick={(e) => {
                                e.stopPropagation();
                                toast.success("Full detail page recommended for resolution");
                                setSelectedRow(null);
                            }}
                        >
                            <Icon icon="mdi:update" className="text-amber-400 group-hover:text-amber-600" width="18" />
                            <span>Quick Update</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default DisputesView;

'use client'

import { formatDate, formatMoney } from "@/src/lib/utils";
import { DotsIcon, FilterIcon, PrinterIcon, SearchIcon } from "../../icons";
import { DeleteBooking, GetAllBookings } from "@/src/lib/request-handlers/bookingMgt";
import { GetAllProperties } from "@/src/lib/request-handlers/propertyMgt";
import { useEffect, useRef, useState } from "react";
import { IBooking } from "../types";
import { BookingBadge } from "../../badge";
import TablePagination from "../../TablePagination";
import Loader from "@/src/components/loader";
import { LuEye, LuTrash2 } from "react-icons/lu";
import { HiOutlinePencilAlt } from "react-icons/hi";
import { useRouter } from "next/navigation";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import Link from "next/link";
import { FiPlus } from "react-icons/fi";
import { Icon } from "@iconify/react/dist/iconify.js";
import { toast } from "react-hot-toast";
import DeleteBookingDialog from "../dialogs/DeleteBookingDialog";

export default function BookingsTable({
    unitId
}: {
    unitId?: string | number
}) {
    const [page, setPage] = useState<number>(1);
    const [searchTerm, setSearchTerm] = useState<string>("");

    // Filter states
    const [propertyFilter, setPropertyFilter] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [startDateFrom, setStartDateFrom] = useState<string>("");
    const [startDateTo, setStartDateTo] = useState<string>("");

    const { data: bookings, isLoading } = GetAllBookings(
        page,
        10,
        searchTerm,
        unitId,
        propertyFilter || undefined,
        statusFilter || undefined,
        startDateFrom || undefined,
        startDateTo || undefined
    );
    const [bookingList, setBookingList] = useState<IBooking[]>([]);
    const router = useRouter();

    // Fetch properties for filter dropdown
    const { data: propertiesData } = GetAllProperties(1, 100, '');
    const properties = (propertiesData?.data?.data?.items ?? propertiesData?.data?.items ?? []) as any[];

    const [selectedRow, setSelectedRow] = useState<number | null>(null);
    const [modalPosition, setModalPosition] = useState<{ top: number; left: number } | null>(null);
    const modalRef = useRef(null);
    const { mutate: deleteBooking, isPending: isDeleting } = DeleteBooking();

    // Delete dialog state
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [bookingToDelete, setBookingToDelete] = useState<IBooking | null>(null);

    const detailButtons = [
        {
            label: "View",
            Icon: <LuEye />,
            onClick: () => router.push(
                PAGE_ROUTES.dashboard.bookingManagement.bookings.details(String((bookingList[selectedRow!] as any).id))
            ),
        },
        {
            label: "Edit",
            Icon: <HiOutlinePencilAlt />,
            onClick: () => router.push(
                `${PAGE_ROUTES.dashboard.bookingManagement.bookings.details(String((bookingList[selectedRow!] as any).id))}?edit=true`
            ),
        },
        {
            label: "Delete",
            Icon: <LuTrash2 className="text-red-500" />,
            onClick: () => {
                const booking = bookingList[selectedRow!];
                setBookingToDelete(booking);
                setIsDeleteDialogOpen(true);
                setSelectedRow(null);
            },
        }
    ];

    // Handle click outside modal
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (modalRef.current && !(modalRef.current as HTMLElement).contains(event.target as Node)) {
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
        setModalPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
    };


    useEffect(() => {
        setBookingList((bookings?.data?.data?.items ?? bookings?.data?.items ?? []) as any);
    }, [bookings])


    return (
        <div className="p-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center gap-4 flex-wrap mb-4">
                        <div>
                            <div className="flex items-center gap-3">
                                {unitId && (
                                    <button
                                        onClick={() => router.back()}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        title="Go back"
                                    >
                                        <Icon icon="lucide:arrow-left" width="20" height="20" className="text-gray-600" />
                                    </button>
                                )}
                                <h1 className="text-xl font-semibold text-gray-900">
                                    {unitId ? "Unit Bookings" : "All Bookings"}
                                </h1>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                                {unitId ? "View and manage bookings for this specific unit" : "Manage and track all property bookings"}
                            </p>
                        </div>
                        <Link
                            href={`${PAGE_ROUTES.dashboard.bookingManagement.bookings.create}`}
                            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg flex items-center gap-2"
                        >
                            <FiPlus className="w-4 h-4" />
                            <span>New Booking</span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex-1 max-w-md relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                placeholder="Search bookings..."
                            />
                            <SearchIcon className="absolute top-[50%] -translate-y-1/2 left-3 w-5" color="#9CA3AF" />
                        </div>
                    </div>

                    {/* Filters Row */}
                    <div className="flex items-center gap-3 mt-4 flex-wrap">
                        {/* Property Filter */}
                        {!unitId && (
                            <div className="min-w-[200px]">
                                <select
                                    value={propertyFilter}
                                    onChange={(e) => {
                                        setPropertyFilter(e.target.value);
                                        setPage(1); // Reset to first page when filter changes
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                                >
                                    <option value="">All Properties</option>
                                    {properties.map((property: any) => (
                                        <option key={property.id} value={property.id}>
                                            {property.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Status Filter */}
                        <div className="min-w-[180px]">
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                            >
                                <option value="">All Statuses</option>
                                <option value="PENDING">Pending</option>
                                <option value="CONFIRMED">Confirmed</option>
                                <option value="CANCELLED">Cancelled</option>
                                <option value="COMPLETED">Completed</option>
                            </select>
                        </div>

                        {/* Date Range Filters */}
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={startDateFrom}
                                onChange={(e) => {
                                    setStartDateFrom(e.target.value);
                                    setPage(1);
                                }}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                                placeholder="From date"
                            />
                            <span className="text-gray-500 text-sm">to</span>
                            <input
                                type="date"
                                value={startDateTo}
                                onChange={(e) => {
                                    setStartDateTo(e.target.value);
                                    setPage(1);
                                }}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                                placeholder="To date"
                            />
                        </div>

                        {/* Clear Filters Button */}
                        {(propertyFilter || statusFilter || startDateFrom || startDateTo) && (
                            <button
                                onClick={() => {
                                    setPropertyFilter("");
                                    setStatusFilter("");
                                    setStartDateFrom("");
                                    setStartDateTo("");
                                    setPage(1);
                                }}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Icon icon="lucide:x" width="16" height="16" />
                                Clear Filters
                            </button>
                        )}
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader />
                    </div>
                ) : bookingList && bookingList.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    <th className="px-6 py-3 text-left">Booking ID</th>
                                    <th className="px-6 py-3 text-left">Guest</th>
                                    <th className="px-6 py-3 text-left">Price</th>
                                    <th className="px-6 py-3 text-center">Status</th>
                                    <th className="px-6 py-3 text-center">Booking Date</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {bookingList.map((booking, index) => (
                                    <tr
                                        key={index}
                                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={() => router.push(PAGE_ROUTES.dashboard.bookingManagement.bookings.details(String((booking as any)?.id)))}
                                    >
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {(booking as any)?.booking_id ?? '--/--'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {booking?.user?.profile?.first_name || (booking?.user as any)?.firstName || (booking as any)?.user_id || '--/--'} {booking?.user?.profile?.last_name || (booking?.user as any)?.lastName || ''}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                            {formatMoney(Number((booking as any)?.total_price ?? 0))}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(booking as any)?.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                                                (booking as any)?.status === 'PENDING' || (booking as any)?.status === 'PENDING_PAYMENT' ? 'bg-yellow-100 text-yellow-800' :
                                                    (booking as any)?.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                                        (booking as any)?.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-gray-100 text-gray-800'
                                                }`}>
                                                {(booking as any)?.status?.replace('_', ' ') ?? '--/--'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700 text-center">
                                            {formatDate((booking as any)?.created_at)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end items-center" onClick={(event) => handleDotsClick(event, index)}>
                                                <DotsIcon className="w-5 cursor-pointer" color="#6B7280" />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : bookingList && bookingList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <Icon icon="hugeicons:album-not-found-01" width="32" height="32" className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No bookings found</h3>
                        <p className="text-sm text-gray-500">Try adjusting your search or create a new booking</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                            <Icon icon="mynaui:danger-octagon" width="32" height="32" className="text-red-600" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">Error loading bookings</h3>
                        <p className="text-sm text-gray-500">Please try again later</p>
                    </div>
                )}

                {!isLoading && bookingList && bookingList.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-200">
                        <TablePagination
                            total={(bookings?.data as any)?.data?.total ?? (bookings?.data as any)?.total ?? 0}
                            currentPage={page}
                            setPage={setPage}
                            firstPage={1}
                            itemsPerPage={(bookings?.data as any)?.data?.size ?? 10}
                        />
                    </div>
                )}
            </div>

            {/* Context Menu */}
            {selectedRow !== null && modalPosition && (
                <div
                    ref={modalRef}
                    className="absolute bg-white shadow-lg rounded-lg z-50 border border-gray-200 overflow-hidden"
                    style={{ top: modalPosition.top, left: modalPosition.left }}
                >
                    {detailButtons.map((button, idx) => (
                        <div
                            key={idx}
                            className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-sm text-gray-700"
                            onClick={button.onClick}
                        >
                            {button.Icon}
                            <span>{button.label}</span>
                        </div>
                    ))}
                </div>
            )}
            {/* Delete Confirmation Dialog */}
            <DeleteBookingDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => {
                    setIsDeleteDialogOpen(false);
                    setBookingToDelete(null);
                }}
                onConfirm={(reason) => {
                    if (bookingToDelete) {
                        deleteBooking(
                            {
                                bookingId: bookingToDelete.id,
                                cancellationReason: reason
                            },
                            {
                                onSuccess: () => {
                                    toast.success('Booking deleted successfully');
                                    setIsDeleteDialogOpen(false);
                                    setBookingToDelete(null);
                                },
                                onError: () => toast.error('Failed to delete booking')
                            }
                        );
                    }
                }}
                bookingId={bookingToDelete?.booking_id ?? bookingToDelete?.bookingId}
                isPending={isDeleting}
            />
        </div>
    );
};
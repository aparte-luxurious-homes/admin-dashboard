'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowIcon, DotsIcon, FilterIcon, PrinterIcon, SearchIcon, TrashIcon } from "../../icons";
import { useRouter } from "next/navigation";
import { IProperty, PropertyType } from "../types";
import { GetAllProperties, DeleteProperty } from "@/src/lib/request-handlers/propertyMgt";
import Loader from "../../loader";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import { BookingBadge } from "../../badge";
import { formatDate } from "@/src/lib/utils";
import TablePagination from "../../TablePagination";
import { LuEye, LuTrash2 } from "react-icons/lu";
import { HiOutlinePencilAlt } from "react-icons/hi";
import { FiPlus } from "react-icons/fi";
import Link from "next/link";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useAuth } from "@/src/hooks/useAuth";
import { UserRole } from "@/src/lib/enums";
import { useDispatch } from "react-redux";
import { showAlert } from "@/src/lib/slices/alertDialogSlice";
import { toast } from "react-hot-toast";

export default function PropertiesTable() {
    const { user } = useAuth();
    const [page, setPage] = useState<number>(1);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const { data: properties, isLoading } = GetAllProperties(page, 10, searchTerm, user?.role || UserRole.GUEST, user?.id);
    const [propertyList, setPropertyList] = useState<IProperty[]>([]);
    const router = useRouter();

    const [selectedRow, setSelectedRow] = useState<number | null>(null);
    const [modalPosition, setModalPosition] = useState<{ top: number; left: number } | null>(null);
    const modalRef = useRef(null);
    const dispatch = useDispatch();
    const { mutate: deleteProperty } = DeleteProperty();

    const detailButtons = [
        {
            label: "View",
            Icon: <LuEye />,
            onClick: () => {
                router.push(
                    PAGE_ROUTES.dashboard.propertyManagement.allProperties.details(propertyList[selectedRow!].id)
                )
                setSelectedRow(null)
            },
        },
        {
            label: "Edit",
            Icon: <HiOutlinePencilAlt />,
            onClick: () => {
                router.push(
                    `${PAGE_ROUTES.dashboard.propertyManagement.allProperties.details(propertyList[selectedRow!].id)}?edit=true`
                )
                setSelectedRow(null)
            },
        },
        {
            label: "Delete",
            Icon: <LuTrash2 className="text-red-500" />,
            onClick: () => {
                const property = propertyList[selectedRow!];
                dispatch(
                    showAlert({
                        title: "Delete Property?",
                        description: `Are you sure you want to delete ${property?.name || 'this property'}? This action cannot be undone.`,
                        confirmText: "Delete",
                        cancelText: "Cancel",
                        onConfirm: () => {
                            deleteProperty(
                                { propertyId: property.id },
                                {
                                    onSuccess: () => toast.success('Property deleted successfully'),
                                    onError: () => toast.error('Failed to delete property')
                                }
                            );
                        },
                    })
                );
                setSelectedRow(null);
            },
        }
    ]

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
        setPropertyList(properties?.data?.data?.data?.data ?? []);
    }, [properties])

    useEffect(() => {
        setPage(1)
    }, [searchTerm])

    return (
        <div className="p-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center gap-4 flex-wrap mb-4">
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">Property Listings</h1>
                            <p className="text-sm text-gray-500 mt-1">Manage all properties and their verification status</p>
                        </div>
                        <Link
                            href={`${PAGE_ROUTES.dashboard.propertyManagement.allProperties.create}`}
                            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg flex items-center gap-2"
                        >
                            <FiPlus className="w-4 h-4" />
                            <span>New Property</span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex-1 max-w-md relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                placeholder="Search properties..."
                            />
                            <SearchIcon className="absolute top-[50%] -translate-y-1/2 left-3 w-5" color="#9CA3AF" />
                        </div>
                        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700">
                            <FilterIcon className="w-4 h-4" color="#6B7280" />
                            <span>Filter</span>
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader />
                    </div>
                ) : propertyList && propertyList.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    <th className="px-6 py-3 text-left">Property ID</th>
                                    <th className="px-6 py-3 text-left">Property Name</th>
                                    <th className="px-6 py-3 text-left">Type</th>
                                    <th className="px-6 py-3 text-left">Owner</th>
                                    <th className="px-6 py-3 text-center">Status</th>
                                    <th className="px-6 py-3 text-left">Agent</th>
                                    <th className="px-6 py-3 text-left">Created</th>
                                    <th className="px-6 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {propertyList.map((property, index) => (
                                    <tr
                                        key={index}
                                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={() => router.push(PAGE_ROUTES.dashboard.propertyManagement.allProperties.details(property?.id))}
                                    >
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            APRT25-{String(property?.id ?? '').substring(0, 8)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                                            {property?.name ?? '--/--'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {property?.property_type ?? '--/--'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {property?.owner?.email || `${property?.owner?.profile?.firstName ?? ''} ${property?.owner?.profile?.lastName ?? ''}` || '--/--'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${property?.is_verified
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {property?.is_verified ? 'Verified' : 'Unverified'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {property?.agent?.email || property?.assigned_agent || '--/--'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {property?.created_at ? formatDate(property?.created_at) : '--/--'}
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
                ) : propertyList && propertyList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <Icon icon="hugeicons:album-not-found-01" width="32" height="32" className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No properties found</h3>
                        <p className="text-sm text-gray-500">Try adjusting your search or create a new property</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                            <Icon icon="mynaui:danger-octagon" width="32" height="32" className="text-red-600" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">Error loading properties</h3>
                        <p className="text-sm text-gray-500">Please try again later</p>
                    </div>
                )}

                {!isLoading && propertyList && propertyList.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-200">
                        <TablePagination
                            total={properties?.data?.data?.data?.meta?.total ?? 0}
                            currentPage={page}
                            setPage={setPage}
                            firstPage={properties?.data?.data?.data?.meta?.firstPage ?? 1}
                            itemsPerPage={10}
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
        </div>
    );
};
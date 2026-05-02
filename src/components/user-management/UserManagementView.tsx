"use client"

import UserEditForm from "./UserEditForm";

import { Skeleton } from "@/src/components/ui/skeleton";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import axiosRequest from "@/src/lib/api";
import Badge from "@/src/components/badge";
import { Icon } from "@iconify/react";
import { CreateUser, OnboardUser, DeleteUser, UpdateUser, GetAssignableRoles } from "@/src/lib/request-handlers/userMgt";
import { usePermissions } from "@/src/hooks/usePermissions";
import { toast } from "react-hot-toast";
import { DotsIcon, FilterIcon, SearchIcon, TrashIcon } from "@/src/components/icons";
import { showAlert } from "@/src/lib/slices/alertDialogSlice";
import { useDispatch } from "react-redux";
import TablePagination from "@/src/components/TablePagination";
import { LuEye } from "react-icons/lu";
import { HiOutlinePencilAlt } from "react-icons/hi";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";

interface UserProfile {
    id: number | string;
    userId: number | string;
    firstName?: string | null;
    first_name?: string | null;
    lastName?: string | null;
    last_name?: string | null;
    gender?: string | null;
    dob?: string | null;
    bio?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    kycStatus?: string;
    kyc_status?: string;
    profileImage?: string | null;
    profile_image?: string | null;
    averageRating?: string | number;
    average_rating?: string | number;
    createdAt?: string;
    created_at?: string;
    updatedAt?: string;
    updated_at?: string;
}

interface User {
    id: string | number;
    email: string;
    phone?: string | null;
    firstName?: string | null;
    first_name?: string | null;
    lastName?: string | null;
    last_name?: string | null;
    profile_image?: string | null;
    profileImage?: string | null;
    is_active?: boolean;
    isVerified?: boolean;
    is_verified?: boolean;
    role: string;
    profile?: UserProfile;
    createdAt?: string;
    created_at?: string;
    updatedAt?: string;
    updated_at?: string;
    total_records?: number;
    kyc_status?: string;
    kycStatus?: string;
    lastLogin?: string | null;
    last_login?: string | null;
    verificationToken?: string | null;
    verification_token?: string | null;
}

interface UserManagementViewProps {
    role: string; // Single role or comma-separated (e.g., "ADMIN,SUPER_ADMIN,OPERATIONS_ADMIN,SUPPORT_ADMIN,ANALYST")
    title: string;
    description: string;
    basePath: string; // e.g., "/user-management/guests"
}

const UserManagementView = ({ role, title, description, basePath }: UserManagementViewProps) => {
    const router = useRouter();
    const { canDeleteUser } = usePermissions();
    const [data, setData] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchValue, setSearchValue] = useState<string>("");
    const [rowCount, setRowCount] = useState(0);
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const [isOpen, setIsOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editUserId, setEditUserId] = useState<string | null>(null);

    console.log("data", data);

    const [selectedRow, setSelectedRow] = useState<number | null>(null);
    const [modalPosition, setModalPosition] = useState<{ top: number; left: number } | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const [isQuickOnboard, setIsQuickOnboard] = useState(false);

    // Create form state — use first role when comma-separated
    const defaultRole = role.includes(',') ? role.split(',')[0].trim() : role;
    const [createForm, setCreateForm] = useState({
        email: '',
        phone: '',
        password: '',
        firstName: '',
        lastName: '',
        gender: '',
        role: defaultRole,
        bio: '',
        is_active: true,
        isVerified: false,
    });

    // Edit form state
    const [editForm, setEditForm] = useState<any>({
        email: '',
        phone: '',
        firstName: '',
        lastName: '',
        gender: '',
        role: '',
        bio: '',
        is_active: true,
        isVerified: false,
    });

    const dispatch = useDispatch();
    const { mutate: createUser, isPending: creating } = CreateUser();
    const { mutate: onboardUser, isPending: onboarding } = OnboardUser();
    const { mutate: updateUser, isPending: updating } = UpdateUser();
    const { mutate: deleteUser, isPending: deleting } = DeleteUser();
    const { data: rolesData } = GetAssignableRoles();
    const assignableRoles: string[] = useMemo(() => {
    return rolesData?.data?.data?.assignable_roles ?? [];
    }, [rolesData]);

    // Sync createForm.role to first assignable role when API data loads,
    // if the current default isn't in the assignable list (prevents submitting an unassignable role)
    useEffect(() => {
        if (assignableRoles.length > 0 && !assignableRoles.includes(createForm.role)) {
            setCreateForm(prev => ({ ...prev, role: assignableRoles[0] }));
        }
    }, [assignableRoles, createForm.role]);

    const handleDownload = (type: "CSV" | "PDF") => {
        if (type === "CSV") {
            downloadCSV(data);
        } else if (type === "PDF") {
            downloadPDF(data);
        }
        setIsOpen(false);
    };

    const downloadCSV = (data: User[]) => {
        if (!data.length) return;
        const headers = ["ID", "First Name", "Last Name", "Email", "Phone", "Verified", "KYC Status", "Account Status", "Created At"];
        const csvContent = data.map(user => [
            user.id,
            user.profile?.first_name || user.profile?.firstName || user.first_name || user.firstName || "",
            user.profile?.last_name || user.profile?.lastName || user.last_name || user.lastName || "",
            user.email,
            user.phone || "",
            user.isVerified,
            user.profile?.kycStatus || "PENDING",
            user.is_active,
            user.createdAt
        ].map(value => `"${value}"`).join(","));
        const csvString = [headers.join(","), ...csvContent].join("\n");
        const blob = new Blob([csvString], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${title.toLowerCase().replace(/\s+/g, '_')}_info.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const downloadPDF = (data: User[]) => {
        if (!data.length) return;
        const doc = new jsPDF();
        doc.text(`${title} Information`, 10, 10);
        const headers = ["ID", "Name", "Email", "KYC Status", "Status", "Created At"];
        const rows = data.map(user => [
            user.id || "--/--",
            `${user?.profile?.first_name || user?.profile?.firstName || user?.first_name || user?.firstName || ""} ${user?.profile?.last_name || user?.profile?.lastName || user?.last_name || user?.lastName || ""}`.trim() || "--/--",
            user.email || "--/--",
            user?.profile?.kycStatus || "PENDING",
            (user.is_active) ? "Active" : "Inactive",
            (user.createdAt) ? new Date(user.createdAt || '').toLocaleDateString() : "--/--"
        ]);
        autoTable(doc, {
            head: [headers],
            body: rows,
            styles: { fontSize: 10, cellPadding: 3 },
            theme: "grid",
        });
        doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}_info.pdf`);
    };

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axiosRequest.get(API_ROUTES.admin.users.base, {
                params: {
                    page: page,
                    size: pageSize,
                    search: searchValue || undefined,
                    role: role,
                },
            });
            const result = response.data.data;
            setData(result.data);
            setRowCount(result.meta.total);
        } catch (err: any) {
            toast.error(err.response?.data?.message || `Failed to fetch ${title.toLowerCase()}`);
        } finally {
            setLoading(false);
        }
    }, [page, searchValue, role, title]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers();
        }, 500); // Debounce search
        return () => clearTimeout(timer);
    }, [fetchUsers]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchValue(e.target.value);
        setPage(1); // Reset to first page on search
    };

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

    const detailButtons = [
        {
            label: "View",
            Icon: <LuEye />,
            onClick: () => {
                if (selectedRow !== null) {
                    router.push(`${basePath}/${data[selectedRow].id}`);
                }
                setSelectedRow(null);
            },
        },
        {
            label: "Edit",
            Icon: <HiOutlinePencilAlt />,
            onClick: () => {
                if (selectedRow !== null) {
                    const user = data[selectedRow];
                    setEditUserId(String(user.id));
                    setEditForm({
                        email: user.email || '',
                        phone: user.phone || '',
                        firstName: user.profile?.first_name || user.profile?.firstName || user.first_name || user.firstName || '',
                        lastName: user.profile?.last_name || user.profile?.lastName || user.last_name || user.lastName || '',
                        gender: user.profile?.gender ? user.profile.gender.toUpperCase() : '',
                        role: user.role || '',
                        bio: user.profile?.bio || '',
                        is_active: user.is_active ?? user.is_active ?? true,
                        isVerified: user.is_verified ?? user.isVerified ?? false,
                    });
                    setIsEditOpen(true);
                }
                setSelectedRow(null);
            },
        },
        ...(canDeleteUser ? [{
            label: "Delete",
            Icon: <TrashIcon className="w-4 h-4" color="#EF4444" />,
            onClick: () => {
                if (selectedRow !== null) {
                    const user = data[selectedRow];
                    dispatch(
                        showAlert({
                            title: `Delete User?`,
                            description: `Are you sure you want to delete ${user.profile?.first_name || user.firstName || 'this user'}? This action cannot be undone.`,
                            confirmText: "Delete",
                            cancelText: "Cancel",
                            onConfirm: () => {
                                deleteUser(
                                    { userId: user.id },
                                    {
                                        onSuccess: () => {
                                            toast.success('User deleted successfully');
                                            fetchUsers();
                                        },
                                        onError: (err: any) => {
                                            toast.error(err.response?.data?.message || 'Failed to delete user');
                                        }
                                    }
                                );
                            },
                        })
                    );
                }
                setSelectedRow(null);
            },
        }] : [])
    ];

    return (
        <>
            <div className="p-3 sm:p-4 md:p-6 w-full max-w-[1600px] mx-auto">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Header Section */}
                    <div className="p-4 sm:p-5 md:p-6 border-b border-gray-200 bg-gray-50/50">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                            <div>
                                <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900">{title}</h1>
                                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">{description}</p>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button
                                    onClick={() => setIsCreateOpen(true)}
                                    className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs sm:text-sm font-medium rounded-lg flex items-center justify-center gap-1.5"
                                >
                                    <Icon icon="mdi:plus" className="w-4 h-4" />
                                    <span>Create {defaultRole.charAt(0) + defaultRole.slice(1).toLowerCase()}</span>
                                </button>
                                <div className="relative">
                                    <button
                                        onClick={() => setIsOpen(!isOpen)}
                                        className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 flex items-center gap-1.5 text-xs sm:text-sm text-gray-700 font-medium"
                                    >
                                        <Icon icon="mdi:printer" className="w-4 h-4" />
                                        <span className="hidden sm:inline">Export</span>
                                    </button>
                                    {isOpen && (
                                        <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-20 overflow-hidden">
                                            <button onClick={() => handleDownload("CSV")} className="w-full text-left px-3 sm:px-4 py-2.5 text-xs sm:text-sm hover:bg-gray-50 transition-colors border-b border-gray-100">Export as CSV</button>
                                            <button onClick={() => handleDownload("PDF")} className="w-full text-left px-3 sm:px-4 py-2.5 text-xs sm:text-sm hover:bg-gray-50 transition-colors">Export as PDF</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Search and Filter Bar */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                            <div className="flex-1 max-w-full sm:max-w-md relative">
                                <input
                                    type="text"
                                    value={searchValue}
                                    onChange={handleSearchChange}
                                    className="w-full px-3 py-2 pl-9 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs sm:text-sm"
                                    placeholder="Search by name, email or phone..."
                                />
                                <SearchIcon className="absolute top-1/2 -translate-y-1/2 left-3 w-4 sm:w-5" color="#9CA3AF" />
                            </div>
                            <button className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-1.5 text-xs sm:text-sm text-gray-700 font-medium">
                                <FilterIcon className="w-4 h-4" color="#6B7280" />
                                <span>Filter</span>
                            </button>
                            <div className="hidden sm:block ml-auto bg-white px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 shadow-sm">
                                Total Users: <span className="text-primary">{rowCount}</span>
                            </div>
                        </div>
                        <div className="sm:hidden bg-white px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-600">
                            Total {role.charAt(0) + role.slice(1).toLowerCase()}s: <span className="text-primary">{rowCount}</span>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="p-4 sm:p-6 md:p-8 space-y-3">
                                <Skeleton className="h-8 sm:h-10 w-full" />
                                <Skeleton className="h-8 sm:h-10 w-full" />
                                <Skeleton className="h-8 sm:h-10 w-full" />
                            </div>
                        ) : data.length > 0 ? (
                            <table className="w-full text-left border-collapse min-w-[600px] sm:min-w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        <th className="px-6 py-4">Full Name</th>
                                        <th className="px-6 py-4">Email / Phone</th>
                                        {role.includes(',') && <th className="px-6 py-4">Role</th>}
                                        <th className="px-6 py-4 text-center">KYC Status</th>
                                        {/* <th className="px-6 py-4 text-center">Acc. Status</th> */}
                                        <th className="px-6 py-4 text-center">Verified</th>
                                        <th className="px-6 py-4">Date Created</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {data.map((user, index) => (
                                        <tr
                                            key={user.id}
                                            className="hover:bg-gray-50 cursor-pointer transition-colors text-xs sm:text-sm"
                                            onClick={() => router.push(`${basePath}/${user.id}`)}
                                        >
                                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-900">
                                                <div className="flex items-center gap-2 sm:gap-3">
                                                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200 flex-shrink-0">
                                                        {(user?.profile_image || user?.profileImage) ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img src={user?.profile_image || user?.profileImage || ''} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Icon icon="mdi:account" className="w-3 h-3 sm:w-5 sm:h-5 text-gray-400" />
                                                        )}
                                                    </div>
                                                    <span className="font-medium truncate max-w-[80px] sm:max-w-none">
                                                        {`${user.profile?.first_name || user.profile?.firstName || user.first_name || user.firstName || "--"} ${user.profile?.last_name || user.profile?.lastName || user.last_name || user.lastName || "--"}`}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-700">
                                                <div className="flex flex-col">
                                                    <span className="font-medium truncate max-w-[100px] sm:max-w-none">{user.email || "--"}</span>
                                                    <span className="text-[8px] sm:text-xs text-gray-500 truncate max-w-[80px] sm:max-w-none">{user.phone || "--"}</span>
                                                </div>
                                            </td>
                                            {role.includes(',') && (
                                                <td className="px-6 py-4">
                                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase bg-primary/10 text-primary border border-primary/20">
                                                        {(user.role || '').replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                            )}
                                            <td className="px-6 py-4 text-center">
                                                {(() => {
                                                    // The /admin/users list response flattens KYC to a top-level
                                                    // `kycStatus` field. Detail responses nest it under `profile`.
                                                    // Read both — list view reads top-level; component is robust
                                                    // to either shape so future serialization changes don't break it.
                                                    const kyc = (user as any).kycStatus
                                                        || (user as any).kyc_status
                                                        || user.profile?.kycStatus
                                                        || user.profile?.kyc_status
                                                        || 'PENDING';
                                                    const cls = kyc === 'VERIFIED' ? 'bg-green-100 text-green-700'
                                                        : kyc === 'REJECTED' ? 'bg-red-100 text-red-700'
                                                            : 'bg-yellow-100 text-yellow-700';
                                                    return (
                                                        <span className={`px-2 py-1 rounded-full text-[10px] font-semibold uppercase ${cls}`}>
                                                            {kyc}
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                                                <Badge status={user.is_verified ?? user.isVerified ?? false} />
                                            </td>
                                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-700 hidden md:table-cell">
                                                {(user.created_at || user.createdAt) ? new Date(user.created_at || user.createdAt || '').toLocaleDateString() : "--/--"}
                                            </td>
                                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                                                <div className="flex justify-end items-center" onClick={(event) => handleDotsClick(event, index)}>
                                                    <DotsIcon className="w-4 sm:w-5 cursor-pointer hover:text-primary transition-colors text-gray-400" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3 sm:mb-4">
                                    <Icon icon="hugeicons:album-not-found-01" width="24" height="24" className="sm:w-8 sm:h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-1">No users found</h3>
                                <p className="text-sm text-gray-500">Try adjusting your search or create a new user</p>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {!loading && data.length > 0 && (
                        <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-200">
                            <TablePagination
                                total={rowCount}
                                currentPage={page}
                                setPage={setPage}
                                itemsPerPage={pageSize}
                                firstPage={1}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Context Menu */}
            {selectedRow !== null && modalPosition && (
                <div
                    ref={modalRef}
                    className="fixed bg-white shadow-xl rounded-lg z-50 border border-gray-200 overflow-hidden min-w-[100px] sm:min-w-[120px]"
                    style={{ top: modalPosition.top, left: modalPosition.left }}
                >
                    {detailButtons.map((button, idx) => (
                        <button
                            key={idx}
                            className="w-full flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 sm:py-2.5 hover:bg-gray-50 cursor-pointer text-xs sm:text-sm text-gray-700 transition-colors border-b last:border-b-0 border-gray-100"
                            onClick={(e) => {
                                e.stopPropagation();
                                button.onClick();
                            }}
                        >
                            <span className="text-gray-500 text-sm sm:text-base">{button.Icon}</span>
                            <span>{button.label}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Create User Modal */}
            {isCreateOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-3 sm:p-4 backdrop-blur-sm transition-all duration-300" onClick={() => setIsCreateOpen(false)}>
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="bg-gray-50/80 border-b border-gray-100 px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Icon icon="mdi:account-plus" width="18" height="18" className="sm:w-6 sm:h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 tracking-tight">Create New User</h2>
                                        <p className="text-xs sm:text-sm text-gray-500 font-medium">Add a new member to the platform</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-4">
                                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-100 rounded-xl border border-zinc-200">
                                        <span className="text-[10px] sm:text-[11px] font-bold text-zinc-500 uppercase">Quick Onboard</span>
                                        <button
                                            onClick={() => setIsQuickOnboard(!isQuickOnboard)}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${isQuickOnboard ? 'bg-primary' : 'bg-gray-300'}`}
                                        >
                                            <span className={`${isQuickOnboard ? 'translate-x-5' : 'translate-x-1'} inline-block h-3 w-3 transform rounded-full bg-white transition-transform`} />
                                        </button>
                                    </div>
                                    <button onClick={() => setIsCreateOpen(false)} className="p-1.5 sm:p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all duration-200 group">
                                        <Icon icon="mdi:close" width="18" height="18" className="sm:w-5 sm:h-5 text-gray-400 group-hover:text-gray-600" />
                                    </button>
                                </div>
                            </div>
                            {/* Mobile Quick Onboard Toggle */}
                            <div className="sm:hidden flex items-center justify-between mt-3 px-3 py-2 bg-zinc-100 rounded-xl border border-zinc-200">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase">Quick Onboard</span>
                                <button
                                    onClick={() => setIsQuickOnboard(!isQuickOnboard)}
                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${isQuickOnboard ? 'bg-primary' : 'bg-gray-300'}`}
                                >
                                    <span className={`${isQuickOnboard ? 'translate-x-5' : 'translate-x-1'} inline-block h-3 w-3 transform rounded-full bg-white transition-transform`} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">

                                {/* Section: Personal Details */}
                                <div className="md:col-span-2">
                                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                                        <div className="h-3 sm:h-4 w-1 bg-primary rounded-full"></div>
                                        <h3 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-wider">Personal Information</h3>
                                    </div>
                                </div>

                                <div className="space-y-1.5 sm:space-y-2">
                                    <label className="text-xs sm:text-sm font-semibold text-gray-700 ml-1">First Name</label>
                                    <div className="relative group">
                                        <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                                            <Icon icon="mdi:account" width="14" className="sm:w-4 sm:h-4" />
                                        </div>
                                        <input
                                            className="w-full pl-7 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all duration-200"
                                            placeholder="John"
                                            value={createForm.firstName}
                                            onChange={e => setCreateForm({ ...createForm, firstName: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5 sm:space-y-2">
                                    <label className="text-xs sm:text-sm font-semibold text-gray-700 ml-1">Last Name</label>
                                    <div className="relative group">
                                        <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                                            <Icon icon="mdi:account-outline" width="14" className="sm:w-4 sm:h-4" />
                                        </div>
                                        <input
                                            className="w-full pl-7 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all duration-200"
                                            placeholder="Doe"
                                            value={createForm.lastName}
                                            onChange={e => setCreateForm({ ...createForm, lastName: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5 sm:space-y-2">
                                    <label className="text-xs sm:text-sm font-semibold text-gray-700 ml-1">Gender</label>
                                    <div className="relative group">
                                        <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors pointer-events-none">
                                            <Icon icon="mdi:gender-male-female" width="14" className="sm:w-4 sm:h-4" />
                                        </div>
                                        <select
                                            className="w-full pl-7 sm:pl-10 pr-7 sm:pr-10 py-2 sm:py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all duration-200 appearance-none pointer-events-auto"
                                            value={createForm.gender}
                                            onChange={e => setCreateForm({ ...createForm, gender: e.target.value })}
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                        <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                            <Icon icon="mdi:chevron-down" width="14" className="sm:w-4 sm:h-4" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 ml-1">Role</label>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors pointer-events-none">
                                            <Icon icon="mdi:shield-account" width="18" />
                                        </div>
                                        <select
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all duration-200 appearance-none"
                                            value={createForm.role}
                                            onChange={e => setCreateForm({ ...createForm, role: e.target.value })}
                                        >
                                            {assignableRoles.length > 0 ? (
                                                assignableRoles.map((r: string) => (
                                                    <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                                                ))
                                            ) : (
                                                <option value={defaultRole}>{defaultRole.replace(/_/g, ' ')}</option>
                                            )}
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                            <Icon icon="mdi:chevron-down" width="18" />
                                        </div>
                                    </div>
                                </div>

                                <div className="md:col-span-2 space-y-1.5 sm:space-y-2">
                                    <label className="text-xs sm:text-sm font-semibold text-gray-700 ml-1">Email Address</label>
                                    <div className="relative group">
                                        <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                                            <Icon icon="mdi:email-outline" width="14" className="sm:w-4 sm:h-4" />
                                        </div>
                                        <input
                                            className="w-full pl-7 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all duration-200"
                                            placeholder="john@example.com"
                                            type="email"
                                            value={createForm.email}
                                            onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2 space-y-1.5 sm:space-y-2">
                                    <label className="text-xs sm:text-sm font-semibold text-gray-700 ml-1">Phone Number</label>
                                    <div className="relative group">
                                        <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                                            <Icon icon="mdi:phone-outline" width="14" className="sm:w-4 sm:h-4" />
                                        </div>
                                        <input
                                            className="w-full pl-7 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all duration-200"
                                            placeholder="+234 800 000 0000"
                                            value={createForm.phone}
                                            onChange={e => setCreateForm({ ...createForm, phone: e.target.value })}
                                        />
                                    </div>
                                    <p className="text-[8px] sm:text-[10px] text-gray-400 ml-1 italic">Format: +234XXXXXXXXXX or 080XXXXXXXX</p>
                                </div>

                                {!isQuickOnboard && (
                                    <div className="md:col-span-2 space-y-1.5 sm:space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className="text-xs sm:text-sm font-semibold text-gray-700 ml-1">Password</label>
                                        <div className="relative group">
                                            <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                                                <Icon icon="mdi:lock-outline" width="14" className="sm:w-4 sm:h-4" />
                                            </div>
                                            <input
                                                className="w-full pl-7 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg sm:rounded-xl focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all duration-200"
                                                placeholder="••••••••"
                                                type="password"
                                                value={createForm.password}
                                                onChange={e => setCreateForm({ ...createForm, password: e.target.value.replace(/\s/g, '') })}
                                            />
                                        </div>

                                        <div className="p-3 sm:p-4 bg-gray-50/50 rounded-lg sm:rounded-xl border border-gray-100 mt-2">
                                            <p className="text-[9px] sm:text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-tight">Security Strength:</p>
                                            <div className="grid grid-cols-2 gap-2 sm:gap-4">
                                                <p className={`text-[8px] sm:text-[10px] flex items-center gap-1 sm:gap-1.5 font-medium ${createForm.password.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}>
                                                    <Icon icon={createForm.password.length >= 8 ? "mdi:check-circle" : "mdi:circle-outline"} width="10" className="sm:w-3 sm:h-3" /> 8+ Characters
                                                </p>
                                                <p className={`text-[8px] sm:text-[10px] flex items-center gap-1 sm:gap-1.5 font-medium ${/[A-Z]/.test(createForm.password) ? 'text-green-600' : 'text-gray-400'}`}>
                                                    <Icon icon={/[A-Z]/.test(createForm.password) ? "mdi:check-circle" : "mdi:circle-outline"} width="10" className="sm:w-3 sm:h-3" /> Uppercase
                                                </p>
                                                <p className={`text-[8px] sm:text-[10px] flex items-center gap-1 sm:gap-1.5 font-medium ${/[a-z]/.test(createForm.password) ? 'text-green-600' : 'text-gray-400'}`}>
                                                    <Icon icon={/[a-z]/.test(createForm.password) ? "mdi:check-circle" : "mdi:circle-outline"} width="10" className="sm:w-3 sm:h-3" /> Lowercase
                                                </p>
                                                <p className={`text-[8px] sm:text-[10px] flex items-center gap-1 sm:gap-1.5 font-medium ${/\d/.test(createForm.password) ? 'text-green-600' : 'text-gray-400'}`}>
                                                    <Icon icon={/\d/.test(createForm.password) ? "mdi:check-circle" : "mdi:circle-outline"} width="10" className="sm:w-3 sm:h-3" /> Digit
                                                </p>
                                                <p className={`text-[8px] sm:text-[10px] flex items-center gap-1 sm:gap-1.5 font-medium col-span-2 ${/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(createForm.password) ? 'text-green-600' : 'text-gray-400'}`}>
                                                    <Icon icon={/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(createForm.password) ? "mdi:check-circle" : "mdi:circle-outline"} width="10" className="sm:w-3 sm:h-3" /> Special Character
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Section: Account Settings */}
                                <div className="md:col-span-2 mt-2 sm:mt-4">
                                    <div className="flex items-center gap-2 mb-3 sm:mb-4">
                                        <div className="h-3 sm:h-4 w-1 bg-primary rounded-full"></div>
                                        <h3 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-wider">Account Settings</h3>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <div className="p-3 sm:p-4 bg-gray-50 rounded-xl sm:rounded-2xl border border-gray-100 flex items-center justify-between group hover:border-primary/20 transition-all duration-200">
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white flex items-center justify-center shadow-sm">
                                                    <Icon icon="mdi:account-check-outline" width="16" className="sm:w-5 sm:h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs sm:text-sm font-bold text-gray-900">Active Account</p>
                                                    <p className="text-[8px] sm:text-xs text-gray-500 font-medium">Allow user to login</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setCreateForm({ ...createForm, is_active: !createForm.is_active })}
                                                className={`relative inline-flex h-5 sm:h-6 w-9 sm:w-11 items-center rounded-full transition-colors focus:outline-none ${createForm.is_active ? 'bg-primary' : 'bg-gray-200'}`}
                                            >
                                                <span className={`${createForm.is_active ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'} inline-block h-3 sm:h-4 w-3 sm:w-4 transform rounded-full bg-white transition-transform`} />
                                            </button>
                                        </div>

                                        <div className="p-3 sm:p-4 bg-gray-50 rounded-xl sm:rounded-2xl border border-gray-100 flex items-center justify-between group hover:border-primary/20 transition-all duration-200">
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white flex items-center justify-center shadow-sm">
                                                    <Icon icon="mdi:verified-badge-outline" width="16" className="sm:w-5 sm:h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-xs sm:text-sm font-bold text-gray-900">Verified Member</p>
                                                    <p className="text-[8px] sm:text-xs text-gray-500 font-medium">Mark as trusted</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setCreateForm({ ...createForm, isVerified: !createForm.isVerified })}
                                                className={`relative inline-flex h-5 sm:h-6 w-9 sm:w-11 items-center rounded-full transition-colors focus:outline-none ${createForm.isVerified ? 'bg-primary' : 'bg-gray-200'}`}
                                            >
                                                <span className={`${createForm.isVerified ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'} inline-block h-3 sm:h-4 w-3 sm:w-4 transform rounded-full bg-white transition-transform`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 border-t border-gray-100 px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-5 flex justify-end gap-2 sm:gap-4 items-center">
                            <button
                                onClick={() => setIsCreateOpen(false)}
                                className="px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    const action = isQuickOnboard ? onboardUser : createUser;
                                    action({
                                        payload: {
                                            ...createForm,
                                            gender: createForm.gender ? createForm.gender.toUpperCase() : undefined,
                                            password: isQuickOnboard ? undefined : createForm.password
                                        }
                                    }, {
                                        onSuccess: () => {
                                            toast.success(isQuickOnboard ? 'User onboarded successfully' : 'User created successfully');
                                            setIsCreateOpen(false);
                                            fetchUsers();
                                        },
                                        onError: (err: any) => {
                                            const detail = err?.response?.data?.detail;
                                            if (Array.isArray(detail)) {
                                                detail.forEach((error: any) => {
                                                    const field = error.loc[error.loc.length - 1];
                                                    toast.error(`${field}: ${error.msg}`);
                                                });
                                            } else {
                                                toast.error(detail || err?.response?.data?.message || 'Failed to create user');
                                            }
                                        }
                                    });
                                }}
                                disabled={creating || onboarding}
                                className="px-5 sm:px-8 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white bg-primary rounded-lg sm:rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20 flex items-center gap-1.5 sm:gap-2"
                            >
                                {creating || onboarding ? (
                                    <>
                                        <Icon icon="mdi:loading" className="animate-spin w-3 h-3 sm:w-4 sm:h-4" />
                                        <span className="text-xs sm:text-sm">{isQuickOnboard ? 'Onboarding...' : 'Creating...'}</span>
                                    </>
                                ) : (
                                    <>
                                        <Icon icon={isQuickOnboard ? "mdi:email-fast-outline" : "mdi:account-plus"} className="w-3 h-3 sm:w-4 sm:h-4" />
                                        <span className="text-xs sm:text-sm">{isQuickOnboard ? 'Quick Onboard' : 'Create Account'}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {isEditOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-3 sm:p-4 backdrop-blur-sm transition-all duration-300" onClick={() => setIsEditOpen(false)}>
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="bg-gray-50/80 border-b border-gray-100 px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Icon icon="mdi:account-edit" width="18" height="18" className="sm:w-6 sm:h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 tracking-tight">Edit User Account</h2>
                                        <p className="text-xs sm:text-sm text-gray-500 font-medium">Update account information and permissions</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsEditOpen(false)} className="p-1.5 sm:p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all duration-200 group">
                                    <Icon icon="mdi:close" width="18" height="18" className="sm:w-5 sm:h-5 text-gray-400 group-hover:text-gray-600" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 custom-scrollbar">
                            <UserEditForm
                                initialData={editForm}
                                isSaving={updating}
                                onCancel={() => setIsEditOpen(false)}
                                onSave={(formData) => {
                                    if (!editUserId) { toast.error('Missing user id'); return; }
                                    updateUser({
                                        userId: editUserId,
                                        payload: {
                                            email: formData.email,
                                            phone: formData.phone,
                                            role: formData.role,
                                            is_active: formData.is_active,
                                            isVerified: formData.isVerified,
                                            profile: {
                                                first_name: formData.firstName,
                                                last_name: formData.lastName,
                                                gender: formData.gender ? formData.gender.toUpperCase() : undefined,
                                                bio: formData.bio,
                                            }
                                        }
                                    }, {
                                        onSuccess: () => {
                                            toast.success('User updated successfully');
                                            setIsEditOpen(false);
                                            fetchUsers();
                                        },
                                        onError: (err: any) => {
                                            const detail = err?.response?.data?.detail;
                                            if (Array.isArray(detail)) {
                                                detail.forEach((error: any) => {
                                                    const field = error.loc[error.loc.length - 1];
                                                    toast.error(`${field}: ${error.msg}`);
                                                });
                                            } else {
                                                toast.error(detail || err?.response?.data?.message || 'Failed to update user');
                                            }
                                        }
                                    });
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default UserManagementView;

"use client"

import UserEditForm from "./UserEditForm";

import { Skeleton } from "@/src/components/ui/skeleton";
import { useState, useEffect, useCallback, useRef } from "react";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import axiosRequest from "@/src/lib/api";
import Badge from "@/src/components/badge";
import { Icon } from "@iconify/react";
import { CreateUser, OnboardUser, DeleteUser, UpdateUser } from "@/src/lib/request-handlers/userMgt";
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
    isActive?: boolean;
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
    role: 'GUEST' | 'OWNER' | 'AGENT' | 'ADMIN' | 'SUPER_ADMIN';
    title: string;
    description: string;
    basePath: string; // e.g., "/user-management/guests"
}

const UserManagementView = ({ role, title, description, basePath }: UserManagementViewProps) => {
    const router = useRouter();
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

    const [selectedRow, setSelectedRow] = useState<number | null>(null);
    const [modalPosition, setModalPosition] = useState<{ top: number; left: number } | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const [isQuickOnboard, setIsQuickOnboard] = useState(false);

    // Create form state
    const [createForm, setCreateForm] = useState({
        email: '',
        phone: '',
        password: '',
        firstName: '',
        lastName: '',
        gender: '',
        role: role,
        bio: '',
        isActive: true,
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
        isActive: true,
        isVerified: false,
    });

    const dispatch = useDispatch();
    const { mutate: createUser, isPending: creating } = CreateUser();
    const { mutate: onboardUser, isPending: onboarding } = OnboardUser();
    const { mutate: updateUser, isPending: updating } = UpdateUser();
    const { mutate: deleteUser, isPending: deleting } = DeleteUser();

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
            user.isActive ? "Active" : "Inactive",
            user.createdAt
        ].map(value => `"${value}"`).join(","));
        const csvString = [headers.join(","), ...csvContent].join("\n");
        const blob = new Blob([csvString], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${role.toLowerCase()}_info.csv`;
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
            (user.isActive) ? "Active" : "Inactive",
            (user.createdAt) ? new Date(user.createdAt || '').toLocaleDateString() : "--/--"
        ]);
        autoTable(doc, {
            head: [headers],
            body: rows,
            styles: { fontSize: 10, cellPadding: 3 },
            theme: "grid",
        });
        doc.save(`${role.toLowerCase()}_info.pdf`);
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
            toast.error(err.response?.data?.message || `Failed to fetch ${role.toLowerCase()}s`);
        } finally {
            setLoading(false);
        }
    }, [page, searchValue, role]);

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
                        isActive: user.is_active ?? user.isActive ?? true,
                        isVerified: user.is_verified ?? user.isVerified ?? false,
                    });
                    setIsEditOpen(true);
                }
                setSelectedRow(null);
            },
        },
        {
            label: "Delete",
            Icon: <TrashIcon className="w-4 h-4" color="#EF4444" />,
            onClick: () => {
                if (selectedRow !== null) {
                    const user = data[selectedRow];
                    dispatch(
                        showAlert({
                            title: `Delete ${role.charAt(0) + role.slice(1).toLowerCase()}?`,
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
        }
    ];

    return (
        <>
            <div className="p-6">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-200 bg-gray-50/50">
                        <div className="flex justify-between items-center gap-4 flex-wrap mb-6">
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
                                <p className="text-sm text-gray-500 mt-1">{description}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setIsCreateOpen(true)}
                                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg flex items-center gap-2"
                                >
                                    <Icon icon="mdi:plus" className="w-4 h-4" />
                                    <span>Create {role.charAt(0) + role.slice(1).toLowerCase()}</span>
                                </button>
                                <div className="relative">
                                    <button
                                        onClick={() => setIsOpen(!isOpen)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700 font-medium"
                                    >
                                        <Icon icon="mdi:printer" className="w-4 h-4" />
                                        <span>Export</span>
                                    </button>
                                    {isOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-20 overflow-hidden">
                                            <button onClick={() => handleDownload("CSV")} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors border-b border-gray-100">Export as CSV</button>
                                            <button onClick={() => handleDownload("PDF")} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors">Export as PDF</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex-1 max-w-md relative">
                                <input
                                    type="text"
                                    value={searchValue}
                                    onChange={handleSearchChange}
                                    className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                                    placeholder="Search by name, email or phone..."
                                />
                                <SearchIcon className="absolute top-[50%] -translate-y-1/2 left-3 w-5" color="#9CA3AF" />
                            </div>
                            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700 font-medium">
                                <FilterIcon className="w-4 h-4" color="#6B7280" />
                                <span>Filter</span>
                            </button>
                            <div className="ml-auto bg-white px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 shadow-sm">
                                Total {role.charAt(0) + role.slice(1).toLowerCase()}s: <span className="text-primary">{rowCount}</span>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="p-8 space-y-4">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ) : data.length > 0 ? (
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        <th className="px-6 py-4">Full Name</th>
                                        <th className="px-6 py-4">Email / Phone</th>
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
                                            className="hover:bg-gray-50 cursor-pointer transition-colors"
                                            onClick={() => router.push(`${basePath}/${user.id}`)}
                                        >
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                                                        {(user?.profile_image || user?.profileImage) ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img src={user?.profile_image || user?.profileImage || ''} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Icon icon="mdi:account" className="w-5 h-5 text-gray-400" />
                                                        )}
                                                    </div>
                                                    <span>{`${user.profile?.first_name || user.profile?.firstName || user.first_name || user.firstName || "--"} ${user.profile?.last_name || user.profile?.lastName || user.last_name || user.lastName || "--"}`}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{user.email || "--"}</span>
                                                    <span className="text-xs text-gray-500">{user.phone || "--"}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-semibold uppercase ${(user.profile?.kyc_status || user.profile?.kycStatus) === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                                                    (user.profile?.kyc_status || user.profile?.kycStatus) === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {user.profile?.kyc_status || user.profile?.kycStatus || 'PENDING'}
                                                </span>
                                            </td>
                                            {/* <td className="px-6 py-4 text-center text-sm">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-semibold uppercase ${(user.is_active ?? user.isActive) ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {(user.is_active ?? user.isActive) ? 'Active' : 'Inactive'}
                                                </span>
                                            </td> */}
                                            <td className="px-6 py-4 text-center">
                                                <Badge status={user.is_verified ?? user.isVerified ?? false} />
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {(user.created_at || user.createdAt) ? new Date(user.created_at || user.createdAt || '').toLocaleDateString() : "--/--"}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end items-center" onClick={(event) => handleDotsClick(event, index)}>
                                                    <DotsIcon className="w-5 cursor-pointer hover:text-primary transition-colors text-gray-400" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12">
                                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                    <Icon icon="hugeicons:album-not-found-01" width="32" height="32" className="text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-1">No {role.toLowerCase()}s found</h3>
                                <p className="text-sm text-gray-500">Try adjusting your search or create a new {role.toLowerCase()}</p>
                            </div>
                        )}
                    </div>

                    {!loading && data.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-200">
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
                    className="fixed bg-white shadow-xl rounded-lg z-50 border border-gray-200 overflow-hidden min-w-[120px]"
                    style={{ top: modalPosition.top, left: modalPosition.left }}
                >
                    {detailButtons.map((button, idx) => (
                        <button
                            key={idx}
                            className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 transition-colors border-b last:border-b-0 border-gray-100"
                            onClick={(e) => {
                                e.stopPropagation();
                                button.onClick();
                            }}
                        >
                            <span className="text-gray-500">{button.Icon}</span>
                            <span>{button.label}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Create User Modal */}
            {isCreateOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm transition-all duration-300" onClick={() => setIsCreateOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="bg-gray-50/80 border-b border-gray-100 px-8 py-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Icon icon="mdi:account-plus" width="24" height="24" className="text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Create New User</h2>
                                        <p className="text-sm text-gray-500 font-medium">Add a new member to the platform</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 rounded-xl border border-zinc-200">
                                        <span className="text-[11px] font-bold text-zinc-500 uppercase">Quick Onboard</span>
                                        <button
                                            onClick={() => setIsQuickOnboard(!isQuickOnboard)}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${isQuickOnboard ? 'bg-primary' : 'bg-gray-300'}`}
                                        >
                                            <span className={`${isQuickOnboard ? 'translate-x-5' : 'translate-x-1'} inline-block h-3 w-3 transform rounded-full bg-white transition-transform`} />
                                        </button>
                                    </div>
                                    <button onClick={() => setIsCreateOpen(false)} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all duration-200 group">
                                        <Icon icon="mdi:close" width="22" height="22" className="text-gray-400 group-hover:text-gray-600" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">

                                {/* Section: Personal Details */}
                                <div className="md:col-span-2">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="h-4 w-1 bg-primary rounded-full"></div>
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Personal Information</h3>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 ml-1">First Name</label>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                                            <Icon icon="mdi:account" width="18" />
                                        </div>
                                        <input
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all duration-200"
                                            placeholder="John"
                                            value={createForm.firstName}
                                            onChange={e => setCreateForm({ ...createForm, firstName: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 ml-1">Last Name</label>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                                            <Icon icon="mdi:account-outline" width="18" />
                                        </div>
                                        <input
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all duration-200"
                                            placeholder="Doe"
                                            value={createForm.lastName}
                                            onChange={e => setCreateForm({ ...createForm, lastName: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 ml-1">Gender</label>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors pointer-events-none">
                                            <Icon icon="mdi:gender-male-female" width="18" />
                                        </div>
                                        <select
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all duration-200 appearance-none pointer-events-auto"
                                            value={createForm.gender}
                                            onChange={e => setCreateForm({ ...createForm, gender: e.target.value })}
                                        >
                                            <option value="">Select Gender</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                            <Icon icon="mdi:chevron-down" width="18" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 ml-1">Default Role</label>
                                    <div className="relative group opacity-80">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                                            <Icon icon="mdi:shield-account" width="18" />
                                        </div>
                                        <input
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl outline-none cursor-not-allowed"
                                            value={role}
                                            disabled
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 ml-1">Email Address</label>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                                            <Icon icon="mdi:email-outline" width="18" />
                                        </div>
                                        <input
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all duration-200"
                                            placeholder="john@example.com"
                                            type="email"
                                            value={createForm.email}
                                            onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 ml-1">Phone Number</label>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                                            <Icon icon="mdi:phone-outline" width="18" />
                                        </div>
                                        <input
                                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all duration-200"
                                            placeholder="+234 800 000 0000"
                                            value={createForm.phone}
                                            onChange={e => setCreateForm({ ...createForm, phone: e.target.value })}
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-400 ml-1 italic">Format: +234XXXXXXXXXX or 080XXXXXXXX</p>
                                </div>

                                {!isQuickOnboard && (
                                    <div className="md:col-span-2 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className="text-sm font-semibold text-gray-700 ml-1">Password</label>
                                        <div className="relative group">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                                                <Icon icon="mdi:lock-outline" width="18" />
                                            </div>
                                            <input
                                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all duration-200"
                                                placeholder="••••••••"
                                                type="password"
                                                value={createForm.password}
                                                onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                                            />
                                        </div>

                                        <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-100 mt-2">
                                            <p className="text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-tight">Security Strength:</p>
                                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
                                                <p className={`text-[10px] flex items-center gap-1.5 font-medium ${createForm.password.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}>
                                                    <Icon icon={createForm.password.length >= 8 ? "mdi:check-circle" : "mdi:circle-outline"} width="14" /> 8+ Characters
                                                </p>
                                                <p className={`text-[10px] flex items-center gap-1.5 font-medium ${/[A-Z]/.test(createForm.password) ? 'text-green-600' : 'text-gray-400'}`}>
                                                    <Icon icon={/[A-Z]/.test(createForm.password) ? "mdi:check-circle" : "mdi:circle-outline"} width="14" /> One Uppercase
                                                </p>
                                                <p className={`text-[10px] flex items-center gap-1.5 font-medium ${/[a-z]/.test(createForm.password) ? 'text-green-600' : 'text-gray-400'}`}>
                                                    <Icon icon={/[a-z]/.test(createForm.password) ? "mdi:check-circle" : "mdi:circle-outline"} width="14" /> One Lowercase
                                                </p>
                                                <p className={`text-[10px] flex items-center gap-1.5 font-medium ${/\d/.test(createForm.password) ? 'text-green-600' : 'text-gray-400'}`}>
                                                    <Icon icon={/\d/.test(createForm.password) ? "mdi:check-circle" : "mdi:circle-outline"} width="14" /> One Digit
                                                </p>
                                                <p className={`text-[10px] flex items-center gap-1.5 font-medium ${/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(createForm.password) ? 'text-green-600' : 'text-gray-400'}`}>
                                                    <Icon icon={/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(createForm.password) ? "mdi:check-circle" : "mdi:circle-outline"} width="14" /> Special Char
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Section: Account Settings */}
                                <div className="md:col-span-2 mt-4">
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="h-4 w-1 bg-primary rounded-full"></div>
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Account Settings</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between group hover:border-primary/20 transition-all duration-200">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                                    <Icon icon="mdi:account-check-outline" width="20" className={createForm.isActive ? "text-green-500" : "text-gray-400"} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">Active Account</p>
                                                    <p className="text-xs text-gray-500 font-medium">Allow user to login</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setCreateForm({ ...createForm, isActive: !createForm.isActive })}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${createForm.isActive ? 'bg-primary' : 'bg-gray-200'}`}
                                            >
                                                <span className={`${createForm.isActive ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                                            </button>
                                        </div>

                                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between group hover:border-primary/20 transition-all duration-200">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                                                    <Icon icon="mdi:verified-badge-outline" width="20" className={createForm.isVerified ? "text-blue-500" : "text-gray-400"} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">Verified Member</p>
                                                    <p className="text-xs text-gray-500 font-medium">Mark as trusted</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setCreateForm({ ...createForm, isVerified: !createForm.isVerified })}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${createForm.isVerified ? 'bg-primary' : 'bg-gray-200'}`}
                                            >
                                                <span className={`${createForm.isVerified ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 border-t border-gray-100 px-8 py-5 flex justify-end gap-4 items-center">
                            <button
                                onClick={() => setIsCreateOpen(false)}
                                className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
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
                                className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                            >
                                {creating || onboarding ? (
                                    <>
                                        <Icon icon="mdi:loading" className="animate-spin" />
                                        {isQuickOnboard ? 'Onboarding...' : 'Creating...'}
                                    </>
                                ) : (
                                    <>
                                        <Icon icon={isQuickOnboard ? "mdi:email-fast-outline" : "mdi:account-plus"} />
                                        {isQuickOnboard ? 'Quick Onboard' : 'Create Account'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {isEditOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm transition-all duration-300" onClick={() => setIsEditOpen(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="bg-gray-50/80 border-b border-gray-100 px-8 py-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Icon icon="mdi:account-edit" width="24" height="24" className="text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Edit User Account</h2>
                                        <p className="text-sm text-gray-500 font-medium">Update account information and permissions</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsEditOpen(false)} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all duration-200 group">
                                    <Icon icon="mdi:close" width="22" height="22" className="text-gray-400 group-hover:text-gray-600" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
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
                                            isActive: formData.isActive,
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

"use client"

import { Skeleton } from "@/src/components/ui/skeleton";
import { useState, useEffect, useCallback, useRef } from "react";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import axiosRequest from "@/src/lib/api";
import Badge from "@/src/components/badge";
import { Icon } from "@iconify/react";
import { CreateUser, DeleteUser, UpdateUser } from "@/src/lib/request-handlers/userMgt";
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

    // Create form state
    const [createForm, setCreateForm] = useState<any>({
        role: role,
        email: '',
        phone: '',
        password: '',
        firstName: '',
        lastName: '',
        gender: '',
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
        is_active: true,
        is_verified: false,
    });

    const dispatch = useDispatch();
    const { mutate: createUser, isPending: creating } = CreateUser();
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
                        gender: user.profile?.gender || '',
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
                                        <th className="px-6 py-4 text-center">Acc. Status</th>
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
                                            <td className="px-6 py-4 text-center text-sm">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-semibold uppercase ${(user.is_active ?? user.isActive) ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {(user.is_active ?? user.isActive) ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm" onClick={() => setIsCreateOpen(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-gray-900">Create {role.charAt(0) + role.slice(1).toLowerCase()}</h2>
                                <button onClick={() => setIsCreateOpen(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                                    <Icon icon="mdi:close" width="24" height="24" className="text-gray-500" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                                    <input
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        placeholder="John"
                                        value={createForm.firstName}
                                        onChange={e => setCreateForm({ ...createForm, firstName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                                    <input
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        placeholder="Doe"
                                        value={createForm.lastName}
                                        onChange={e => setCreateForm({ ...createForm, lastName: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="block text-sm font-medium text-gray-700">Email Address</label>
                                    <input
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        placeholder="john@example.com"
                                        type="email"
                                        value={createForm.email}
                                        onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                                    <input
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        placeholder="+234 800 000 0000"
                                        value={createForm.phone}
                                        onChange={e => setCreateForm({ ...createForm, phone: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="block text-sm font-medium text-gray-700">Password</label>
                                    <input
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        placeholder="••••••••"
                                        type="password"
                                        value={createForm.password}
                                        onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-gray-700">Gender</label>
                                    <select
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white"
                                        value={createForm.gender}
                                        onChange={e => setCreateForm({ ...createForm, gender: e.target.value })}
                                    >
                                        <option value="">Select gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="flex flex-col justify-center space-y-3 pt-2">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={createForm.is_active}
                                            onChange={e => setCreateForm({ ...createForm, is_active: e.target.checked })}
                                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                        />
                                        <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">Active account</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={createForm.is_verified}
                                            onChange={e => setCreateForm({ ...createForm, is_verified: e.target.checked })}
                                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                        />
                                        <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">Mark as Verified</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 z-10">
                            <button
                                onClick={() => setIsCreateOpen(false)}
                                className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    createUser({ payload: createForm }, {
                                        onSuccess: () => { toast.success('User created successfully'); setIsCreateOpen(false); fetchUsers(); },
                                        onError: (e: any) => {
                                            const detail = e?.response?.data?.detail;
                                            const msg = Array.isArray(detail) ? detail.map((d: any) => d?.msg).join('; ') : (detail || e?.response?.data?.message || 'Failed');
                                            toast.error(msg);
                                        }
                                    });
                                }}
                                disabled={creating}
                                className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                {creating ? 'Creating...' : `Create ${role.charAt(0) + role.slice(1).toLowerCase()}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {isEditOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm" onClick={() => setIsEditOpen(false)}>
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-gray-900">Edit {role.charAt(0) + role.slice(1).toLowerCase()}</h2>
                                <button onClick={() => setIsEditOpen(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                                    <Icon icon="mdi:close" width="24" height="24" className="text-gray-500" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                                    <input
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        placeholder="John"
                                        value={editForm.firstName}
                                        onChange={e => setEditForm({ ...editForm, firstName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                                    <input
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        placeholder="Doe"
                                        value={editForm.lastName}
                                        onChange={e => setEditForm({ ...editForm, lastName: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="block text-sm font-medium text-gray-700">Email Address</label>
                                    <input
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        placeholder="john@example.com"
                                        type="email"
                                        value={editForm.email}
                                        onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                                    <input
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        placeholder="+234 800 000 0000"
                                        value={editForm.phone}
                                        onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-gray-700">Gender</label>
                                    <select
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all bg-white"
                                        value={editForm.gender}
                                        onChange={e => setEditForm({ ...editForm, gender: e.target.value })}
                                    >
                                        <option value="">Select gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="flex flex-col justify-center space-y-3 pt-2">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={editForm.is_active}
                                            onChange={e => setEditForm({ ...editForm, is_active: e.target.checked })}
                                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                        />
                                        <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">Active account</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={editForm.is_verified}
                                            onChange={e => setEditForm({ ...editForm, is_verified: e.target.checked })}
                                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                        />
                                        <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">Verified</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3 z-10">
                            <button
                                onClick={() => setIsEditOpen(false)}
                                className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (!editUserId) { toast.error('Missing user id'); return; }
                                    updateUser({
                                        userId: editUserId,
                                        payload: {
                                            email: editForm.email,
                                            phone: editForm.phone,
                                            is_verified: editForm.is_verified,
                                            profile: {
                                                first_name: editForm.firstName,
                                                last_name: editForm.lastName,
                                                gender: editForm.gender ? editForm.gender.toUpperCase() : undefined,
                                            }
                                        }
                                    }, {
                                        onSuccess: () => { toast.success('User updated successfully'); setIsEditOpen(false); fetchUsers(); },
                                        onError: (e: any) => {
                                            const detail = e?.response?.data?.detail;
                                            const msg = Array.isArray(detail) ? detail.map((d: any) => d?.msg).join('; ') : (detail || e?.response?.data?.message || 'Failed');
                                            toast.error(msg);
                                        }
                                    });
                                }}
                                disabled={updating}
                                className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                            >
                                {updating ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default UserManagementView;

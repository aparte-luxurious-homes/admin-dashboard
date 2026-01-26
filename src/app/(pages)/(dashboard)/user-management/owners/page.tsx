"use client"

import { Skeleton } from "@/src/components/ui/skeleton";
import { TableSearch } from "@/src/components/table/tableAction";
import Table from "@/src/components/table/table";
import { useState, useEffect } from "react";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import axiosRequest from "@/src/lib/api";
import Badge from "@/src/components/badge";
import { Icon } from "@iconify/react";
import { GridColDef } from "@mui/x-data-grid";
import Button from "@/src/components/button";
import Link from "next/link";
import jsPDF from "jspdf";
import "jspdf-autotable"; import autoTable from "jspdf-autotable";
import ItemCount from "@/src/components/item-count/itemcount";
import { CreateUser, UpdateUser } from "@/src/lib/request-handlers/userMgt";
import { toast } from "react-hot-toast";

interface UserProfile {
  address: string | null;
  averageRating: string;
  bio: string | null;
  bvn: string | null;
  city: string | null;
  country: string | null;
  createdAt: string;
  dob: string | null;
  firstName: string | null;
  gender: string | null;
  id: number;
  kycStatus: string;
  lastName: string | null;
  nin: string | null;
  profileImage: string | null;
  state: string | null;
  updatedAt: string;
  userId: number;
}

interface User {
  createdAt: string;
  email: string;
  id: number;
  isActive: boolean;
  isVerified: boolean;
  lastLogin: string | null;
  phone: string | null;
  profile: UserProfile;
  role: string;
  updatedAt: string;
  verificationToken: string | null;
}

const Owner = () => {
  const [searchResult, setSearchResult] = useState<User[]>([]);
  const [ownerInfo, setOwnerInfo] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [searchValue, setSearchValue] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);

  // Create form state
  const [createForm, setCreateForm] = useState<any>({
    role: 'OWNER',
    email: '',
    phone: '',
    password: '',
    first_name: '',
    last_name: '',
    gender: '',
    is_active: true,
    is_verified: false,
  });

  // Edit form state
  const [editForm, setEditForm] = useState<any>({
    email: '',
    phone: '',
    first_name: '',
    last_name: '',
    gender: '',
    is_active: true,
    is_verified: false,
  });

  const { mutate: createUser, isPending: creating } = CreateUser();
  const { mutate: updateUser, isPending: updating } = UpdateUser();

  const handleDownload = (type: "CSV" | "PDF") => {
    console.log(`Downloading ${type}...`);

    if (type === "CSV") {
      downloadCSV(ownerInfo);
    } else if (type === "PDF") {
      downloadPDF(ownerInfo);
    }

    setIsOpen(false);
  };

  const downloadCSV = (data: User[]) => {
    if (!data.length) return;

    // Extract headers dynamically
    const headers = Object.keys(data[0]).join(",");

    // Convert array of objects to CSV format
    const csvContent = data.map(row =>
      Object.values(row).map(value => `"${value}"`).join(",")
    );

    // Combine headers and rows
    const csvString = [headers, ...csvContent].join("\n");

    // Create a Blob and trigger download
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "owner_info.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download PDF(Error in creation format)
  const downloadPDF = (data: User[]) => {
    if (!data.length) return;

    const doc = new jsPDF();
    doc.text("Owner Information", 10, 10);

    // Defind table headers
    const headers = ["ID", "First Name", "Last Name", "KYC Status", "Email", "Created At"];

    // Format data properly
    const rows = data.map(user => [
      user.id || "--/--",
      user?.profile?.firstName || "--/--",
      user?.profile?.lastName || "--/--",
      user?.profile?.kycStatus || "--/--",
      user.email || "--/--",
      user.createdAt ? new Date(user.createdAt).toLocaleString() : "--/--"
    ]);

    // Generate table
    autoTable(doc, {
      head: [headers],
      body: rows,
      styles: { fontSize: 10, cellPadding: 3 },
      theme: "grid",
    });

    doc.save("owner_info.pdf");
  };


  const anOwnerColumn: GridColDef[] = [
    {
      field: "name",
      headerName: "Full Name",
      width: 250,
      renderCell: (params) => {
        const p = params?.row?.profile ?? {} as any;
        const first = (p.first_name ?? p.firstName) || "--/--";
        const last = (p.last_name ?? p.lastName) || "--/--";
        return `${first} ${last}`;
      },
    },
    {
      field: "email",
      headerName: "Email",
      width: 200,
      renderCell: (params) => params?.row?.email || "--/--",
    },
    {
      field: "phone",
      headerName: "Phone Number",
      width: 130,
      renderCell: (params) => params?.row?.phone || "--/--",
    },
    {
      field: "isVerified",
      headerName: "Verification Status",
      width: 150,
      renderCell: (params) => {
        return <Badge status={params?.value} />;
      },
    },
    {
      field: "gender",
      headerName: "Gender",
      width: 100,
      renderCell: (params) => (params?.row?.profile?.gender ?? params?.row?.profile?.gender)?.toString() || "--/--",
    },
    {
      field: "createdAt",
      headerName: "Date Created",
      width: 150,
      renderCell: (params) => (params?.row?.created_at ?? params?.row?.createdAt)?.toString()?.substring(0, 10) || "--/--",
    },
    {
      field: "isActive",
      headerName: "Account Status",
      width: 150,
      renderCell: (params) => {
        return <Badge status={params?.value} />;
      },
    },
    {
      field: "actions",
      headerName: "",
      width: 30,
      sortable: false,
      align: "center",
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <Link href={`/user-management/owners/${params.row.id}`}>
            <Icon icon="mdi:eye" className="cursor-pointer text-[#514A4A]" />
          </Link>
          <button
            onClick={() => {
              const p = (params?.row?.profile ?? {}) as any;
              setEditUserId(params?.row?.id);
              setEditForm({
                email: params?.row?.email ?? '',
                phone: params?.row?.phone ?? '',
                first_name: p.first_name ?? p.firstName ?? '',
                last_name: p.last_name ?? p.lastName ?? '',
                gender: p.gender ?? '',
                is_active: params?.row?.isActive ?? true,
                is_verified: params?.row?.isVerified ?? false,
              });
              setIsEditOpen(true);
            }}
            className=""
            aria-label="Edit user"
          >
            <Icon icon="mdi:pencil" className="cursor-pointer text-[#514A4A]" />
          </button>
        </div>
      ),
    },
  ];

  const fetchownerInfo = async () => {
    setLoading(true);
    try {
      const response = await axiosRequest.get(
        `${API_ROUTES?.admin?.users?.base}`
      );
      const rows = response?.data?.data?.items ?? response?.data?.data?.data ?? response?.data?.data ?? [];
      const ownerData = rows?.filter((user: User) => user?.role === "OWNER") || [];

      setOwnerInfo(ownerData);
      setSearchResult(ownerData);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchownerInfo();
  }, []);

  console.log("loading", loading);
  console.log("searchResult", searchResult);
  // --| Filter Property table using name, state and and all
  const handleSearchProperty = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setSearchValue(value);

    const valArray = value.split(" ");
    // --| Filter data by partial match onchange in the search input box
    const result = ownerInfo?.filter((data) => {
      const email = (data?.email || '').toLowerCase();
      const p = (data?.profile ?? {}) as any;
      const last = ((p.lastName ?? p.last_name) || '').toString().toLowerCase();
      const first = ((p.firstName ?? p.first_name) || '').toString().toLowerCase();
      const gender = (p.gender || '').toString().toLowerCase();
      return valArray?.every((word: string) => {
        const w = word.toLowerCase();
        return email.includes(w) || last.includes(w) || first.includes(w) || gender.includes(w);
      });
    });
    setSearchResult(result);
  };
  return (
    <>
      <div className="p-6">
        {loading ? (
          <Skeleton className="h-[500px] w-full rounded-lg" />
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center gap-4 flex-wrap">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">Owner Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage property owners and their listings</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    buttonSize="small"
                    color="btnwhite"
                    type="button"
                    onClick={() => setIsCreateOpen(true)}
                    buttonName={<span>Create Owner</span>}
                  />
                  <Button
                    variant="primaryoutline"
                    buttonSize="small"
                    color="btnfontprimary"
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    buttonName={
                      <span className="flex items-center gap-1">
                        <Icon icon="mdi:printer" className="text-base" />
                        <span>Export</span>
                      </span>
                    }
                  />
                  {isOpen && (
                    <div className="absolute right-8 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      <button
                        onClick={() => handleDownload("CSV")}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded-t-lg"
                      >
                        Export as CSV
                      </button>
                      <button
                        onClick={() => handleDownload("PDF")}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded-b-lg"
                      >
                        Export as PDF
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <div className="flex-1 max-w-md">
                  <TableSearch
                    placeholder="Search owners..."
                    searchTableFunc={handleSearchProperty}
                    value={searchValue}
                  />
                </div>
                <ItemCount count={searchResult?.length} />
              </div>
            </div>

            {searchResult?.length > 0 ? (
              <div className="overflow-x-auto">
                <Table
                  columns={anOwnerColumn}
                  rows={searchResult}
                  getRowId={(row) => row?.id}
                  pagination={false}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <Icon icon="hugeicons:album-not-found-01" width="32" height="32" className="text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No owners found</h3>
                <p className="text-sm text-gray-500">Try adjusting your search or create a new owner</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Create Owner</h2>
                <button onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <Icon icon="mdi:close" width="24" height="24" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="John"
                    value={createForm.first_name}
                    onChange={e => setCreateForm({ ...createForm, first_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Doe"
                    value={createForm.last_name}
                    onChange={e => setCreateForm({ ...createForm, last_name: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="john@example.com"
                    type="email"
                    value={createForm.email}
                    onChange={e => setCreateForm({ ...createForm, email: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="+234 800 000 0000"
                    value={createForm.phone}
                    onChange={e => setCreateForm({ ...createForm, phone: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="••••••••"
                    type="password"
                    value={createForm.password}
                    onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    value={createForm.gender}
                    onChange={e => setCreateForm({ ...createForm, gender: e.target.value })}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createForm.is_active}
                      onChange={e => setCreateForm({ ...createForm, is_active: e.target.checked })}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">Active account</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createForm.is_verified}
                      onChange={e => setCreateForm({ ...createForm, is_verified: e.target.checked })}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">Verified</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  createUser({ payload: createForm }, {
                    onSuccess: () => { toast.success('User created successfully'); setIsCreateOpen(false); fetchownerInfo(); },
                    onError: (e: any) => {
                      const detail = e?.response?.data?.detail;
                      const msg = Array.isArray(detail) ? detail.map((d: any) => d?.msg).join('; ') : (detail || e?.response?.data?.message || 'Failed');
                      toast.error(msg);
                    }
                  });
                }}
                disabled={creating}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : 'Create Owner'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Edit Owner</h2>
                <button onClick={() => setIsEditOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <Icon icon="mdi:close" width="24" height="24" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="John"
                    value={editForm.first_name}
                    onChange={e => setEditForm({ ...editForm, first_name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Doe"
                    value={editForm.last_name}
                    onChange={e => setEditForm({ ...editForm, last_name: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="john@example.com"
                    type="email"
                    value={editForm.email}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="+234 800 000 0000"
                    value={editForm.phone}
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    value={editForm.gender}
                    onChange={e => setEditForm({ ...editForm, gender: e.target.value })}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.is_active}
                      onChange={e => setEditForm({ ...editForm, is_active: e.target.checked })}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">Active account</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.is_verified}
                      onChange={e => setEditForm({ ...editForm, is_verified: e.target.checked })}
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">Verified</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setIsEditOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!editUserId) { toast.error('Missing user id'); return; }
                  updateUser({ userId: editUserId, payload: editForm }, {
                    onSuccess: () => { toast.success('User updated successfully'); setIsEditOpen(false); fetchownerInfo(); },
                    onError: (e: any) => {
                      const detail = e?.response?.data?.detail;
                      const msg = Array.isArray(detail) ? detail.map((d: any) => d?.msg).join('; ') : (detail || e?.response?.data?.message || 'Failed');
                      toast.error(msg);
                    }
                  });
                }}
                disabled={updating}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
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

export default Owner;

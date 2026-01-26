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

const Agent = () => {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState<string>("");
  const [rowCount, setRowCount] = useState(0);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  const [isOpen, setIsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);

  // Create form state
  const [createForm, setCreateForm] = useState<any>({
    role: 'AGENT',
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
      downloadCSV(data);
    } else if (type === "PDF") {
      downloadPDF(data);
    }
    setIsOpen(false);
  };

  const downloadCSV = (data: User[]) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]).join(",");
    const csvContent = data.map(row =>
      Object.values(row).map(value => `"${value}"`).join(",")
    );
    const csvString = [headers, ...csvContent].join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "agent_info.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = (data: User[]) => {
    if (!data.length) return;
    const doc = new jsPDF();
    doc.text("Agent Information", 10, 10);
    const headers = ["ID", "First Name", "Last Name", "KYC Status", "Email", "Created At"];
    const rows = data.map(user => [
      user.id || "--/--",
      user?.profile?.firstName || "--/--",
      user?.profile?.lastName || "--/--",
      user?.profile?.kycStatus || "--/--",
      user.email || "--/--",
      user.createdAt ? new Date(user.createdAt).toLocaleString() : "--/--"
    ]);
    autoTable(doc, {
      head: [headers],
      body: rows,
      styles: { fontSize: 10, cellPadding: 3 },
      theme: "grid",
    });
    doc.save("agent_info.pdf");
  };

  const anAgentColumns: GridColDef[] = [
    {
      field: "name",
      headerName: "Full Name",
      width: 250,
      renderCell: (params) => {
        const first = params.row.firstName || "--/--";
        const last = params.row.lastName || "--/--";
        return `${first} ${last}`;
      },
    },
    {
      field: "email",
      headerName: "Email",
      width: 200,
    },
    {
      field: "phone",
      headerName: "Phone Number",
      width: 150,
    },
    {
      field: "isVerified",
      headerName: "Verification Status",
      width: 180,
      renderCell: (params) => <Badge status={params.value} />,
    },
    {
      field: "createdAt",
      headerName: "Date Created",
      width: 180,
      renderCell: (params) => (params.value ? new Date(params.value).toLocaleDateString() : "--/--"),
    },
    {
      field: "actions",
      headerName: "",
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <div className="flex items-center gap-3">
          <Link href={`/user-management/agents/${params.row.id}`}>
            <Icon icon="mdi:eye" className="cursor-pointer text-gray-500 hover:text-primary transition-colors" width="20" />
          </Link>
          <button
            onClick={() => {
              setEditUserId(params.row.id);
              setEditForm({
                email: params.row.email || '',
                phone: params.row.phone || '',
                first_name: params.row.firstName || '',
                last_name: params.row.lastName || '',
                gender: params.row.gender || '',
                is_active: params.row.isActive ?? true,
                is_verified: params.row.isVerified ?? false,
              });
              setIsEditOpen(true);
            }}
            className="text-gray-500 hover:text-blue-600 transition-colors"
          >
            <Icon icon="mdi:pencil" width="20" />
          </button>
        </div>
      ),
    },
  ];

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const response = await axiosRequest.get(API_ROUTES.admin.users.base, {
        params: {
          page: paginationModel.page + 1,
          size: paginationModel.pageSize,
          search: searchValue || undefined,
          role: "AGENT",
        },
      });
      const result = response.data.data;
      setData(result.data);
      setRowCount(result.meta.total);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to fetch agents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAgents();
    }, 500); // Debounce search
    return () => clearTimeout(timer);
  }, [paginationModel, searchValue]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    setPaginationModel(prev => ({ ...prev, page: 0 })); // Reset to first page on search
  };

  return (
    <>
      <div className="p-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <div className="flex justify-between items-center gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Agent Management</h1>
                <p className="text-sm text-gray-500 mt-1">Manage and monitor all your platform agents</p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="primary"
                  buttonSize="small"
                  onClick={() => setIsCreateOpen(true)}
                  buttonName={<span className="flex items-center gap-2"><Icon icon="mdi:plus" /> Create Agent</span>}
                />
                <div className="relative">
                  <Button
                    variant="primaryoutline"
                    buttonSize="small"
                    onClick={() => setIsOpen(!isOpen)}
                    buttonName={<span className="flex items-center gap-2"><Icon icon="mdi:printer" /> Export</span>}
                  />
                  {isOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-20">
                      <button onClick={() => handleDownload("CSV")} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors border-b border-gray-100">Export as CSV</button>
                      <button onClick={() => handleDownload("PDF")} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors">Export as PDF</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-6">
              <div className="flex-1 max-w-md relative">
                <TableSearch
                  placeholder="Search by name, email or phone..."
                  searchTableFunc={handleSearchChange}
                  value={searchValue}
                />
              </div>
              <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 shadow-sm">
                Total Agents: <span className="text-primary">{rowCount}</span>
              </div>
            </div>
          </div>

          <div className="p-0">
            <Table
              columns={anAgentColumns}
              rows={data}
              getRowId={(row) => row.id}
              loading={loading}
              pagination
              paginationMode="server"
              rowCount={rowCount}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
            />
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Create Agent</h2>
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
                    onSuccess: () => { toast.success('User created successfully'); setIsCreateOpen(false); fetchAgents(); },
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
                {creating ? 'Creating...' : 'Create Agent'}
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
                <h2 className="text-xl font-semibold text-gray-900">Edit Agent</h2>
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
                    onSuccess: () => { toast.success('User updated successfully'); setIsEditOpen(false); fetchAgents(); },
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

export default Agent;

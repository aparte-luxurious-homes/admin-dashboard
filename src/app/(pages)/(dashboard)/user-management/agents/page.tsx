"use client"

import { Skeleton } from "@/src/components/ui/skeleton";
import { TableSearch } from "@/src/components/table/tableAction";
import Table from "@/src/components/table/table";
import { useState, useEffect } from "react";
import { API_ROUTES, BASE_API_URL } from "@/src/lib/routes/endpoints";
import axiosRequest from "@/src/lib/api";
import Badge from "@/src/components/badge";
import { Icon } from "@iconify/react";
import { GridColDef } from "@mui/x-data-grid";
import Button from "@/src/components/button";
import Link from "next/link";
import jsPDF from "jspdf";
import "jspdf-autotable";import autoTable from "jspdf-autotable";
import ItemCount from "@/src/components/item-count/itemcount";

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
  const [searchResult, setSearchResult] = useState<User[]>([]);
  const [ownerInfo, setOwnerInfo] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [searchValue, setSearchValue] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

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


  const anAgentColumns: GridColDef[] = [
    {
      field: "name",
      headerName: "Full Name",
      width: 250,
      renderCell: (params) => {
        const { firstName, lastName } = params?.row?.profile;
        return `${firstName || "--/--"}, ${lastName || "--/--"}`;
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
      renderCell: (params) => params?.row?.profile?.gender || "--/--",
    },
    {
      field: "createdAt",
      headerName: "Phone Number",
      width: 150,
      renderCell: (params) => params?.value?.substring(0, 10) || "--/--",
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
        <Link href={`/user-management/agents/${params.row.id}`}>
          <Icon icon="mdi:eye" className="cursor-pointer text-[#514A4A] mt-4" />
        </Link>
      ),
    },
  ];

  const fetchownerInfo = async () => {
    setLoading(true);
    try {
      const response = await axiosRequest.get(
        `${BASE_API_URL}${API_ROUTES?.admin?.users?.base}`
      );
      const ownerData = response?.data?.data?.data?.filter((user: User ) => user?.role === "AGENT") || [];

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
    const result = ownerInfo?.filter((data) =>
      valArray?.every(
        (word: string) =>
          data?.email?.toLowerCase().includes(word.toLowerCase()) ||
          data?.profile?.lastName?.toLowerCase().includes(word.toLowerCase()) ||
          data?.profile?.firstName?.toLowerCase().includes(word.toLowerCase()) ||
          data?.profile?.gender?.toLowerCase().includes(word.toLowerCase())
      )
    );
    setSearchResult(result);
  };
  return (
    <>

      <div className="p-[30px] mt-10 mb-100 border border-[#D9D9D9] rounded-[15px] bg-white shadow-md min-h-[calc(100vh-150px)]">
        {loading ? (
          <Skeleton className="h-[300px] w-full rounded-md" />
        ) : (
          <>
            <div className="flex justify-between gap-4 items-start md:items-center flex-col md:flex-row">
              <div className="flex items-center md:items-center flex-col md:flex-row">
                <h4 className="mr-4 font-medium max-[400px]:mb-2">Agent Management</h4>
                <div className="flex items-center gap-2">
                  <TableSearch
                    placeholder="Search here..."
                    searchTableFunc={handleSearchProperty}
                    value={searchValue}
                  />
                  <ItemCount count={searchResult?.length} />
                </div>
              </div>
              <div>
                <Button
                  variant="primaryoutline"
                  buttonSize="full"
                  color="btnfontprimary"
                  // isLoading={isPending}
                  onClick={() => setIsOpen(!isOpen)}
                  // type="submit"
                  buttonName={
                    <>
                      <span>Print CSV/PDF</span>
                      <Icon icon="mdi:printer" className="text-lg" />
                    </>
                  } 
                />
                {isOpen && (
                  <div className="absolute right-16 mt-2 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                    <button
                      onClick={() => handleDownload("CSV")}
                      className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                    >
                      Export as CSV
                    </button>
                    <button
                      onClick={() => handleDownload("PDF")}
                      className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                    >
                      Export as PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
            {searchResult?.length > 0 ? (
              <Table
                columns={anAgentColumns}
                rows={searchResult}
                getRowId={(row) => row?.id}
                pagination={false}
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 mt-[20%]">
                <Icon
                  icon="hugeicons:album-not-found-01"
                  width="40"
                  height="40"
                  className="text-gray-400"
                />
                <p className="text-gray-500 text-sm font-medium">
                  No Data Found
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default Agent;

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

interface Owner {
  id: number;
  email: string;
  phone: string;
  role: string;
  verificationToken: string | null;
}

interface Amenities {
  id: number;
  name: string;
}
interface Media {
  id: number;
  media_file: string;
  is_featured: boolean;
}

interface Agent {
  id: number;
  email: string;
  phone: string | null;
  role: string;
  verificationToken: string | null;
}
interface Property {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  description: string;
  isPetAllowed: boolean;
  isVerified: boolean;
  latitude: number | null;
  longitude: number | null;
  propertyType: string;
  assignedAgent: number;
  agent: Agent;
  owner: Owner;
  ownerId: number;
  media: Media[];
  amenities: Amenities[];
  createdAt: string;
}

const Guests = () => {
  const [searchResult, setSearchResult] = useState<Property[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [searchValue, setSearchValue] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  const handleDownload = (type: "CSV" | "PDF") => {
    console.log(`Downloading ${type}...`);
    setIsOpen(false);
  };


  const anAgentColumns: GridColDef[] = [
    { field: "name", headerName: "Full Name", width: 300 },
    {
      field: "location",
      headerName: "Email",
      width: 200,
    },
    { field: "propertyType", headerName: "Phone Number", width: 150 },
    {
      field: "isVerified",
      headerName: "Verification Status",
      width: 100,
      renderCell: (params) => {
        console.log("Badge", params.value);
        return <Badge status={params.value} />;
      },
    },
    { field: "propertyType", headerName: "Bookings", width: 150 },
    { field: "propertyType", headerName: "Account Status", width: 150 },
    { field: "propertyType", headerName: "Registration Date", width: 150 },
    {
      field: "actions",
      headerName: "",
      width: 50,
      sortable: false,
      align: "center",
      renderCell: (params) => (
        <Link href={`/property-management/all-properties/${params.row.id}`}>
          <Icon icon="mdi:eye" className="cursor-pointer text-[#514A4A] mt-4" />
        </Link>
      ),
    },
  ];

  console.log("loading", loading);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const response = await axiosRequest.get(
        `${BASE_API_URL}${API_ROUTES.propertyManagement.properties.base}`
      );
      setProperties(response?.data?.data?.data);
      setSearchResult(response?.data?.data?.data);
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
  // --| Filter Property table using name, state and and all
  const handleSearchProperty = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setSearchValue(value);

    const valArray = value.split(" ");
    // --| Filter data by partial match onchange in the search input box
    const result = properties?.filter((data) =>
      valArray?.every(
        (word: string) =>
          data?.name?.toLowerCase().includes(word.toLowerCase()) ||
          data?.propertyType?.toLowerCase().includes(word.toLowerCase()) ||
          data?.propertyType?.toLowerCase().includes(word.toLowerCase()) ||
          data?.agent?.email?.toLowerCase().includes(word.toLowerCase())
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
            <div className="flex justify-between gap-4">
              <div className="flex items-center">
                <h4 className="mr-4 font-medium">Guest Management</h4>
                <TableSearch
                  placeholder="Search here..."
                  searchTableFunc={handleSearchProperty}
                  value={searchValue}
                />
              </div>
              <div className="mt-4">
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

export default Guests;

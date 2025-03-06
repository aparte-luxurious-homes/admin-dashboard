"use client";

import { Skeleton } from "@/src/components/ui/skeleton";
import { TableSearch } from "@/src/components/table/tableAction";
import Table from "@/src/components/table/table";
import { useState, useEffect } from "react";
import { API_ROUTES, BASE_API_URL } from "@/src/lib/routes/endpoints";
import axiosRequest from "@/src/lib/api";
import Badge from "@/src/components/badge";
import { Icon } from "@iconify/react";
import { GridColDef } from "@mui/x-data-grid";
import Link from "next/link";

interface Transaction {
  id: string;
  wallet_id: string;
  user_id: number;
  action: string;
  transaction_type: string;
  comment: string;
  currency: string;
  reference: string;
  payment_reference: string;
  amount: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const BookingWithdrawals = () => {
  const [searchResult, setSearchResult] = useState<Transaction[]>([]);
  const [tableData, setTableData] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [searchValue, setSearchValue] = useState<string>("");

  const transactionColumn: GridColDef[] = [
    {
      field: "userId",
      headerName: "User Id",
      width: 200,
      renderCell: (params) => params?.row?.userId || "--/--",
    },
    {
      field: "amount",
      headerName: "Amount",
      width: 150,
      renderCell: (params) => {
        const amount = params?.row?.amount;
        if (!amount) return "--/--";

        const formattedAmount = new Intl.NumberFormat("en-US").format(
          Number(amount)
        );
        return formattedAmount;
      },
    },
    {
      field: "action",
      headerName: "Action Type",
      width: 150,
      renderCell: (params) => params?.value || "--/--",
    },
    {
      field: "createdAt",
      headerName: "Date Created",
      width: 150,
      renderCell: (params) => params?.value?.substring(0, 10) || "--/--",
    },
    {
      field: "comment",
      headerName: "Comment",
      width: 250,
      renderCell: (params) => params?.value || "--/--",
    },
    {
      field: "status",
      headerName: "Status",
      width: 150,
      renderCell: (params) => {
        return <Badge status={params?.value?.toLowerCase()} />;
      },
    },
    {
      field: "actions",
      headerName: "",
      width: 30,
      sortable: false,
      align: "center",
      renderCell: (params) => (
        <Link href={`/transactions/booking-withdrawals/${params.row.id}`}>
          <Icon icon="mdi:eye" className="cursor-pointer text-[#514A4A] mt-4" />
        </Link>
      ),
    },
  ];

  const fatchBookings = async () => {
    setLoading(true);
    try {
      const response = await axiosRequest.get(
        `${BASE_API_URL}${API_ROUTES?.transactions?.base}`
      );
      console.log("response", response);
      const BookingData = response?.data?.data?.filter((data: Transaction) => data?.transaction_type?.toLowerCase() === "booking");

      setTableData(BookingData);
      setSearchResult(BookingData);
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
    fatchBookings();
  }, []);

  console.log("tableData", tableData);
  console.log("searchResult", searchResult);
  // --| Filter Property table using name, state and and all
  const handleSearchProperty = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setSearchValue(value);

    const valArray = value.split(" ");
    // --| Filter data by partial match onchange in the search input box
    const result = tableData?.filter((data) =>
      valArray?.every(
        (word: string) =>
          data?.amount?.toLowerCase().includes(word.toLowerCase()) ||
          data?.reference?.toLowerCase().includes(word.toLowerCase()) ||
          String(data?.user_id)?.toLowerCase().includes(word.toLowerCase()) ||
          data?.payment_reference?.toLowerCase().includes(word.toLowerCase()) ||
          data?.reference?.toLowerCase().includes(word.toLowerCase())
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
                <h4 className="mr-4 font-medium">All Withdrawals</h4>
                <TableSearch
                  placeholder="Search here..."
                  searchTableFunc={handleSearchProperty}
                  value={searchValue}
                />
              </div>
            </div>
            {searchResult?.length > 0 ? (
              <Table
                columns={transactionColumn}
                rows={searchResult}
                getRowId={(row) => row?.id}
                pagination={false}
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 mt-[20%]">
                <Icon
                  icon="hugeicons:album-not-found-01"
                  width="60"
                  height="60"
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

export default BookingWithdrawals;

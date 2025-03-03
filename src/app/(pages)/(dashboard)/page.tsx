"use client"

import Table from "../../../components/table/table";
import { useEffect } from "react";
import { useAuth } from "@/src/hooks/useAuth";
import { useState } from "react";
import axiosRequest from "@/src/lib/api";
import { TableSearch } from "../../../components/table/tableAction";
import Badge from "../../../components/badge";
import { Icon } from "@iconify/react";
// import allProperty from "../../../dummydata/allProperty.json";
import topAgents from "../../../dummydata/topAgents.json";
import { GridColDef } from "@mui/x-data-grid";
import Grid from "@mui/material/Grid2";
import UsersChart from "@/src/components/userchart/userchart";
import StatsCard from "@/src/components/statcard/statcard";
import LineChart from "@/src/components/linecharts/linecharts";
import { API_ROUTES, BASE_API_URL } from "@/src/lib/routes/endpoints";
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link";

interface Agent {
  id: number;
  email: string;
  phone: string | null;
  role: string;
  verificationToken: string | null;
}

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
// interface AgentData {
//   agentName: string;
//   verifiedCount: number;
// }

interface StatsData {
  totalPayments: TotalStats;
  totalRevenue: TotalStats;
  totalProperties: TotalPropertiesStats;
  users: MonthlyUserStats[];
  properties: MonthlyPropertyStats[];
  topListings: Record<string, number>;
}

interface TotalStats {
  lastMonthAmount: number;
  percentageChange: string;
}

interface TotalPropertiesStats {
  lastMonthTotal: number;
  percentageChange: string;
}

interface MonthlyUserStats {
  month: string;
  totalUsers: number;
}

interface MonthlyPropertyStats {
  month: string;
  totalProperties: number;
  totalVerified: number;
  totalUnverified: number;
}

const Home = () => {
  const [searchResult, setSearchResult] = useState<Property[]>([]);
  const allAgents = topAgents;
  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState<StatsData>({} as StatsData);
  const [loading, setLoading] = useState(false);
  const [isStatLoading, setIsStatLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [statError, setStatError] = useState<string>("");
  const [searchValue, setSearchValue] = useState<string>("");
  const [range, setRange] = useState<string>("year");
  const { user, isFetching } = useAuth();

  console.log(isFetching ? "Fetching User" : user);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const response = await axiosRequest.get(`${BASE_API_URL}${API_ROUTES.propertyManagement.properties.base}`);
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
  
  const fetchStatistics = async () => {
    setIsStatLoading(true);
    try {
      const response = await axiosRequest.get(`${BASE_API_URL}${API_ROUTES.statistic.base}`);
      setStats(response?.data?.data);
    } catch (err) {
      if (err instanceof Error) {
        setStatError(err.message);
      } else {
        setStatError("An unknown error occurred");
      }
    } finally {
      setIsStatLoading(false);
    }
  };
  
  useEffect(() => {
    fetchProperties();
    fetchStatistics();
  }, []);

  console.log("stats", stats);
  console.log(error)
  console.log(statError)
  console.log("properties", properties);

  const dataByRange = {
    year: stats?.users?.map((item) => ({
      label: item?.month.slice(0, 3),
      thisYear: item?.totalUsers,
      lastYear: 0,
    })),
  };

  const adminColumns: GridColDef[] = [
    // { field: "id", headerName: "ID", width: 70 },
    { field: "name", headerName: "Property Name", width: 180 },
    // { field: "address", headerName: "Address", width: 250 },
    // { field: "city", headerName: "City", width: 120 },
    // { field: "state", headerName: "State", width: 120 },
    // { field: "country", headerName: "Country", width: 120 },
    {
      field: "location",
      headerName: "Location",
      width: 150,
      renderCell: (params) => {
        const { city, state } = params.row;
        return `${city || "--/--"}, ${state || "--/--"}`;
      },
    },
    { field: "propertyType", headerName: "Type", width: 110 },
    {
      field: "isVerified",
      headerName: "Verification Status",
      width: 120,
      renderCell: (params) => <Badge status={params.value} />,
    },
    // { field: "isPetAllowed", headerName: "Pets Allowed", width: 120, type: "boolean" },
    { 
      field: "agent", 
      headerName: "Agent Name", 
      width: 150, 
      renderCell: (params) => `${params.row?.agent?.name || "--/--"}`
    },
    { 
      field: "owner", 
      headerName: "Owner's Name", 
      width: 150, 
      renderCell: (params) => `${params.row?.owner?.name || "--/--"}`
    },
    {
      field: "meta",
      headerName: "Rating",
      width: 100,
      renderCell: (params) => {
        return params.value?.average_rating ?? "--/--";
      },
    },
    {
      field: "unitsCount",
      headerName: "Units",
      width: 50,
      renderCell: (params) => {
        return params.row.units?.length ?? 0;
      },
    },
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
  const propertyColumns: GridColDef[] = [
    // { field: "id", headerName: "ID", width: 70 },
    { field: "name", headerName: "Property Name", width: 200 },
    // { field: "address", headerName: "Address", width: 250 },
    // { field: "city", headerName: "City", width: 120 },
    // { field: "state", headerName: "State", width: 120 },
    // { field: "country", headerName: "Country", width: 120 },
    {
      field: "location",
      headerName: "Location",
      width: 200,
      renderCell: (params) => {
        const { city, state } = params.row;
        return `${city || "--/--"}, ${state || "--/--"}`;
      },
    },
    { field: "propertyType", headerName: "Type", width: 150 },
    {
      field: "isVerified",
      headerName: "Verification Status",
      width: 150,
      renderCell: (params) => <Badge status={params.value} />,
    },
    // { field: "isPetAllowed", headerName: "Pets Allowed", width: 120, type: "boolean" },
    { 
      field: "agent", 
      headerName: "Agent Name", 
      width: 180, 
      renderCell: (params) => `${params.row?.agent?.name || "--/--"}`
    },
    {
      field: "meta",
      headerName: "Rating",
      width: 70,
      renderCell: (params) => {
        return params.value?.average_rating ?? "--/--";
      },
    },
    {
      field: "unitsCount",
      headerName: "Units",
      width: 50,
      renderCell: (params) => {
        return params.row.units?.length ?? 0;
      },
    },
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
  const anAgentColumns: GridColDef[] = [
    { field: "name", headerName: "Property Name", width: 300 },
    {
      field: "location",
      headerName: "Location",
      width: 200,
      renderCell: (params) => {
        const { city, state } = params.row;
        return `${city || "--/--"}, ${state || "--/--"}`;
      },
    },
    { field: "propertyType", headerName: "Type", width: 150 },
    {
      field: "meta",
      headerName: "Rating",
      width: 90,
      renderCell: (params) => {
        return params.value?.average_rating ?? "--/--";
      },
    },
    {
      field: "unitsCount",
      headerName: "Units",
      width: 90,
      renderCell: (params) => {
        return params.row.units?.length ?? 0;
      },
    },
    {
      field: "isVerified",
      headerName: "Verification Status",
      width: 100,
      renderCell: (params) => {
        console.log("Badge", params.value);
        return <Badge status={params.value} />;
      },
    },
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

  const topAgentColumns: GridColDef[] = [
    { field: "agentName", headerName: "Agent Name", width: 90 },
    { field: "verifiedCount", headerName: "Verified Listing", width: 120 },
  ];

  // --| Filter Property table using name, state and and all
  const handleSearchProperty = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setSearchValue(value);

    const valArray = value.split(" ");
    // --| Filter data by partial match onchange in the search input box
    const result = properties?.filter((data) => 
      valArray?.every((word: string) => 
        data?.name?.toLowerCase().includes(word.toLowerCase()) ||
        data?.propertyType?.toLowerCase().includes(word.toLowerCase()) ||
        data?.propertyType?.toLowerCase().includes(word.toLowerCase()) ||
        data?.agent?.email?.toLowerCase().includes(word.toLowerCase())
      )
    );
    setSearchResult(result);
  };
  const labels = stats?.properties?.map((item) => item?.month.slice(0, 3),) || [];

  const datasets = [
    {
      label: "Verified",
      data: stats?.properties?.map((item) => item?.totalVerified) || [],
      borderColor: "#007080",
    },
    {
      label: "Unverified",
      data: stats?.properties?.map((item) => item?.totalUnverified) || [],
      borderColor: "#D22B2B",
    },
  ];

  return (
    <div className="full p-10">
      <div className="mb-6">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 12, md: 12, lg: user?.role === "OWNER" || user?.role === "ADMIN" ? 9 : 12, }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                <StatsCard 
                  title="Total Revenue"
                  amount={`₦${stats?.totalRevenue?.lastMonthAmount?.toLocaleString()  || "0"}`}
                  percentage={stats?.totalRevenue?.percentageChange || 0}
                  isIncrease={parseFloat(stats?.totalRevenue?.percentageChange) > 0} 
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                <StatsCard 
                  title="Total Payments Processed"
                  amount={`₦${stats?.totalPayments?.lastMonthAmount?.toLocaleString() || "0"}`}
                  percentage={stats?.totalPayments?.percentageChange || 0}
                  isIncrease={parseFloat(stats?.totalPayments?.percentageChange) > 0} 
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                <StatsCard 
                  title="Total Property Listed"
                  amount={`${stats?.totalProperties?.lastMonthTotal?.toLocaleString()  || "0"}`}
                  percentage={stats?.totalProperties?.percentageChange || 0}
                  isIncrease={parseFloat(stats?.totalProperties?.percentageChange) > 0} 
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6 }}>
                <div className={`p-[20px] h-[270px] border border-[#D9D9D9] rounded-[15px] bg-white shadow-md ${stats?.properties?.length === 0 && "flex items-center justify-center"}`}>
                  {isStatLoading ? (
                    <Skeleton className="h-[200px] w-full rounded-md" />
                  ) : stats?.properties?.length > 0 ? (
                    <div>
                      <div className="flex justify-between items-center gap-1 mb-1">
                        <div className="flex gap-4 items-center">
                          <h4>Users</h4>
                          <div className="flex gap-1 items-center">
                            <div className="flex items-center gap-2">
                              <p className="text-[12px]">This Year</p>
                              <div className="w-3 h-1 bg-[#028090]"></div>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="text-[12px]">Last Year</p>
                              <div className="w-3 h-1 bg-[#D9D9D9]"></div>
                            </div>
                          </div>
                        </div>
                        <select onChange={(e) => setRange(e.target.value)} value={range}>
                          <option value="30days">Last 30 Days</option>
                          <option value="90days">Last 90 Days</option>
                          <option value="year">This Year</option>
                        </select>
                      </div>

                      <UsersChart range={range} data={dataByRange} />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 mt-20">
                      <Icon icon="hugeicons:album-not-found-01" width="40" height="40" className="text-gray-400" />
                      <p className="text-gray-500 text-sm font-medium">No Data Found</p>
                    </div>
                  )}
                </div>
              </Grid>
              <Grid size={{ xs: 12, sm: 12, md: 6, lg: 6 }}>
                <div className="p-[20px] h-[270px] border border-[#D9D9D9] rounded-[15px] bg-white shadow-md">
                  {isStatLoading ? (
                    <Skeleton className="h-[200px] w-full rounded-md" />
                  ) : stats?.users?.length > 0 ? (
                      <div>
                        <div className="flex justify-between items-center gap-1 mb-1">
                          <h4>Properties</h4>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                              <p className="text-[12px]">Verified</p>
                              <div className="w-3 h-1 bg-[#028090]"></div>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="text-[12px]">Unverified</p>
                              <div className="w-3 h-1 bg-[#FF0000]"></div>
                            </div>
                          </div>
                        </div>
                        <LineChart labels={labels} datasets={datasets} />
                     </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 mt-20">
                      <Icon icon="hugeicons:album-not-found-01" width="40" height="40" className="text-gray-400" />
                      <p className="text-gray-500 text-sm font-medium">No Data Found</p>
                    </div>
                  )}
                </div>
              </Grid>
            </Grid>
          </Grid>
          {user?.role === "OWNER" || user?.role === "ADMIN" ? (
            <Grid size={{ xs: 12, sm: 12, md: 12, lg: 3 }}>
              <div className="p-[30px] border border-[#D9D9D9] rounded-[15px] bg-white shadow-md">
                <h3>Top Performing Agents</h3>
                <Table columns={topAgentColumns} rows={allAgents} getRowId={(row) => row.agentName} pagination={false} />
              </div>
            </Grid>
          ) : (
            null
          )}
        </Grid>
      </div>
      <div className="p-[30px] mb-100 border border-[#D9D9D9] rounded-[15px] bg-white shadow-md">
        {loading ? (
          <Skeleton className="h-[300px] w-full rounded-md" />
        ) : (
          <>
            <div>
              <TableSearch
                placeholder="Search here..."
                searchTableFunc={handleSearchProperty}
                value={searchValue}
              />
            </div>
            {searchResult?.length > 0 ? (
              <Table
                columns={user?.role === "OWNER" ? propertyColumns : user?.role === "ADMIN" ? adminColumns : anAgentColumns}
                rows={searchResult}
                getRowId={(row) => row?.id}
                pagination={false}
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2">
                <Icon icon="hugeicons:album-not-found-01" width="40" height="40" className="text-gray-400" />
                <p className="text-gray-500 text-sm font-medium">No Data Found</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Home;

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
  media: any[];
  amenities: any[];
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // const [statError, setStatError] = useState(null);
  const [searchValue, setSearchValue] = useState<string>("");
  const [range, setRange] = useState<string>("year");
  const { user, isFetching } = useAuth();

  console.log(isFetching ? "Fetching User" : user);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await axiosRequest.get(`${BASE_API_URL}${API_ROUTES.propertyManagement.properties.base}`);

        setProperties(response?.data?.data?.data);
        setSearchResult(response?.data?.data?.data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);
  useEffect(() => {
    const getStatistics = async () => {
      try {
        const response = await axiosRequest.get(`${BASE_API_URL}${API_ROUTES.statistic.base}`);

        setStats(response?.data?.data);
        setLoading(false);
      } catch (err) {
        console.log(err.message);
      } finally {
        setLoading(false);
      }
    };

    getStatistics();
  }, []);

  console.log("stats", stats);

  if (loading) return <p>Loading properties...</p>;
  if (error) return <p>Error: {error}</p>;
  console.log("properties", properties);

  const dataByRange = {
    year: stats?.users?.map((item) => ({
      label: item?.month.slice(0, 3),
      thisYear: item?.totalUsers,
      lastYear: 0,
    })),
  };

  const propertyColumns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "name", headerName: "Property Name", width: 200 },
    { field: "address", headerName: "Address", width: 250 },
    { field: "city", headerName: "City", width: 120 },
    { field: "state", headerName: "State", width: 120 },
    { field: "country", headerName: "Country", width: 120 },
    { field: "propertyType", headerName: "Type", width: 150 },
    {
      field: "isVerified",
      headerName: "Verification Status",
      width: 150,
      renderCell: (params) => <Badge status={params.value} />,
    },
    { field: "isPetAllowed", headerName: "Pets Allowed", width: 120, type: "boolean" },
    { 
      field: "agent", 
      headerName: "Agent Details", 
      width: 280, 
      valueGetter: (params: any) => `Email: ${params.row?.agent?.email || "--/--"} | Phone: ${params.row?.agent?.phone || "--/--"}`
    },
    {
      field: "actions",
      headerName: "",
      width: 50,
      sortable: false,
      align: "center",
      renderCell: () => (
        <button className="bg-transparent border-0 text-[#514A4A]">
          <Icon icon="bi:three-dots" />
        </button>
      ),
    },
  ];
  const anAgentColumns: GridColDef[] = [
    { field: "name", headerName: "Property Name", width: 300 },
    { field: "city", headerName: "City", width: 150 },
    { field: "state", headerName: "State", width: 150 },
    { field: "country", headerName: "Country", width: 150 },
    { field: "propertyType", headerName: "Type", width: 150 },
    {
      field: "verificationStatus",
      headerName: "Verification Status",
      width: 150,
      renderCell: (params) => <Badge status={params.value} />,
    },
    {
      field: "actions",
      headerName: "",
      width: 50,
      sortable: false,
      align: "center",
      renderCell: () => (
        <button className="bg-transparent border-0 text-[#514A4A]">
          <Icon icon="bi:three-dots" />
        </button>
      ),
    },
  ];

  const topAgentColumns: GridColDef[] = [
    { field: "agentName", headerName: "Agent Name", width: 100 },
    { field: "verifiedCount", headerName: "Verified Listing", width: 100 },
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
    <div className="full">
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
              <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                <div className="p-[20px] h-full border border-[#D9D9D9] rounded-[15px] bg-white shadow-md">
                  <select onChange={(e) => setRange(e.target.value)} value={range}>
                    <option value="30days">Last 30 Days</option>
                    <option value="90days">Last 90 Days</option>
                    <option value="year">This Year</option>
                  </select>

                  <UsersChart range={range} data={dataByRange} />
                </div>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                <div className="h-full p-[20px] border border-[#D9D9D9] rounded-[15px] bg-white shadow-md flex">
                  <LineChart labels={labels} datasets={datasets} />
                </div>
              </Grid>
            </Grid>
          </Grid>
          {user?.role === "OWNER" || user?.role === "ADMIN" ? (
            <Grid size={{ xs: 12, sm: 6, md: 3, lg: 3 }}>
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
        <div><TableSearch placeholder="Search here..." searchTableFunc={handleSearchProperty} value={searchValue} /></div>
        <Table columns={user?.role === "OWNER" || user?.role === "ADMIN" ? propertyColumns : anAgentColumns} rows={searchResult} getRowId={(row) => row?.id} pagination={false} />
      </div>
    </div>
  );
}

export default Home;

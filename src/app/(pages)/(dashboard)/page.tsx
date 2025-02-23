"use client"

import Table from "../../../components/table/table";
import { useState } from "react";
import { TableSearch } from "../../../components/table/tableAction";
import Badge from "../../../components/badge";
import { Icon } from "@iconify/react";
import allProperty from "../../../dummydata/allProperty.json";
import topAgents from "../../../dummydata/topAgents.json";
import { GridColDef } from "@mui/x-data-grid";
import Grid from "@mui/material/Grid2";
import UsersChart from "@/src/components/userchart/userchart";
import StatsCard from "@/src/components/statcard/statcard";
import LineChart from "@/src/components/linecharts/linecharts";
interface PropertyData {
  propertyID: string;
  propertyName: string;
  propertyType: string;
  ownersName: string;
  verificationStatus: string;
  assignedAgent: string;
  submissionDate: string;
}
// interface AgentData {
//   agentName: string;
//   verifiedCount: number;
// }

interface ChartDataItem {
  label: string;
  thisYear: number;
  lastYear: number;
}

const Home = () => {
  const [searchResult, setSearchResult] = useState<PropertyData[]>(allProperty);
  const allAgents = topAgents;
  const [searchValue, setSearchValue] = useState<string>("");
  const [range, setRange] = useState<string>("year");

  const dataByRange: Record<string, ChartDataItem[]> = {
    "30days": [
      { label: "Week 1", thisYear: 4000, lastYear: 3000 },
      { label: "Week 2", thisYear: 5000, lastYear: 4000 },
      { label: "Week 3", thisYear: 7000, lastYear: 5000 },
      { label: "Week 4", thisYear: 6000, lastYear: 4500 },
    ],
    "90days": [
      { label: "Jan", thisYear: 8000, lastYear: 7000 },
      { label: "Feb", thisYear: 6000, lastYear: 5000 },
      { label: "Mar", thisYear: 10000, lastYear: 8000 },
    ],
    "year": [
      { label: "Jan", thisYear: 9000, lastYear: 8000 },
      { label: "Feb", thisYear: 6000, lastYear: 5000 },
      { label: "Mar", thisYear: 10000, lastYear: 9000 },
      { label: "Apr", thisYear: 7500, lastYear: 7000 },
      { label: "May", thisYear: 3000, lastYear: 2500 },
      { label: "Jun", thisYear: 7000, lastYear: 6500 },
      { label: "Jul", thisYear: 10000, lastYear: 9500 },
      { label: "Aug", thisYear: 5000, lastYear: 4500 },
      { label: "Sep", thisYear: 2000, lastYear: 1800 },
      { label: "Oct", thisYear: 7000, lastYear: 6800 },
      { label: "Nov", thisYear: 8500, lastYear: 8000 },
      { label: "Dec", thisYear: 6000, lastYear: 5500 },
    ],
  };

  const propertyColumns: GridColDef[] = [
    { field: "propertyID", headerName: "Property ID", width: 100 },
    { field: "propertyName", headerName: "Property Name", width: 200 },
    { field: "propertyType", headerName: "Type", width: 150 },
    { field: "ownersName", headerName: "Owner", width: 150 },
    {
      field: "verificationStatus",
      headerName: "Verification Status",
      width: 150,
      renderCell: (params) => <Badge status={params.value} />,
    },
    { field: "assignedAgent", headerName: "Assigned Agent", width: 150 },
    { field: "submissionDate", headerName: "Submission Date", width: 130 },
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
  const agentColumns: GridColDef[] = [
    { field: "agentName", headerName: "Agent Name", width: 100 },
    { field: "verifiedCount", headerName: "Verified Listing", width: 100 },
  ];

  // --| Filter Property table using name, state and and all
  const handleSearchProperty = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setSearchValue(value);

    const valArray = value.split(" ");
    // --| Filter data by partial match onchange in the search input box
    const result = allProperty?.filter((data) => 
      valArray?.every((word: string) => 
        data?.propertyID?.toLowerCase().includes(word.toLowerCase()) ||
        data?.propertyName?.toLowerCase().includes(word.toLowerCase()) ||
        data?.propertyType?.toLowerCase().includes(word.toLowerCase()) ||
        data?.ownersName?.toLowerCase().includes(word.toLowerCase()) ||
        data?.verificationStatus?.toLowerCase().includes(word.toLowerCase()) ||
        data?.assignedAgent?.toLowerCase().includes(word.toLowerCase())
      )
    );
    setSearchResult(result);
  };
  const labels = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const datasets = [
    {
      label: "Verified",
      data: [1000, 2000, 3000, 4000, 5000, 7000, 9000, 8000, 7000, 6000, 6500, 7000],
      borderColor: "#007080",
    },
    {
      label: "Unverified",
      data: [2000, 4000, 5000, 4500, 6000, 7500, 6500, 5000, 3000, 2500, 4000, 6000],
      borderColor: "#D22B2B",
    },
  ];

  return (
    <div className="full">
      <div className="mb-6">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 12, md: 12, lg: 9 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                <StatsCard 
                  title="Total Revenue"
                  amount="₦395,450,500"
                  percentage={23}
                  isIncrease={true} 
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                <StatsCard 
                  title="Total Payments Processed"
                  amount="₦3,921,450,500"
                  percentage={18}
                  isIncrease={true} 
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                <StatsCard 
                  title="Total Payments Listed"
                  amount="450,500"
                  percentage={31}
                  isIncrease={false} 
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
          <Grid size={{ xs: 12, sm: 6, md: 3, lg: 3 }}>
            <div className="p-[30px] border border-[#D9D9D9] rounded-[15px] bg-white shadow-md">
              <h3>Top Performing Agents</h3>
              <Table columns={agentColumns} rows={allAgents} getRowId={(row) => row.agentName} pagination={false} />
            </div>
          </Grid>
        </Grid>
      </div>
      <div className="p-[30px] border border-[#D9D9D9] rounded-[15px] bg-white shadow-md">
        <div><TableSearch placeholder="Search here..." searchTableFunc={handleSearchProperty} value={searchValue} /></div>
        <Table columns={propertyColumns} rows={searchResult} getRowId={(row) => row?.propertyID} pagination={false} />
      </div>
    </div>
  );
}

export default Home;

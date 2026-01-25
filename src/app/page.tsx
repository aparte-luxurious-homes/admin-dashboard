"use client"

import Table from "@/src/components/table/table";
import { useEffect } from "react";
import { useAuth } from "@/src/hooks/useAuth";
import { useState } from "react";
import axiosRequest from "@/src/lib/api";
import { TableSearch } from "@/src/components/table/tableAction";
import Badge from "@/src/components/badge";
import { Icon } from "@iconify/react";
import { GridColDef } from "@mui/x-data-grid";
import Grid from "@mui/material/Grid2";
import UsersChart from "@/src/components/userchart/userchart";
import StatsCard from "@/src/components/statcard/statcard";
import LineChart from "@/src/components/linecharts/linecharts";
import { API_ROUTES, BASE_API_URL } from "@/src/lib/routes/endpoints";
import { Skeleton } from "@/src/components/ui/skeleton"
import Link from "next/link";
import ItemCount from "@/src/components/item-count/itemcount";

interface Agent {
    id: number;
    email: string;
    phone: string | null;
    role: string;
    verificationToken: string | null;
}

interface OwnerProfile {
    firstName: string;
    lastName: string | null;
    userId: number;
}
interface Owner {
    email: string;
    id: number;
    profile: OwnerProfile;
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

interface TopListing {
    propertyId: number;
    agent: {
        id: number;
        name: string;
    };
    totalVerifiedProperties: number;
}

interface StatsData {
    totalPayments: {
        lastMonthAmount: number;
        percentageChange: string;
    };
    totalRevenue: {
        lastMonthAmount: number;
        percentageChange: string;
    };
    totalProperties: {
        lastMonthTotal: number;
        percentageChange: string;
    };
    users: Array<{
        month: string;
        totalUsers: number;
    }>;
    properties: Array<{
        month: string;
        totalProperties: number;
        totalVerified: number;
        totalUnverified: number;
    }>;
    topListings: TopListing[];
}

const Home = () => {
    const [searchResult, setSearchResult] = useState<Property[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [stats, setStats] = useState<StatsData>({} as StatsData);
    const [loading, setLoading] = useState(false);
    const [isStatLoading, setIsStatLoading] = useState(false);
    const [error, setError] = useState<string>("");
    const [statError, setStatError] = useState<string>("");
    const [searchValue, setSearchValue] = useState<string>("");
    const [range, setRange] = useState<string>("year");
    const { user, isFetching } = useAuth();

    const fetchProperties = async () => {
        setLoading(true);
        try {
            // Using relative path correctly
            const response = await axiosRequest.get(API_ROUTES.propertyManagement.properties.base);
            let DataByRole: Property[] = [];
            if (user?.role === "OWNER") {
                DataByRole = response?.data?.data?.data?.filter(
                    (property: Property) => property?.owner?.id === user?.profile?.id
                );
            } else if (user?.role === "AGENT") {
                DataByRole = response?.data?.data?.data?.filter(
                    (property: Property) => property?.agent?.id === user?.profile?.id
                );
            } else {
                DataByRole = response?.data?.data?.data;
            }

            setProperties(DataByRole || []);
            setSearchResult(DataByRole || []);
        } catch (err: any) {
            setError(err?.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const fetchStatistics = async () => {
        setIsStatLoading(true);
        try {
            const response = await axiosRequest.get(API_ROUTES.statistic.base);
            setStats(response?.data?.data);
        } catch (err: any) {
            setStatError(err?.message || "An error occurred");
        } finally {
            setIsStatLoading(false);
        }
    };

    useEffect(() => {
        if (user && !isFetching) {
            fetchProperties();
            fetchStatistics();
        }
    }, [user, isFetching]);

    const dataByRange = {
        year: stats?.users?.map((item) => ({
            label: item?.month.slice(0, 3),
            thisYear: item?.totalUsers,
            lastYear: 0,
        })),
    };

    const adminColumns: GridColDef[] = [
        { field: "name", headerName: "Property Name", width: 180 },
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
            renderCell: (params) => `${params.row?.owner?.profile?.lastName || ""} ${params.row?.owner?.profile?.firstName || ""}`
        },
        {
            field: "meta",
            headerName: "Rating",
            width: 100,
            renderCell: (params) => {
                return params.row.meta?.average_rating ?? "--/--";
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
        { field: "name", headerName: "Property Name", width: 200 },
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
                return params.row.meta?.average_rating ?? "--/--";
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
            field: "owner",
            headerName: "Owner's Name",
            width: 150,
            renderCell: (params) => `${params.row?.owner?.profile?.lastName || ""} ${params.row?.owner?.profile?.firstName || ""}`
        },
        {
            field: "meta",
            headerName: "Rating",
            width: 90,
            renderCell: (params) => {
                return params.row.meta?.average_rating ?? "--/--";
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
        {
            field: "agent",
            headerName: "Agent Name",
            width: 110,
            renderCell: (params) => params?.row?.agent?.name || "--/--",
        },
        {
            field: "totalVerifiedProperties",
            headerName: "Verified Listing",
            width: 120,
            renderCell: (params) => params?.row?.totalVerifiedProperties || "--/--",
        }
    ];

    const handleSearchProperty = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        setSearchValue(value);
        const valArray = value.toLowerCase().split(" ");

        const result = properties?.filter((data) => {
            return valArray.some((word) => {
                if (word === "verified") return data?.isVerified === true;
                return (
                    data?.name?.toLowerCase().includes(word) ||
                    data?.owner?.profile?.lastName?.toLowerCase().includes(word) ||
                    data?.owner?.email?.toLowerCase().includes(word) ||
                    data?.state?.toLowerCase().includes(word) ||
                    data?.propertyType?.toLowerCase().includes(word)
                );
            });
        });
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
        <div className="full py-6">
            <div className="mb-6">
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 12, lg: user?.role === "OWNER" || user?.role === "ADMIN" ? 9 : 12, }}>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                                <StatsCard
                                    title="Total Revenue"
                                    amount={`₦${(stats?.totalRevenue?.lastMonthAmount || 0).toLocaleString()}`}
                                    percentage={stats?.totalRevenue?.percentageChange || 0}
                                    isIncrease={parseFloat(stats?.totalRevenue?.percentageChange || "0") > 0}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                                <StatsCard
                                    title="Total Payments"
                                    amount={`₦${(stats?.totalPayments?.lastMonthAmount || 0).toLocaleString()}`}
                                    percentage={stats?.totalPayments?.percentageChange || 0}
                                    isIncrease={parseFloat(stats?.totalPayments?.percentageChange || "0") > 0}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                                <StatsCard
                                    title="Total Properties"
                                    amount={`${(stats?.totalProperties?.lastMonthTotal || 0).toLocaleString()}`}
                                    percentage={stats?.totalProperties?.percentageChange || 0}
                                    isIncrease={parseFloat(stats?.totalProperties?.percentageChange || "0") > 0}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 6, lg: 6 }}>
                                <div className={`p-[20px] h-[270px] border border-[#D9D9D9] rounded-[15px] bg-white shadow-md ${!stats?.users?.length && "flex items-center justify-center"}`}>
                                    {isStatLoading ? (
                                        <Skeleton className="h-[200px] w-full rounded-md" />
                                    ) : stats?.users?.length > 0 ? (
                                        <div>
                                            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-1 mb-1">
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
                                                <select className="border border-[#D9D9D9] p-1 rounded-[6px]" onChange={(e) => setRange(e.target.value)} value={range}>
                                                    <option value="year">This Year</option>
                                                </select>
                                            </div>
                                            <UsersChart range={range} data={dataByRange} />
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Icon icon="hugeicons:album-not-found-01" width="40" height="40" className="text-gray-400" />
                                            <p className="text-gray-500 text-sm font-medium">No Data Found</p>
                                        </div>
                                    )}
                                </div>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6, lg: 6 }}>
                                <div className="p-[20px] h-[270px] border border-[#D9D9D9] rounded-[15px] bg-white shadow-md">
                                    {isStatLoading ? (
                                        <Skeleton className="h-[200px] w-full rounded-md" />
                                    ) : stats?.properties?.length > 0 ? (
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
                                        <div className="flex flex-col items-center justify-center gap-2 py-10">
                                            <Icon icon="hugeicons:album-not-found-01" width="40" height="40" className="text-gray-400" />
                                            <p className="text-gray-500 text-sm font-medium">No Data Found</p>
                                        </div>
                                    )}
                                </div>
                            </Grid>
                        </Grid>
                    </Grid>
                    {user?.role === "OWNER" || user?.role === "ADMIN" ? (
                        <Grid size={{ xs: 12, lg: 3 }}>
                            <div className="h-full p-[30px] border border-[#D9D9D9] rounded-[15px] bg-white shadow-md">
                                <h3>Top Performing Agents</h3>
                                <Table columns={topAgentColumns} rows={stats?.topListings || []} getRowId={(row: any) => row.agent?.id} pagination={false} />
                            </div>
                        </Grid>
                    ) : null}
                </Grid>
            </div>
            <div className="p-[30px] mb-20 border border-[#D9D9D9] rounded-[15px] bg-white shadow-md">
                {loading ? (
                    <Skeleton className="h-[300px] w-full rounded-md" />
                ) : (
                    <>
                        <div className="flex items-center gap-4">
                            <TableSearch
                                placeholder="Search here..."
                                searchTableFunc={handleSearchProperty}
                                value={searchValue}
                            />
                            <ItemCount count={searchResult?.length} />
                        </div>
                        {searchResult?.length > 0 ? (
                            <Table
                                columns={user?.role === "OWNER" ? propertyColumns : user?.role === "ADMIN" ? adminColumns : anAgentColumns}
                                rows={searchResult}
                                getRowId={(row) => row?.id}
                                pagination={false}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-2 py-10">
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

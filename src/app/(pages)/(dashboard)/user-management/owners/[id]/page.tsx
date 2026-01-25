"use client";

import BreadCrumb from "@/src/components/breadcrumb";
import Grid from "@mui/material/Grid2";
import { API_ROUTES, BASE_API_URL } from "@/src/lib/routes/endpoints";
import { useEffect, useState, useCallback } from "react";
import axiosRequest from "@/src/lib/api";
import { toast } from "react-hot-toast";
import { Icon } from "@iconify/react";
// import Button from "@/src/components/button";
import InputGroup from "@/src/components/formcomponent/InputGroup";
import { TableSearch } from "@/src/components/table/tableAction";
import Table from "@/src/components/table/table";
import { Skeleton } from "@/components/ui/skeleton";
import { GridColDef } from "@mui/x-data-grid";
import Badge from "@/src/components/badge";
import Link from "next/link";
import { useParams } from "next/navigation";
import Image from "next/image";

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
  id: number;
  email: string;
  phone: string;
  role: Record<string, any>;
  profile: UserProfile;
  verification_token: string;
  isVerified: boolean;
  last_login: string;
  isActive: boolean;
  created_at: string;
  updated_at: string;
}

const OwnerInfo = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [searchResult, setSearchResult] = useState<Property[]>([]);
  const [userInfo, setUserInfo] = useState<User>({} as User);
  const [loading, setLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(false);
  const [searchValue, setSearchValue] = useState<string>("");
  const [error, setError] = useState<string>("");
  const params = useParams();
  const id = params?.id;
  console.log("params", params?.id);

  const fetchAUserInfo = useCallback(async () => {
    if (!id) return; // Ensure id exists before making the request

    setUserLoading(true);
    try {
      const response = await axiosRequest.get(
        `${BASE_API_URL}${API_ROUTES.admin.users.userById(Number(id))}`
      );
      console.log("response", response);
      setUserInfo(response?.data?.data);
      setUserLoading(false);
    } catch (error: any) {
      console.error("Error fetching user info:", error);
      toast.error(error.response?.data?.message, {
        duration: 6000,
        style: {
          maxWidth: "500px",
          width: "max-content",
        },
      });
    } finally {
      setUserLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAUserInfo();
  }, [fetchAUserInfo]);

  console.log("userInfo", userInfo);

  const fetchProperties = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    try {
      const response = await axiosRequest.get(
        `${BASE_API_URL}${API_ROUTES.propertyManagement.properties.base}`
      );
      console.log("response prop", response);

      const filteredProperties = response?.data?.data?.data.filter(
        (owner: Owner) => owner.id === Number(id)
      );

      setProperties(filteredProperties);
      setSearchResult(filteredProperties);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  console.log("properties", properties);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

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

  const propertyColumns: GridColDef[] = [
    // { field: "id", headerName: "ID", width: 70 },
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
    // { field: "isPetAllowed", headerName: "Pets Allowed", width: 120, type: "boolean" },
    {
      field: "agent",
      headerName: "Agent Name",
      width: 180,
      renderCell: (params) => `${params.row?.agent?.name || "--/--"}`,
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
        <Link href={`/user-management/owners/${params.row.id}`}>
          <Icon icon="mdi:eye" className="cursor-pointer text-[#514A4A] mt-4" />
        </Link>
      ),
    },
  ];
  return (
    <>
      <div className="p-[30px] mt-10 mb-100 border border-[#D9D9D9] rounded-[15px] bg-white shadow-md min-h-[calc(100vh-150px)]">
        <BreadCrumb
          description=""
          active="Property Owner info"
          link_one="/user-management/owners"
          link_one_name="Owners"
        />
        <div className="mt-0">
          <h3 className="mb-[50px] mt-[10px] font-semibold">
            Property Owner Info
          </h3>
          {userLoading ? (
            <Skeleton className="h-[500px]  mt-5 bw-full rounded-md" />
          ) : (
            <>
              <div className="relative w-[48px] h-[48px] rounded-full overflow-hidden border-2 border-gray-300">
                {userInfo?.profile?.profileImage ? (
                  <Image
                    src={userInfo?.profile?.profileImage}
                    alt="profile"
                    layout="fill"
                    objectFit="cover"
                    className="rounded-full"
                  />
                ) : (
                  <Icon
                    icon="gg:profile"
                    width="48"
                    height="48"
                    className="text-gray-500 flex items-center justify-center"
                  />
                )}
              </div>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                  <InputGroup
                    label="Legal Name"
                    required
                    disabled
                    defaultValue={`${userInfo?.profile?.lastName || "--/--"} ${
                      userInfo?.profile?.firstName || "--/--"
                    }`}
                    inputType="text"
                    inputName="name"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                  <InputGroup
                    label="Email Address"
                    required
                    disabled
                    defaultValue={userInfo?.email || "--/--"}
                    inputType="email"
                    inputName="email"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                  <InputGroup
                    label="Phone Number"
                    required
                    disabled
                    defaultValue={userInfo?.phone || "--/--"}
                    inputType="text"
                    inputName="phoneNumber"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                  <InputGroup
                    label="State"
                    required
                    disabled
                    defaultValue={userInfo?.profile?.state || "--/--"}
                    inputType="text"
                    inputName="verification"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                  <InputGroup
                    label="Address"
                    required
                    disabled
                    inputType="text"
                    defaultValue={userInfo?.profile?.address || "--/--"}
                    inputName="address"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                  <InputGroup
                    label="Gender"
                    required
                    disabled
                    defaultValue={userInfo?.profile?.gender || "--/--"}
                    inputType="text"
                    inputName="text"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                      <h4>Active</h4>
                      <Badge status={userInfo?.isActive} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 6, lg: 6 }}>
                      <h4>Verified</h4>
                      <Badge status={userInfo?.isVerified} />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </>
          )}
        </div>
        {loading ? (
          <Skeleton className="h-[300px]  mt-5 bw-full rounded-md" />
        ) : (
          <>
            <div className="mt-5">
              <TableSearch
                placeholder="Search here..."
                searchTableFunc={handleSearchProperty}
                value={searchValue}
              />
            </div>
            {searchResult?.length > 0 ? (
              <Table
                columns={propertyColumns}
                rows={searchResult}
                getRowId={(row) => row?.id}
                pagination={false}
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2">
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

export default OwnerInfo;

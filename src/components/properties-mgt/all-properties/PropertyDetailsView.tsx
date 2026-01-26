'use client'

import Image from "next/image";
import { TrashIcon } from "../../icons";
import { TbAirConditioning } from "react-icons/tb";
import { FaPlus, FaSwimmer, FaTv } from "react-icons/fa";
import { GoChecklist, GoVerified } from "react-icons/go";
import { IoCloudUploadOutline, IoLocationOutline } from "react-icons/io5";
import { PiBuildingApartment } from "react-icons/pi";
import { RiBuilding2Line } from "react-icons/ri";
import { IoStarSharp } from "react-icons/io5";
import { IoWifi } from "react-icons/io5";
import { PiBathtub } from "react-icons/pi";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import Link from "next/link";
import { useEffect, useState } from "react";
import EditProperty from "./EditPropertyView";
import { IProperty, IPropertyUnit, PropertyVerificationStatus } from "../types";
import { AssignToProperty, DeleteProperty, FeatureProperty, GetAmenities, GetSingleProperty } from "@/src/lib/request-handlers/propertyMgt";
import { Skeleton } from "@/components/ui/skeleton"
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import { useDispatch } from "react-redux";
import { showAlert } from "@/src/lib/slices/alertDialogSlice";
import { IoIosStarOutline } from "react-icons/io";
import CustomModal from "../../ui/CustomModal";
import { IoGameControllerOutline } from "react-icons/io5";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { useSearchParams } from 'next/navigation';
import { useAuth } from "@/src/hooks/useAuth";
import { UserRole } from "@/src/lib/enums";
import { Icon } from "@iconify/react/dist/iconify.js";
import AdjustableFilterDropdown from "../../ui/AdjustableFilterDropdown";
import { IUser } from "@/src/lib/types";
import { GetAllUsers } from "@/src/lib/request-handlers/userMgt";
import Spinner from "../../ui/Spinner";
import { formatDate } from "@/src/lib/utils";



export default function PropertyDetailsView({
    propertyId,
}: {
    propertyId: string;
}) {
    const dispatch = useDispatch();
    const { user } = useAuth();

    const { data, isLoading } = GetSingleProperty(propertyId)
    const { data: fetchedAmenites } = GetAmenities();
    const { mutate: deleteMutation, isPending: deleteIsPending } = DeleteProperty()
    const { mutate: assignAgent, isPending: assignmentLoading } = AssignToProperty(propertyId)
    // const { mutate, isPending } = FeatureProperty();


    const router = useRouter();
    const pathname = usePathname(); // Get current path
    const urlSearchParams = new URLSearchParams(window.location.search);
    const searchParams = useSearchParams();

    const [agentSearchTerm, setAgentSearchTerm] = useState<string>('')
    const { data: agentsList, isLoading: agentsLoading } = GetAllUsers(1, 12, agentSearchTerm, UserRole.AGENT);

    const [showVerification, setShowVerification] = useState(false);
    const [showAgentSelection, setShowAgentSelecteion] = useState(false);
    const [editMode, setEditMode] = useState<boolean>(Boolean(searchParams.get('edit')));
    const [property, setProperty] = useState<IProperty>(data?.data?.data)
    const [availabeUnits, setAvailableUnits] = useState<number>(0)
    const [averageRating, setAverageRating] = useState<number>(property?.meta?.total_reviews ? (property?.meta?.total_rating / property?.meta?.total_reviews) : 0);
    const [agents, setAgents] = useState<IUser[]>(agentsList?.data?.data?.data)
    const [selectedAgent, setSelectedAgent] = useState<IUser | null>(null)


    const setQueryParam = (key: string, value: string) => {
        urlSearchParams.set(key, value); // Add or update query param
        router.push(`${pathname}?${urlSearchParams.toString()}`); // Update the URL
    };

    const handleDelete = () => {
        dispatch(
            showAlert({
                title: "Are you sure?",
                description: "This action cannot be undone. This will permanently delete this property.",
                confirmText: "Delete",
                cancelText: "Cancel",
                onConfirm: () => {
                    if (propertyId)
                        deleteMutation(
                            { propertyId },
                            {
                                onSuccess: (response) => {
                                    console.log(response)
                                    toast.success(response?.data?.message, {
                                        duration: 6000,
                                        style: {
                                            maxWidth: '500px',
                                            width: 'max-content'
                                        }
                                    });
                                    if (response.status === 204)
                                        router.push(PAGE_ROUTES.dashboard.propertyManagement.allProperties.base)
                                }
                            }
                        )
                },
            })
        );
    };

    const handleAgentAssignment = (agentId: string) => {
        assignAgent(
            {
                payload: { agent_id: agentId }
            },
            {
                onSuccess: () => {
                    toast.success('Agent assigned successfully', {
                        duration: 6000,
                        style: {
                            maxWidth: '500px',
                            width: 'max-content'
                        }
                    });

                    setShowAgentSelecteion(false)
                    setSelectedAgent(null)
                },
                onError: () =>
                    toast.error('Something went wrong', {
                        duration: 6000,
                        style: {
                            maxWidth: '500px',
                            width: 'max-content'
                        }
                    })
            }
        )
    }

    const handleAgentSelection = (email: string) => {
        const filteredUsers = agents?.filter(el => {
            if (el?.email === email) return el;
        })
        setSelectedAgent(filteredUsers[0])
    }

    useEffect(() => {
        setAgents(agentsList?.data?.data?.data)
    }, [agentsList])

    useEffect(() => {
        if (data) {
            setProperty(data?.data?.data)
            let unitAmount = 0
            if (data?.data?.data?.units && Array.isArray(data?.data?.data?.units)) {
                data?.data?.data?.units.forEach((el: IPropertyUnit) => {
                    // If count exists, use it; otherwise count each unit as 1
                    const count = el.count ? Number(el.count) : 1;
                    unitAmount += count;
                })
            }
            setAvailableUnits(unitAmount)
            setAverageRating(property?.meta?.total_reviews ? (property?.meta?.total_reviews / property?.meta?.average_rating) : 0)
        }

    }, [data, property?.meta?.average_rating, property?.meta?.total_reviews])

    return (
        <div className="p-10 w-full">
            <div className="w-full border border-zinc-500/20 bg-white rounded-xl p-10 min-h-[50vh]">
                {
                    isLoading && !property ?
                        <div className="flex flex-col space-y-3">
                            <Skeleton className="w-full h-72 rounded-xl" />
                            <div className="space-y-4 mt-4">
                                <Skeleton className="h-20 w-full" />
                                <Skeleton className="h-20 w-full" />
                            </div>
                        </div>
                        : !isLoading && !property ?
                            <div className="size-full text-center text-gray-500 pt-10 self-center">
                                <div className="m-auto w-fit">
                                    <Icon icon="mynaui:danger-octagon" width="40" height="40" className="text-red-600 " />
                                </div>
                                <p className="text-center text-gray-500">
                                    Error loading unit
                                </p>
                            </div>
                            :
                            <>
                                <div className="w-full relative">
                                    <Swiper
                                        loop={true}
                                        modules={[Navigation, Autoplay]}
                                        spaceBetween={10}
                                        slidesPerView={property?.media.length > 1 ? 2 : 1}
                                        navigation
                                        autoplay
                                        className="rewind"
                                    >
                                        {
                                            property?.media?.map((el: any, index: any) => (
                                                <SwiperSlide key={index}>
                                                    <Image
                                                        alt={`${property?.name}_img_${index}`}
                                                        src={el.mediaUrl}
                                                        className="w-full rounded-xl"
                                                        width={900}
                                                        height={900}
                                                    />
                                                </SwiperSlide>
                                            ))
                                        }
                                    </Swiper>
                                </div>

                                {
                                    !editMode ?
                                        <>
                                            <div className="w-full mt-10 flex justify-between items-center">
                                                <div>
                                                    <div className="flex flex-wrap items-start gap-2">
                                                        <h3 className="text-3xl font-normal text-zinc-800">
                                                            {property?.name}
                                                        </h3>
                                                        {
                                                            property?.isVerified &&
                                                            <span className="text-sm text-teal-800 border border-teal-800 rounded-full px-2 "><em>Verified {property?.verifications?.[0]?.verificationDate && `on ${formatDate(property?.verifications?.[0]?.verificationDate)}`}</em></span>
                                                        }
                                                    </div>
                                                    <div className="flex gap-2 items-center mt-2 text-xl text-zinc-700">
                                                        <IoLocationOutline />
                                                        <p className="text-base">
                                                            {property?.address}
                                                        </p>
                                                    </div>
                                                    <div className="flex justify-between items-center gap-6 mt-3 ">
                                                        {
                                                            property?.amenities?.map((el, index) =>
                                                                <div key={index} className="flex items-center  gap-2 ">
                                                                    {
                                                                        el.name === 'AIR CONDITIONER'
                                                                            ? <TbAirConditioning className="text-xl" />
                                                                            : el.name === 'HOT TUB'
                                                                                ? <PiBathtub className="text-xl" />
                                                                                : el.name === 'Wi-FI'
                                                                                    ? <IoWifi className="text-xl" />
                                                                                    : el.name === 'PS5'
                                                                                        ? < IoGameControllerOutline className="text-xl" />
                                                                                        : el?.name === 'TV'
                                                                                            ? <FaTv className="text-xl" />
                                                                                            : <FaSwimmer />
                                                                    }
                                                                    <span>{el.name}</span>
                                                                </div>
                                                            )
                                                        }
                                                    </div>
                                                    {
                                                        <Link href={PAGE_ROUTES.dashboard.propertyManagement.allProperties.verifications.base(propertyId)}>
                                                            <em className="text-teal-800 text-sm underline">
                                                                View verifications
                                                            </em>
                                                        </Link>
                                                    }
                                                </div>
                                                <div className="flex flex-col items-center gap-0 pr-3 mt-2">
                                                    <p className="text-base text-primary font-medium m-0">
                                                        {averageRating}/5
                                                    </p>
                                                    <div className="flex justify-center items-center gap-1 mb-1">
                                                        {[...Array(5)].map((_, index) => (
                                                            index < Math.round(averageRating) ?
                                                                <IoStarSharp className="text-primary text-lg" key={index} /> :
                                                                <IoIosStarOutline className="text-primary text-lg" key={index} />
                                                        ))}
                                                    </div>
                                                    <p className="text-base text-primary font-medium mt-2">
                                                        {property?.meta?.total_reviews ?? 0} Reviews
                                                    </p>
                                                </div>
                                            </div>

                                            {
                                                user?.role === UserRole.ADMIN && (!property?.isVerified || !property?.agent) &&
                                                <div className="flex justify-between items-center gap-4 mt-7 mb-5 w-full px-4 py-3 border-dashed border-2 border-zinc-400 rounded-lg">
                                                    <p className="text-xl text-zinc-500">
                                                        This property has not been verified yet!
                                                    </p>
                                                    <div className="flex justify-center items-center gap-5">
                                                        {
                                                            property?.agent ?
                                                                <span onClick={() => router.push(PAGE_ROUTES.dashboard.propertyManagement.allProperties.verifications.details(property?.id, property?.verifications?.[0]?.id))} className="cursor-pointer pl-2 text-zinc-800"><u>View verification details</u></span>
                                                                :
                                                                <button type='button' onClick={() => setShowAgentSelecteion(!showVerification)} className="cursor-pointer  flex gap-3 items-center border border-primay/90 rounded-lg px-5 py-1.5 text-lg text-white bg-primary/90 hover:bg-primary disabled:cursor-not-allowed disabled:opacity-75 disabled:hover:bg-transparent">
                                                                    <span>Assign agent</span>
                                                                    <IoCloudUploadOutline className="text-2xl text-medium" />
                                                                </button>
                                                        }
                                                    </div>
                                                </div>
                                            }

                                            <div className="h-px w-full bg-zinc-400/30 mb-5" />

                                            <p className="text-2xl text-zinc-900 mt-8">
                                                Property description
                                            </p>

                                            <p className="text-base text-zinc-700 mt-4">
                                                {property?.description}
                                            </p>

                                            <div className="h-px w-full bg-zinc-400/30 my-5" />

                                            <div className="my-10">
                                                <div className="text-2xl text-zinc-900 flex items-center justify-between">
                                                    <p>
                                                        Available units
                                                    </p>
                                                    <Link href={PAGE_ROUTES.dashboard.propertyManagement.allProperties.units.create(property?.id)} className="cursor-pointer text-base text-primary/90 group flex items-center gap-2">
                                                        Add Units
                                                        <span>
                                                            <FaPlus className="text-primary/90" />
                                                        </span>
                                                    </Link>
                                                </div>

                                                <div className="w-full grid grid-cols-3 mt-2 p-3 gap-6">
                                                    {
                                                        property?.units.map((el, index) =>
                                                            <Link href={PAGE_ROUTES.dashboard.propertyManagement.allProperties.units.details(property?.id, el.id)} key={index} className="cursor-pointer border border-zinc-300 rounded-lg flex justify-between ease-in-out duration-150 hover:border-primary/80">
                                                                <div className="w-full px-4 py-3 text-zinc-900">
                                                                    <p className="font-medium text-lg mt-0 mb-1">
                                                                        {el.name}
                                                                    </p>
                                                                    <p className="font-normal text-base mt-0 truncate">
                                                                        {el.description}
                                                                    </p>
                                                                    <p className="font-normal text-sm mt-1 ">
                                                                        <em>
                                                                            {el.count}{` ${el.count > 1 ? 'units' : 'unit'}`} available
                                                                        </em>
                                                                    </p>
                                                                </div>
                                                            </Link>
                                                        )
                                                    }
                                                    {
                                                        property?.units.length === 0 && <em className="text-sm text-zinc-700 mt-4">You haven't created units for this property</em>
                                                    }
                                                    {
                                                        property?.units.length > 5 &&
                                                        <div className="flex justify-start items-end">
                                                            <p className="underline hover:text-primary/80 cursor-pointer text-xl">
                                                                View more
                                                            </p>
                                                        </div>
                                                    }
                                                </div>

                                            </div>

                                            <div className="h-px w-full bg-zinc-400/30 my-5" />

                                            <div className="my-10">
                                                <p className="text-2xl text-zinc-900">
                                                    Attached profiles
                                                </p>

                                                <div className="flex gap-4 items-center mt-4 justify-between w-[90%]">

                                                    {
                                                        user?.role !== UserRole.OWNER &&
                                                        <div className="">
                                                            <p className="font-medium">
                                                                Owner
                                                            </p>
                                                            <div className="flex gap-4 items-center rounded-full mt-3 pl-5">
                                                                <Image
                                                                    alt="owner-image"
                                                                    src={property?.owner?.profile?.profileImage ?? '/png/sample_profile.png'}
                                                                    height={50}
                                                                    width={60}
                                                                />
                                                                <div>
                                                                    <p className="text-lg text-zinc-900 m-0">{`${property?.owner?.profile?.firstName ?? `--/--`} ${property?.owner?.profile?.lastName ?? `--/--`}`}</p>
                                                                    <p className="text-base text-zinc-500">{`${property?.owner?.email ?? '--/--'}`}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    }

                                                    {
                                                        property?.agent && user?.role !== UserRole.AGENT &&
                                                        <div className="">
                                                            <p className="font-medium">
                                                                Agent
                                                            </p>
                                                            <div className="flex gap-4 items-center rounded-full mt-3 pl-5">
                                                                <Image
                                                                    alt="owner-image"
                                                                    src={property?.agent?.profile?.profileImage ?? '/png/sample_profile.png'}
                                                                    height={50}
                                                                    width={60}
                                                                />
                                                                <div>
                                                                    <p className="text-lg text-zinc-900 m-0">{`${property?.agent?.profile?.firstName ?? '--/--'} ${property?.agent?.profile?.lastName ?? '--/--'}`}</p>
                                                                    <p className="text-base text-zinc-500">{`${property?.agent?.email ?? '--/--'}`}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    }
                                                </div>
                                            </div>

                                            <div className="h-px w-full bg-zinc-400/30 my-5" />

                                            <div className="mt-10 w-2/3">
                                                <p className="text-2xl text-zinc-900">
                                                    Stats
                                                </p>
                                                <div className="mt-6 grid grid-cols-3 grid-flow-row gap-x-3 gap-y-8">
                                                    <div>
                                                        <div className="flex gap-3 text-zinc-700">
                                                            <GoVerified className="text-2xl font-medium" />
                                                            <span className="text-base">Status</span>
                                                        </div>
                                                        {
                                                            property?.isVerified ?
                                                                <p className="text-base  text-teal-900 bg-primary/20 rounded-lg px-5 py-1 mt-2 max-w-min">
                                                                    Verified
                                                                </p>
                                                                :
                                                                <p className="text-base  text-red-600 bg-red-600/15 rounded-lg px-5 py-1 mt-2 max-w-min">
                                                                    Unverified
                                                                </p>
                                                        }
                                                    </div>
                                                    <div>
                                                        <div className="flex gap-3 text-zinc-700">
                                                            <PiBuildingApartment className="text-2xl " />
                                                            <span className="text-base">Total units availabe</span>
                                                        </div>
                                                        <p className="text-2xl font-medium text-zinc-800 mt-2">
                                                            {availabeUnits}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <div className="flex gap-3 text-zinc-700">
                                                            <GoChecklist className="text-2xl" />
                                                            <span className="text-base">Listed on</span>
                                                        </div>
                                                        <p className="text-xl font-medium text-zinc-800 mt-2">
                                                            {property?.isVerified ? formatDate(property?.verifications?.[0]?.verificationDate ?? '2025-1-13') : <em className="text-base text-zinc-400 font-normal">Not listed</em>}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <div className="flex gap-3 text-zinc-700">
                                                            <RiBuilding2Line className="text-2xl" />
                                                            <span className="text-base">Property type</span>
                                                        </div>
                                                        <p className="text-2xl font-medium text-zinc-800 mt-2 capitalize">
                                                            {property?.propertyType?.toLocaleLowerCase()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex justify-end items-center gap-5 mt-3">
                                                <div
                                                    onClick={() => {
                                                        setEditMode(true)
                                                        setQueryParam('edit', 'true')
                                                    }}
                                                    className="cursor-pointer border border-zinc-500 rounded-lg px-5 py-2.5 text-lg text-zinc-600 hover:bg-zinc-600 hover:text-white">
                                                    Edit
                                                </div>
                                                <div onClick={() => handleDelete()} className="cursor-pointer border border-red-500 rounded-md px-3 py-2.5 text-lg text-white bg-red-600 hover:bg-red-700">
                                                    <TrashIcon className="size-6" color="white" />
                                                </div>
                                            </div>
                                        </>
                                        :
                                        <EditProperty
                                            propertyData={property}
                                            handleEditMode={setEditMode}
                                            availableAmenities={fetchedAmenites?.data?.data}
                                        />
                                }

                                <CustomModal
                                    isOpen={showVerification}
                                    onClose={() => setShowVerification(false)}
                                    title="Property verification details"
                                >
                                    <div className="w-full p-3 flex flex-col justify-between gap-7">
                                        <div className='my-2'>
                                            <p className="text-lg zinc-900 font-medium">Agent</p>
                                            <div className="flex gap-4 items-center rounded-full">
                                                <Image
                                                    alt="agent-image"
                                                    src={property?.agent?.profile?.profileImage ?? '/png/sample_profile.png'}
                                                    height={50}
                                                    width={60}
                                                />
                                                <div>
                                                    <p className="text-xl font-medium text-zinc-900 m-0">{`${property?.agent?.profile?.firstName ?? 'Kunle'} ${property?.agent?.profile?.lastName ?? 'Aina'}`} <span className="text-base font-normal text-zinc-600"><em> (Assigned agent)</em></span></p>
                                                    <p className="text-lg text-zinc-700">{`${property?.agent?.email ?? 'agent007@aparteng.com'}`}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className='my-2'>
                                            <p className="text-lg zinc-900 font-medium">Agent feedback</p>
                                            <p className="text-lg font-medium text-zinc-900">
                                                {
                                                    property?.verifications?.[0]?.feedback ??
                                                    <em className="text-zinc-400 font-normal">No comments yet</em>
                                                }
                                            </p>
                                        </div>

                                        <div className='my-2'>
                                            <p className="text-lg zinc-900 font-medium">KYC details</p>
                                            <p className="text-lg font-medium text-zinc-900">
                                                <em className="text-zinc-400 font-normal">Coming soon...</em>
                                            </p>
                                        </div>


                                    </div>
                                </CustomModal>


                                <CustomModal
                                    isOpen={showAgentSelection}
                                    onClose={() => {
                                        setShowAgentSelecteion(false)
                                        setSelectedAgent(null)
                                    }}
                                    title="Assign agent to property"
                                >
                                    <div className="w-full">
                                        {
                                            !selectedAgent ?
                                                <div className="relative my-3">
                                                    <label htmlFor="city" className="text-lg zinc-900 font-normal">Search agents</label>
                                                    <AdjustableFilterDropdown
                                                        placeholder={`E.g. Abiola Graham`}
                                                        options={agents?.map(el => el?.email)}
                                                        handleSelection={
                                                            (val) => handleAgentSelection(val)
                                                        }
                                                        searchTerm={agentSearchTerm}
                                                        setSearchTerm={setAgentSearchTerm}
                                                        isLoading={agentsLoading}
                                                    />
                                                </div>
                                                :
                                                <div>
                                                    <div className="my-8">
                                                        <div className="flex gap-4 items-center rounded-full mt-3">
                                                            <Image
                                                                alt="agent-image"
                                                                src={selectedAgent?.profile?.profileImage ?? '/png/sample_profile.png'}
                                                                height={50}
                                                                width={60}
                                                            />
                                                            <div>
                                                                <p className="text-lg text-zinc-900 m-0">{`${selectedAgent?.profile?.firstName ?? 'Kunle'} ${selectedAgent?.profile?.lastName ?? 'Aina'}`}</p>
                                                                <p className="text-base text-zinc-500">{`${selectedAgent?.email}`}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <p className="text-base text-zinc-800 font-normal my-5">
                                                        You're about to assign {`${selectedAgent?.profile?.firstName ?? 'James'} ${selectedAgent?.profile?.lastName ?? 'Bond'}`} to this property.
                                                        <br />
                                                        <strong>Are you sure?</strong>
                                                    </p>
                                                    <div className="flex justify-between items-center gap-5 mt-10 w-full">
                                                        <button
                                                            type='button'
                                                            onClick={() => {
                                                                setSelectedAgent(null)
                                                            }}
                                                            disabled={assignmentLoading}
                                                            className="font-medium rounded-lg px-5 py-2.5 text-lg bg-red-600 text-white hover:bg-red-700 disabled:hover:bg-red-600 disabled:opacity-75 disabled:cursor-not-allowed"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => handleAgentAssignment(String(selectedAgent?.id))}
                                                            disabled={assignmentLoading}
                                                            type='button'
                                                            className="rounded-lg px-5 py-2.5 text-lg font-medium bg-primary/90 text-white hover:bg-primary disabled:hover:bg-primary/90 disabled:opacity-75 disabled:cursor-not-allowed">
                                                            {assignmentLoading ? <Spinner /> : 'Assign'}
                                                        </button>
                                                    </div>

                                                </div>
                                        }
                                    </div>
                                </CustomModal>
                            </>
                }
            </div>
        </div>
    );
}
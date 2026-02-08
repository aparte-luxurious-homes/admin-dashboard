'use client'

import Image from "next/image";
import { TrashIcon } from "../../icons";
import { TbAirConditioning } from "react-icons/tb";
import { FaPlus, FaSwimmer, FaTv } from "react-icons/fa";
import { GoChecklist, GoVerified } from "react-icons/go";
import { IoCloudUploadOutline, IoLocationOutline } from "react-icons/io5";
import { PiBuildingApartment } from "react-icons/pi";
import { RiBuilding2Line } from "react-icons/ri";
import { IoStarSharp, IoBedOutline } from "react-icons/io5";
import { IoWifi } from "react-icons/io5";
import { PiBathtub } from "react-icons/pi";
import { TbToolsKitchen } from "react-icons/tb";
import { LuUsers } from "react-icons/lu";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import { HiOutlinePencilAlt } from "react-icons/hi";
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
    const [showAgentSelection, setShowAgentSelection] = useState(false);
    const [editMode, setEditMode] = useState<boolean>(Boolean(searchParams.get('edit')));
    const [property, setProperty] = useState<IProperty>(data?.data?.data)
    const [availableUnits, setAvailableUnits] = useState<number>(0)
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

                    setShowAgentSelection(false)
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
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                    {/* Main Content Column */}
                                    <div className="lg:col-span-8 space-y-8">
                                        {/* Premium Hero Section */}
                                        <div className="relative rounded-2xl overflow-hidden group shadow-xl bg-zinc-100 min-h-[400px]">
                                            <Swiper
                                                loop={true}
                                                modules={[Navigation, Autoplay]}
                                                spaceBetween={10}
                                                slidesPerView={1}
                                                navigation
                                                autoplay={{ delay: 5000 }}
                                                className="h-full w-full"
                                            >
                                                {property?.media?.length > 0 ? (
                                                    property?.media?.map((el: any, index: any) => (
                                                        <SwiperSlide key={index}>
                                                            <div className="relative w-full aspect-video">
                                                                <Image
                                                                    alt={`${property?.name}_img_${index}`}
                                                                    src={el.media_url || el.mediaUrl || "/png/placeholder.png"}
                                                                    fill
                                                                    className="object-cover"
                                                                    priority={index === 0}
                                                                />
                                                            </div>
                                                        </SwiperSlide>
                                                    ))
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-[400px] text-zinc-400">
                                                        <PiBuildingApartment className="text-6xl mb-4" />
                                                        <p>No images available for this property</p>
                                                    </div>
                                                )}
                                            </Swiper>

                                            {/* Floating Info Overlay */}
                                            <div className="absolute top-4 left-4 z-10 flex gap-2">
                                                <span className="px-3 py-1.5 bg-black/60 backdrop-blur-md text-white text-xs font-semibold rounded-full uppercase tracking-wider">
                                                    {(property?.propertyType || property?.property_type)}
                                                </span>
                                                {(property?.isVerified || property?.is_verified) && (
                                                    <span className="px-3 py-1.5 bg-teal-500/80 backdrop-blur-md text-white text-xs font-semibold rounded-full flex items-center gap-1">
                                                        <GoVerified className="text-sm" /> Verified
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {!editMode ? (
                                            <>
                                                {/* Title and Description */}
                                                <section className="space-y-4">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <h1 className="text-4xl font-bold text-zinc-900 tracking-tight">
                                                                {property?.name}
                                                            </h1>
                                                            <div className="flex items-center gap-2 text-zinc-500 mt-2">
                                                                <IoLocationOutline className="text-xl text-primary" />
                                                                <p className="text-lg font-medium">{property?.address}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="flex items-center gap-1.5 bg-primary/5 px-3 py-2 rounded-xl">
                                                                <span className="text-xl font-bold text-primary">{averageRating.toFixed(1)}</span>
                                                                <div className="flex">
                                                                    {[...Array(5)].map((_, i) => (
                                                                        <IoStarSharp
                                                                            key={i}
                                                                            className={i < Math.round(averageRating) ? 'text-primary' : 'text-zinc-200'}
                                                                        />
                                                                    ))}
                                                                </div>
                                                                <span className="text-zinc-400 text-sm ml-1">({property?.meta?.total_reviews ?? 0})</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="bg-zinc-50 rounded-2xl p-6 border border-zinc-100">
                                                        <h3 className="text-lg font-bold text-zinc-800 mb-3 flex items-center gap-2">
                                                            <Icon icon="solar:document-text-bold-duotone" className="text-xl text-primary" />
                                                            About this property
                                                        </h3>
                                                        <p className="text-zinc-600 leading-relaxed text-lg">
                                                            {property?.description || "No description provided for this luxury property."}
                                                        </p>
                                                    </div>
                                                </section>

                                                {/* Amenities Grid */}
                                                <section className="space-y-4">
                                                    <h3 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
                                                        <Icon icon="solar:checklist-bold-duotone" className="text-2xl text-primary" />
                                                        Luxury Amenities
                                                    </h3>
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                                        {property?.amenities?.map((el, index) => (
                                                            <div key={index} className="flex flex-col items-center justify-center p-4 bg-white border border-zinc-200 rounded-2xl hover:border-primary/50 hover:shadow-md transition-all group">
                                                                <div className="mb-2 p-3 bg-zinc-50 rounded-xl group-hover:bg-primary/10 transition-colors">
                                                                    {el.name === 'AIR CONDITIONER' ? <TbAirConditioning className="text-2xl text-zinc-600 group-hover:text-primary" />
                                                                        : el.name === 'HOT TUB' ? <PiBathtub className="text-2xl text-zinc-600 group-hover:text-primary" />
                                                                            : el.name === 'Wi-FI' ? <IoWifi className="text-2xl text-zinc-600 group-hover:text-primary" />
                                                                                : el.name === 'PS5' ? <IoGameControllerOutline className="text-2xl text-zinc-600 group-hover:text-primary" />
                                                                                    : el?.name === 'TV' ? <FaTv className="text-2xl text-zinc-600 group-hover:text-primary" />
                                                                                        : <FaSwimmer className="text-2xl text-zinc-600 group-hover:text-primary" />}
                                                                </div>
                                                                <span className="text-sm font-semibold text-zinc-700 text-center">{el.name}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </section>

                                                {/* Units Section */}
                                                <section className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
                                                            <Icon icon="solar:home-2-bold-duotone" className="text-2xl text-primary" />
                                                            Available Units
                                                        </h3>
                                                        <Link
                                                            href={PAGE_ROUTES.dashboard.propertyManagement.allProperties.units.create(property?.id)}
                                                            className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary font-bold rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"
                                                        >
                                                            <FaPlus className="text-xs" />
                                                            Add New Unit
                                                        </Link>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {property?.units.length > 0 ? (
                                                            property?.units.map((el, index) => (
                                                                <Link
                                                                    href={PAGE_ROUTES.dashboard.propertyManagement.allProperties.units.details(property?.id, el.id)}
                                                                    key={index}
                                                                    className="group flex flex-col bg-white border border-zinc-200 rounded-2xl overflow-hidden hover:border-primary/50 hover:shadow-xl transition-all h-full"
                                                                >
                                                                    <div className="relative h-48 bg-zinc-100 overflow-hidden">
                                                                        {el.media && el.media.length > 0 ? (
                                                                            <Image
                                                                                src={el.media[0].media_url || el.media[0].mediaUrl || "/png/placeholder.png"}
                                                                                alt={el.name}
                                                                                fill
                                                                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                                            />
                                                                        ) : (
                                                                            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-300">
                                                                                <PiBuildingApartment className="text-5xl" />
                                                                                <span className="text-xs font-semibold mt-2">NO IMAGE</span>
                                                                            </div>
                                                                        )}
                                                                        <div className="absolute top-3 right-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm">
                                                                            <p className="text-sm font-bold text-primary">
                                                                                ₦{Number(el.price_per_night ?? el.pricePerNight ?? 0).toLocaleString()} <span className="text-[10px] font-normal text-zinc-500">/night</span>
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="p-4 flex flex-col flex-1">
                                                                        <h4 className="font-bold text-xl text-zinc-800 mb-1 group-hover:text-primary transition-colors">{el.name}</h4>
                                                                        <p className="text-sm text-zinc-500 line-clamp-2 mb-4 flex-1">{el.description || "View this premium property unit."}</p>
                                                                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-zinc-100">
                                                                            <div className="flex items-center gap-1.5 text-zinc-600 text-xs font-semibold">
                                                                                <IoBedOutline className="text-primary" /> {el.bedroom_count ?? el.bedroomCount ?? 0} Beds
                                                                            </div>
                                                                            <div className="flex items-center gap-1.5 text-zinc-600 text-xs font-semibold">
                                                                                <PiBathtub className="text-primary" /> {el.bathroom_count ?? el.bathroomCount ?? 0} Baths
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </Link>
                                                            ))
                                                        ) : (
                                                            <div className="col-span-2 p-12 bg-zinc-50 border border-dashed border-zinc-200 rounded-3xl flex flex-col items-center justify-center text-zinc-400">
                                                                <Icon icon="solar:box-minimalistic-bold-duotone" className="text-6xl mb-4" />
                                                                <p className="font-semibold italic">No units created for this property yet.</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </section>
                                            </>
                                        ) : (
                                            <EditProperty
                                                propertyData={property}
                                                handleEditMode={setEditMode}
                                                availableAmenities={fetchedAmenites?.data?.data}
                                            />
                                        )}
                                    </div>

                                    {/* Sidebar Column */}
                                    <div className="lg:col-span-4 space-y-6">
                                        {/* Status and Visibility Alert */}
                                        {user?.role === UserRole.ADMIN && (!property?.isVerified && !property?.is_verified || !property?.agent) && (
                                            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 shadow-sm">
                                                <div className="flex items-start gap-4 mb-4">
                                                    <div className="p-3 bg-amber-100 rounded-2xl">
                                                        <Icon icon="solar:danger-bold-duotone" className="text-2xl text-amber-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-amber-900 leading-tight">Verification Required</p>
                                                        <p className="text-sm text-amber-700 mt-1">This property is currently not visible to public users.</p>
                                                    </div>
                                                </div>
                                                {property?.agent ? (
                                                    <button
                                                        onClick={() => {
                                                            const verificationId = property?.verifications?.[0]?.id;
                                                            if (verificationId) {
                                                                router.push(PAGE_ROUTES.dashboard.propertyManagement.allProperties.verifications.details(property?.id, verificationId));
                                                            } else {
                                                                router.push(PAGE_ROUTES.dashboard.propertyManagement.allProperties.verifications.base(propertyId));
                                                            }
                                                        }}
                                                        className="w-full py-3 bg-white border border-amber-300 text-amber-800 font-bold rounded-2xl hover:bg-amber-100 transition-all text-sm"
                                                    >
                                                        Review Details
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => setShowAgentSelection(true)}
                                                        className="w-full py-3 bg-amber-600 text-white font-bold rounded-2xl hover:bg-amber-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-amber-200"
                                                    >
                                                        <IoCloudUploadOutline className="text-xl" />
                                                        Assign Agent
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {/* Quick Stats Card */}
                                        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
                                            <h3 className="text-xl font-bold text-zinc-900 mb-6 flex items-center gap-2 border-b border-zinc-100 pb-4">
                                                <Icon icon="solar:chart-2-bold-duotone" className="text-primary text-2xl" />
                                                Property Overview
                                            </h3>
                                            <div className="space-y-6">
                                                <div className="flex justify-between items-center group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-zinc-50 rounded-lg group-hover:bg-primary/10 transition-colors">
                                                            <GoVerified className="text-zinc-500 group-hover:text-primary" />
                                                        </div>
                                                        <span className="text-zinc-600 font-medium">Status</span>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${property?.isVerified || property?.is_verified ? 'bg-teal-100 text-teal-800' : 'bg-red-100 text-red-800'}`}>
                                                        {property?.isVerified || property?.is_verified ? 'Verified' : 'Unverified'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-zinc-50 rounded-lg group-hover:bg-primary/10 transition-colors">
                                                            <PiBuildingApartment className="text-zinc-500 group-hover:text-primary" />
                                                        </div>
                                                        <span className="text-zinc-600 font-medium">Inventory</span>
                                                    </div>
                                                    <span className="text-zinc-900 font-bold">{availableUnits} Units</span>
                                                </div>
                                                <div className="flex justify-between items-center group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-zinc-50 rounded-lg group-hover:bg-primary/10 transition-colors">
                                                            <GoChecklist className="text-zinc-500 group-hover:text-primary" />
                                                        </div>
                                                        <span className="text-zinc-600 font-medium">Listed on</span>
                                                    </div>
                                                    <span className="text-zinc-900 font-bold text-sm">
                                                        {(property?.isVerified || property?.is_verified) ? (property?.verifications?.[0]?.verificationDate ? formatDate(property?.verifications?.[0]?.verificationDate) : 'Recently') : 'Not Listed'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-zinc-50 rounded-lg group-hover:bg-primary/10 transition-colors">
                                                            <RiBuilding2Line className="text-zinc-500 group-hover:text-primary" />
                                                        </div>
                                                        <span className="text-zinc-600 font-medium">Type</span>
                                                    </div>
                                                    <span className="text-zinc-900 font-bold capitalize">{(property?.propertyType || property?.property_type)?.toLowerCase()}</span>
                                                </div>
                                            </div>

                                            <div className="mt-8 pt-6 border-t border-zinc-100 flex flex-col gap-3">
                                                {!editMode && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => { setEditMode(true); setQueryParam('edit', 'true'); }}
                                                            className="flex-1 h-9 bg-zinc-900 text-white font-semibold rounded-lg hover:bg-zinc-800 transition-all shadow-sm flex items-center justify-center gap-2 active:scale-[0.98] text-[10px] uppercase tracking-wider"
                                                        >
                                                            <HiOutlinePencilAlt className="text-base" />
                                                            <span>Edit</span>
                                                        </button>
                                                        <button
                                                            onClick={handleDelete}
                                                            className="flex-1 h-9 bg-red-50 text-red-600 font-semibold rounded-lg hover:bg-red-100 transition-all flex items-center justify-center border border-red-100 gap-2 active:scale-[0.98] text-[10px] uppercase tracking-wider"
                                                        >
                                                            <TrashIcon className="w-3" color="#dc2626" />
                                                            <span>Delete</span>
                                                        </button>
                                                    </div>
                                                )}
                                                <Link
                                                    href={PAGE_ROUTES.dashboard.propertyManagement.allProperties.verifications.base(propertyId)}
                                                    className="w-full py-3 text-center text-zinc-500 text-sm font-medium hover:text-primary transition-colors underline"
                                                >
                                                    View complete verification history
                                                </Link>
                                            </div>
                                        </div>

                                        {/* Profiles Section */}
                                        <div className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm">
                                            <h3 className="text-xl font-bold text-zinc-900 mb-6 flex items-center gap-2 border-b border-zinc-100 pb-4">
                                                <Icon icon="solar:users-group-rounded-bold-duotone" className="text-primary text-2xl" />
                                                Management
                                            </h3>
                                            <div className="space-y-8">
                                                {user?.role !== UserRole.OWNER && (
                                                    <div className="group">
                                                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Owner</p>
                                                        <div className="flex gap-4 items-center">
                                                            <div className="relative">
                                                                <Image
                                                                    alt="owner-image"
                                                                    src={(property?.owner?.profile?.profileImage || property?.owner?.profile?.profile_image) ?? '/png/sample_profile.png'}
                                                                    height={56}
                                                                    width={56}
                                                                    className="rounded-full object-cover ring-2 ring-zinc-50 group-hover:ring-primary/20 transition-all"
                                                                />
                                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-teal-500 border-2 border-white rounded-full"></div>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-lg font-bold text-zinc-900 truncate">
                                                                    {property?.owner?.profile?.firstName ? `${property?.owner?.profile?.firstName} ${property?.owner?.profile?.lastName}` : property?.owner?.email || 'Aparte Partner'}
                                                                </p>
                                                                <p className="text-sm text-zinc-500 truncate">{property?.owner?.email ?? '--/--'}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="h-px w-full bg-zinc-50" />

                                                {property?.agent && user?.role !== UserRole.AGENT ? (
                                                    <div className="group">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Assigned Agent</p>
                                                            {user?.role === UserRole.ADMIN && !editMode && (
                                                                <button
                                                                    onClick={() => setShowAgentSelection(true)}
                                                                    className="p-1.5 hover:bg-primary/10 rounded-lg transition-colors group/edit"
                                                                    title="Change assigned agent"
                                                                >
                                                                    <HiOutlinePencilAlt className="text-sm text-zinc-400 group-hover/edit:text-primary" />
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-4 items-center">
                                                            <div className="relative">
                                                                <Image
                                                                    alt="agent-image"
                                                                    src={(property?.agent?.profile?.profileImage || property?.agent?.profile?.profile_image) ?? '/png/sample_profile.png'}
                                                                    height={56}
                                                                    width={56}
                                                                    className="rounded-full object-cover ring-2 ring-zinc-50 group-hover:ring-primary/20 transition-all"
                                                                />
                                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 border-2 border-white rounded-full"></div>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-lg font-bold text-zinc-900 truncate">
                                                                    {property?.agent?.profile?.firstName ? `${property?.agent?.profile?.firstName} ${property?.agent?.profile?.lastName}` : property?.agent?.email || 'Verification Officer'}
                                                                </p>
                                                                <p className="text-sm text-zinc-500 truncate">{property?.agent?.email ?? '--/--'}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    user?.role === UserRole.ADMIN && !editMode && (
                                                        <button
                                                            onClick={() => setShowAgentSelection(true)}
                                                            className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-zinc-200 rounded-2xl text-zinc-500 font-bold hover:border-primary hover:text-primary transition-all bg-zinc-50/50"
                                                        >
                                                            <FaPlus className="text-xs" />
                                                            Assign Verification Agent
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

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
                                                    src={(property?.agent?.profile?.profileImage || property?.agent?.profile?.profile_image) ?? '/png/sample_profile.png'}
                                                    height={50}
                                                    width={60}
                                                />
                                                <div>
                                                    <p className="text-xl font-medium text-zinc-900 m-0">{property?.agent?.profile?.firstName ? `${property?.agent?.profile?.firstName} ${property?.agent?.profile?.lastName}` : property?.agent?.email || '--/--'} <span className="text-base font-normal text-zinc-600"><em> (Assigned agent)</em></span></p>
                                                    <p className="text-lg text-zinc-700">{`${property?.agent?.email ?? '--/--'}`}</p>
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
                                        setShowAgentSelection(false)
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
                                                                src={(selectedAgent?.profile?.profileImage || selectedAgent?.profile?.profile_image) ?? '/png/sample_profile.png'}
                                                                height={50}
                                                                width={60}
                                                            />
                                                            <div>
                                                                <p className="text-lg text-zinc-900 m-0">{selectedAgent?.firstName ? `${selectedAgent?.firstName} ${selectedAgent?.lastName}` : selectedAgent?.email || '--/--'}</p>
                                                                <p className="text-base text-zinc-500">{`${selectedAgent?.email}`}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <p className="text-base text-zinc-800 font-normal my-5">
                                                        You're about to assign <strong>{selectedAgent?.firstName ? `${selectedAgent?.firstName} ${selectedAgent?.lastName}` : (selectedAgent?.email || 'this agent')}</strong> to this property.
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
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
import { useEffect, useRef, useState } from "react";
import EditProperty from "./EditPropertyView";
import { BookingMode, IProperty, IPropertyUnit } from "../types";
import { AssignToProperty, DeleteProperty, FeatureProperty, GetAmenities, GetSingleProperty, UpdateBookingMode, UpdatePropertyDocumentStatus, UploadPropertyDocument } from "@/src/lib/request-handlers/propertyMgt";
import { Skeleton } from "@/components/ui/skeleton"
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import { useDispatch } from "react-redux";
import { showAlert } from "@/src/lib/slices/alertDialogSlice";
import { IoIosStarOutline } from "react-icons/io";
import CustomModal from "../../ui/CustomModal";
import CustomDropdown from "../../ui/customDropdown";
import CustomDropzone from "../../ui/CustomDropzone";
import { IoGameControllerOutline } from "react-icons/io5";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { DocumentType, IPropertyDocument, PropertyVerificationStatus } from "../types";
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
    const { mutate: updateBookingMode, isPending: bookingModeUpdating } = UpdateBookingMode();
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

    const [showDocUpload, setShowDocUpload] = useState(false);
    const [showDocVerify, setShowDocVerify] = useState(false);
    const docPreviewsRef = useRef<{ url: string; file: File }[]>([]);
    const [selectedDoc, setSelectedDoc] = useState<IPropertyDocument | null>(null);
    const [docUploadPending, setDocUploadPending] = useState(false);
    const [selectedDocType, setSelectedDocType] = useState<DocumentType>(DocumentType.UTILITY_BILL);
    const { mutate: uploadDoc } = UploadPropertyDocument();
    const { mutate: verifyDoc, isPending: docVerifyPending } = UpdatePropertyDocumentStatus();


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
        <div className="p-3 sm:p-4 md:p-6 lg:p-8 w-full">
            <div className="w-full border border-zinc-200/70 bg-white rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-6 lg:p-8 min-h-[50vh] shadow-sm">
                {isLoading && !property ? (
                    <div className="flex flex-col space-y-3">
                        <Skeleton className="w-full h-48 sm:h-64 md:h-80 lg:h-96 rounded-xl" />
                        <div className="space-y-3 mt-4">
                            <Skeleton className="h-12 sm:h-16 w-full" />
                            <Skeleton className="h-12 sm:h-16 w-full" />
                        </div>
                    </div>
                ) : !isLoading && !property ? (
                    <div className="size-full text-center text-gray-500 py-10 flex flex-col items-center justify-center">
                        <div className="w-fit mb-3">
                            <Icon icon="mynaui:danger-octagon" width="40" height="40" className="text-red-500" />
                        </div>
                        <p className="text-center text-gray-500 text-sm sm:text-base">
                            Error loading property details
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 lg:gap-8">
                            {/* Main Content Column */}
                            <div className="lg:col-span-8 space-y-4 md:space-y-6 lg:space-y-8">
                                {/* Hero Section - Mobile Optimized */}
                                <div className="relative rounded-xl md:rounded-2xl overflow-hidden group shadow-md bg-zinc-100 min-h-[200px] sm:min-h-[300px] md:min-h-[350px] lg:min-h-[400px]">
                                    <Swiper
                                        loop={true}
                                        modules={[Navigation, Autoplay]}
                                        spaceBetween={5}
                                        slidesPerView={1}
                                        navigation
                                        autoplay={{ delay: 5000 }}
                                        className="h-full w-full"
                                    >
                                        {property?.media?.length > 0 ? (
                                            property?.media?.map((el: any, index: any) => (
                                                <SwiperSlide key={index}>
                                                    <div className="relative w-full h-[200px] sm:h-[300px] md:h-[350px] lg:h-[400px]">
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
                                            <div className="flex flex-col items-center justify-center h-[200px] sm:h-[300px] md:h-[350px] lg:h-[400px] text-zinc-400">
                                                <PiBuildingApartment className="text-4xl sm:text-5xl md:text-6xl mb-2 md:mb-4" />
                                                <p className="text-xs sm:text-sm px-4 text-center">No images available for this property</p>
                                            </div>
                                        )}
                                    </Swiper>

                                    {/* Floating Info Overlay */}
                                    <div className="absolute top-2 sm:top-3 md:top-4 left-2 sm:left-3 md:left-4 z-10 flex flex-wrap gap-1.5 sm:gap-2">
                                        <span className="px-2 sm:px-3 py-1 bg-black/60 backdrop-blur-md text-white text-[10px] sm:text-xs font-semibold rounded-full uppercase tracking-wider">
                                            {(property?.propertyType || property?.property_type)}
                                        </span>
                                        {(property?.isVerified || property?.is_verified) && (
                                            <span className="px-2 sm:px-3 py-1 bg-teal-500/80 backdrop-blur-md text-white text-[10px] sm:text-xs font-semibold rounded-full flex items-center gap-1">
                                                <GoVerified className="text-xs" /> Verified
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {!editMode ? (
                                    <>
                                        {/* Title and Description - Mobile Optimized */}
                                        <section className="space-y-2 md:space-y-3 lg:space-y-4">
                                            <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                                                <div className="w-full sm:w-auto">
                                                    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-zinc-900 tracking-tight">
                                                        {property?.name}
                                                    </h1>
                                                    <div className="flex items-start gap-1.5 text-zinc-500 mt-1">
                                                        <IoLocationOutline className="text-base sm:text-lg md:text-xl text-primary flex-shrink-0 mt-0.5" />
                                                        <p className="text-xs sm:text-sm md:text-base font-medium break-words">{property?.address}</p>
                                                    </div>
                                                </div>
                                                <div className="w-full sm:w-auto flex justify-start sm:justify-end">
                                                    <div className="flex items-center gap-1 bg-primary/5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl">
                                                        <span className="text-base sm:text-lg md:text-xl font-bold text-primary">{averageRating.toFixed(1)}</span>
                                                        <div className="flex">
                                                            {[...Array(5)].map((_, i) => (
                                                                <IoStarSharp
                                                                    key={i}
                                                                    className={i < Math.round(averageRating) ? 'text-primary text-xs sm:text-sm' : 'text-zinc-200 text-xs sm:text-sm'}
                                                                />
                                                            ))}
                                                        </div>
                                                        <span className="text-zinc-400 text-[10px] sm:text-xs ml-1">({property?.meta?.total_reviews ?? 0})</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-zinc-50 rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 border border-zinc-100">
                                                <h3 className="text-base sm:text-lg font-bold text-zinc-800 mb-2 flex items-center gap-1.5">
                                                    <Icon icon="solar:document-text-bold-duotone" className="text-lg sm:text-xl text-primary" />
                                                    About this property
                                                </h3>
                                                <p className="text-zinc-600 leading-relaxed text-sm sm:text-base">
                                                    {property?.description || "No description provided for this property."}
                                                </p>
                                            </div>
                                        </section>

                                        {/* Amenities Grid - Mobile Optimized */}
                                        <section className="space-y-2 md:space-y-3">
                                            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-zinc-900 flex items-center gap-2">
                                                <Icon icon="solar:checklist-bold-duotone" className="text-xl sm:text-2xl text-primary" />
                                                Amenities
                                            </h3>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                                                {property?.amenities?.map((el, index) => (
                                                    <div key={index} className="flex flex-col items-center justify-center p-2 sm:p-3 md:p-4 bg-white border border-zinc-200 rounded-lg sm:rounded-xl md:rounded-2xl hover:border-primary/50 hover:shadow-sm transition-all group">
                                                        <div className="mb-1 sm:mb-2 p-1.5 sm:p-2 md:p-3 bg-zinc-50 rounded-lg sm:rounded-xl group-hover:bg-primary/10 transition-colors">
                                                            {el.name === 'AIR CONDITIONER' ? <TbAirConditioning className="text-lg sm:text-xl md:text-2xl text-zinc-600 group-hover:text-primary" />
                                                                : el.name === 'HOT TUB' ? <PiBathtub className="text-lg sm:text-xl md:text-2xl text-zinc-600 group-hover:text-primary" />
                                                                    : el.name === 'Wi-FI' ? <IoWifi className="text-lg sm:text-xl md:text-2xl text-zinc-600 group-hover:text-primary" />
                                                                        : el.name === 'PS5' ? <IoGameControllerOutline className="text-lg sm:text-xl md:text-2xl text-zinc-600 group-hover:text-primary" />
                                                                            : el?.name === 'TV' ? <FaTv className="text-lg sm:text-xl md:text-2xl text-zinc-600 group-hover:text-primary" />
                                                                                : <FaSwimmer className="text-lg sm:text-xl md:text-2xl text-zinc-600 group-hover:text-primary" />}
                                                        </div>
                                                        <span className="text-[10px] sm:text-xs md:text-sm font-semibold text-zinc-700 text-center">{el.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>

                                        {/* Documents Section - Mobile Optimized */}
                                        <section className="space-y-2 md:space-y-3">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-zinc-900 flex items-center gap-2">
                                                    <Icon icon="solar:folder-with-files-bold-duotone" className="text-xl sm:text-2xl text-primary" />
                                                    Documents
                                                </h3>
                                                {(user?.role === UserRole.OWNER) && (
                                                    <button
                                                        onClick={() => setShowDocUpload(true)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-primary/10 text-primary text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"
                                                    >
                                                        <FaPlus className="text-[8px] sm:text-xs" />
                                                        Upload
                                                    </button>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                                                {property?.documents?.length > 0 ? (
                                                    property?.documents.map((doc: IPropertyDocument, index: number) => (
                                                        <div key={index} className="bg-white border border-zinc-200 rounded-xl md:rounded-2xl p-3 flex flex-col gap-2 group hover:border-primary/50 transition-all">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                                    <div className="p-1.5 sm:p-2 bg-zinc-50 rounded-lg group-hover:bg-primary/10 transition-colors flex-shrink-0">
                                                                        <Icon icon="solar:file-text-bold-duotone" className="text-zinc-500 group-hover:text-primary text-sm sm:text-base" />
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="font-bold text-zinc-800 text-xs sm:text-sm truncate">{(doc?.document_type as string)?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())}</p>
                                                                        <p className="text-[8px] sm:text-[10px] text-zinc-400 capitalize truncate">{doc?.status?.toLowerCase()}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                                    <a href={doc?.document_url} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-500">
                                                                        <Icon icon="solar:eye-bold-duotone" className="text-sm sm:text-base" />
                                                                    </a>
                                                                    {user?.role === UserRole.ADMIN && doc?.status === PropertyVerificationStatus.PENDING && (
                                                                        <button onClick={() => { setSelectedDoc(doc); setShowDocVerify(true); }} className="p-1 hover:bg-primary/10 rounded-lg transition-colors text-primary">
                                                                            <Icon icon="solar:checklist-bold-duotone" className="text-sm sm:text-base" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {doc?.status === PropertyVerificationStatus.REJECTED && doc?.rejection_reason && (
                                                                <p className="text-[8px] sm:text-[10px] text-red-500 bg-red-50 p-1.5 sm:p-2 rounded-lg italic line-clamp-2">{doc.rejection_reason}</p>
                                                            )}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="col-span-1 sm:col-span-2 p-6 sm:p-8 md:p-10 lg:p-12 bg-zinc-50 border border-dashed border-zinc-200 rounded-xl md:rounded-2xl lg:rounded-3xl flex flex-col items-center justify-center text-zinc-400">
                                                        <Icon icon="solar:folder-favorite-bold-duotone" className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-2 md:mb-4" />
                                                        <p className="text-xs sm:text-sm font-semibold italic text-center">No documents uploaded yet.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </section>

                                        <div className="h-px bg-zinc-100 w-full" />

                                        {/* Units Section - Mobile Optimized */}
                                        <section className="space-y-2 md:space-y-3">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-zinc-900 flex items-center gap-2">
                                                    <Icon icon="solar:home-2-bold-duotone" className="text-xl sm:text-2xl text-primary" />
                                                    Units
                                                </h3>
                                                <Link
                                                    href={PAGE_ROUTES.dashboard.propertyManagement.allProperties.units.create(property?.id)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-primary/10 text-primary text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"
                                                >
                                                    <FaPlus className="text-[8px] sm:text-xs" />
                                                    Add Unit
                                                </Link>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                                                {property?.units.length > 0 ? (
                                                    property?.units.map((el, index) => (
                                                        <Link
                                                            href={PAGE_ROUTES.dashboard.propertyManagement.allProperties.units.details(property?.id, el.id)}
                                                            key={index}
                                                            className="group flex flex-col bg-white border border-zinc-200 rounded-xl md:rounded-2xl overflow-hidden hover:border-primary/50 hover:shadow-md transition-all h-full"
                                                        >
                                                            <div className="relative h-32 sm:h-36 md:h-40 lg:h-48 bg-zinc-100 overflow-hidden">
                                                                {el.media && el.media.length > 0 ? (
                                                                    <Image
                                                                        src={el.media[0].media_url || el.media[0].mediaUrl || "/png/placeholder.png"}
                                                                        alt={el.name}
                                                                        fill
                                                                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-300">
                                                                        <PiBuildingApartment className="text-2xl sm:text-3xl md:text-4xl" />
                                                                        <span className="text-[8px] sm:text-[10px] font-semibold mt-1">NO IMAGE</span>
                                                                    </div>
                                                                )}
                                                                <div className="absolute top-2 right-2 px-2 py-0.5 sm:px-3 sm:py-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm">
                                                                    <p className="text-[10px] sm:text-xs md:text-sm font-bold text-primary">
                                                                        ₦{Number(el.price_per_night ?? el.pricePerNight ?? 0).toLocaleString()} <span className="text-[6px] sm:text-[8px] md:text-[10px] font-normal text-zinc-500">/night</span>
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="p-2 sm:p-3 md:p-4 flex flex-col flex-1">
                                                                <h4 className="font-bold text-sm sm:text-base md:text-lg lg:text-xl text-zinc-800 mb-0.5 sm:mb-1 group-hover:text-primary transition-colors truncate">{el.name}</h4>
                                                                <p className="text-[10px] sm:text-xs text-zinc-500 line-clamp-2 mb-2 flex-1">{el.description || "View this unit."}</p>
                                                                <div className="grid grid-cols-2 gap-1 sm:gap-2 pt-2 border-t border-zinc-100">
                                                                    <div className="flex items-center gap-1 text-zinc-600 text-[8px] sm:text-[10px] md:text-xs font-semibold">
                                                                        <IoBedOutline className="text-primary text-xs" /> {el.bedroom_count ?? el.bedroomCount ?? 0} Beds
                                                                    </div>
                                                                    <div className="flex items-center gap-1 text-zinc-600 text-[8px] sm:text-[10px] md:text-xs font-semibold">
                                                                        <PiBathtub className="text-primary text-xs" /> {el.bathroom_count ?? el.bathroomCount ?? 0} Baths
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    ))
                                                ) : (
                                                    <div className="col-span-1 sm:col-span-2 p-6 sm:p-8 md:p-10 lg:p-12 bg-zinc-50 border border-dashed border-zinc-200 rounded-xl md:rounded-2xl lg:rounded-3xl flex flex-col items-center justify-center text-zinc-400">
                                                        <Icon icon="solar:box-minimalistic-bold-duotone" className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-2 md:mb-4" />
                                                        <p className="text-xs sm:text-sm font-semibold italic text-center">No units created yet.</p>
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

                            {/* Sidebar Column - Mobile Optimized */}
                            <div className="lg:col-span-4 space-y-3 md:space-y-4 lg:space-y-5">
                                {/* Status Alert - Mobile Optimized */}
                                {user?.role === UserRole.ADMIN && (!property?.isVerified && !property?.is_verified || !property?.agent) && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl md:rounded-2xl lg:rounded-3xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-sm">
                                        <div className="flex items-start gap-2 sm:gap-3 mb-3">
                                            <div className="p-1.5 sm:p-2 bg-amber-100 rounded-lg sm:rounded-xl flex-shrink-0">
                                                <Icon icon="solar:danger-bold-duotone" className="text-lg sm:text-xl text-amber-600" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-amber-900 text-sm sm:text-base">Verification Required</p>
                                                <p className="text-[10px] sm:text-xs text-amber-700 mt-0.5">Not visible to public.</p>
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
                                                className="w-full py-2 sm:py-2.5 bg-white border border-amber-300 text-amber-800 text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl hover:bg-amber-100 transition-all"
                                            >
                                                Review Details
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setShowAgentSelection(true)}
                                                className="w-full py-2 sm:py-2.5 bg-amber-600 text-white text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl hover:bg-amber-700 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                                            >
                                                <IoCloudUploadOutline className="text-sm sm:text-base" />
                                                Assign Agent
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Quick Stats Card - Mobile Optimized */}
                                <div className="bg-white border border-zinc-200 rounded-xl md:rounded-2xl lg:rounded-3xl p-4 sm:p-5 md:p-6 lg:p-8 shadow-sm">
                                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-zinc-900 mb-3 sm:mb-4 flex items-center gap-1.5 border-b border-zinc-100 pb-2 sm:pb-3">
                                        <Icon icon="solar:chart-2-bold-duotone" className="text-primary text-lg sm:text-xl md:text-2xl" />
                                        Overview
                                    </h3>
                                    <div className="space-y-3 sm:space-y-4">
                                        <div className="flex justify-between items-center group">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-zinc-50 rounded-lg group-hover:bg-primary/10 transition-colors">
                                                    <GoVerified className="text-zinc-500 group-hover:text-primary text-xs sm:text-sm" />
                                                </div>
                                                <span className="text-zinc-600 text-xs sm:text-sm font-medium">Status</span>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-full text-[8px] sm:text-[10px] font-bold ${property?.isVerified || property?.is_verified ? 'bg-teal-100 text-teal-800' : 'bg-red-100 text-red-800'}`}>
                                                {property?.isVerified || property?.is_verified ? 'Verified' : 'Unverified'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center group">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-zinc-50 rounded-lg group-hover:bg-primary/10 transition-colors">
                                                    <PiBuildingApartment className="text-zinc-500 group-hover:text-primary text-xs sm:text-sm" />
                                                </div>
                                                <span className="text-zinc-600 text-xs sm:text-sm font-medium">Inventory</span>
                                            </div>
                                            <span className="text-zinc-900 font-bold text-xs sm:text-sm">{availableUnits} Units</span>
                                        </div>
                                        <div className="flex justify-between items-center group">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-zinc-50 rounded-lg group-hover:bg-primary/10 transition-colors">
                                                    <GoChecklist className="text-zinc-500 group-hover:text-primary text-xs sm:text-sm" />
                                                </div>
                                                <span className="text-zinc-600 text-xs sm:text-sm font-medium">Listed on</span>
                                            </div>
                                            <span className="text-zinc-900 font-bold text-[10px] sm:text-xs">
                                                {(property?.isVerified || property?.is_verified) ? (property?.verifications?.[0]?.verificationDate ? formatDate(property?.verifications?.[0]?.verificationDate) : 'Recently') : 'Not Listed'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center group">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-zinc-50 rounded-lg group-hover:bg-primary/10 transition-colors">
                                                    <RiBuilding2Line className="text-zinc-500 group-hover:text-primary text-xs sm:text-sm" />
                                                </div>
                                                <span className="text-zinc-600 text-xs sm:text-sm font-medium">Type</span>
                                            </div>
                                            <span className="text-zinc-900 font-bold text-[10px] sm:text-xs capitalize">{(property?.propertyType || property?.property_type)?.toLowerCase()}</span>
                                        </div>
                                    </div>

                                    <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-zinc-100 flex flex-col gap-2">
                                        {!editMode && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => { setEditMode(true); setQueryParam('edit', 'true'); }}
                                                    className="flex-1 h-8 sm:h-9 bg-zinc-900 text-white text-[8px] sm:text-[10px] font-semibold rounded-lg hover:bg-zinc-800 transition-all shadow-sm flex items-center justify-center gap-1 active:scale-[0.98] uppercase tracking-wider"
                                                >
                                                    <HiOutlinePencilAlt className="text-xs sm:text-sm" />
                                                    <span>Edit</span>
                                                </button>
                                                <button
                                                    onClick={handleDelete}
                                                    className="flex-1 h-8 sm:h-9 bg-red-50 text-red-600 text-[8px] sm:text-[10px] font-semibold rounded-lg hover:bg-red-100 transition-all flex items-center justify-center border border-red-100 gap-1 active:scale-[0.98] uppercase tracking-wider"
                                                >
                                                    <TrashIcon className="w-2 sm:w-2.5" color="#dc2626" />
                                                    <span>Delete</span>
                                                </button>
                                            </div>
                                        )}
                                        <Link
                                            href={PAGE_ROUTES.dashboard.propertyManagement.allProperties.verifications.base(propertyId)}
                                            className="w-full py-2 text-center text-zinc-500 text-[10px] sm:text-xs font-medium hover:text-primary transition-colors underline"
                                        >
                                            View verification history
                                        </Link>
                                    </div>
                                </div>

                                {/* Profiles Section - Mobile Optimized */}
                                <div className="bg-white border border-zinc-200 rounded-xl md:rounded-2xl lg:rounded-3xl p-4 sm:p-5 md:p-6 lg:p-8 shadow-sm">
                                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-zinc-900 mb-3 sm:mb-4 flex items-center gap-1.5 border-b border-zinc-100 pb-2 sm:pb-3">
                                        <Icon icon="solar:users-group-rounded-bold-duotone" className="text-primary text-lg sm:text-xl md:text-2xl" />
                                        Management
                                    </h3>
                                    <div className="space-y-4 sm:space-y-5">
                                        {user?.role !== UserRole.OWNER && (
                                            <div className="group">
                                                <p className="text-[8px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Owner</p>
                                                <div className="flex gap-2 sm:gap-3 items-center">
                                                    <div className="relative flex-shrink-0">
                                                        <Image
                                                            alt="owner-image"
                                                            src={(property?.owner?.profile?.profileImage || property?.owner?.profile?.profile_image) ?? '/png/sample_profile.png'}
                                                            height={40}
                                                            width={40}
                                                            className="rounded-full object-cover ring-2 ring-zinc-50 group-hover:ring-primary/20 transition-all w-8 h-8 sm:w-10 sm:h-10"
                                                        />
                                                        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-3 sm:h-3 bg-teal-500 border-1.5 border-white rounded-full"></div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs sm:text-sm font-bold text-zinc-900 truncate">
                                                            {property?.owner?.profile?.firstName ? `${property?.owner?.profile?.firstName} ${property?.owner?.profile?.lastName}` : property?.owner?.email || 'Aparte Partner'}
                                                        </p>
                                                        <p className="text-[10px] sm:text-xs text-zinc-500 truncate">{property?.owner?.email ?? '--/--'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="h-px w-full bg-zinc-50" />

                                        {property?.agent && user?.role !== UserRole.AGENT ? (
                                            <div className="group">
                                                <div className="flex items-center justify-between mb-2">
                                                    <p className="text-[8px] sm:text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Assigned Agent</p>
                                                    {user?.role === UserRole.ADMIN && !editMode && (
                                                        <button
                                                            onClick={() => setShowAgentSelection(true)}
                                                            className="p-1 hover:bg-primary/10 rounded-lg transition-colors group/edit"
                                                            title="Change agent"
                                                        >
                                                            <HiOutlinePencilAlt className="text-xs text-zinc-400 group-hover/edit:text-primary" />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="flex gap-2 sm:gap-3 items-center">
                                                    <div className="relative flex-shrink-0">
                                                        <Image
                                                            alt="agent-image"
                                                            src={(property?.agent?.profile?.profileImage || property?.agent?.profile?.profile_image) ?? '/png/sample_profile.png'}
                                                            height={40}
                                                            width={40}
                                                            className="rounded-full object-cover ring-2 ring-zinc-50 group-hover:ring-primary/20 transition-all w-8 h-8 sm:w-10 sm:h-10"
                                                        />
                                                        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 border-1.5 border-white rounded-full"></div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs sm:text-sm font-bold text-zinc-900 truncate">
                                                            {property?.agent?.profile?.firstName ? `${property?.agent?.profile?.firstName} ${property?.agent?.profile?.lastName}` : property?.agent?.email || 'Verification Officer'}
                                                        </p>
                                                        <p className="text-[10px] sm:text-xs text-zinc-500 truncate">{property?.agent?.email ?? '--/--'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            user?.role === UserRole.ADMIN && !editMode && (
                                                <button
                                                    onClick={() => setShowAgentSelection(true)}
                                                    className="w-full flex items-center justify-center gap-1.5 py-2 sm:py-3 border-2 border-dashed border-zinc-200 rounded-lg sm:rounded-xl text-zinc-500 text-xs sm:text-sm font-bold hover:border-primary hover:text-primary transition-all bg-zinc-50/50"
                                                >
                                                    <FaPlus className="text-[8px] sm:text-xs" />
                                                    Assign Agent
                                                </button>
                                            )
                                        )}
                                    </div>
                                </div>

                                {/* Booking Mode Card - Mobile Optimized */}
                                {(user?.role === UserRole.OWNER || user?.role === UserRole.ADMIN) && !editMode && (
                                    <div className="bg-white border border-zinc-200 rounded-xl md:rounded-2xl lg:rounded-3xl p-4 sm:p-5 md:p-6 lg:p-8 shadow-sm">
                                        <h3 className="text-base sm:text-lg md:text-xl font-bold text-zinc-900 mb-1 flex items-center gap-1.5 border-b border-zinc-100 pb-2">
                                            <Icon icon="solar:hand-shake-bold-duotone" className="text-primary text-lg sm:text-xl md:text-2xl" />
                                            Booking Mode
                                        </h3>
                                        <p className="text-[10px] sm:text-xs text-zinc-500 mb-3 mt-2">Choose how guests book.</p>
                                        <div className="flex flex-col gap-2">
                                            <button
                                                type="button"
                                                disabled={bookingModeUpdating}
                                                onClick={() => {
                                                    const current = property?.bookingMode ?? property?.booking_mode;
                                                    if (current !== BookingMode.INSTANT) {
                                                        updateBookingMode(
                                                            { propertyId, booking_mode: BookingMode.INSTANT },
                                                            {
                                                                onSuccess: () => {
                                                                    setProperty(prev => ({ ...prev, booking_mode: BookingMode.INSTANT, bookingMode: BookingMode.INSTANT }));
                                                                    toast.success('Switched to Instant Book');
                                                                },
                                                                onError: (err: any) => toast.error(err?.response?.data?.detail || 'Update failed'),
                                                            }
                                                        );
                                                    }
                                                }}
                                                className={`flex items-start gap-2 p-2 sm:p-3 rounded-lg sm:rounded-xl border-2 text-left transition-all ${(property?.bookingMode ?? property?.booking_mode) === BookingMode.INSTANT || !(property?.bookingMode ?? property?.booking_mode) ? 'border-primary bg-primary/5' : 'border-zinc-200 bg-white hover:border-zinc-300'} disabled:opacity-60 disabled:cursor-not-allowed`}
                                            >
                                                <div className={`mt-0.5 p-1.5 rounded-lg ${(property?.bookingMode ?? property?.booking_mode) === BookingMode.INSTANT || !(property?.bookingMode ?? property?.booking_mode) ? 'bg-primary/10' : 'bg-zinc-100'}`}>
                                                    <Icon icon="solar:bolt-bold-duotone" className={`text-sm sm:text-base ${(property?.bookingMode ?? property?.booking_mode) === BookingMode.INSTANT || !(property?.bookingMode ?? property?.booking_mode) ? 'text-primary' : 'text-zinc-400'}`} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`font-bold text-xs sm:text-sm ${(property?.bookingMode ?? property?.booking_mode) === BookingMode.INSTANT || !(property?.bookingMode ?? property?.booking_mode) ? 'text-primary' : 'text-zinc-700'}`}>Instant Book</p>
                                                    <p className="text-[8px] sm:text-[10px] text-zinc-500 mt-0.5 leading-relaxed">Guests book immediately.</p>
                                                </div>
                                                {((property?.bookingMode ?? property?.booking_mode) === BookingMode.INSTANT || !(property?.bookingMode ?? property?.booking_mode)) && (
                                                    <Icon icon="solar:check-circle-bold-duotone" className="text-primary text-sm sm:text-base shrink-0" />
                                                )}
                                            </button>

                                            <button
                                                type="button"
                                                disabled={bookingModeUpdating}
                                                onClick={() => {
                                                    const current = property?.bookingMode ?? property?.booking_mode;
                                                    if (current !== BookingMode.REQUEST_TO_BOOK) {
                                                        updateBookingMode(
                                                            { propertyId, booking_mode: BookingMode.REQUEST_TO_BOOK },
                                                            {
                                                                onSuccess: () => {
                                                                    setProperty(prev => ({ ...prev, booking_mode: BookingMode.REQUEST_TO_BOOK, bookingMode: BookingMode.REQUEST_TO_BOOK }));
                                                                    toast.success('Switched to Request to Book');
                                                                },
                                                                onError: (err: any) => toast.error(err?.response?.data?.detail || 'Update failed'),
                                                            }
                                                        );
                                                    }
                                                }}
                                                className={`flex items-start gap-2 p-2 sm:p-3 rounded-lg sm:rounded-xl border-2 text-left transition-all ${(property?.bookingMode ?? property?.booking_mode) === BookingMode.REQUEST_TO_BOOK ? 'border-violet-500 bg-violet-50' : 'border-zinc-200 bg-white hover:border-zinc-300'} disabled:opacity-60 disabled:cursor-not-allowed`}
                                            >
                                                <div className={`mt-0.5 p-1.5 rounded-lg ${(property?.bookingMode ?? property?.booking_mode) === BookingMode.REQUEST_TO_BOOK ? 'bg-violet-100' : 'bg-zinc-100'}`}>
                                                    <Icon icon="solar:hand-shake-bold-duotone" className={`text-sm sm:text-base ${(property?.bookingMode ?? property?.booking_mode) === BookingMode.REQUEST_TO_BOOK ? 'text-violet-600' : 'text-zinc-400'}`} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`font-bold text-xs sm:text-sm ${(property?.bookingMode ?? property?.booking_mode) === BookingMode.REQUEST_TO_BOOK ? 'text-violet-700' : 'text-zinc-700'}`}>Request to Book</p>
                                                    <p className="text-[8px] sm:text-[10px] text-zinc-500 mt-0.5 leading-relaxed">You approve requests.</p>
                                                </div>
                                                {(property?.bookingMode ?? property?.booking_mode) === BookingMode.REQUEST_TO_BOOK && (
                                                    <Icon icon="solar:check-circle-bold-duotone" className="text-violet-600 text-sm sm:text-base shrink-0" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modals - Keep as is but ensure they're responsive */}
                        <CustomModal
                            isOpen={showVerification}
                            onClose={() => setShowVerification(false)}
                            title="Property verification details"
                        >
                            <div className="w-full p-2 sm:p-3 flex flex-col justify-between gap-4 sm:gap-5">
                                <div className='my-1 sm:my-2'>
                                    <p className="text-base sm:text-lg zinc-900 font-medium">Agent</p>
                                    <div className="flex gap-3 sm:gap-4 items-center rounded-full mt-2">
                                        <Image
                                            alt="agent-image"
                                            src={(property?.agent?.profile?.profileImage || property?.agent?.profile?.profile_image) ?? '/png/sample_profile.png'}
                                            height={40}
                                            width={50}
                                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                                        />
                                        <div>
                                            <p className="text-sm sm:text-base md:text-lg font-medium text-zinc-900">{property?.agent?.profile?.firstName ? `${property?.agent?.profile?.firstName} ${property?.agent?.profile?.lastName}` : property?.agent?.email || '--/--'} <span className="text-xs sm:text-sm font-normal text-zinc-600"><em> (Assigned agent)</em></span></p>
                                            <p className="text-xs sm:text-sm text-zinc-700">{`${property?.agent?.email ?? '--/--'}`}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className='my-1 sm:my-2'>
                                    <p className="text-base sm:text-lg zinc-900 font-medium">Agent feedback</p>
                                    <p className="text-sm sm:text-base font-medium text-zinc-900">
                                        {property?.verifications?.[0]?.feedback ??
                                            <em className="text-zinc-400 font-normal">No comments yet</em>}
                                    </p>
                                </div>

                                <div className='my-1 sm:my-2'>
                                    <p className="text-base sm:text-lg zinc-900 font-medium">KYC details</p>
                                    <p className="text-sm sm:text-base font-medium text-zinc-900">
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
                            <div className="w-full p-2 sm:p-3">
                                {!selectedAgent ? (
                                    <div className="relative my-2 sm:my-3">
                                        <label htmlFor="city" className="text-sm sm:text-base zinc-900 font-normal">Search agents</label>
                                        <AdjustableFilterDropdown
                                            placeholder="Search by email..."
                                            options={agents?.map(el => el?.email)}
                                            handleSelection={(val) => handleAgentSelection(val)}
                                            searchTerm={agentSearchTerm}
                                            setSearchTerm={setAgentSearchTerm}
                                            isLoading={agentsLoading}
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <div className="my-4 sm:my-5">
                                            <div className="flex gap-3 sm:gap-4 items-center rounded-full mt-2">
                                                <Image
                                                    alt="agent-image"
                                                    src={(selectedAgent?.profile?.profileImage || selectedAgent?.profile?.profile_image) ?? '/png/sample_profile.png'}
                                                    height={40}
                                                    width={50}
                                                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                                                />
                                                <div>
                                                    <p className="text-sm sm:text-base text-zinc-900">{selectedAgent?.firstName ? `${selectedAgent?.firstName} ${selectedAgent?.lastName}` : selectedAgent?.email || '--/--'}</p>
                                                    <p className="text-xs sm:text-sm text-zinc-500">{`${selectedAgent?.email}`}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-xs sm:text-sm text-zinc-800 font-normal my-3 sm:my-4">
                                            Assign <strong>{selectedAgent?.firstName ? `${selectedAgent?.firstName} ${selectedAgent?.lastName}` : (selectedAgent?.email || 'this agent')}</strong> to this property?
                                        </p>
                                        <div className="flex justify-between items-center gap-3 sm:gap-4 mt-4 sm:mt-5 w-full">
                                            <button
                                                type='button'
                                                onClick={() => setSelectedAgent(null)}
                                                disabled={assignmentLoading}
                                                className="flex-1 font-medium rounded-lg px-3 py-2 text-xs sm:text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-75"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => handleAgentAssignment(String(selectedAgent?.id))}
                                                disabled={assignmentLoading}
                                                type='button'
                                                className="flex-1 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium bg-primary/90 text-white hover:bg-primary disabled:opacity-75">
                                                {assignmentLoading ? <Spinner /> : 'Assign'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CustomModal>

                        <CustomModal
                            isOpen={showDocUpload}
                            onClose={() => setShowDocUpload(false)}
                            title="Upload Property Document"
                        >
                            <div className="w-full space-y-4 sm:space-y-5 pt-2 sm:pt-3">
                                <div className="space-y-1 sm:space-y-2">
                                    <label className="text-xs sm:text-sm font-bold text-zinc-700">Document Type</label>
                                    <CustomDropdown
                                        selected={selectedDocType}
                                        options={Object.values(DocumentType)}
                                        handleSelection={(val) => setSelectedDocType(val as DocumentType)}
                                        formatLabel={(val: string) => val.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())}
                                    />
                                </div>
                                <div className="w-full">
                                    <CustomDropzone
                                        onDrop={async (files) => {
                                            if (files.length > 0) {
                                                const formData = new FormData();
                                                formData.append('document_file', files[0]);
                                                formData.append('document_type', selectedDocType);

                                                setDocUploadPending(true);
                                                uploadDoc({
                                                    propertyId,
                                                    payload: formData
                                                }, {
                                                    onSuccess: () => {
                                                        toast.success("Document uploaded successfully");
                                                        setShowDocUpload(false);
                                                        setDocUploadPending(false);
                                                        docPreviewsRef.current = [];
                                                    },
                                                    onError: (err: any) => {
                                                        toast.error(err?.response?.data?.detail || "Upload failed");
                                                        setDocUploadPending(false);
                                                    }
                                                });
                                            }
                                        }}
                                        multiple={false}
                                        previewsRef={docPreviewsRef}
                                    />
                                </div>
                                {docUploadPending && (
                                    <div className="flex justify-center p-3">
                                        <Spinner />
                                    </div>
                                )}
                            </div>
                        </CustomModal>

                        <CustomModal
                            isOpen={showDocVerify}
                            onClose={() => setShowDocVerify(false)}
                            title="Verify Property Document"
                        >
                            <div className="w-full space-y-4 sm:space-y-5 pt-2 sm:pt-3">
                                <div className="bg-zinc-50 p-2 sm:p-3 rounded-lg sm:rounded-xl">
                                    <p className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase mb-1">Document Type</p>
                                    <p className="text-xs sm:text-sm font-bold text-zinc-800">{(selectedDoc?.document_type as string)?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())}</p>
                                </div>

                                <div className="flex gap-2 sm:gap-3">
                                    <button
                                        onClick={() => {
                                            verifyDoc({
                                                propertyId,
                                                documentId: selectedDoc?.id || "",
                                                payload: { status: PropertyVerificationStatus.VERIFIED, feedback: "Approved" }
                                            }, {
                                                onSuccess: () => {
                                                    toast.success("Document verified");
                                                    setShowDocVerify(false);
                                                }
                                            });
                                        }}
                                        disabled={docVerifyPending}
                                        className="flex-1 py-2 sm:py-2.5 bg-teal-600 text-white text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl hover:bg-teal-700 transition-all flex items-center justify-center gap-1.5"
                                    >
                                        {docVerifyPending ? <Spinner color="white" /> : "Approve"}
                                    </button>
                                    <button
                                        onClick={() => {
                                            const reason = prompt("Enter rejection reason:");
                                            if (reason) {
                                                verifyDoc({
                                                    propertyId,
                                                    documentId: selectedDoc?.id || "",
                                                    payload: { status: PropertyVerificationStatus.REJECTED, feedback: reason }
                                                }, {
                                                    onSuccess: () => {
                                                        toast.success("Document rejected");
                                                        setShowDocVerify(false);
                                                    }
                                                });
                                            }
                                        }}
                                        disabled={docVerifyPending}
                                        className="flex-1 py-2 sm:py-2.5 bg-red-50 text-red-600 text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl hover:bg-red-100 transition-all"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        </CustomModal>
                    </>
                )}
            </div>
        </div>
    );
}
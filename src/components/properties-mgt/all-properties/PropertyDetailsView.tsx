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

    const router = useRouter();
    const pathname = usePathname();
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
        urlSearchParams.set(key, value);
        router.push(`${pathname}?${urlSearchParams.toString()}`);
    };

    const EmptyState = ({ icon, label }: { icon: string; label: string }) => {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center">
                <Icon icon={icon} className="w-16 h-16 mb-4 text-gray-400" />
                <p className="text-gray-500">{label}</p>
            </div>
        )
    }

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
                                    toast.success(response?.data?.message, { duration: 6000, style: { maxWidth: '500px', width: 'max-content' } });
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
            { payload: { agent_id: agentId } },
            {
                onSuccess: () => {
                    toast.success('Agent assigned successfully', { duration: 6000, style: { maxWidth: '500px', width: 'max-content' } });
                    setShowAgentSelection(false);
                    setSelectedAgent(null);
                },
                onError: () => toast.error('Something went wrong', { duration: 6000, style: { maxWidth: '500px', width: 'max-content' } })
            }
        )
    }

    const handleAgentSelection = (email: string) => {
        const filteredUsers = agents?.filter(el => el?.email === email);
        setSelectedAgent(filteredUsers[0]);
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
                    const count = el.count ? Number(el.count) : 1;
                    unitAmount += count;
                })
            }
            setAvailableUnits(unitAmount)
            setAverageRating(property?.meta?.total_reviews ? (property?.meta?.total_reviews / property?.meta?.average_rating) : 0)
        }
    }, [data, property?.meta?.average_rating, property?.meta?.total_reviews])

    return (
        <div className="px-3 py-4 sm:px-5 sm:py-6 md:px-6 md:py-8 w-full">
            <div className="w-full bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">

                {/* ── Loading State ── */}
                {isLoading && !property ? (
                    <div className="p-5 sm:p-6 md:p-8 flex flex-col gap-4">
                        <Skeleton className="w-full h-52 sm:h-72 md:h-96 rounded-xl" />
                        <Skeleton className="h-10 w-2/3" />
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                ) : !isLoading && !property ? (
                    /* ── Error State ── */
                    <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3 p-8">
                        <Icon icon="mynaui:danger-octagon" width="44" height="44" className="text-red-400" />
                        <p className="text-sm text-zinc-500 text-center">Error loading property details</p>
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-100">
                        <div className="relative bg-zinc-100 h-56 sm:h-80 md:h-[26rem] lg:h-[30rem] overflow-hidden">
                            <Swiper
                                loop={true}
                                modules={[Navigation, Autoplay]}
                                spaceBetween={0}
                                slidesPerView={1}
                                navigation
                                autoplay={{ delay: 5000 }}
                                className="h-full w-full"
                            >
                                {property?.media?.length > 0 ? (
                                    property.media.map((el: any, index: any) => (
                                        <SwiperSlide key={index}>
                                            <div className="relative w-full h-56 sm:h-80 md:h-[26rem] lg:h-[30rem]">
                                                {(el.media_type === 'VIDEO' || el.mediaType === 'VIDEO') ? (
                                                    <video
                                                        src={el.media_url || el.mediaUrl}
                                                        controls
                                                        preload="metadata"
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Image
                                                        alt={`${property?.name}_img_${index}`}
                                                        src={el.media_url || el.mediaUrl || "/png/placeholder.png"}
                                                        fill
                                                        className="object-cover"
                                                        priority={index === 0}
                                                    />
                                                )}
                                                {/* Gradient overlay */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                                            </div>
                                        </SwiperSlide>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-56 sm:h-80 md:h-96 text-zinc-400 gap-3">
                                        <PiBuildingApartment className="text-5xl" />
                                        <p className="text-sm">No images available</p>
                                    </div>
                                )}
                            </Swiper>

                            {/* Badges */}
                            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 flex flex-wrap gap-2">
                                <span className="px-3 py-1 bg-black/55 backdrop-blur-md text-white text-[10px] sm:text-xs font-semibold rounded-full uppercase tracking-wider">
                                    {property?.propertyType || property?.property_type}
                                </span>
                                {(property?.isVerified || property?.is_verified) && (
                                    <span className="px-3 py-1 bg-teal-500/80 backdrop-blur-md text-white text-[10px] sm:text-xs font-semibold rounded-full flex items-center gap-1.5">
                                        <GoVerified className="text-xs" /> Verified
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-12 lg:divide-x lg:divide-zinc-100">

                            <div className="lg:col-span-8 p-4 sm:p-6 md:p-8 space-y-8 md:space-y-10">

                                {!editMode ? (
                                    <>
                                        {/* Title + Rating */}
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-zinc-900 tracking-tight leading-tight">
                                                    {property?.name}
                                                </h1>
                                                <div className="flex items-start gap-1.5 text-zinc-500 mt-2">
                                                    <IoLocationOutline className="text-lg text-primary flex-shrink-0 mt-0.5" />
                                                    <p className="text-sm md:text-base break-words">{property?.address || "Address not available"}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-100 px-3 py-2 rounded-xl self-start flex-shrink-0">
                                                <span className="text-xl font-bold text-primary">{averageRating.toFixed(1)}</span>
                                                <div className="flex gap-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <IoStarSharp
                                                            key={i}
                                                            className={`text-sm ${i < Math.round(averageRating) ? 'text-primary' : 'text-zinc-200'}`}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="text-zinc-400 text-xs ml-0.5">({property?.meta?.total_reviews ?? 0})</span>
                                            </div>
                                        </div>

                                        {/* Description */}
                                        <div className="bg-zinc-50 rounded-2xl p-4 sm:p-5 border border-zinc-100">
                                            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <Icon icon="solar:document-text-bold-duotone" className="text-base text-primary" />
                                                About this property
                                            </h3>
                                            <p className="text-zinc-600 leading-relaxed text-sm sm:text-base">
                                                {property?.description || "No description provided for this property."}
                                            </p>
                                        </div>

                                        {/* ── Amenities ── */}
                                        <section>
                                            <h3 className="text-base font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <Icon icon="solar:checklist-bold-duotone" className="text-base text-primary" />
                                                Amenities
                                            </h3>
                                            {property?.amenities?.length > 0 ? (
                                                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3">
                                                    {property.amenities.map((el, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex flex-col items-center justify-center gap-2 p-3 sm:p-4 bg-white border border-zinc-100 rounded-xl hover:border-primary/40 hover:shadow-sm transition-all cursor-default group"
                                                        >
                                                            <div className="p-2 bg-zinc-50 rounded-lg group-hover:bg-primary/10 transition-colors">
                                                                {el.name === 'AIR CONDITIONER' ? <TbAirConditioning className="text-xl text-zinc-500 group-hover:text-primary" />
                                                                    : el.name === 'HOT TUB' ? <PiBathtub className="text-xl text-zinc-500 group-hover:text-primary" />
                                                                        : el.name === 'Wi-FI' ? <IoWifi className="text-xl text-zinc-500 group-hover:text-primary" />
                                                                            : el.name === 'PS5' ? <IoGameControllerOutline className="text-xl text-zinc-500 group-hover:text-primary" />
                                                                                : el?.name === 'TV' ? <FaTv className="text-xl text-zinc-500 group-hover:text-primary" />
                                                                                    : <FaSwimmer className="text-xl text-zinc-500 group-hover:text-primary" />}
                                                            </div>
                                                            <span className="text-[10px] sm:text-xs font-semibold text-zinc-600 text-center leading-tight">{el.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <EmptyState icon="solar:sofa-bold-duotone" label="No amenities listed." />
                                            )}
                                        </section>

                                        {/* ── Documents ── */}
                                        <section>
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-base font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                                    <Icon icon="solar:folder-with-files-bold-duotone" className="text-base text-primary" />
                                                    Documents
                                                </h3>
                                                {user?.role === UserRole.OWNER && (
                                                    <button
                                                        onClick={() => setShowDocUpload(true)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-xl hover:bg-primary hover:text-white transition-all"
                                                    >
                                                        <FaPlus className="text-[9px]" />
                                                        Upload
                                                    </button>
                                                )}
                                            </div>

                                            {property?.documents?.length > 0 ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {property.documents.map((doc: IPropertyDocument, index: number) => (
                                                        <div
                                                            key={index}
                                                            className="bg-white border border-zinc-100 rounded-xl p-3 sm:p-4 flex flex-col gap-3 hover:border-primary/30 hover:shadow-sm transition-all group"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="p-2 bg-zinc-50 rounded-lg group-hover:bg-primary/10 transition-colors flex-shrink-0">
                                                                    <Icon icon="solar:file-text-bold-duotone" className="text-zinc-400 group-hover:text-primary text-lg" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-bold text-zinc-800 text-xs sm:text-sm truncate">
                                                                        {(doc?.document_type as string)?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())}
                                                                    </p>
                                                                    <p className="text-[10px] text-zinc-400 capitalize mt-0.5">{doc?.status?.toLowerCase()}</p>
                                                                </div>
                                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                                    <a
                                                                        href={doc?.document_url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="p-1.5 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-400 hover:text-zinc-700"
                                                                    >
                                                                        <Icon icon="solar:eye-bold-duotone" className="text-base" />
                                                                    </a>
                                                                    {user?.role === UserRole.ADMIN && doc?.status === PropertyVerificationStatus.PENDING && (
                                                                        <button
                                                                            onClick={() => { setSelectedDoc(doc); setShowDocVerify(true); }}
                                                                            className="p-1.5 hover:bg-primary/10 rounded-lg transition-colors text-primary"
                                                                        >
                                                                            <Icon icon="solar:checklist-bold-duotone" className="text-base" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {doc?.status === PropertyVerificationStatus.REJECTED && doc?.rejection_reason && (
                                                                <p className="text-[10px] text-red-500 bg-red-50 px-2.5 py-2 rounded-lg italic leading-relaxed">
                                                                    {doc.rejection_reason}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <EmptyState icon="solar:folder-favourite-bold-duotone" label="No documents uploaded yet." />
                                            )}
                                        </section>

                                        <div className="h-px bg-zinc-100" />

                                        {/* ── Units ── */}
                                        <section>
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-base font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                                                    <Icon icon="solar:home-2-bold-duotone" className="text-base text-primary" />
                                                    Units
                                                </h3>
                                                <Link
                                                    href={PAGE_ROUTES.dashboard.propertyManagement.allProperties.units.create(property?.id)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-xl hover:bg-primary hover:text-white transition-all"
                                                >
                                                    <FaPlus className="text-[9px]" />
                                                    Add Unit
                                                </Link>
                                            </div>

                                            {property?.units?.length > 0 ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                    {property.units.map((el, index) => (
                                                        <Link
                                                            href={PAGE_ROUTES.dashboard.propertyManagement.allProperties.units.details(property?.id, el.id)}
                                                            key={index}
                                                            className="group flex flex-col bg-white border border-zinc-100 rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-md transition-all"
                                                        >
                                                            <div className="relative h-36 sm:h-44 bg-zinc-100 overflow-hidden">
                                                                {el.media && el.media.length > 0 ? (
                                                                    (() => {
                                                                        const firstImage = el.media.find((m: any) => m.media_type !== 'VIDEO' && m.mediaType !== 'VIDEO') || el.media[0];
                                                                        const mediaUrl = firstImage.media_url || firstImage.mediaUrl || "/png/placeholder.png";
                                                                        const isVideo = firstImage.media_type === 'VIDEO' || firstImage.mediaType === 'VIDEO';
                                                                        return isVideo ? (
                                                                            <video src={mediaUrl} muted preload="metadata" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                                        ) : (
                                                                            <Image src={mediaUrl} alt={el.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                                                        );
                                                                    })()
                                                                ) : (
                                                                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-300 gap-2">
                                                                        <PiBuildingApartment className="text-3xl" />
                                                                        <span className="text-[9px] font-semibold uppercase tracking-wider">No image</span>
                                                                    </div>
                                                                )}
                                                                <div className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm">
                                                                    <p className="text-xs font-bold text-primary">
                                                                        ₦{Number(el.price_per_night ?? el.pricePerNight ?? 0).toLocaleString()}
                                                                        <span className="text-[9px] font-normal text-zinc-400 ml-0.5">/night</span>
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="p-3 sm:p-4 flex flex-col gap-1.5">
                                                                <h4 className="font-bold text-sm sm:text-base text-zinc-800 group-hover:text-primary transition-colors truncate">
                                                                    {el.name}
                                                                </h4>
                                                                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                                                                    {el.description || "View this unit for more details."}
                                                                </p>
                                                                <div className="flex items-center gap-4 pt-2 mt-1 border-t border-zinc-50">
                                                                    <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-semibold">
                                                                        <IoBedOutline className="text-primary" />
                                                                        {el.bedroom_count ?? el.bedroomCount ?? 0} Beds
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-semibold">
                                                                        <PiBathtub className="text-primary" />
                                                                        {el.bathroom_count ?? el.bathroomCount ?? 0} Baths
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </Link>
                                                    ))}
                                                </div>
                                            ) : (
                                                <EmptyState icon="solar:box-minimalistic-bold-duotone" label="No units created yet." />
                                            )}
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

                            <div className="lg:col-span-4 p-4 sm:p-6 md:p-8 space-y-4 md:space-y-5 bg-zinc-50/50">

                                {/* ── Verification Alert (Admin) ── */}
                                {user?.role === UserRole.ADMIN && (!property?.isVerified && !property?.is_verified || !property?.agent) && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5">
                                        <div className="flex items-start gap-3 mb-4">
                                            <div className="p-2 bg-amber-100 rounded-xl flex-shrink-0">
                                                <Icon icon="solar:danger-bold-duotone" className="text-xl text-amber-600" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-amber-900 text-sm">Verification Required</p>
                                                <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">This property is not visible to the public yet.</p>
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
                                                className="w-full py-2.5 bg-white border border-amber-300 text-amber-800 text-xs font-bold rounded-xl hover:bg-amber-100 transition-all"
                                            >
                                                Review Details
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setShowAgentSelection(true)}
                                                className="w-full py-2.5 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700 transition-all flex items-center justify-center gap-2"
                                            >
                                                <IoCloudUploadOutline className="text-sm" />
                                                Assign Agent
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* ── Overview Card ── */}
                                <div className="bg-white border border-zinc-100 rounded-2xl p-4 sm:p-5 shadow-sm">
                                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2 pb-3 border-b border-zinc-50">
                                        <Icon icon="solar:chart-2-bold-duotone" className="text-base text-primary" />
                                        Overview
                                    </h3>
                                    <div className="space-y-3">
                                        <OverviewRow
                                            icon={<GoVerified className="text-zinc-400 text-sm" />}
                                            label="Status"
                                            value={
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${property?.isVerified || property?.is_verified ? 'bg-teal-100 text-teal-700' : 'bg-red-50 text-red-600'}`}>
                                                    {property?.isVerified || property?.is_verified ? 'Verified' : 'Unverified'}
                                                </span>
                                            }
                                        />
                                        <OverviewRow
                                            icon={<PiBuildingApartment className="text-zinc-400 text-sm" />}
                                            label="Inventory"
                                            value={<span className="text-xs font-bold text-zinc-800">{availableUnits} Units</span>}
                                        />
                                        <OverviewRow
                                            icon={<GoChecklist className="text-zinc-400 text-sm" />}
                                            label="Listed on"
                                            value={
                                                <span className="text-xs font-bold text-zinc-800">
                                                    {(property?.isVerified || property?.is_verified)
                                                        ? (property?.verifications?.[0]?.verificationDate ? formatDate(property?.verifications?.[0]?.verificationDate) : 'Recently')
                                                        : 'Not Listed'}
                                                </span>
                                            }
                                        />
                                        <OverviewRow
                                            icon={<RiBuilding2Line className="text-zinc-400 text-sm" />}
                                            label="Type"
                                            value={<span className="text-xs font-bold text-zinc-800 capitalize">{(property?.propertyType || property?.property_type)?.toLowerCase()}</span>}
                                        />
                                    </div>

                                    {/* Action Buttons */}
                                    {!editMode && (
                                        <div className="mt-5 pt-4 border-t border-zinc-50 space-y-2">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => { setEditMode(true); setQueryParam('edit', 'true'); }}
                                                    className="flex-1 h-9 bg-zinc-900 text-white text-xs font-semibold rounded-xl hover:bg-zinc-700 transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider"
                                                >
                                                    <HiOutlinePencilAlt className="text-sm" />
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={handleDelete}
                                                    className="flex-1 h-9 bg-red-50 text-red-600 text-xs font-semibold rounded-xl hover:bg-red-100 transition-all flex items-center justify-center gap-1.5 border border-red-100 uppercase tracking-wider"
                                                >
                                                    <TrashIcon className="w-2.5" color="#dc2626" />
                                                    Delete
                                                </button>
                                            </div>
                                            <Link
                                                href={PAGE_ROUTES.dashboard.propertyManagement.allProperties.verifications.base(propertyId)}
                                                className="block w-full py-2 text-center text-zinc-400 text-xs hover:text-primary transition-colors underline underline-offset-2"
                                            >
                                                View verification history
                                            </Link>
                                        </div>
                                    )}
                                </div>

                                {/* ── Management Card ── */}
                                <div className="bg-white border border-zinc-100 rounded-2xl p-4 sm:p-5 shadow-sm">
                                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2 pb-3 border-b border-zinc-50">
                                        <Icon icon="solar:users-group-rounded-bold-duotone" className="text-base text-primary" />
                                        Management
                                    </h3>
                                    <div className="space-y-4">

                                        {/* Owner */}
                                        {user?.role !== UserRole.OWNER && (
                                            <div>
                                                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2.5">Owner</p>
                                                <PersonRow
                                                    image={(property?.owner?.profile?.profileImage || property?.owner?.profile?.profile_image) ?? '/png/sample_profile.png'}
                                                    name={property?.owner?.profile?.firstName
                                                        ? `${property?.owner?.profile?.firstName} ${property?.owner?.profile?.lastName}`
                                                        : property?.owner?.email || 'Aparte Partner'}
                                                    email={property?.owner?.email ?? '--/--'}
                                                    dotColor="bg-teal-500"
                                                />
                                            </div>
                                        )}

                                        {user?.role !== UserRole.OWNER && <div className="h-px bg-zinc-50" />}

                                        {/* Agent */}
                                        {property?.agent && user?.role !== UserRole.AGENT ? (
                                            <div>
                                                <div className="flex items-center justify-between mb-2.5">
                                                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Assigned Agent</p>
                                                    {user?.role === UserRole.ADMIN && !editMode && (
                                                        <button
                                                            onClick={() => setShowAgentSelection(true)}
                                                            className="p-1.5 hover:bg-primary/10 rounded-lg transition-colors"
                                                            title="Change agent"
                                                        >
                                                            <HiOutlinePencilAlt className="text-xs text-zinc-400 hover:text-primary" />
                                                        </button>
                                                    )}
                                                </div>
                                                <PersonRow
                                                    image={(property?.agent?.profile?.profileImage || property?.agent?.profile?.profile_image) ?? '/png/sample_profile.png'}
                                                    name={property?.agent?.profile?.firstName
                                                        ? `${property?.agent?.profile?.firstName} ${property?.agent?.profile?.lastName}`
                                                        : property?.agent?.email || 'Verification Officer'}
                                                    email={property?.agent?.email ?? '--/--'}
                                                    dotColor="bg-blue-500"
                                                />
                                            </div>
                                        ) : (
                                            user?.role === UserRole.ADMIN && !editMode && (
                                                <button
                                                    onClick={() => setShowAgentSelection(true)}
                                                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-zinc-200 rounded-xl text-zinc-400 text-xs font-bold hover:border-primary hover:text-primary transition-all bg-zinc-50/50"
                                                >
                                                    <FaPlus className="text-[9px]" />
                                                    Assign Agent
                                                </button>
                                            )
                                        )}
                                    </div>
                                </div>

                                {/* ── Booking Mode Card ── */}
                                {(user?.role === UserRole.OWNER || user?.role === UserRole.ADMIN) && !editMode && (
                                    <div className="bg-white border border-zinc-100 rounded-2xl p-4 sm:p-5 shadow-sm">
                                        <div className="pb-3 border-b border-zinc-50 mb-1">
                                            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                                <Icon icon="solar:hand-shake-bold-duotone" className="text-base text-primary" />
                                                Booking Mode
                                            </h3>
                                            <p className="text-[11px] text-zinc-400 mt-1.5">Choose how guests book your property.</p>
                                        </div>
                                        <div className="flex flex-col gap-2.5 mt-4">
                                            {/* Instant Book */}
                                            <BookingModeButton
                                                isActive={(property?.bookingMode ?? property?.booking_mode) === BookingMode.INSTANT || !(property?.bookingMode ?? property?.booking_mode)}
                                                isDisabled={bookingModeUpdating}
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
                                                activeClass="border-primary bg-primary/5"
                                                icon={<Icon icon="solar:bolt-bold-duotone" className={`text-base ${(property?.bookingMode ?? property?.booking_mode) === BookingMode.INSTANT || !(property?.bookingMode ?? property?.booking_mode) ? 'text-primary' : 'text-zinc-400'}`} />}
                                                iconBg={(property?.bookingMode ?? property?.booking_mode) === BookingMode.INSTANT || !(property?.bookingMode ?? property?.booking_mode) ? 'bg-primary/10' : 'bg-zinc-100'}
                                                title="Instant Book"
                                                titleClass={(property?.bookingMode ?? property?.booking_mode) === BookingMode.INSTANT || !(property?.bookingMode ?? property?.booking_mode) ? 'text-primary' : 'text-zinc-700'}
                                                description="Guests can book immediately without approval."
                                                checkColor="text-primary"
                                                showCheck={(property?.bookingMode ?? property?.booking_mode) === BookingMode.INSTANT || !(property?.bookingMode ?? property?.booking_mode)}
                                            />
                                            {/* Request to Book */}
                                            <BookingModeButton
                                                isActive={(property?.bookingMode ?? property?.booking_mode) === BookingMode.REQUEST_TO_BOOK}
                                                isDisabled={bookingModeUpdating}
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
                                                activeClass="border-violet-400 bg-violet-50"
                                                icon={<Icon icon="solar:hand-shake-bold-duotone" className={`text-base ${(property?.bookingMode ?? property?.booking_mode) === BookingMode.REQUEST_TO_BOOK ? 'text-violet-600' : 'text-zinc-400'}`} />}
                                                iconBg={(property?.bookingMode ?? property?.booking_mode) === BookingMode.REQUEST_TO_BOOK ? 'bg-violet-100' : 'bg-zinc-100'}
                                                title="Request to Book"
                                                titleClass={(property?.bookingMode ?? property?.booking_mode) === BookingMode.REQUEST_TO_BOOK ? 'text-violet-700' : 'text-zinc-700'}
                                                description="You review and approve each booking request."
                                                checkColor="text-violet-600"
                                                showCheck={(property?.bookingMode ?? property?.booking_mode) === BookingMode.REQUEST_TO_BOOK}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modals */}
                        <CustomModal isOpen={showVerification} onClose={() => setShowVerification(false)} title="Property verification details">
                            <div className="w-full p-1 flex flex-col gap-6">
                                <ModalSection title="Agent">
                                    <div className="flex gap-3 items-center mt-2">
                                        <Image
                                            alt="agent-image"
                                            src={(property?.agent?.profile?.profileImage || property?.agent?.profile?.profile_image) ?? '/png/sample_profile.png'}
                                            height={44} width={44}
                                            className="w-11 h-11 rounded-full object-cover ring-2 ring-zinc-100"
                                        />
                                        <div>
                                            <p className="text-sm font-semibold text-zinc-900">
                                                {property?.agent?.profile?.firstName ? `${property?.agent?.profile?.firstName} ${property?.agent?.profile?.lastName}` : property?.agent?.email || '--/--'}
                                                <span className="text-xs font-normal text-zinc-500 ml-1"><em>(Assigned agent)</em></span>
                                            </p>
                                            <p className="text-xs text-zinc-500 mt-0.5">{property?.agent?.email ?? '--/--'}</p>
                                        </div>
                                    </div>
                                </ModalSection>

                                <ModalSection title="Agent feedback">
                                    <p className="text-sm text-zinc-700 mt-1.5">
                                        {property?.verifications?.[0]?.feedback ?? <em className="text-zinc-400 font-normal">No comments yet</em>}
                                    </p>
                                </ModalSection>

                                <ModalSection title="KYC details">
                                    <p className="text-sm text-zinc-400 italic mt-1.5">Coming soon...</p>
                                </ModalSection>
                            </div>
                        </CustomModal>

                        <CustomModal
                            isOpen={showAgentSelection}
                            onClose={() => { setShowAgentSelection(false); setSelectedAgent(null); }}
                            title="Assign agent to property"
                        >
                            <div className="w-full p-1">
                                {!selectedAgent ? (
                                    <div className="mt-2">
                                        <label className="text-sm text-zinc-600 font-medium block mb-2">Search agents</label>
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
                                    <div className="mt-2 space-y-4">
                                        <div className="flex gap-3 items-center p-3 bg-zinc-50 rounded-xl">
                                            <Image
                                                alt="agent-image"
                                                src={(selectedAgent?.profile?.profileImage || selectedAgent?.profile?.profile_image) ?? '/png/sample_profile.png'}
                                                height={44} width={44}
                                                className="w-11 h-11 rounded-full object-cover ring-2 ring-zinc-100"
                                            />
                                            <div>
                                                <p className="text-sm font-semibold text-zinc-900">
                                                    {selectedAgent?.firstName ? `${selectedAgent?.firstName} ${selectedAgent?.lastName}` : selectedAgent?.email || '--/--'}
                                                </p>
                                                <p className="text-xs text-zinc-500">{selectedAgent?.email}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-zinc-700">
                                            Assign <strong>{selectedAgent?.firstName ? `${selectedAgent?.firstName} ${selectedAgent?.lastName}` : (selectedAgent?.email || 'this agent')}</strong> to this property?
                                        </p>
                                        <div className="flex gap-3 pt-1">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedAgent(null)}
                                                disabled={assignmentLoading}
                                                className="flex-1 py-2.5 font-semibold rounded-xl text-sm border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-60 transition-all"
                                            >
                                                Back
                                            </button>
                                            <button
                                                onClick={() => handleAgentAssignment(String(selectedAgent?.id))}
                                                disabled={assignmentLoading}
                                                type="button"
                                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-60 transition-all"
                                            >
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
                    </div>
                )}
            </div>
        </div>
    );
}

/** Sidebar overview row */
function OverviewRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-zinc-50 rounded-lg flex-shrink-0">
                    {icon}
                </div>
                <span className="text-zinc-500 text-xs font-medium">{label}</span>
            </div>
            <div>{value}</div>
        </div>
    );
}

/** Person (owner / agent) row */
function PersonRow({ image, name, email, dotColor }: { image: string; name: string; email: string; dotColor: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
                <Image alt="profile" src={image} height={40} width={40} className="rounded-full object-cover ring-2 ring-zinc-100 w-10 h-10" />
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${dotColor} border-2 border-white rounded-full`} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-zinc-900 truncate">{name}</p>
                <p className="text-xs text-zinc-400 truncate">{email}</p>
            </div>
        </div>
    );
}

/** Modal section heading */
function ModalSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{title}</p>
            {children}
        </div>
    );
}

/** Booking mode toggle button */
function BookingModeButton({
    isActive, isDisabled, onClick, activeClass,
    icon, iconBg, title, titleClass, description, checkColor, showCheck
}: {
    isActive: boolean; isDisabled: boolean; onClick: () => void;
    activeClass: string; icon: React.ReactNode; iconBg: string;
    title: string; titleClass: string; description: string;
    checkColor: string; showCheck: boolean;
}) {
    return (
        <button
            type="button"
            disabled={isDisabled}
            onClick={onClick}
            className={`flex items-start gap-3 p-3 sm:p-4 rounded-xl border-2 text-left transition-all w-full
                ${isActive ? activeClass : 'border-zinc-100 bg-white hover:border-zinc-200'}
                disabled:opacity-60 disabled:cursor-not-allowed`}
        >
            <div className={`mt-0.5 p-2 rounded-lg flex-shrink-0 ${iconBg}`}>
                {icon}
            </div>
            <div className="flex-1">
                <p className={`font-bold text-sm ${titleClass}`}>{title}</p>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">{description}</p>
            </div>
            {showCheck && (
                <Icon icon="solar:check-circle-bold-duotone" className={`${checkColor} text-lg shrink-0 mt-0.5`} />
            )}
        </button>
    );
}
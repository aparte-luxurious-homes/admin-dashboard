import { DeletePropertyUnit, GetSinglePropertyUnit, GetUnitAvailability, CreateUnitAvailability } from "@/src/lib/request-handlers/unitMgt";
import { useEffect, useState } from "react";
import { IPropertyUnit } from "../types";
import { Skeleton } from "../../ui/skeleton";
import { Navigation, Autoplay } from 'swiper/modules';
import { Swiper } from "swiper/react";
import { SwiperSlide } from "swiper/react";
import Image from "next/image";
import { IoStarSharp } from "react-icons/io5";
import { PiBathtub, PiBuildingApartment } from "react-icons/pi";
import { TrashIcon } from "../../icons";
import { formatMoney } from "@/src/lib/utils";
import { TbToolsKitchen, TbAirConditioning } from "react-icons/tb";
import { LuSofa, LuUsers } from "react-icons/lu";
import { IoBedOutline, IoLocationOutline, IoWifi, IoGameControllerOutline } from "react-icons/io5";
import { FaSwimmer, FaTv, FaPlus } from "react-icons/fa";
import { HiOutlinePencilAlt } from "react-icons/hi";
import { Icon } from "@iconify/react/dist/iconify.js";
import { GoVerified, GoChecklist } from "react-icons/go";
import { RiBuilding2Line } from "react-icons/ri";
import EditUnitView from "./EditUnitView";
import Link from "next/link";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import { useDispatch } from "react-redux";
import { showAlert } from "@/src/lib/slices/alertDialogSlice";
import { IoIosStarOutline } from "react-icons/io";
import { GetAmenities } from "@/src/lib/request-handlers/propertyMgt";
import toast from "react-hot-toast";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AvailabilityCalendar from "./AvailabilityCalendar";
import { format, addMonths } from "date-fns";

export default function UnitDetailsView({ propertyId, unitId }: { propertyId: string | number, unitId: string | number }) {
    const dispatch = useDispatch();
    const { data, isLoading } = GetSinglePropertyUnit(propertyId, unitId)
    const { mutate: deleteMutation, isPending: deleteIsPending } = DeletePropertyUnit()
    const router = useRouter();
    const pathname = usePathname();
    const urlSearchParams = new URLSearchParams(window.location.search);
    const searchParams = useSearchParams();

    const [editMode, setEditMode] = useState<boolean>(Boolean(searchParams.get('edit')));
    const [propertyUnit, setPropertyUnit] = useState<IPropertyUnit>(data?.data?.data)

    // Availability management
    const [showAvailability, setShowAvailability] = useState(false);
    const startDate = format(new Date(), 'yyyy-MM-dd');
    const endDate = format(addMonths(new Date(), 3), 'yyyy-MM-dd');
    const { data: availabilityData } = GetUnitAvailability(propertyId, unitId, startDate, endDate);
    const { mutate: saveAvailability, isPending: isSavingAvailability } = CreateUnitAvailability();

    const setQueryParam = (key: string, value: string) => {
        urlSearchParams.set(key, value);
        router.push(`${pathname}?${urlSearchParams.toString()}`);
    };

    const handleDelete = () => {
        dispatch(
            showAlert({
                title: "Are you sure?",
                description: "This action cannot be undone. This will permanently delete this property unit.",
                confirmText: "Delete",
                cancelText: "Cancel",
                onConfirm: () => {
                    if (propertyId && unitId)
                        deleteMutation(
                            { propertyId: String(propertyId), unitId: Number(unitId) },
                            {
                                onSuccess: (response) => {
                                    toast.success(response?.data?.message, {
                                        duration: 6000,
                                        style: {
                                            maxWidth: '500px',
                                            width: 'max-content'
                                        }
                                    });
                                    if (response.status === 204)
                                        router.push(PAGE_ROUTES.dashboard.propertyManagement.allProperties.details(propertyId))
                                }
                            }
                        )
                },
            })
        );
    };

    useEffect(() => {
        if (data) {
            setPropertyUnit(data?.data?.data)
        }
    }, [data])

    return (
        <div className="p-3 sm:p-4 md:p-6 lg:p-10 w-full max-w-[1600px] mx-auto">
            <div className="w-full border border-zinc-200 bg-white rounded-xl sm:rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-12 shadow-sm min-h-[70vh]">
                {isLoading && !propertyUnit ? (
                    <div className="flex flex-col space-y-4 sm:space-y-6">
                        <Skeleton className="w-full h-[250px] sm:h-[350px] md:h-[400px] rounded-xl sm:rounded-2xl md:rounded-3xl" />
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
                            <div className="lg:col-span-8 space-y-4 sm:space-y-6">
                                <Skeleton className="h-8 sm:h-10 md:h-12 w-3/4" />
                                <Skeleton className="h-24 sm:h-28 md:h-32 w-full" />
                                <Skeleton className="h-48 sm:h-56 md:h-64 w-full" />
                            </div>
                            <div className="lg:col-span-4 space-y-4 sm:space-y-6">
                                <Skeleton className="h-40 sm:h-44 md:h-48 w-full" />
                                <Skeleton className="h-40 sm:h-44 md:h-48 w-full" />
                            </div>
                        </div>
                    </div>
                ) : editMode ? (
                    <EditUnitView
                        handleEditMode={setEditMode}
                        unitData={propertyUnit}
                        propertyId={propertyId}
                        unitId={unitId}
                    />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8">
                        {/* Main Content Column */}
                        <div className="lg:col-span-8 space-y-6 sm:space-y-8 lg:space-y-10">
                            {/* Hero Gallery Section */}
                            <div className="relative rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden group shadow-lg sm:shadow-xl lg:shadow-2xl bg-zinc-100 min-h-[250px] sm:min-h-[350px] md:min-h-[450px]">
                                <Swiper
                                    loop={true}
                                    modules={[Navigation, Autoplay]}
                                    spaceBetween={0}
                                    slidesPerView={1}
                                    navigation
                                    autoplay={{ delay: 5000 }}
                                    className="h-full w-full"
                                >
                                    {propertyUnit?.media?.length > 0 ? (
                                        propertyUnit?.media?.map((el: any, index: any) => (
                                            <SwiperSlide key={index}>
                                                <div className="relative w-full aspect-[16/9] sm:aspect-[16/10] md:h-[450px] lg:h-[500px]">
                                                    <Image
                                                        alt={`${propertyUnit?.name}_img_${index}`}
                                                        src={el.media_url || el.mediaUrl || "/png/placeholder.png"}
                                                        fill
                                                        className="object-cover"
                                                        priority={index === 0}
                                                    />
                                                </div>
                                            </SwiperSlide>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-[250px] sm:h-[350px] md:h-[450px] text-zinc-300">
                                            <PiBuildingApartment className="text-5xl sm:text-6xl md:text-8xl mb-2 sm:mb-3 md:mb-4 opacity-20" />
                                            <p className="font-semibold italic text-base sm:text-lg md:text-xl px-4 text-center">No images for this unit</p>
                                        </div>
                                    )}
                                </Swiper>
                            </div>

                            {/* Info Section */}
                            <section className="space-y-4 sm:space-y-5 md:space-y-6">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4">
                                    <div className="space-y-1 sm:space-y-2 w-full sm:w-auto">
                                        <h1 className="text-2xl sm:text-[20px] md:text-[24px] lg:text-[28px] font-bold text-zinc-900 tracking-tight leading-tight sm:leading-none">
                                            {propertyUnit?.name}
                                        </h1>
                                        <div className="flex items-center gap-1 sm:gap-2 text-primary group">
                                            <Icon icon="solar:link-bold-duotone" className="text-lg sm:text-xl" />
                                            <Link
                                                href={PAGE_ROUTES.dashboard.propertyManagement.allProperties.details(propertyUnit?.propertyId || propertyUnit?.property_id || propertyId)}
                                                className="text-sm sm:text-base md:text-[16px] font-bold underline decoration-primary/30 underline-offset-4 hover:text-primary/70 transition-colors break-words"
                                            >
                                                View Parent Property
                                            </Link>
                                        </div>
                                    </div>
                                    <div className="bg-primary px-2 sm:px-3 md:px-3 py-2 sm:py-2 rounded-1xl sm:rounded-2xl shadow-md sm:shadow-xl shadow-primary/20 text-center w-full sm:w-auto sm:min-w-[160px] md:min-w-[180px]">
                                        <p className="text-xl sm:text-1xl md:text-[20px] font-bold text-white">
                                            {formatMoney(propertyUnit?.pricePerNight || propertyUnit?.price_per_night || 0)}
                                        </p>
                                        <p className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-white/70 uppercase tracking-[0.2em] mt-0.5 sm:mt-1">Per Night</p>
                                    </div>
                                </div>

                                <div className="bg-zinc-50 rounded-2xl sm:rounded-3xl p-4 sm:p-3 md:p-4 border border-zinc-100 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 sm:p-6 md:p-8 opacity-5">
                                        <Icon icon="solar:document-text-bold-duotone" className="text-5xl sm:text-6xl md:text-8xl" />
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-bold text-zinc-800 mb-1 sm:mb-1 md:mb-1 flex items-center gap-1 sm:gap-2">
                                        <Icon icon="solar:document-text-bold-duotone" className="text-xl sm:text-2xl text-primary" />
                                        Unit Description
                                    </h3>
                                    <p className="text-[12px] sm:[14px] md:[14px] text-zinc-600 leading-relaxed max-w-3xl relative z-10">
                                        {propertyUnit?.description || "A premium living space within this luxury development, carefully curated for excellence and comfort."}
                                    </p>
                                </div>
                            </section>

                            {/* Features Grid */}
                            <section className="space-y-4 sm:space-y-5 md:space-y-6">
                                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-zinc-900 flex items-center gap-2 sm:gap-3">
                                    <Icon icon="solar:widget-2-bold-duotone" className="text-2xl sm:text-3xl text-primary" />
                                    Essential Features
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                                    {[
                                        { label: 'Bedrooms', value: propertyUnit?.bedroomCount || propertyUnit?.bedroom_count || 0, icon: IoBedOutline },
                                        { label: 'Bathrooms', value: propertyUnit?.bathroomCount || propertyUnit?.bathroom_count || 0, icon: PiBathtub },
                                        { label: 'Kitchens', value: propertyUnit?.kitchenCount || propertyUnit?.kitchen_count || 0, icon: TbToolsKitchen },
                                        { label: 'Lounges', value: propertyUnit?.livingRoomCount || propertyUnit?.living_room_count || 0, icon: LuSofa }
                                    ].map((feature, i) => (
                                        <div key={i} className="p-1 sm:p-1 md:p-1 lg:p-1 bg-white border border-zinc-200 rounded-[4px] sm:rounded-[8px] md:rounded-[1rem] flex flex-col items-center gap-2 sm:gap-3 md:gap-4 hover:border-primary/40 hover:shadow-lg transition-all group cursor-default">
                                            <div className="p-1 sm:p-1 md:p-1 bg-zinc-50 rounded-lg sm:rounded-xl md:rounded-2xl group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-300">
                                                <feature.icon className="text-2xl sm:text-3xl md:text-4xl text-zinc-500 group-hover:text-primary" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.2 sm:mb-0.5">{feature.label}</p>
                                                <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-zinc-900 leading-none">{feature.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Amenities */}
                            {propertyUnit?.amenities && propertyUnit?.amenities?.length > 0 && (
                                <section className="space-y-4 sm:space-y-5 md:space-y-6">
                                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-zinc-900 flex items-center gap-2 sm:gap-3">
                                        <Icon icon="solar:star-bold-duotone" className="text-2xl sm:text-3xl text-primary" />
                                        Unit Amenities
                                    </h3>
                                    <div className="flex flex-wrap gap-2 sm:gap-3">
                                        {propertyUnit?.amenities?.map((el, index) => (
                                            <div key={index} className="px-3 sm:px-4 md:px-5 lg:px-6 py-2 sm:py-3 md:py-4 bg-white border border-zinc-100 rounded-lg sm:rounded-xl md:rounded-2xl shadow-sm text-xs sm:text-sm font-bold text-zinc-700 flex items-center gap-1 sm:gap-2 hover:border-primary/20 transition-colors">
                                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary shadow-sm shadow-primary/50" />
                                                {el.name}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Reviews */}
                            <section className="space-y-4 sm:space-y-5 md:space-y-6">
                                <div className="flex items-center justify-between border-b border-zinc-100 pb-4 sm:pb-5 md:pb-6">
                                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-zinc-900 flex items-center gap-2 sm:gap-3">
                                        <Icon icon="solar:medal-star-bold-duotone" className="text-2xl sm:text-3xl text-primary" />
                                        Guest Experience
                                    </h3>
                                    <div className="bg-primary/5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl flex items-center gap-1 sm:gap-2">
                                        <span className="text-primary font-bold text-sm sm:text-base">5.0</span>
                                        <div className="flex text-primary">
                                            {[...Array(5)].map((_, i) => <IoStarSharp key={i} size={12} className="sm:w-3.5 sm:h-3.5" />)}
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                                    {propertyUnit?.reviews?.length === 0 ? (
                                        <div className="p-8 sm:p-12 md:p-16 bg-zinc-50/50 border border-dashed border-zinc-200 rounded-2xl sm:rounded-3xl md:rounded-[3rem] flex flex-col items-center justify-center text-zinc-400">
                                            <Icon icon="solar:chat-line-broken" className="text-4xl sm:text-5xl md:text-6xl mb-2 sm:mb-3 md:mb-4 opacity-20" />
                                            <p className="font-bold text-sm sm:text-base md:text-lg opacity-60 text-center">No reviews yet for this unit.</p>
                                        </div>
                                    ) : (
                                        propertyUnit?.reviews?.map((review, index) => (
                                            <div key={index} className="p-4 sm:p-6 md:p-8 bg-white border border-zinc-100 rounded-xl sm:rounded-2xl md:rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-3 sm:gap-4 md:gap-5 mb-3 sm:mb-4 md:mb-6">
                                                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-zinc-100 rounded-full flex items-center justify-center ring-2 sm:ring-4 ring-zinc-50">
                                                        <LuUsers className="text-zinc-400 sm:w-5 md:w-6" size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm sm:text-base md:text-lg text-zinc-900 leading-tight">Verified Guest</p>
                                                        <p className="text-[8px] sm:text-[10px] md:text-xs font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Confirmed Booking</p>
                                                    </div>
                                                </div>
                                                <p className="text-sm sm:text-base md:text-lg text-zinc-600 leading-relaxed italic line-clamp-3">"{review?.review}"</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* Sidebar Column */}
                        <div className="lg:col-span-4 space-y-4 sm:space-y-6 lg:space-y-8 mt-4 sm:mt-6 lg:mt-0">
                            {/* Actions & Specs Card */}
                            <div className="bg-white border border-zinc-200 rounded-2xl sm:rounded-3xl md:rounded-[2rem] lg:rounded-[1rem] p-2 sm:p-1 md:p-2 lg:p-4 shadow-md sm:shadow-lg lg:shadow-xl shadow-zinc-200/50 space-y-5 sm:space-y-6 lg:space-y-8">
                                <section>
                                    <h3 className="text-lg sm:text-xl font-bold text-zinc-900 mb-4 sm:mb-6 lg:mb-8 flex items-center gap-1 sm:gap-2 border-b border-zinc-100 pb-3 sm:pb-4">
                                        <Icon icon="solar:info-square-bold-duotone" className="text-primary text-xl sm:text-2xl" />
                                        Unit Specifications
                                    </h3>
                                    <div className="space-y-1 sm:space-y-2 lg:space-y-3">
                                        {[
                                            { icon: LuUsers, label: 'Capacity', value: `${propertyUnit?.max_guests || 0} Guests` },
                                            { icon: 'solar:dollar-minimalistic-bold-duotone', label: 'Caution Fee', value: `${formatMoney(propertyUnit?.caution_fee || 0)}` },
                                            { icon: 'solar:box-bold-duotone', label: 'Available Inventory', value: `${propertyUnit?.count || 1} Units` }
                                        ].map((spec, i) => (
                                            <div key={i} className="flex justify-between items-center group/spec">
                                                <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                                                    <div className="p-1.5 sm:p-2 lg:p-2.5 bg-zinc-50 rounded-lg sm:rounded-xl group-hover/spec:bg-primary/10 transition-colors">
                                                        {typeof spec.icon === 'string' ? 
                                                            <Icon icon={spec.icon} className="text-zinc-500 group-hover/spec:text-primary transition-colors text-base sm:text-lg lg:text-xl" /> : 
                                                            <spec.icon className="text-zinc-500 group-hover/spec:text-primary transition-colors text-base sm:text-lg lg:text-xl" />
                                                        }
                                                    </div>
                                                    <span className="text-zinc-600 font-bold text-xs sm:text-sm tracking-tight">{spec.label}</span>
                                                </div>
                                                <span className="text-zinc-900 font-bold text-xs sm:text-sm">{spec.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <div className="space-y-2 pt-2 sm:pt-3 lg:pt-4">
                                    <Link
                                        href={PAGE_ROUTES.dashboard.propertyManagement.allProperties.units.bookings(propertyUnit?.propertyId || propertyUnit?.property_id || propertyId, propertyUnit?.id)}
                                        className="w-full h-8 sm:h-9 lg:h-10 bg-primary text-white font-semibold rounded-md sm:rounded-lg hover:bg-primary/90 transition-all shadow-md flex items-center justify-center gap-1 sm:gap-2 active:scale-[0.98] text-[10px] sm:text-xs uppercase tracking-wide"
                                    >
                                        <Icon icon="solar:ticket-bold-duotone" className="text-sm sm:text-base" />
                                        <span>See Unit Bookings</span>
                                    </Link>
                                    <div className="flex gap-1 sm:gap-2">
                                        <button
                                            onClick={() => { setEditMode(true); setQueryParam('edit', 'true'); }}
                                            className="flex-1 h-7 sm:h-8 lg:h-9 bg-zinc-900 text-white font-semibold rounded-md sm:rounded-lg hover:bg-zinc-800 transition-all shadow-sm flex items-center justify-center gap-1 sm:gap-2 active:scale-[0.98] text-[8px] sm:text-[10px] uppercase tracking-wider"
                                        >
                                            <HiOutlinePencilAlt className="text-xs sm:text-sm lg:text-base" />
                                            <span>Edit</span>
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            className="flex-1 h-7 sm:h-8 lg:h-9 bg-red-50 text-red-600 font-semibold rounded-md sm:rounded-lg hover:bg-red-100 transition-all flex items-center justify-center border border-red-100 gap-1 sm:gap-2 active:scale-[0.98] text-[8px] sm:text-[10px] uppercase tracking-wider"
                                        >
                                            <TrashIcon className="w-2.5 sm:w-3" color="#dc2626" />
                                            <span>Delete</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Availability Section in Sidebar */}
                            <div className="bg-white border border-zinc-200 rounded-2xl sm:rounded-3xl md:rounded-[2rem] lg:rounded-[1rem] p-2 sm:p-2 md:p-2 lg:p- shadow-sm space-y-4 sm:space-y-6 lg:space-y-8">
                                <h3 className="text-lg sm:text-xl font-bold text-zinc-900 flex items-center gap-1 sm:gap-2 border-b border-zinc-100 pb-3 sm:pb-4">
                                    <Icon icon="solar:calendar-bold-duotone" className="text-primary text-xl sm:text-2xl" />
                                    Occupancy Calendar
                                </h3>
                                <div className="space-y-4 sm:space-y-5 lg:space-y-6">
                                    <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 text-[8px] sm:text-[9px] lg:text-[10px] font-bold uppercase tracking-widest text-zinc-400 justify-center flex-wrap">
                                        <div className="flex items-center gap-1 sm:gap-2">
                                            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-primary rounded-full" />
                                            <span>Available</span>
                                        </div>
                                        <div className="flex items-center gap-1 sm:gap-2">
                                            <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-red-500 rounded-full" />
                                            <span>Reserved</span>
                                        </div>
                                    </div>
                                    <div className="w-full flex justify-center overflow-x-auto pb-2">
                                        <div className="min-w-[280px] sm:min-w-[300px] md:min-w-[320px] lg:min-w-full">
                                            <AvailabilityCalendar
                                                propertyId={propertyId}
                                                unitId={unitId}
                                                availability={availabilityData?.data?.data || []}
                                                defaultCount={propertyUnit?.count || 1}
                                                isSaving={isSavingAvailability}
                                                hideHeader={true}
                                                minimal={true}
                                                onSave={(dates) => {
                                                    saveAvailability(
                                                        { propertyId: String(propertyId), unitId, payload: { dates } },
                                                        {
                                                            onSuccess: () => toast.success('Availability updated successfully'),
                                                            onError: () => toast.error('Failed to update availability')
                                                        }
                                                    );
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Property Relationship Section */}
                            {propertyUnit?.property && (
                                <div className="bg-white border border-zinc-200 rounded-2xl sm:rounded-3xl md:rounded-[2rem] lg:rounded-[3rem] p-5 sm:p-6 md:p-8 lg:p-10 shadow-sm space-y-4 sm:space-y-6 lg:space-y-8">
                                    <h3 className="text-lg sm:text-xl font-bold text-zinc-900 flex items-center gap-1 sm:gap-2 border-b border-zinc-100 pb-3 sm:pb-4">
                                        <Icon icon="solar:users-group-rounded-bold-duotone" className="text-primary text-xl sm:text-2xl" />
                                        Property Management
                                    </h3>
                                    <div className="space-y-4 sm:space-y-6 lg:space-y-10">
                                        {[
                                            { label: 'OWNER', user: propertyUnit?.property?.owner },
                                            { label: 'ASSIGNED AGENT', user: propertyUnit?.property?.agent }
                                        ].map((role, i) => (
                                            <div key={i} className="group">
                                                <p className="text-[8px] sm:text-[9px] lg:text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-2 sm:mb-3 lg:mb-4">{role.label}</p>
                                                <div className="flex gap-2 sm:gap-3 lg:gap-4 items-center">
                                                    <div className="relative flex-shrink-0">
                                                        <Image
                                                            alt={`${role.label}-image`}
                                                            src={(role.user?.profile?.profileImage || role.user?.profile?.profile_image) ?? '/png/sample_profile.png'}
                                                            height={40}
                                                            width={40}
                                                            className="rounded-lg sm:rounded-xl lg:rounded-2xl object-cover ring-1 sm:ring-2 ring-zinc-50 shadow-sm w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12"
                                                        />
                                                        <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-4 lg:h-4 bg-green-500 border-1.5 sm:border-2 border-white rounded-full" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-zinc-900 truncate text-sm sm:text-base">
                                                            {role.user?.profile?.firstName ? `${role.user?.profile?.firstName} ${role.user?.profile?.lastName}` : role.user?.email || 'System User'}
                                                        </p>
                                                        <p className="text-[10px] sm:text-xs font-bold text-zinc-400 truncate">{role.user?.email}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
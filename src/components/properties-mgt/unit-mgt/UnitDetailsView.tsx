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
    const pathname = usePathname(); // Get current path
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
        urlSearchParams.set(key, value); // Add or update query param
        router.push(`${pathname}?${urlSearchParams.toString()}`); // Update the URL
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
                                    console.log(response)
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
        <div className="p-4 md:p-10 w-full max-w-[1600px] mx-auto">
            <div className="w-full border border-zinc-200 bg-white rounded-3xl p-6 md:p-12 shadow-sm min-h-[70vh]">
                {isLoading && !propertyUnit ? (
                    <div className="flex flex-col space-y-6">
                        <Skeleton className="w-full h-[400px] rounded-3xl" />
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                            <div className="md:col-span-8 space-y-6">
                                <Skeleton className="h-12 w-3/4" />
                                <Skeleton className="h-32 w-full" />
                                <Skeleton className="h-64 w-full" />
                            </div>
                            <div className="md:col-span-4 space-y-6">
                                <Skeleton className="h-48 w-full" />
                                <Skeleton className="h-48 w-full" />
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
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Main Content Column */}
                        <div className="lg:col-span-8 space-y-10">
                            {/* Hero Gallery Section */}
                            <div className="relative rounded-3xl overflow-hidden group shadow-2xl bg-zinc-100 min-h-[450px]">
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
                                                <div className="relative w-full aspect-[16/10] md:h-[500px]">
                                                    <Image
                                                        alt={`${propertyUnit?.name}_img_${index}`}
                                                        src={el.mediaUrl}
                                                        fill
                                                        className="object-cover"
                                                        priority={index === 0}
                                                    />
                                                </div>
                                            </SwiperSlide>
                                        ))
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-[450px] text-zinc-300">
                                            <PiBuildingApartment className="text-8xl mb-4 opacity-20" />
                                            <p className="font-semibold italic text-xl">No images for this unit</p>
                                        </div>
                                    )}
                                </Swiper>
                            </div>

                            {/* Info Section */}
                            <section className="space-y-6">
                                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                    <div className="space-y-2">
                                        <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 tracking-tight leading-none">
                                            {propertyUnit?.name}
                                        </h1>
                                        <div className="flex items-center gap-2 text-primary group">
                                            <Icon icon="solar:link-bold-duotone" className="text-xl" />
                                            <Link
                                                href={PAGE_ROUTES.dashboard.propertyManagement.allProperties.details(propertyUnit?.propertyId || propertyUnit?.property_id || propertyId)}
                                                className="text-lg font-bold underline decoration-primary/30 underline-offset-4 hover:text-primary/70 transition-colors"
                                            >
                                                View Parent Property
                                            </Link>
                                        </div>
                                    </div>
                                    <div className="bg-primary px-6 py-4 rounded-3xl shadow-xl shadow-primary/20 text-center min-w-[180px]">
                                        <p className="text-3xl font-bold text-white">
                                            ₦{formatMoney(propertyUnit?.pricePerNight || propertyUnit?.price_per_night || 0)}
                                        </p>
                                        <p className="text-[10px] font-bold text-white/70 uppercase tracking-[0.2em] mt-1">Per Night</p>
                                    </div>
                                </div>

                                <div className="bg-zinc-50 rounded-3xl p-8 border border-zinc-100 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-5">
                                        <Icon icon="solar:document-text-bold-duotone" className="text-8xl" />
                                    </div>
                                    <h3 className="text-xl font-bold text-zinc-800 mb-4 flex items-center gap-2">
                                        <Icon icon="solar:document-text-bold-duotone" className="text-2xl text-primary" />
                                        Unit Description
                                    </h3>
                                    <p className="text-zinc-600 leading-relaxed text-lg max-w-3xl relative z-10">
                                        {propertyUnit?.description || "A premium living space within this luxury development, carefully curated for excellence and comfort."}
                                    </p>
                                </div>
                            </section>

                            {/* Features Grid */}
                            <section className="space-y-6">
                                <h3 className="text-2xl font-bold text-zinc-900 flex items-center gap-3">
                                    <Icon icon="solar:widget-2-bold-duotone" className="text-3xl text-primary" />
                                    Essential Features
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {[
                                        { label: 'Bedrooms', value: propertyUnit?.bedroomCount || propertyUnit?.bedroom_count || 0, icon: IoBedOutline },
                                        { label: 'Bathrooms', value: propertyUnit?.bathroomCount || propertyUnit?.bathroom_count || 0, icon: PiBathtub },
                                        { label: 'Kitchens', value: propertyUnit?.kitchenCount || propertyUnit?.kitchen_count || 0, icon: TbToolsKitchen },
                                        { label: 'Lounges', value: propertyUnit?.livingRoomCount || propertyUnit?.living_room_count || 0, icon: LuSofa }
                                    ].map((feature, i) => (
                                        <div key={i} className="p-6 bg-white border border-zinc-200 rounded-[2.5rem] flex flex-col items-center gap-4 hover:border-primary/40 hover:shadow-lg transition-all group cursor-default">
                                            <div className="p-4 bg-zinc-50 rounded-2xl group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-300">
                                                <feature.icon className="text-4xl text-zinc-500 group-hover:text-primary" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">{feature.label}</p>
                                                <p className="text-2xl font-bold text-zinc-900 leading-none">{feature.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Amenities */}
                            {propertyUnit?.amenities && propertyUnit?.amenities?.length > 0 && (
                                <section className="space-y-6">
                                    <h3 className="text-2xl font-bold text-zinc-900 flex items-center gap-3">
                                        <Icon icon="solar:star-bold-duotone" className="text-3xl text-primary" />
                                        Unit Amenities
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                        {propertyUnit?.amenities?.map((el, index) => (
                                            <div key={index} className="px-6 py-4 bg-white border border-zinc-100 rounded-2xl shadow-sm text-sm font-bold text-zinc-700 flex items-center gap-3 hover:border-primary/20 transition-colors">
                                                <div className="w-2 h-2 rounded-full bg-primary shadow-sm shadow-primary/50" />
                                                {el.name}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Reviews */}
                            <section className="space-y-6">
                                <div className="flex items-center justify-between border-b border-zinc-100 pb-6">
                                    <h3 className="text-2xl font-bold text-zinc-900 flex items-center gap-3">
                                        <Icon icon="solar:medal-star-bold-duotone" className="text-3xl text-primary" />
                                        Guest Experience
                                    </h3>
                                    <div className="bg-primary/5 px-4 py-2 rounded-2xl flex items-center gap-2">
                                        <span className="text-primary font-bold">5.0</span>
                                        <div className="flex text-primary">
                                            {[...Array(5)].map((_, i) => <IoStarSharp key={i} size={14} />)}
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    {propertyUnit?.reviews?.length === 0 ? (
                                        <div className="p-16 bg-zinc-50/50 border border-dashed border-zinc-200 rounded-[3rem] flex flex-col items-center justify-center text-zinc-400">
                                            <Icon icon="solar:chat-line-broken" className="text-6xl mb-4 opacity-20" />
                                            <p className="font-bold text-lg opacity-60">No reviews yet for this unit.</p>
                                        </div>
                                    ) : (
                                        propertyUnit?.reviews?.map((review, index) => (
                                            <div key={index} className="p-8 bg-white border border-zinc-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-5 mb-6">
                                                    <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center ring-4 ring-zinc-50">
                                                        <LuUsers className="text-zinc-400" size={24} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-zinc-900 text-lg leading-none">Verified Guest</p>
                                                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">Confirmed Booking</p>
                                                    </div>
                                                </div>
                                                <p className="text-zinc-600 leading-relaxed italic text-lg line-clamp-3">"{review?.review}"</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* Sidebar Column */}
                        <div className="lg:col-span-4 space-y-8">
                            {/* Actions & Specs Card */}
                            <div className="bg-white border border-zinc-200 rounded-[3rem] p-10 shadow-lg shadow-zinc-200/50 space-y-8">
                                <section>
                                    <h3 className="text-xl font-bold text-zinc-900 mb-8 flex items-center gap-2 border-b border-zinc-100 pb-4">
                                        <Icon icon="solar:info-square-bold-duotone" className="text-primary text-2xl" />
                                        Unit Specifications
                                    </h3>
                                    <div className="space-y-6">
                                        {[
                                            { icon: LuUsers, label: 'Capacity', value: `${propertyUnit?.maxGuests || 0} Guests` },
                                            { icon: 'solar:dollar-minimalistic-bold-duotone', label: 'Caution Fee', value: `₦${formatMoney(propertyUnit?.cautionFee || 0)}` },
                                            { icon: 'solar:box-bold-duotone', label: 'Available Inventory', value: `${propertyUnit?.count || 1} Units` }
                                        ].map((spec, i) => (
                                            <div key={i} className="flex justify-between items-center group/spec">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-2.5 bg-zinc-50 rounded-xl group-hover/spec:bg-primary/10 transition-colors">
                                                        {typeof spec.icon === 'string' ? <Icon icon={spec.icon} className="text-zinc-500 group-hover/spec:text-primary transition-colors text-xl" /> : <spec.icon className="text-zinc-500 group-hover/spec:text-primary transition-colors text-xl" />}
                                                    </div>
                                                    <span className="text-zinc-600 font-bold text-sm tracking-tight">{spec.label}</span>
                                                </div>
                                                <span className="text-zinc-900 font-bold">{spec.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <div className="space-y-2 pt-4">
                                    <Link
                                        href={PAGE_ROUTES.dashboard.propertyManagement.allProperties.units.bookings(propertyUnit?.propertyId || propertyUnit?.property_id || propertyId, propertyUnit?.id)}
                                        className="w-full h-10 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.98] text-xs uppercase tracking-wide"
                                    >
                                        <Icon icon="solar:ticket-bold-duotone" className="text-base" />
                                        <span>See Unit Bookings</span>
                                    </Link>
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
                                </div>
                            </div>

                            {/* Availability Section in Sidebar */}
                            <div className="bg-white border border-zinc-200 rounded-[3rem] p-10 shadow-sm space-y-8">
                                <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-4">
                                    <Icon icon="solar:calendar-bold-duotone" className="text-primary text-2xl" />
                                    Occupancy Calendar
                                </h3>
                                <div className="space-y-6">
                                    <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-zinc-400 justify-center">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 bg-primary rounded-full" />
                                            <span>Available</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                                            <span>Reserved</span>
                                        </div>
                                    </div>
                                    <div className="w-full flex justify-center scale-90 sm:scale-100 origin-top overflow-hidden">
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

                            {/* Property Relationship Section */}
                            {propertyUnit?.property && (
                                <div className="bg-white border border-zinc-200 rounded-[3rem] p-10 shadow-sm space-y-8">
                                    <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-2 border-b border-zinc-100 pb-4">
                                        <Icon icon="solar:users-group-rounded-bold-duotone" className="text-primary text-2xl" />
                                        Property Management
                                    </h3>
                                    <div className="space-y-10">
                                        {[
                                            { label: 'OWNER', user: propertyUnit?.property?.owner },
                                            { label: 'ASSIGNED AGENT', user: propertyUnit?.property?.agent }
                                        ].map((role, i) => (
                                            <div key={i} className="group">
                                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-4">{role.label}</p>
                                                <div className="flex gap-4 items-center">
                                                    <div className="relative">
                                                        <Image
                                                            alt={`${role.label}-image`}
                                                            src={role.user?.profile?.profileImage ?? '/png/sample_profile.png'}
                                                            height={52}
                                                            width={52}
                                                            className="rounded-2xl object-cover ring-2 ring-zinc-50 shadow-sm"
                                                        />
                                                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-zinc-900 truncate text-base">
                                                            {role.user?.profile?.firstName ? `${role.user?.profile?.firstName} ${role.user?.profile?.lastName}` : role.user?.email || 'System User'}
                                                        </p>
                                                        <p className="text-xs font-bold text-zinc-400 truncate">{role.user?.email}</p>
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
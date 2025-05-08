import { DeletePropertyUnit, GetSinglePropertyUnit } from "@/src/lib/request-handlers/unitMgt";
import { useEffect, useState } from "react";
import { IPropertyUnit } from "../types";
import { Skeleton } from "../../ui/skeleton";
import { Navigation, Autoplay } from 'swiper/modules';
import { Swiper } from "swiper/react";
import { SwiperSlide } from "swiper/react";
import Image from "next/image";
import { IoStarSharp } from "react-icons/io5";
import { PiBathtub } from "react-icons/pi";
import { TrashIcon } from "../../icons";
import { formatMoney } from "@/src/lib/utils";
import { TbToolsKitchen } from "react-icons/tb";
import { LuSofa } from "react-icons/lu";
import { IoBedOutline } from "react-icons/io5";
import EditUnitView from "./EditUnitView";
import Link from "next/link";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import { useDispatch } from "react-redux";
import { showAlert } from "@/src/lib/slices/alertDialogSlice";
import { IoIosStarOutline } from "react-icons/io";
import { GetAmenities } from "@/src/lib/request-handlers/propertyMgt";
import toast from "react-hot-toast";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function UnitDetailsView({ propertyId, unitId }: { propertyId: number, unitId: number }) {
    const dispatch = useDispatch();
    const { data, isLoading } = GetSinglePropertyUnit(propertyId, unitId)
    const  { mutate: deleteMutation, isPending: deleteIsPending } = DeletePropertyUnit()
    const router = useRouter();
    const pathname = usePathname(); // Get current path
    const urlSearchParams = new URLSearchParams(window.location.search); 
    const searchParams = useSearchParams();
    
    const [editMode, setEditMode] = useState<boolean>(Boolean(searchParams.get('edit')));
    const [propertyUnit, setPropertyUnit] = useState<IPropertyUnit>(data?.data?.data)


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
                        { propertyId, unitId },
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

    return(
        <div className="p-10 w-full">
            <div className="w-full border border-zinc-500/20 bg-white rounded-xl p-10 min-h-[50vh]">
                {
                    isLoading && !propertyUnit ?
                    <div className="flex flex-col space-y-3">
                        <Skeleton className="w-full h-72 rounded-xl" />
                        <div className="space-y-4 mt-4">
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-20 w-full" />
                        </div>
                    </div>
                    :
                    <>
                        <div className="w-full relative">
                            <Swiper
                                loop={true}
                                modules={[Navigation, Autoplay]}
                                spaceBetween={10}
                                slidesPerView={propertyUnit?.media.length > 1 ? 2 : 1}
                                navigation
                                autoplay
                                className="rewind"
                            >   
                                {
                                    propertyUnit?.media?.map((el: any, index: any) => (
                                        <SwiperSlide key={index}>
                                            <Image
                                                alt={`${propertyUnit?.name}_img_${index}`}
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
                                    <h3 className="text-3xl font-normal text-zinc-800 leading-3 mt-5">
                                        {propertyUnit?.name} <span className="text-base font-light"><em>{`(${propertyUnit?.count} units)`}</em></span> <br/>
                                        <span className="underline text-primary/90 italic text-sm hover:text-primary">
                                            <Link href={PAGE_ROUTES.dashboard.propertyManagement.allProperties.details(propertyUnit?.propertyId)}>
                                                See property
                                            </Link>
                                        </span>
                                    </h3>
                                    
                                    <div className="flex flex-col justify-center items-center gap-0 mt-3">
                                        <p className="text-xl font-medium text-zinc-800">
                                        ₦{formatMoney(propertyUnit?.cautionFee)}
                                        </p>
                                        <p className="text-sm font-normal">
                                            <em>(Caution fee)</em>
                                        </p>
                                    </div>
                                    
                                    <div className="flex flex-col justify-center items-center gap-0 mt-3">
                                        <p className="text-xl font-medium text-zinc-800">
                                            {propertyUnit?.maxGuests} {propertyUnit?.maxGuests > 1 ? 'guests' : 'guest'}
                                        </p>
                                        <p className="text-sm font-normal">
                                            <em>(maximum)</em>
                                        </p>
                                    </div>
                                    

                                    <div className="flex flex-col justify-center items-center gap-0 pr-3 leading-3 ">
                                        <p className="text-xl text-primary font-medium mt-5 mb-0">
                                            ₦{formatMoney(propertyUnit?.pricePerNight)}
                                        </p>
                                        <p className="text-sm font-medium text-zinc-600">
                                            Per night
                                        </p>
                                        <span className="underline text-primary/90 italic text-sm hover:text-primary mt-1">
                                            <Link href={PAGE_ROUTES.dashboard.propertyManagement.allProperties.units.bookings(propertyUnit?.propertyId, propertyUnit?.id)}>
                                                See bookings
                                            </Link>
                                        </span>
                                    </div>
                                </div>

                                <div className="h-px w-full bg-zinc-300/30 my-6" />

                                <>
                                    <p className="text-2xl text-zinc-900 mt-8 mb-5">
                                        Description
                                    </p>
                                    <p className="text-lg text-zinc-700 font-normal my-3">
                                        {propertyUnit?.description}
                                    </p>
                                </>

                                <div className="h-px w-full bg-zinc-300/30 my-8" />

                                <div className="mt-8 mb-5">
                                    <p className="text-2xl text-zinc-900">
                                        Features
                                    </p>

                                    <div className="w-full mt-2 p-3 grid grid-cols-4 gap-10 text-lg font-normal text-zinc-900">
                                        {
                                            propertyUnit?.bedroomCount > 0 &&  
                                            <div className="border border-zinc-300/50 rounded-xl py-5 px-2 flex flex-col justify-center items-center gap-5">
                                                <IoBedOutline className="text-3xl font-normal" />
                                                <p className="text-center">
                                                    Bedroom <br /><span className="text-base font-normal text-zinc-700"><em>x{propertyUnit?.bedroomCount}</em></span>
                                                </p>
                                            </div>
                                        }
                                        {
                                            propertyUnit?.bathroomCount > 0 &&
                                            <div className="border border-zinc-300/50 rounded-xl py-5 px-2 flex flex-col justify-center items-center gap-5">
                                                <PiBathtub className="text-3xl font-normal" />
                                                <p className="text-center">
                                                    Bathroom <br /><span className="text-base  font-normal text-zinc-700"><em>x{propertyUnit?.bathroomCount}</em></span>
                                                </p>
                                            </div>
                                        }
                                        {
                                            propertyUnit?.kitchenCount > 0 &&  
                                            <div className="border border-zinc-300/50 rounded-xl py-5 px-2 flex flex-col justify-center items-center gap-5">
                                                <TbToolsKitchen className="text-3xl font-normal" />
                                                <p className="text-center">
                                                    Kitchen <br /><span className="text-base  font-normal text-zinc-700"><em>x{propertyUnit?.kitchenCount}</em></span>
                                                </p>
                                            </div>
                                        }
                                        {
                                            propertyUnit?.livingRoomCount > 0 &&
                                            <div className="border border-zinc-300/50 rounded-xl py-5 px-2 flex flex-col justify-center items-center gap-5">
                                                <LuSofa className="text-3xl font-normal"/>
                                                <p className="text-center">
                                                    Living Room <br/><span className="text-base  font-normal text-zinc-700"><em>x{propertyUnit?.livingRoomCount}</em></span>
                                                </p>
                                            </div>
                                        }
                                    </div>
                                </div>

                                <div className="h-px w-full bg-zinc-300/30 my-8" />

                                <div className="mt-8 mb-5">
                                    <p className="text-2xl text-zinc-900">
                                        Amenities
                                    </p>

                                    <div className="w-full mt-7 flex gap-3">
                                        {
                                            propertyUnit?.amenities &&
                                            propertyUnit?.amenities.map((el, index) => 
                                                <div key={index} className="w-fit h-12 flex items-center justify-center p-5 border rounded-lg">
                                                    {el.name}
                                                </div>
                                            )
                                        }
                                    </div>

                                </div>
                                

                                <div className="h-px w-full bg-zinc-300/30 my-6" />
                                {
                                    propertyUnit?.property &&
                                    <>
                                        <div className="mb-10">
                                            <p className="text-2xl text-zinc-900">
                                                Attached profiles
                                            </p>

                                            <div className="flex gap-4 items-center mt-3 justify-between w-2/3">
                                                <div className="">
                                                    <p className="font-medium">
                                                        Owner
                                                    </p>
                                                    <div className="flex gap-4 items-center rounded-full mt-3 pl-5">
                                                        <Image 
                                                            alt="owner-image"
                                                            src={propertyUnit?.property?.owner?.profile?.profileImage??'/png/sample_profile.png'}
                                                            height={50}
                                                            width={60}
                                                        />
                                                        <div>
                                                            <p className="text-lg text-zinc-900 m-0">{`${propertyUnit?.property?.owner?.profile?.firstName??`Olutayo`} ${propertyUnit?.property?.owner?.profile?.lastName??`Akingbola`}`}</p>
                                                            <p className="text-base text-zinc-500">{`${propertyUnit?.property?.owner?.email}`}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                
                                                <div className="w-px h-[4.5rem] bg-zinc-400 rotate-180 "/>
                                                    
                                                <div className="">
                                                    <p className="font-medium">
                                                        Agent
                                                    </p>
                                                    <div className="flex gap-4 items-center rounded-full mt-3 pl-5">
                                                        <Image 
                                                            alt="owner-image"
                                                            src={propertyUnit?.property?.agent.profile?.profileImage??'/png/sample_profile.png'}
                                                            height={50}
                                                            width={60}
                                                        />
                                                        <div>
                                                            <p className="text-lg text-zinc-900 m-0">{`${propertyUnit?.property?.agent.profile?.firstName??'Kunle'} ${propertyUnit?.property?.agent.profile?.lastName??'Aina'}`}</p>
                                                            <p className="text-base text-zinc-500">{`${propertyUnit?.property?.agent.email}`}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="h-px w-full bg-zinc-300/30 my-6" />
                                    </>
                                }

                                <div className="mt-8 mb-5 w-full">
                                    <div className="w-full flex justify-between items-center">
                                        <p className="text-2xl text-zinc-900">
                                            Reviews 
                                        </p>
                                        <div className="flex flex-col justify-center items-center gap-0  pl-6">
                                            <p className="text-base font-medium text-teal-800">
                                                (0/5)
                                            </p>
                                            <div className="flex justify-center items-center gap-1">
                                                <IoIosStarOutline className="text-primary text-lg"/>
                                                <IoIosStarOutline className="text-primary text-lg"/>
                                                <IoIosStarOutline className="text-primary text-lg"/>
                                                <IoIosStarOutline className="text-primary text-lg"/>
                                                <IoIosStarOutline className="text-primary text-lg"/>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 p-4">
                                        {
                                            propertyUnit?.reviews.length === 0 ?
                                            <p className="text-lg text-zinc-500 mt-3"><em>No reviews yet</em></p>
                                            :
                                            <div className="flex flex-col divide-x divide-zinc-300 gap-y-4">
                                                {
                                                    propertyUnit?.reviews.map((review, index) => 
                                                        <p key={index} className="text-lg text-zinc-900 ">
                                                            {`${review?.review}`}
                                                        </p>
                                                    )
                                                }
                                            </div>
                                        }
                                    </div>
                                </div>
                                
                                <div className="flex justify-end items-center gap-5 mt-3">
                                    <div onClick={() => {setEditMode(true); setQueryParam('edit', 'true')}} className="cursor-pointer border border-zinc-500 rounded-lg px-5 py-2.5 text-lg text-zinc-600 hover:bg-zinc-600 hover:text-white">
                                        Edit
                                    </div>
                                    <div onClick={() => handleDelete()} className="cursor-pointer border border-red-500 rounded-md px-3 py-2.5 text-lg text-white bg-red-600 hover:bg-red-700">
                                        <TrashIcon className="size-6" color="white" />
                                    </div>
                                </div>
                            </>
                            :
                            <EditUnitView
                                handleEditMode={setEditMode}
                                unitData={propertyUnit}
                                propertyId={propertyId}
                                unitId={unitId}
                            />
                        }
                    </>
                }
            </div> 
        </div>
    );
}
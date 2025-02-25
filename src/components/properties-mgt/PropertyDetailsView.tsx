'use client'

import Image from "next/image";
import { TrashIcon } from "../icons";
import { TbAirConditioning } from "react-icons/tb";
import { FaSwimmer, FaTv } from "react-icons/fa";
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
import { IProperty, IPropertyUnit } from "./types";
import { FeatureProperty, GetAmenities, GetSingleProperty } from "@/src/lib/request-handlers/propertyMgt";
import { Skeleton } from "@/components/ui/skeleton"
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import { useDispatch } from "react-redux";
import { showAlert } from "@/src/lib/slices/alertDialogSlice";
import { IoIosStarOutline } from "react-icons/io";
import Spinner from "../ui/Spinner";
import CustomModal from "../ui/CustomModal";
import { IoGameControllerOutline } from "react-icons/io5";



export default function PropertyDetailsView({
    propertyId,
    }: {
        propertyId: number;
    }) {

    const dispatch = useDispatch();
    const { data, isLoading } = GetSingleProperty(propertyId)
    const { data: fetchedAmenites } = GetAmenities();
    const { mutate, isPending } = FeatureProperty();
    
    const [showVerification, setShowVerification] = useState(false);
    const [editMode, setEditMode] = useState<boolean>(false);
    const [property, setProperty] = useState<IProperty>(data?.data?.data)
    const [availabeUnits, setAvailableUnits] = useState<number>(0)
    const [averageRating, setAverageRating] = useState<number>(property?.meta?.total_reviews ? (property.meta.total_rating / property.meta.total_reviews): 0);


    const handleDelete = () => {
        dispatch(
            showAlert({
                title: "Are you sure?",
                description: "This action cannot be undone. This will permanently delete this property.",
                confirmText: "Delete",
                cancelText: "Cancel",
                onConfirm: () => {
                    console.log("Item deleted!");
                },
            })
        );
    };


    useEffect(() => {
        if (data) {
            setProperty(data?.data?.data)
            let unitAmount = 0
            data?.data?.data?.units.forEach((el: IPropertyUnit) => {unitAmount += el.count})
            setAvailableUnits(unitAmount)
            setAverageRating(property?.meta?.total_reviews ? (property.meta.total_reviews / property.meta.average_rating ) : 0)
        }
    }, [data, property.meta.average_rating, property.meta.total_reviews])

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
                                        <h3 className="text-3xl font-normal text-zinc-800">
                                            {property?.name}
                                        </h3>
                                        <div className="flex gap-2 items-center mt-2 text-xl text-zinc-700">
                                            <IoLocationOutline />
                                            <p className="text-base">
                                                {property?.address}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-6 mt-3 ">
                                            {
                                                property?.amenities?.map((el, index) => 
                                                    <div key={index} className="flex items-center  gap-2 ">
                                                        {
                                                            el.amenity.name === 'AIR CONDITIONER'
                                                            ? <TbAirConditioning className="text-xl"/>
                                                            : el.amenity.name === 'HOT TUB'
                                                                ? <PiBathtub className="text-xl"/>
                                                                : el.amenity.name === 'Wi-FI'
                                                                    ? <IoWifi className="text-xl"/>
                                                                    : el.amenity.name === 'PS5'
                                                                        ? < IoGameControllerOutline  className="text-xl"/>
                                                                        : el.amenity.name === 'TV'
                                                                            ? <FaTv className="text-xl"/>
                                                                            : <FaSwimmer />

                                                        }
                                                        <span>{ el.amenity.name }</span>
                                                    </div>
                                                )
                                            }
                                        </div>
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
                                    !property?.isFeatured &&
                                    <div className="flex justify-between items-center gap-4 mt-7 mb-5 w-full px-4 py-3 border-dashed border-2 border-zinc-400 rounded-lg">
                                        <p className="text-xl text-zinc-500">
                                            This property has not been listed on the market yet! <span onClick={() => setShowVerification(true)} className="cursor-pointer pl-1 text-zinc-800"><u>View verification</u></span>
                                        </p>

                                        {
                                            isPending ?
                                            <Spinner />
                                            :
                                            <div className="flex justify-center items-center gap-5">
                                                <button onClick={() => mutate({ propertyId: property?.id })} disabled={isPending}  className="cursor-pointer  flex gap-3 items-center border border-teal-800 rounded-lg px-5 py-1.5 text-lg text-teal-800 hover:bg-teal-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-75 disabled:hover:bg-transparent">
                                                    <span>Publish</span>
                                                    <IoCloudUploadOutline className="text-2xl text-medium"/>
                                                </button>
                                            </div>
                                        }
                                    </div>
                                }

                                <div className="h-px w-full bg-zinc-400/30 mt-10 mb-5" />

                                <p className="text-2xl text-zinc-900 mt-8">
                                    Property description
                                </p>

                                <p className="text-lg text-zinc-700 mt-4">
                                    {property?.description}
                                </p>

                                <div className="h-px w-full bg-zinc-400/30 my-5" />

                                <div className="my-10">
                                    <p className="text-2xl text-zinc-900">
                                        Available units
                                    </p>

                                    <div className="w-full grid grid-cols-3 mt-2 p-3 gap-6">
                                        {
                                            property?.units.map((el, index) => 
                                                <Link href={PAGE_ROUTES.dashboard.propertyManagement.allProperties.units.details(property.id, el.id)} key={index} className="cursor-pointer border border-zinc-300 rounded-lg flex justify-between ease-in-out duration-150 hover:border-primary/80">
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

                                    <div className="flex gap-4 items-center mt-4 justify-between w-2/3">
                                        <div className="">
                                            <p className="font-medium">
                                                Owner
                                            </p>
                                            <div className="flex gap-4 items-center rounded-full mt-3 pl-5">
                                                <Image 
                                                    alt="owner-image"
                                                    src={property?.owner?.profile?.profileImage??'/png/sample_profile.png'}
                                                    height={50}
                                                    width={60}
                                                />
                                                <div>
                                                    <p className="text-lg text-zinc-900 m-0">{`${property?.owner?.profile?.firstName??`Olutayo`} ${property?.owner?.profile?.lastName??`Akingbola`}`}</p>
                                                    <p className="text-base text-zinc-500">{`${property?.owner?.email}`}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {
                                            property?.agent &&
                                            <div className="">
                                                <p className="font-medium">
                                                    Agent
                                                </p>
                                                <div className="flex gap-4 items-center rounded-full mt-3 pl-5">
                                                    <Image 
                                                        alt="owner-image"
                                                        src={property?.agent?.profile?.profileImage??'/png/sample_profile.png'}
                                                        height={50}
                                                        width={60}
                                                    />
                                                    <div>
                                                        <p className="text-lg text-zinc-900 m-0">{`${property?.agent?.profile?.firstName??'Kunle'} ${property?.agent?.profile?.lastName??'Aina'}`}</p>
                                                        <p className="text-base text-zinc-500">{`${property?.agent?.email}`}</p>
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
                                                <GoVerified className="text-2xl font-medium"/>
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
                                                <PiBuildingApartment className="text-2xl "/>
                                                <span className="text-base">Total units availabe</span>
                                            </div>
                                            <p className="text-2xl font-medium text-zinc-800 mt-2">
                                                {availabeUnits}
                                            </p>
                                        </div>
                                        <div>
                                            <div className="flex gap-3 text-zinc-700">
                                                <GoChecklist className="text-2xl"/>
                                                <span className="text-base">Listed on</span>
                                            </div>
                                            <p className="text-2xl font-medium text-zinc-800 mt-2">
                                                30th <span className="text-xl">Februrary, 2025</span>
                                            </p>
                                        </div>
                                        <div>
                                            <div className="flex gap-3 text-zinc-700">
                                                <RiBuilding2Line className="text-2xl"/>
                                                <span className="text-base">Property type</span>
                                            </div>
                                            <p className="text-2xl font-medium text-zinc-800 mt-2 capitalize">
                                                {property?.propertyType.toLocaleLowerCase()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex justify-end items-center gap-5 mt-3">
                                    <div onClick={() => setEditMode(true)} className="cursor-pointer border border-zinc-500 rounded-lg px-5 py-2.5 text-lg text-zinc-600 hover:bg-zinc-600 hover:text-white">
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
                                <div className="flex gap-4 items-center rounded-full mt-3 ">
                                    <Image 
                                        alt="owner-image"
                                        src={property?.agent?.profile?.profileImage??'/png/sample_profile.png'}
                                        height={50}
                                        width={60}
                                    />
                                    <div>
                                        <p className="text-xl font-medium text-zinc-900 m-0">{`${property?.agent?.profile?.firstName??'Kunle'} ${property?.agent?.profile?.lastName??'Aina'}`} <span className="text-base font-normal text-zinc-600"><em> (Assigned agent)</em></span></p>
                                        <p className="text-lg text-zinc-700">{`${property?.agent?.email ?? 'agent007@aparteng.com'}`}</p>
                                    </div>
                                </div>

                                <p className="text-lg font-medium text-zinc-900 mt-2">
                                    {
                                        property?.verifications?.feedback??
                                        'The luxury apartment units for rent were meticulously verified, ensuring premium features such as smart home automation, high-end finishes, top-tier security, resort-style amenities, and breathtaking views.'
                                    }
                                </p>

                                <p className="text-base font-normal text-zinc-600 ">
                                    <em>
                                        Verified on <br />{property?.verifications?.verificationDate??'February 15th, 2024'}
                                    </em>
                                </p>
                            </div>
                        </CustomModal>
                    </>
                }
            </div> 
        </div>
    );
}

'use client'

import { CalendarIcon } from "../../icons";
import { formatDate } from "@/src/lib/utils";
import { useFormik } from "formik";
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import { GetAllProperties, GetSingleProperty } from "@/src/lib/request-handlers/propertyMgt";
import { useEffect, useState } from "react";
import { IProperty, PropertyType, PropertyVerificationStatus } from "../../properties-mgt/types";
import AdjustableFilterDropdown from "../../ui/AdjustableFilterDropdown"
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/src/hooks/useAuth";
import { IoLocationOutline } from 'react-icons/io5';
import { BookingBadge, VerificationBadge } from '../../badge';
import { BookingStatus } from '../../booking-mgt/types';
import toast from "react-hot-toast";
import { UserRole } from "@/src/lib/enums";

export default function CreateVerificationView() {
    // const router = useRouter();
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const [propertySearchTerm, setPropertySearchTerm] = useState<string>('')
    const { data: propertyData } = GetSingleProperty(Number(searchParams.get('property')))
    const { data: propertyList, isLoading: propertiesLoading } = GetAllProperties(1, 12, propertySearchTerm, user.role, user.id);
    const [properties, setProperties] = useState<IProperty[]>(propertyList?.data?.data?.data)
    const [selectedProperty, setSelectedProperty] = useState<IProperty | null>(null)



    const formik = useFormik({
        initialValues: {
            feedback: "",
            status: PropertyVerificationStatus.PENDING,
        },
        onSubmit: async () => {}
    })

    const handlePropertySelection = (name: string) => {
        const filteredProperties = properties?.filter(el => {
            if (el?.name === name ) return el;
        })
        setSelectedProperty(filteredProperties[0])
    }

    
    useEffect(() => {
        setProperties(propertyList?.data?.data?.data)
    }, [propertyList])

    useEffect(() => {
        setSelectedProperty(propertyData?.data?.data)
    }, [propertyData])


    return(
        <section>
            <div className="p-10 w-full">
                <div className="w-full border border-zinc-500/20 bg-white rounded-xl p-10 min-h-[50vh]">

                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-3xl text-zinc-800 font-medium">
                            Verify property
                        </h3>
                    </div>

                    <form className={`my-6`}>
                        {
                            selectedProperty?
                            <>
                                <section className="flex justify-between gap-6 w-full max-h-[9rem]">
                                    <div className="w-[70%] relative">
                                        <Swiper
                                            loop={true}
                                            modules={[Navigation, Autoplay]}
                                            spaceBetween={5}
                                            slidesPerView={selectedProperty?.media?.length > 1 ? 2 : 1}
                                            navigation
                                            autoplay
                                            className="rewind"
                                        >   
                                            {
                                                selectedProperty?.media?.map((el: any, index: any) => (
                                                    <SwiperSlide key={index}>
                                                        <Image
                                                            alt={`${selectedProperty?.name}_img_${index}`}
                                                            src={el.mediaUrl}
                                                            className="w-full max-w-[500px] rounded-xl"
                                                            width={500}
                                                            height={500}
                                                        />
                                                    </SwiperSlide>
                                                ))   
                                            }
                                        </Swiper>
                                    </div>
                                    {
                                        user.role === UserRole.ADMIN &&
                                        <div className='w-full flex flex-col gap-y-3'>
                                            <div className='size-full flex flex-col justify-center items-center bg-background rounded-xl'>
                                                <p className='text-base text-zinc-800 font-medium text-center mb-1'>
                                                    Assigned agent
                                                </p>
                                                <Image 
                                                    alt={`agent_img`}
                                                    src={selectedProperty?.agent?.profile?.profileImage??`/png/sample_owner.png`}
                                                    className="w-full max-w-[10rem] rounded-xl my-3"
                                                    width={400}
                                                    height={400}
                                                />
                                                <p className='text-base text-zinc-800 font-medium text-center mb-1'>
                                                    {`${selectedProperty?.agent?.profile?.firstName??'Chinedu'} ${selectedProperty?.agent?.profile?.lastName??'Matthew'}`}
                                                </p>
                                                <p className='text-sm text-zinc-800 font-medium text-center'>
                                                    {selectedProperty?.agent?.email}
                                                </p>
                                            </div>
                                            <div className='flex justify-between items-center gap-5 w-full'>
                                                {/* <div className="cursor-pointer rounded-lg px-5 py-2.5 text-lg font-medium text-white bg-zinc-500 hover:bg-zinc-600 disabled:opacity-75 disabled:cursor-not-allowed">
                                                    Re-assign
                                                </div> */}
                                                <div className="text-center w-full cursor-pointer border border-primary rounded-lg px-5 py-2.5 text-lg font-medium text-primary hover:bg-primary/90 hover:text-white disabled:hover:bg-white disabled:opacity-75 disabled:cursor-not-allowed">
                                                    View Agent
                                                </div>
                                            </div>
                                        </div>
                                    }
                                </section>
                
                                <section className='my-5 w-full'>
                                    <div className='w-full flex justify-between'>
                                        <div className='w-full flex flex-col'>
                                            <h3 className="text-3xl font-normal text-zinc-800">
                                                {selectedProperty?.name}
                                            </h3>
                                            <div className="flex gap-2 items-center mt-2 text-xl text-zinc-600">
                                                <IoLocationOutline />
                                                <p className="text-base">
                                                    {selectedProperty?.address}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                
                                <section className=''>
                                    <div className="w-full flex items-center gap-10 mx-0">
                                        <div className="flex items-center">
                                            <p className="text-zinc-500 text-base">PropertyID:</p>
                                            <p className="text-zinc-900 text-base ml-3">
                                                APRT-{selectedProperty?.id}
                                            </p>
                                        </div>
                                        <div className="flex items-center">
                                            <p className="text-zinc-500 text-sm">Status:</p>
                                            <VerificationBadge status={verification?.status} classNames="ml-2" />
                                        </div>
                                        <div className="flex items-center">
                                            <CalendarIcon color="#a6a4a4"/>
                                            <p className="text-zinc-900 text-sm ml-2">{formatDate(selectedProperty?.verifications[0]?.verificationDate??`2025-2-2`)}</p>
                                        </div>
                                        <div className="flex items-center">
                                            <p className="text-zinc-500 text-base">Property Type</p>
                                            <p className="text-zinc-900 text-base ml-3">
                                                {selectedProperty?.propertyType}
                                            </p>
                                        </div>
                                        <div className="flex items-center">
                                            <p className="text-zinc-500 text-base">Owner</p>
                                            <p className="text-teal-800 text-base ml-3 cursor-pointer hover:underline">
                                                {`${selectedProperty?.owner?.profile?.firstName??'Daniel'} ${selectedProperty?.owner?.profile?.lastName??'Oyesola'}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="my-5">
                                        <div className="w-full flex gap-3">
                                            {
                                                selectedProperty &&
                                                selectedProperty?.amenities.map((el, index) =>
                                                    <div key={index} className="w-fit flex items-center justify-center px-5 py-2  bg-zinc-200 rounded-lg text-[14px]">
                                                        {el.name}
                                                    </div>
                                                )
                                            }
                                        </div>
                                    </div>
                                </section>
                            </>
                            :
                            <div className="w-full relative">
                                <label htmlFor="state" className="text-lg zinc-900 font-medium">Property</label>
                                <AdjustableFilterDropdown
                                    placeholder={`E.g. The Saphire hotel`} 
                                    options={properties?.map(el => el?.name)} 
                                    handleSelection={
                                        // (val) => formik.setFieldValue("state", val)
                                        (val) => handlePropertySelection(val)
                                    }
                                    searchTerm={propertySearchTerm}
                                    setSearchTerm={setPropertySearchTerm}
                                    isLoading={propertiesLoading}
                                />
                            </div>
                        }

                        <div className="w-full my-10">
                            <label htmlFor="description" className="text-lg zinc-900 font-medium">Feedback</label>
                            <div className="relative mt-2">
                                <span className="absolute bottom-3 right-3 text-base font-normal">{`${formik.values.feedback.length}/1000`}</span>
                                <textarea
                                    id="description"
                                    maxLength={1000}
                                    rows={8}
                                    placeholder={'What you have assessed about the property...'}
                                    value={formik.values.feedback}
                                    onChange={e => formik.setFieldValue("feedback", e.target.value)}
                                    className="size-full border border-zinc-400 rounded-lg p-3 text-lg"
                                />
                            </div>
                        </div>

                        <section className='my-10 w-full flex items-center justify-between'>
                            <div className='w-full items-center gap-4'>
                                <button className="cursor-pointer rounded-lg px-5 py-2.5 text-lg font-medium text-white bg-zinc-500 hover:bg-zinc-600 disabled:opacity-75 disabled:cursor-not-allowed">
                                    Save draft
                                </button>
                            </div>
                            <div className='w-full flex justify-end items-center gap-4'>
                                {/* pending | rejected ? */}
                                <button type='button'  className="border border-primary bg-transparent text-primary/90 hover:text-white hover:bg-primary/90 rounded-lg px-5 py-2.5  text-lg font-medium">
                                    Verify 
                                </button>
                                {/* verified | pending ? */}
                                <button type='button'  className="bg-red-600 text-white hover:bg-red-700 rounded-lg px-5 py-2.5  text-lg font-medium">
                                    Reject 
                                </button> 
                            </div>
                        </section>
                    </form>
                </div>
            </div>
        </section>
    )
}
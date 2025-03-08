import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import { IoLocationOutline, IoStarSharp } from 'react-icons/io5';
import { formatDate } from '@/src/lib/utils';
import { IoIosStarOutline } from 'react-icons/io';
import { BookingBadge } from '../../badge';
import { BookingStatus } from '../../booking-mgt/types';
import { CalendarIcon } from '../../icons';
import { PropertyType } from '../types';
import { fixedAmenities } from '@/src/data/amenities';

export default function VerifcationDetails({
    verificationId
}: {
    verificationId: number
}){
    console.log(verificationId)
    return (
        <div className="p-10 w-full">
            <div className="w-full border border-zinc-500/20 bg-white rounded-xl min-h-[50vh]">
                <div className='p-10 w-full'>
                    <h4 className='text-zinc-800 text-2xl font-medium'>
                        Verification Details
                    </h4>
                </div>
                
                <section className="flex justify-between gap-6 w-full px-10">
                    <div className="w-[70%] relative">
                        <Swiper
                            loop={true}
                            modules={[Navigation, Autoplay]}
                            spaceBetween={5}
                            slidesPerView={1}
                            navigation
                            autoplay
                            className="rewind"
                        >   
                            {/* {
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
                            } */}
                            <SwiperSlide>
                                <Image
                                    alt={`img_`}
                                    src={`/png/sample_properties.png`}
                                    className="w-full rounded-xl"
                                    width={900}
                                    height={900}
                                />
                            </SwiperSlide>
                        </Swiper>
                    </div>
                    <div className='w-full flex flex-col gap-y-3'>
                        <div className='size-full flex flex-col justify-center items-center bg-background rounded-xl'>
                            <p className='text-base text-zinc-800 font-medium text-center mb-1'>
                                Assigned agent
                            </p>
                            <Image 
                                alt={`owner_img`}
                                src={`/png/sample_owner.png`}
                                className="w-full max-w-[10rem] rounded-xl my-3"
                                width={400}
                                height={400}
                            />
                            <p className='text-base text-zinc-800 font-medium text-center mb-1'>
                                Chinedu Matthew
                            </p>
                            <p className='text-sm text-zinc-800 font-medium text-center'>
                                anisamson@gmail.com
                            </p>
                        </div>
                        <div className='flex justify-between items-center gap-5 w-full'>
                            {/* <div className="cursor-pointer rounded-lg px-5 py-2.5 text-lg font-medium text-white bg-zinc-500 hover:bg-zinc-600 disabled:opacity-75 disabled:cursor-not-allowed">
                                View Agent 
                            </div> */}
                            <div className="text-center w-full cursor-pointer border border-primary rounded-lg px-5 py-2.5 text-lg font-medium text-primary hover:bg-primary/90 hover:text-white disabled:hover:bg-white disabled:opacity-75 disabled:cursor-not-allowed">
                                View Agent
                            </div>
                        </div>
                    </div>
                </section>

                <section className='my-5 w-full px-10'>
                    <div className='w-full flex justify-between'>
                        <div className='w-full flex flex-col'>
                            <h3 className="text-3xl font-normal text-zinc-800">
                                {/* {property?.name} */}
                                Magodo Crystal Springs Hotel and Resort
                            </h3>
                            <div className="flex gap-2 items-center mt-2 text-xl text-zinc-600">
                                <IoLocationOutline />
                                <p className="text-base">
                                    {/* {property?.address} */}
                                    17a Abdulrahmon Sanni St, Alagbado, Lagos 102213, Lagos
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col items-center pr-3">
                            <p className="text-base text-primary font-medium m-0">
                                {/* {averageRating}/5 */}
                                4.5/5
                            </p>
                            <div className="flex justify-center items-center gap-1 mb-1">
                                {[...Array(5)].map((_, index) => (
                                // index < Math.round(averageRating) ? 
                                index < Math.round(7) ? 
                                    <IoStarSharp className="text-primary text-lg" key={index} /> : 
                                    <IoIosStarOutline className="text-primary text-lg" key={index} />
                                ))}
                            </div>
                            <p className="text-base text-primary font-medium mt-2">
                                {/* {property?.meta?.total_reviews ?? 0} Reviews */}
                                0 Reviews
                            </p>
                        </div>
                    </div>
                </section>

                <section className='px-10'>
                    <div className="w-full flex items-center gap-10 mx-0">
                        <div className="flex items-center">
                            <p className="text-zinc-500 text-base">PropertyID:</p>
                            <p className="text-zinc-900 text-base ml-3">
                                {/* APRT-{property?.id} */}
                                134
                            </p>
                        </div>
                        <div className="flex items-center">
                            <p className="text-zinc-500 text-sm">Status:</p>
                            <BookingBadge status={BookingStatus.CANCELLED} classNames="ml-2" />
                        </div>
                        <div className="flex items-center">
                            <CalendarIcon color="#a6a4a4"/>
                            <p className="text-zinc-900 text-sm ml-2">{formatDate("24-11-2024")}</p>
                        </div>
                        <div className="flex items-center">
                            <p className="text-zinc-500 text-base">Property Type</p>
                            <p className="text-zinc-900 text-base ml-3">
                                {/* {property?.propertyType} */}
                                {PropertyType.BUNGALOW}
                            </p>
                        </div>
                        <div className="flex items-center">
                            <p className="text-zinc-500 text-base">Owner</p>
                            <p className="text-teal-800 text-base ml-3 cursor-pointer hover:underline">
                                {/* {`${bookingDetails?.user?.profile?.firstName} ${bookingDetails?.user?.profile?.lastName}`} */}
                                Daniel Oyesola
                            </p>
                        </div>
                    </div>
                    <div className="my-5">
                        <div className="w-full flex gap-3">
                            {
                                // propertyUnit?.amenities &&
                                // propertyUnit?.amenities.map((el, index) => 
                                fixedAmenities.map((el, index) =>
                                    <div key={index} className="w-fit flex items-center justify-center px-5 py-2  bg-zinc-200 rounded-lg text-[14px]">
                                        {el.name}
                                    </div>
                                )
                            }
                        </div>
                    </div>
                </section>

                <section className='w-full mt-10 px-10'>
                    <div className='p-6 bg-background/70 min-h-24 w-full rounded-xl'>
                        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Facere dolore, autem aliquam beatae tempora dolorum porro a assumenda itaque quaerat obcaecati laborum. Unde quis saepe rem ratione voluptatum, veniam pariatur!
                        <br />
                        <br />
                        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Facere dolore, autem aliquam beatae tempora dolorum porro a assumenda itaque quaerat obcaecati laborum. Unde quis saepe rem ratione voluptatum, veniam pariatur!
                        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Facere dolore, autem aliquam beatae tempora dolorum porro a assumenda itaque quaerat obcaecati laborum. Unde quis saepe rem ratione voluptatum, veniam pariatur!
                        <br />
                        <br />
                        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Facere dolore, autem aliquam beatae tempora dolorum porro a assumenda itaque quaerat obcaecati laborum. Unde quis saepe rem ratione voluptatum, veniam pariatur!
                    </div>
                </section>

                <section className='my-10 w-full px-10'>
                    <div className='w-full flex justify-end items-center gap-4'>
                        {/* pending | rejected ? */}
                        <button type='button'  className="border border-teal-700 bg-transparent text-teal-700 hover:text-white hover:bg-teal-800 rounded-lg px-5 py-2.5  text-lg font-medium">
                            Verify 
                        </button>
                        {/* verified | pending ? */}
                        <button type='button'  className="bg-red-600 text-white hover:bg-red-500 rounded-lg px-5 py-2.5  text-lg font-medium">
                            Reject 
                        </button> 
                    </div>
                </section>

            </div>
        </div>
    )
}
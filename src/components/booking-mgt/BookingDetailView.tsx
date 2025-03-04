import { IoLocationOutline } from "react-icons/io5";
import { BsCloudDownload } from "react-icons/bs";
import { LiaPrintSolid } from "react-icons/lia";

import { CalendarIcon, CancelStampIcon, CardClockIcon, CardsCycleIcon, ClockIcon, MailIcon, OpenWalletIcon, PhoneIcon, PriceTagIcon, PrinterIcon, PropertiesIcon, RateIcon, ReturnIcon, TornPaperIcon, UnitIcon, UserIcon, UsersIcon } from "../icons";

export default function BookingDetailView({ bookingId }: { bookingId: number }) {


    return(
        <div className="p-10 w-full">
            <div className="w-full border border-zinc-500/20 bg-white rounded-xl p-10 pt-0 min-h-[50vh]">
                <div className="w-full mt-10 items-center flex justify-between">
                    <div>
                        <h3 className="text-3xl font-normal text-zinc-800 leading-3 my-4">
                            Magodo Crystal Springs Hotel and Resort
                        </h3>
                        <div className="flex gap-2 items-center mt-2 text-md text-zinc-500">
                            <IoLocationOutline className="text-zinc-700"/>
                            <p>
                                17a Abdulrahman Sanni St. Alagbado, Lagos 102213, Lagos.
                            </p>
                        </div>
                    </div>
                    <div className="cursor-pointer size-12 border-2 border-[#124452] rounded-full flex justify-center items-center p-2 mr-5 group hover:bg-[#124452]/90">
                        {/* <PrinterIcon color="#124452" className="size-10 "/> */}
                        {/* <LiaPrintSolid className="text-[#124452] size-10 group-hover:text-white stroke-[0.3px]"/> */}
                        <BsCloudDownload className="text-[#124452] size-10 group-hover:text-white stroke-[0.3px]" />
                    </div>
                </div>

                <div className="h-px bg-zinc-200/70 w-full my-8" />

                <div className="w-full flex items-center gap-10 my-3 mx-0">
                    <div className="flex items-center " >
                        <p className="text-zinc-500 text-base">PropertyID</p>
                        <p className="text-zinc-900 text-base ml-3">APT203-13</p>
                    </div>
                    <div className="flex items-center" >
                        <p className="text-zinc-500 text-sm">Status</p>
                        <p className="text-zinc-600 text-sm ml-3 px-4 py-1 bg-zinc-300 rounded-lg">Canceled</p>
                    </div>
                    <div className="flex items-center" >
                        <CalendarIcon color="#a6a4a4"/>
                        <p className="text-zinc-900 text-sm ml-2">24th November, 2024</p>
                    </div>
                    <div className="flex items-center" >
                        <p className="text-zinc-500 text-base">Property Type</p>
                        <p className="text-zinc-900 text-base ml-3">Duplex</p>
                    </div>
                    <div className="flex items-center" >
                        <p className="text-zinc-500 text-base">Agent</p>
                        <p className="text-zinc-900 text-base ml-3">Duplex</p>
                    </div>
                </div>

                <section className="w-full my-8">
                    <div className="w-full p-5 bg-zinc-300 flex gap-3">
                        <UsersIcon color='#8a8a8a'/>
                        <p className="text-base text-zinc-500">
                            Guest Information
                        </p>
                    </div>
                    <div className="mt-2 p-5">
                        <div className="grid grid-cols-3 grid-cols grid-flow-row gap-y-6">
                            <div className="">
                                <div className="text-zinc-500 text-sm flex items-center">
                                    <UserIcon className="size-5"/>
                                    <p className="mt-1 ml-2 text-lg">Guest name</p>
                                </div>
                                <p className="text-zinc-900 text-xl pl-1 mt-1.5">
                                    Abimbola Suleiman
                                </p>
                            </div>

                            <div className="">
                                <div className="text-zinc-500 text-sm flex items-center">
                                    <MailIcon className="size-5"/>
                                    <p className="mt-1 ml-2 text-lg">Email</p>
                                </div>
                                <p className="text-zinc-900 text-xl pl-1 mt-1.5">
                                    abimbola2002@gmail.com
                                </p>
                            </div>

                            <div className="">
                                <div className="text-zinc-500 text-sm flex items-center">
                                    <PhoneIcon className="size-5"/>
                                    <p className="mt-1 ml-2 text-lg">Phone number</p>
                                </div>
                                <p className="text-zinc-900 text-xl pl-1 mt-1.5">
                                    +234 802 6712 0067
                                </p>
                            </div>

                            <div className="">
                                <div className="text-zinc-500 text-sm flex items-center">
                                    <IoLocationOutline className="size-5 text-zinc-900" />
                                    <p className="mt-1 ml-2 text-lg">Address</p>
                                </div>
                                <p className="text-zinc-900 text-xl pl-1 mt-1.5">
                                    1134 Johnson Close Suite 33b, Oshodi-Isolo. Lagos, Nigeria
                                </p>
                            </div>

                        </div>

                    </div>
                </section>

                <section className="w-full my-8">
                    <div className="w-full p-5 bg-zinc-300 flex gap-3">
                        <TornPaperIcon />
                        <p className="text-base text-zinc-500">
                            Booking Information
                        </p>
                    </div>
                    <div className="mt-2 p-5">
                        <div className="grid grid-cols-3 grid-cols grid-flow-row gap-y-6">
                            <div className="">
                                <div className="text-zinc-500 text-sm flex items-center">
                                    <ReturnIcon className="size-5"/>
                                    <p className="mt-1 ml-2 text-lg">Check-in</p>
                                </div>
                                <p className="text-zinc-900 text-xl pl-1 mt-1.5">
                                    Sunday 23rd March, 2025
                                </p>
                            </div>
                            <div className="">
                                <div className="text-zinc-500 text-sm flex items-center">
                                    <ReturnIcon className="size-5 scale-x-[-1]"/>
                                    <p className="mt-1 ml-2 text-lg">Check-out</p>
                                </div>
                                <p className="text-zinc-900 text-xl pl-1 mt-1.5">
                                    Sunday 23rd March, 2025
                                </p>
                            </div>
                            <div className="">
                                <div className="text-zinc-500 text-sm flex items-center">
                                    <ClockIcon color="#191919"  className="size-5"/>
                                    <p className="mt-1 ml-2 text-lg">Stay</p>
                                </div>
                                <p className="text-zinc-900 text-xl pl-1 mt-1.5">
                                    2 Nights
                                </p>
                            </div>
                            <div className="">
                                <div className="text-zinc-500 text-sm flex items-center">
                                    <UsersIcon color="#191919"  className="size-5"/>
                                    <p className="mt-1 ml-2 text-lg">Guests</p>
                                </div>
                                <div className="flex gap-8 first:pl-1">
                                    <p className="text-zinc-900 text-xl mt-1.5 w-fit">
                                        Adults <em className="text-base text-zinc-700">x2</em>
                                    </p>
                                    <p className="text-zinc-900 text-xl mt-1.5 w-fit">
                                        Children <em className="text-base text-zinc-700">x3</em>
                                    </p>
                                    <p className="text-zinc-900 text-xl mt-1.5 w-fit">
                                        Pets <em className="text-base text-zinc-700">x0</em>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="w-full my-8">
                    <div className="w-full p-5 bg-zinc-300 flex gap-3">
                        <OpenWalletIcon className="size-5"/>
                        <p className="text-base text-zinc-500">
                            Payment Information
                        </p>
                    </div>
                    <div className="mt-2 p-5">
                        <div className="grid grid-cols-3 grid-cols grid-flow-row gap-y-6">
                            <div className="">
                                <div className="text-zinc-500 text-sm flex items-center">
                                    <PropertiesIcon color="#191919" className="size-5"/>
                                    <p className="mt-1 ml-2 text-lg">Property type</p>
                                </div>
                                <p className="text-zinc-900 text-lg pl-1 mt-1.5">
                                    BUNGALOW
                                </p>
                            </div>
                            <div className="">
                                <div className="text-zinc-500 text-sm flex items-center">
                                    <UnitIcon color="#191919" className="size-5"/>
                                    <p className="mt-1 ml-2 text-lg">Units</p>
                                </div>
                                <p className="text-zinc-900 text-xl pl-1 mt-1.5">
                                    1
                                </p>
                            </div>
                            <div className="">
                                <div className="text-zinc-500 text-sm flex items-center">
                                    <PriceTagIcon color="#191919" className="size-5"/>
                                    <p className="mt-1 ml-2 text-lg">Price per night</p>
                                </div>
                                <p className="text-zinc-900 text-xl pl-2 mt-1.5">
                                    ₦ 235,000
                                </p>
                            </div>
                            <div className="">
                                <div className="text-zinc-500 text-sm flex items-center">
                                    <CancelStampIcon className="size-5"/>
                                    <p className="mt-1 ml-2 text-lg">Caution Fee</p>
                                </div>
                                <p className="text-zinc-900 text-xl pl-2 mt-1.5">
                                    ₦ 17,625
                                </p>
                            </div>
                            {/* <div className="">
                                <div className="text-zinc-500 text-sm flex items-center">
                                    <RateIcon className="size-5"/>
                                    <p className="mt-1 ml-2 text-lg">5% TAX</p>
                                </div>
                                <p className="text-zinc-900 text-xl pl-2 mt-1.5">
                                    ₦ 17,625
                                </p>
                            </div> */}
                            
                            <div className="">
                                <div className="text-zinc-500 text-sm flex items-center">
                                    <CardsCycleIcon className="size-5"/>
                                    <p className="mt-1 ml-2 text-lg">Total payable</p>
                                </div>
                                <p className="text-zinc-900 text-xl pl-2 mt-1.5">
                                    ₦ 178,625
                                </p>
                            </div>
                            
                            <div className="">
                                <div className="text-zinc-500 text-sm flex items-center">
                                    <CalendarIcon color="#191919" className="size-5"/>
                                    <p className="mt-1 ml-2 text-lg">Expires on</p>
                                </div>
                                <p className="text-zinc-900 text-xl pl-2 mt-1.5">
                                    Saturday 22 March, 2025
                                </p>
                            </div>
                            
                            <div className="">
                                <div className="text-zinc-500 text-sm flex items-center">
                                    <CardClockIcon className="size-5"/>
                                    <p className="mt-1 ml-2 text-lg">Payment Status</p>
                                </div>
                                <p className="text-[#FFAE00] bg-[#FFAE0033] text-base ml-1 px-4 py-2 rounded-lg mt-1.5 w-fit">
                                    Unpaid
                                </p>
                            </div>

                        </div>
                    </div>
                </section>

                <div className="h-px bg-zinc-200/80 w-full my-8" />

                <section className="flex justify-end items-center my-3">
                    <div className="w-3/6 flex justify-end items-center gap-6">
                        <button className="bg-zinc-500 text-white hover:bg-zinc-400 rounded-lg px-7 py-2 h-14 text-xl">
                            Edit
                        </button>
                        <button className="bg-red-600 text-white hover:bg-red-500 rounded-lg px-7 py-2 h-14 text-xl">
                            Cancel booking
                        </button>
                    </div>
                </section>

            </div>
        </div>
    );
};
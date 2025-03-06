'use client'

import { formatDate, formatMoney } from "@/src/lib/utils";
import { DotsIcon, FilterIcon, PrinterIcon, SearchIcon } from "../icons";
import { GetAllBookings } from "@/src/lib/request-handlers/bookingMgt";
import { useEffect, useState } from "react";
import { IBooking } from "./types";
import { BookingBadge } from "../badge";
import TablePagination from "../TablePagination";
import Loader from "@/src/components/loader";
import { Icon } from "lucide-react";
import { LuEye } from "react-icons/lu";
import { useRouter } from "next/navigation";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";

export default function ListBookingView() {

    const [page, setPage] = useState<number>(1);
    const { data: bookings, isLoading } = GetAllBookings(page);
    const [bookingList, setBookingList] = useState<IBooking[]>(bookings?.data?.data?.data);
    const router = useRouter();

    // const detailButtons = [
    //     {
    //         label: "View",
    //         Icon: <LuEye />,
    //         onClick: () => console.log("View button clicked"),
    //     },
    //     {
    //         label: "Edit",
    //         Icon: <HiOutlinePencilAlt />,
    //         onClick: () => console.log("View button clicked"),
    //     }
    // ]


    useEffect(() => {
        setBookingList(bookings?.data?.data?.data);
    }, [bookings])


    return (
            
                <div className="w-full p-10">
                    <div className="w-full border border-zinc-500/20 bg-white rounded-xl px-6 py-7 min-h-[72vh] flex flex-col items-center">

                        {
                            isLoading ?
                            <Loader />
                            :
                            <>
                                <div className="w-full flex justify-between items-center">
                                    <div className="w-1/2 flex items-center gap-5">
                                        {/* <div className="relative w-[60%]">
                                            <input type="text" className="border border-zinc-500/20 bg-background rounded-lg w-full h-10 p-3 pl-10" placeholder="Search bookings "/>
                                            <SearchIcon className="absolute top-[25%] left-3 w-5" color="black" />
                                        </div>
                                        <div className="flex justify-center items-center gap-2 border border-zinc-500/20 bg-background hover:bg-zinc-300/70 cursor-pointer rounded-lg h-10 px-3 w-[20%]">
                                            <p className="text-zinc-700 text-base">
                                                Filter
                                            </p>
                                            <FilterIcon className="w-5" color="black" />
                                        </div> */}
                                    </div>
                                    <button className="bg-primary hover:bg-primary/95 text-background hover:bg-teal-900/ flex justify-center items-center gap-1 rounded-lg w-48 p-1.5">
                                        <p className="text-sm">
                                            Print CSV
                                        </p>
                                        <PrinterIcon className="w-4" color="white"/>
                                    </button>
                                </div>

                                <div className="w-full mt-6">
                                    <table className="w-full border-collapse">
                                        <thead className="">
                                            <tr className="text-teal-600 text-[13px]">
                                                <th className="bg-[#0280901A] h-10 p-5 flex justify-start items-center gap-3 rounded-tl-xl rounded-bl-xl font-medium w-full">
                                                    {/* <input 
                                                        type="checkbox"
                                                        className={`
                                                            size-4 border-2 border-teal-600 rounded-md bg-transparent appearance-none
                                                            checked:bg-teal-600 checked:border-teal-600 checked:text-[#0280901A]
                                                        `}
                                                    /> */}
                                                    <p>
                                                        Booking ID
                                                    </p>
                                                </th>
                                                <th className="bg-[#0280901A] h-10 font-medium text-left">
                                                    <p>
                                                        Property
                                                    </p>
                                                </th>
                                                <th className="bg-[#0280901A] h-10 font-medium text-left">
                                                    <p>
                                                        Property Type
                                                    </p>
                                                </th>
                                                <th className="bg-[#0280901A] h-10 font-medium text-left">
                                                    <p>
                                                        {"Guest's Name"}
                                                    </p>
                                                </th>
                                                <th className="bg-[#0280901A] h-10 font-medium text-left">
                                                    <p>
                                                        Price
                                                    </p>
                                                </th>
                                                <th className="bg-[#0280901A] h-10 font-medium text-center">
                                                    <p>
                                                        Status
                                                    </p>
                                                </th>
                                                <th className="bg-[#0280901A] h-10 font-medium  text-center">
                                                    <p className="pr-2">
                                                        Booking date
                                                    </p>
                                                </th>
                                                <th className="bg-[#0280901A] h-10 rounded-tr-xl rounded-br-xl">{' '}</th>
                                                <th className="bg-[#0280901A] h-10 rounded-tr-xl rounded-br-xl">{' '}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-[14px]">
                                            {
                                                bookingList &&
                                                bookingList?.map((booking, index) => (
                                                    <tr key={index} className="hover:bg-background/50 cursor-pointer" onClick={() => router.push(PAGE_ROUTES.dashboard.bookingManagement.bookings.details(booking?.id))} >
                                                        <td className="flex items-center px-5 py-4 gap-3 border-b-2 border-b-gray-200">
                                                            {/* <input 
                                                                type="checkbox"
                                                                className={`
                                                                    size-4 border-2 border-zinc-800 rounded-md bg-transparent appearance-none
                                                                    checked:bg-zinc-800 checked:border-zinc-800 checked:text-zinc-200
                                                                `}
                                                            /> */}
                                                            <p className="pt-1">
                                                                APRT-{booking?.id}
                                                            </p>  
                                                        </td>
                                                        <td className="border-b-2 border-b-gray-200">
                                                            <p className="pt-1 truncate max-w-[13rem]">
                                                                {booking?.unit?.name}
                                                            </p>   
                                                        </td>
                                                        <td className="border-b-2 border-b-gray-200">
                                                            <p className="pt-1 font-medium">
                                                                {booking?.unit?.property?.propertyType}
                                                            </p>
                                                        </td>
                                                        <td className="border-b-2 border-b-gray-200">
                                                            <p className="pt-1 ">
                                                                {`${booking?.user?.profile?.firstName??'Fola'} ${booking?.user?.profile?.lastName??'Ogunleye'}`}
                                                            </p>
                                                        </td>
                                                        <td className="border-b-2 border-b-gray-200">{`₦ ${formatMoney(Number(booking?.totalPrice))}`}</td>
                                                        <td className="border-b-2 border-b-gray-200">
                                                            <div className="py-2.5 w-2/3 m-auto text-center">
                                                                <BookingBadge status={booking?.status} classNames="" />
                                                            </div>
                                                        </td>
                                                        <td className="border-b-2 border-b-gray-200 text-center">{formatDate(booking.startDate)}</td>
                                                        {/* <td className="border-b-2 border-b-gray-200">
                                                            <DotsIcon className="w-5 ml-12 cursor-pointer rotate-90 " color="black" />
                                                        </td> */}
                                                    </tr>
                                                ))
                                            }
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        }

                    </div>

                    {
                        !isLoading &&
                        <TablePagination 
                            total={bookings?.data?.data?.meta?.total}
                            currentPage={page}
                            setPage={setPage}
                            firstPage={bookings?.data?.data?.meta?.firstPage}
                            itemsPerPage={10}
                        />
                    }          
                    
                </div>
            
    );
};
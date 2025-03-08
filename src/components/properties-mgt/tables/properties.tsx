'use client'

import { useEffect, useRef, useState } from "react";
import { ArrowIcon, DotsIcon, FilterIcon, PrinterIcon, SearchIcon } from "../../icons";
import { useRouter } from "next/navigation";
import { IProperty, PropertyType } from "../types";
import { GetAllProperties } from "@/src/lib/request-handlers/propertyMgt";
import Loader from "../../loader";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import { BookingBadge } from "../../badge";
import { formatDate } from "@/src/lib/utils";
import TablePagination from "../../TablePagination";
import { LuEye } from "react-icons/lu";
import { HiOutlinePencilAlt } from "react-icons/hi";

export default function PropertiesTable() {
    const [page, setPage] = useState<number>(1);
    const [searchTerm , setSearchTerm] = useState<string>("");
    const { data: properties, isLoading } = GetAllProperties(page, 10, searchTerm);
    const [propertyList, setPropertyList] = useState<IProperty[]>(properties?.data?.data?.data);
    const router = useRouter();

    const [selectedRow, setSelectedRow] = useState<number>(0);
    const [modalPosition, setModalPosition] = useState<{ top: number; left: number } | null>(null);
    const modalRef = useRef(null);

    const detailButtons = [
        {
            label: "View",
            Icon: <LuEye />,
            onClick: () => {
                router.push(
                    PAGE_ROUTES.dashboard.propertyManagement.allProperties.details(propertyList[selectedRow].id)
                )
                setSelectedRow(0)
            },
        },
        {
            label: "Edit",
            Icon: <HiOutlinePencilAlt />,
            onClick: () => {
                router.push(
                    `${PAGE_ROUTES.dashboard.propertyManagement.allProperties.details(propertyList[selectedRow].id)}?edit=true`
                )
                setSelectedRow(0)
            },
        }
    ]

    // Handle click outside modal
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (modalRef.current && !(modalRef.current as HTMLElement).contains(event.target as Node)) {
                setSelectedRow(0);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleDotsClick = (event: React.MouseEvent, index: number) => {
        event.stopPropagation();
        setSelectedRow(index);

        const rect = (event.target as HTMLElement).getBoundingClientRect();
        setModalPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
    };

    useEffect(() => {
        setPropertyList(properties?.data?.data?.data);
    }, [properties])

    return (
        <div className="w-full p-10">
            <div className="w-full border border-zinc-500/20 bg-white rounded-xl px-6 py-7 min-h-[70vh] flex flex-col items-center">
                
                
                <div className="w-full flex justify-between items-center">
                    <div className="w-[80%] flex items-center gap-5">
                        <p className="text-2xl font-medium mr-10">Property Listings</p>
                        <div className="relative w-[40%]">
                            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="border border-zinc-500/20 bg-background rounded-lg w-full h-10 p-3 pl-10" placeholder="Search properties "/>
                            <SearchIcon className="absolute top-[25%] left-3 w-5" color="black" />
                        </div>
                        <div className="flex justify-center items-center gap-2 border border-zinc-500/20 bg-background hover:bg-zinc-300/70 cursor-pointer rounded-lg h-10 px-3 w-[10%]">
                            <p className="text-zinc-700 text-base">
                                Filter
                            </p>
                            <FilterIcon className="w-5" color="black" />
                        </div>
                    </div>
                    <button className="bg-primary hover:bg-primary/95 text-background hover:bg-teal-900/ flex justify-center items-center gap-1 rounded-lg w-48 p-1.5 h-10">
                        <p className="text-sm">
                            Print CSV
                        </p>
                        <PrinterIcon className="w-4" color="white"/>
                    </button>
                </div>

                {
                    isLoading ?
                    <Loader />
                    :
                    <div className="w-full mt-6">
                        <table className="w-full border-collapse">
                            <thead className="">
                                <tr className="text-teal-600 text-[12px]">
                                    <th className="bg-[#0280901A] h-10 p-5 flex justify-start items-center gap-3 rounded-tl-xl rounded-bl-xl font-medium w-full">
                                        {/* <input 
                                            type="checkbox"
                                            className={`
                                                size-4 border-2 border-teal-600 rounded-md bg-transparent appearance-none
                                                checked:bg-teal-600 checked:border-teal-600 checked:text-[#0280901A]
                                            `}
                                        /> */}
                                        <p>
                                            Property ID
                                        </p>
                                    </th>
                                    <th className="bg-[#0280901A] h-10 font-medium text-left">
                                        <p>
                                            Property Name
                                        </p>
                                    </th>
                                    <th className="bg-[#0280901A] h-10 font-medium text-left">
                                        <p>
                                            Property Type
                                        </p>
                                    </th>
                                    <th className="bg-[#0280901A] h-10 font-medium text-left">
                                        <p>
                                            {"Owner's Name"}
                                        </p>
                                    </th>
                                    <th className="bg-[#0280901A] h-10 font-medium text-center">
                                        <p>
                                            Verification status
                                        </p>
                                    </th>
                                    <th className="bg-[#0280901A] h-10 font-medium text-left">
                                        <p>
                                            Assigned agent
                                        </p>
                                    </th>
                                    <th className="bg-[#0280901A] h-10 font-medium  text-left">
                                        <p className="pr-2">
                                            Submission date
                                        </p>
                                    </th>
                                    <th className="bg-[#0280901A] h-10 rounded-tr-xl rounded-br-xl">{' '}</th>
                                    <th className="bg-[#0280901A] h-10 rounded-tr-xl rounded-br-xl">{' '}</th>
                                </tr>
                            </thead>
                            <tbody className="text-[13px]">
                                {
                                    propertyList &&
                                    propertyList?.map((property, index) => (
                                        <tr key={index} className="hover:bg-background/50 cursor-pointer"  onClick={() => router.push(PAGE_ROUTES.dashboard.propertyManagement.allProperties.details(property?.id))}>
                                            <td className="flex items-center px-5 py-4 gap-3 border-b-2 border-b-gray-200">
                                                {/* <input 
                                                    type="checkbox"
                                                    className={`
                                                        size-4 border-2 border-zinc-800 rounded-md bg-transparent appearance-none
                                                        checked:bg-zinc-800 checked:border-zinc-800 checked:text-zinc-200
                                                    `}
                                                /> */}
                                                <p className="pt-1">
                                                    APT25-{property?.id}
                                                </p>  
                                            </td>
                                            <td className="border-b-2 border-b-gray-200">
                                                <p className="pt-1 truncate max-w-[13rem]">
                                                    {property?.name}
                                                </p>   
                                            </td>
                                            <td className="border-b-2 border-b-gray-200">
                                                <p className="pt-1 font-medium">
                                                    {property?.propertyType}
                                                </p>
                                            </td>
                                            <td className="border-b-2 border-b-gray-200">
                                                <p className="pt-1 ">
                                                    {`${property?.owner?.profile?.firstName??'John'} ${property?.owner?.profile?.lastName??'Oderinde'}`}
                                                </p>
                                            </td>
                                            <td className="border-b-2 border-b-gray-200">
                                                <div className="py-2.5 w-2/3 m-auto text-center">
                                                    <BookingBadge 
                                                        status={property?.isVerified ? 'Verified' : 'Unverified'} 
                                                        textColour={property?.isVerified ? "text-[#028090]" : "text-red-600" }
                                                        backgroundColour={property?.isVerified ? "bg-[#0280901A]" : "bg-red-200"}
                                                    />
                                                </div>
                                            </td>
                                            <td className="border-b-2 border-b-gray-200">
                                                <p className="pt-1 ">
                                                    {`${property?.agent?.profile?.firstName??'Thomas'} ${property?.agent?.profile?.lastName??'Alexander'}`}
                                                </p>
                                            </td>
                                            <td className="border-b-2 border-b-gray-200">
                                                {formatDate(property?.verifications?.createdAt??"02-03-2024")}
                                            </td>
                                            <td className="border-b-2 border-b-gray-200">
                                                <div className="flex justify-center items-center w-fit" onClick={(event) => handleDotsClick(event, index)}>
                                                    <DotsIcon className="w-5 ml-12 cursor-pointer " color="gray" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                }
                            </tbody>
                        </table>
                    </div>
                }
            </div>


            {/* Modal */}
            {selectedRow !== 0 && modalPosition && (
                <div
                    ref={modalRef}
                    className="absolute bg-white shadow-md rounded-md z-50 border border-gray-300 w-[9em]"
                    style={{ top: modalPosition.top, left: modalPosition.left }}
                >
                    {detailButtons.map((button, idx) => (
                        <div
                            key={idx}
                            className="flex items-center gap-2 px-4 py-3 hover:bg-zinc-100 cursor-pointer"
                            onClick={button.onClick}
                        >
                            {button.Icon}
                            <p>{button.label}</p>
                        </div>
                    ))}
                </div>
            )}
            
            {
                !isLoading && propertyList &&
                <TablePagination
                    total={properties?.data?.data?.meta?.total}
                    currentPage={page}
                    setPage={setPage}
                    firstPage={properties?.data?.data?.meta?.firstPage}
                    itemsPerPage={10}
                />
            }   

        </div>
    );
};
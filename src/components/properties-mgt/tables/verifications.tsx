'use client'

import { useEffect, useRef, useState } from "react";
import { ArrowIcon, DotsIcon, FilterIcon, PrinterIcon, SearchIcon } from "../../icons";
import { useRouter } from "next/navigation";
import { IProperty, IPropertyVerification, PropertyType } from "../types";
import { GetAllProperties, GetAllVerifications } from "@/src/lib/request-handlers/propertyMgt";
import Loader from "../../loader";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import { BookingBadge, VerificationBadge } from "../../badge";
import { formatDate } from "@/src/lib/utils";
import TablePagination from "../../TablePagination";
import { LuEye } from "react-icons/lu";
import { HiOutlinePencilAlt } from "react-icons/hi";
import { BookingStatus } from "../../booking-mgt/types";
import { MdOutlineVerified } from "react-icons/md";
import { ImCancelCircle } from "react-icons/im";
import { useAuth } from "@/src/hooks/useAuth";
import { UserRole } from "@/src/lib/enums";
import { Icon } from "@iconify/react/dist/iconify.js";


export default function AllVerificationsTable() {
    const  { user } = useAuth();
    const router = useRouter();
    const modalRef = useRef(null);
    const [page, setPage] = useState<number>(1);
    const [searchTerm , setSearchTerm] = useState<string>("");
    const { data: verificationList, isLoading: verificationsLoading } = GetAllVerifications(page, 12, searchTerm, user?.role || UserRole.GUEST)
    const [verifications, setVerifications] = useState<IPropertyVerification[]>(verificationList?.data?.data?.data);

    const [selectedRow, setSelectedRow] = useState<number|null>(null);
    const [modalPosition, setModalPosition] = useState<{ top: number; left: number } | null>(null);

    const detailButtons = [
        {
            label: "View",
            Icon: <LuEye />,
            onClick: () => {
                router.push(
                    PAGE_ROUTES.dashboard.propertyManagement.allProperties.verifications.details(verifications[selectedRow!]?.propertyId, verifications[selectedRow!]?.id)
                )
                setSelectedRow(null)
            },
        },
        {
            label: "Edit",
            Icon: <HiOutlinePencilAlt />,
            onClick: () => {
                router.push(
                    `${PAGE_ROUTES.dashboard.propertyManagement.allProperties.verifications.details(verifications[selectedRow!]?.propertyId, verifications[selectedRow!]?.id)}?edit=true`
                )
                setSelectedRow(null)
            },
        },
        {
            label: "Verify",
            Icon: <MdOutlineVerified />,
            onClick: () => {
                // router.push(
                //     `${PAGE_ROUTES.dashboard.propertyManagement.allProperties.details(propertyList[selectedRow].id)}?edit=true`
                // )
                setSelectedRow(null)
            },
        },
        {
            label: "Reject",
            Icon: <ImCancelCircle className="size-3.5" />,
            onClick: () => {
                // router.push(
                //     `${PAGE_ROUTES.dashboard.propertyManagement.allProperties.details(propertyList[selectedRow].id)}?edit=true`
                // )
                setSelectedRow(null)
            },
        },
    ]

    // Handle click outside modal
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (modalRef.current && !(modalRef.current as HTMLElement).contains(event.target as Node)) {
                setSelectedRow(null);
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
        setVerifications(verificationList?.data?.data?.data);
    }, [verificationList])

    return (
        <div className="w-full p-10">
            <div className="w-full border border-zinc-500/20 bg-white rounded-xl px-6 py-7 min-h-[70vh] flex flex-col items-center">
                
                
                <div className="w-full flex justify-between items-center">
                    <div className="w-[80%] flex items-center gap-5">
                        <p className="text-2xl font-medium mr-10">Verifications</p>
                        <div className="relative w-[40%]">
                            <input 
                                type="text" 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                                className="border border-zinc-500/20 bg-background rounded-lg w-full h-10 p-3 pl-10" 
                                placeholder="Search property "
                            />
                            <SearchIcon className="absolute top-[25%] left-3 w-5" color="black" />
                        </div>
                    </div>
                    {/* <button className="bg-primary hover:bg-primary/95 text-background hover:bg-teal-900/ flex justify-center items-center gap-1 rounded-lg w-48 p-1.5 h-10">
                        <p className="text-sm">
                            Print CSV
                        </p>
                        <PrinterIcon className="w-4" color="white"/>
                    </button> */}
                </div>

                {
                    verificationsLoading ?
                    <Loader />
                    : verifications  && verifications.length > 0 ?
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
                                            PropertyID
                                        </p>
                                    </th>
                                    <th className="bg-[#0280901A] h-10 font-medium text-left">
                                        <p>
                                            Property name
                                        </p>
                                    </th>
                                    <th className="bg-[#0280901A] h-10 font-medium text-left">
                                        <p>
                                            Feedback
                                        </p>
                                    </th>
                                    <th className="bg-[#0280901A] h-10 font-medium text-left">
                                        <p>
                                            Assigned agent
                                        </p>
                                    </th>
                                    <th className="bg-[#0280901A] h-10 font-medium  text-left">
                                        <p className="pr-2">
                                            Created on
                                        </p>
                                    </th>
                                    <th className="bg-[#0280901A] h-10 font-medium  text-left">
                                        <p className="pr-2">
                                            Verified on
                                        </p>
                                    </th>
                                    <th className="bg-[#0280901A] h-10 font-medium text-center">
                                        <p>
                                            Status
                                        </p>
                                    </th>
                                    <th className="bg-[#0280901A] h-10">{''}</th>
                                    <th className="bg-[#0280901A] h-10 rounded-tr-xl rounded-br-xl  w-3">{' '}</th>
                                </tr>
                            </thead>
                            <tbody className="text-[13px]">
                                {
                                    verifications &&
                                    verifications?.map((verification, index) => (
                                        <tr 
                                            key={index} 
                                            className="hover:bg-background/50 cursor-pointer"  
                                            onClick={() => router.push(PAGE_ROUTES.dashboard.propertyManagement.allProperties.verifications.details(verification?.propertyId, verification?.id))}
                                        >
                                            <td className="flex items-center px-5 py-4 gap-3 border-b border-b-gray-200">
                                                {/* <input 
                                                    type="checkbox"
                                                    className={`
                                                        size-4 border-2 border-zinc-800 rounded-md bg-transparent appearance-none
                                                        checked:bg-zinc-800 checked:border-zinc-800 checked:text-zinc-200
                                                    `}
                                                /> */}
                                                <p className="pt-1 pl-5">
                                                    APRT25-{verification?.propertyId}
                                                </p>  
                                            </td>
                                            <td className="border-b border-b-gray-200">
                                                <p className="pt-1 truncate max-w-[13rem]">
                                                    {verification?.property?.name}
                                                </p>   
                                            </td>
                                            <td className="border-b border-b-gray-200">
                                                <p className="pt-1 truncate max-w-[13rem]">
                                                    {verification?.feedback??<em className=" text-zinc-400">No comments yet</em>}
                                                </p>   
                                            </td>
                                            <td className="border-b border-b-gray-200">
                                                <p className="pt-1 font-medium">
                                                    {`${verification?.agent?.profile.firstName??'--/--'} ${verification?.agent?.profile.lastName??'--/--'}`}
                                                </p>
                                            </td>
                                            <td className="border-b border-b-gray-200">
                                            {verification?.verificationDate ? formatDate(verification?.createdAt) : '--/--'}
                                            </td>
                                            <td className="border-b border-b-gray-200">
                                                {verification?.verificationDate ? formatDate(verification?.verificationDate) : '--/--'}
                                            </td>
                                            <td className="border-b border-b-gray-200">
                                                <div className="w-2/3 m-auto text-center">
                                                    <VerificationBadge 
                                                        status={verification?.status}
                                                    />
                                                </div>
                                            </td>                                          
                                            <td className="border-b border-b-gray-200">
                                                <div 
                                                    className="flex justify-center items-center w-fit" 
                                                    onClick={(event) => handleDotsClick(event, index)}
                                                >
                                                    <DotsIcon className="w-5 ml-12 cursor-pointer " color="gray" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                }
                            </tbody>
                        </table>
                    </div>
                    : verifications && verifications.length === 0 ? 
                    <div className="size-full m-auto text-center">
                        <div className="m-auto w-fit">
                            <Icon icon="hugeicons:album-not-found-01" width="40" height="40" className="text-gray-400" />
                        </div>
                        <p className="text-center text-gray-500 pt-10">No verifications found</p>
                    </div>
                    : 
                    <div className="size-full text-center text-gray-500 pt-10 self-center">
                        <div className="m-auto w-fit">
                            <Icon icon="mynaui:danger-octagon" width="40" height="40" className="text-red-600 " />
                        </div>
                        <p className="text-center text-gray-500">
                            Error loading verifications
                        </p>
                    </div>
                }
            </div>


            {/* Modal */}
            {selectedRow !== null && modalPosition && (
                <div
                    ref={modalRef}
                    className="absolute bg-white shadow-md rounded-md z-50 border border-gray-300 w-[9em]"
                    style={{ top: modalPosition.top, left: modalPosition.left }}
                >
                    {detailButtons.map((button, idx) => (
                        <div
                            key={idx}
                            className={`flex items-center gap-2 px-4 py-3  ${button.label === 'Reject' ? 'hover:bg-red-600 hover:text-white' : 'hover:bg-background/50'} cursor-pointer`}
                            onClick={button.onClick}
                        >
                            {button.Icon}
                            <p>{button.label}</p>
                        </div>
                    ))}
                </div>
            )}
            
            {
                !verificationsLoading && verificationList &&
                <TablePagination
                    total={verificationList?.data?.data?.meta?.total}
                    currentPage={page}
                    setPage={setPage}
                    firstPage={verificationList?.data?.data?.meta?.firstPage}
                    itemsPerPage={10}
                />
            }   

        </div>
    );
};
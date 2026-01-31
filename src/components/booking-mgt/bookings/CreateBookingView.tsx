
'use client'

import { TbCurrencyNaira } from "react-icons/tb";
import { CalendarIcon, PriceTagIcon, UnitIcon, UsersIcon } from "../../icons";
import { formatDate, formatDateToYYYYMMDD, formatMoney, getDayDifference } from "@/src/lib/utils";
import { useFormik } from "formik";
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import CustomFilterDropdown from "../../ui/customFilterDropDown";
import { GetAllProperties } from "@/src/lib/request-handlers/propertyMgt";
import { GetAllUsers } from "@/src/lib/request-handlers/userMgt";
import { useEffect, useState } from "react";
import { IProperty, IPropertyUnit, PropertyType } from "../../properties-mgt/types";
import { IUser } from "@/src/lib/types";
import AdjustableFilterDropdown from "../../ui/AdjustableFilterDropdown";
import { IoLocationOutline } from "react-icons/io5";
import { IoMdReturnLeft } from "react-icons/io";
import DateInput from "../../ui/DateInput";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import { useRouter, useSearchParams } from "next/navigation";
import { CreateBooking } from "@/src/lib/request-handlers/bookingMgt";
import Spinner from "../../ui/Spinner";
import { useAuth } from "@/src/hooks/useAuth";
import toast from "react-hot-toast";
import { UserRole } from "@/src/lib/enums";

export default function CreateBookingView() {
    const router = useRouter();
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const [userSearchTerm, setUserSearchTerm] = useState<string>('')
    const [propertySearchTerm, setPropertySearchTerm] = useState<string>('')
    const [propPage, setPropPage] = useState<number>(1);
    const propSize = 12;
    // Fetch all properties paginated; no role/user filter so dropdown always has results
    const { data: propertyList, isLoading: propertiesLoading } = GetAllProperties(propPage, propSize, propertySearchTerm);
    const { data: userList, isLoading: usersLoading } = GetAllUsers(1, 12, userSearchTerm)
    const [selectionMode, setSelectionMode] = useState<boolean>(true)
    const [properties, setProperties] = useState<IProperty[]>([])
    const [users, setUsers] = useState<IUser[]>([])
    const [selectedProperty, setSeletedProperty] = useState<IProperty | any | null>(null)
    const [selectedUnit, setSeletedUnit] = useState<IPropertyUnit | null>(null)
    const [selectedUser, setSeletedUser] = useState<IUser | null>(null)
    const { mutate, isPending } = CreateBooking();



    const formik = useFormik({
        initialValues: {
            user_id: 0,
            unit_id: 0,
            start_date: null,
            end_date: null,
            guests_count: 1,
            unit_count: 0,
            total_price: 0,
        },
        onSubmit: async (values) => {
            mutate(
                {
                    payload: {
                        ...values,
                        start_date: formatDateToYYYYMMDD(values.start_date!),
                        end_date: formatDateToYYYYMMDD(values.end_date!)
                    },
                },
                {
                    onSuccess: (values) => {
                        console.log(values)
                        toast.success('Booking created successfully', {
                            duration: 6000,
                            style: {
                                maxWidth: '500px',
                                width: 'max-content'
                            }
                        });
                        if (values?.data?.data) {
                            router.push(PAGE_ROUTES.dashboard.bookingManagement.bookings.details(values?.data?.data?.id))
                        }
                    },
                    onError: () =>
                        toast.error('Something went wrong', {
                            duration: 6000,
                            style: {
                                maxWidth: '500px',
                                width: 'max-content'
                            }
                        }),
                }
            )
        }
    })

    const handlePropertySelection = (name: string) => {
        const filteredProperties = properties?.filter(el => {
            if (el?.name === name) return el;
        })
        setSeletedProperty(filteredProperties[0])
        setSeletedUnit(null)
    }

    const handleUnitSelection = (property: IProperty, name: string) => {
        const filteredUnits = property?.units?.filter(el => {
            if (el?.name === name) return el;
        })
        setSeletedUnit(filteredUnits[0])
        formik.setFieldValue('unit_id', filteredUnits[0]?.id)
    }

    const handleUserSelection = (email: string) => {
        const filteredUsers = users?.filter(el => {
            if (el?.email === email) return el;
        })
        setSeletedUser(filteredUsers[0])
        formik.setFieldValue('user_id', filteredUsers[0]?.id)
    }


    useEffect(() => {
        const fromItems = (propertyList as any)?.data?.data?.items ?? (propertyList as any)?.data?.items;
        const fromData = (propertyList as any)?.data?.data?.data ?? [];
        const next = Array.isArray(fromItems) ? fromItems : (Array.isArray(fromData) ? fromData : []);
        setProperties(next as IProperty[])
    }, [propertyList])


    useEffect(() => {
        const fromItems = (userList as any)?.data?.data?.items ?? (userList as any)?.data?.items;
        const fromData = (userList as any)?.data?.data?.data ?? [];
        const next = Array.isArray(fromItems) ? fromItems : (Array.isArray(fromData) ? fromData : []);
        setUsers(next as IUser[])
    }, [userList])

    const { values, setFieldValue } = formik;
    useEffect(() => {
        const days = getDayDifference(values.start_date as any, values.end_date as any)
        const firstPrice = days * (values.unit_count || 0) * Number(selectedUnit?.pricePerNight)
        const grandPrice = firstPrice + Number(selectedUnit?.cautionFee)
        setFieldValue('total_price', grandPrice)

    }, [
        values.unit_count,
        values.start_date,
        values.end_date,
        selectedUnit?.pricePerNight,
        selectedUnit?.cautionFee,
        setFieldValue,
    ])


    return (
        <section>
            <div className="p-10 w-full">
                <div className="w-full border border-zinc-500/20 bg-white rounded-xl p-10 min-h-[50vh]">

                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-3xl text-zinc-800 font-medium">
                            Create Booking
                        </h3>
                        {
                            !selectionMode &&
                            <div onClick={() => setSelectionMode(true)} className="flex gap-3 items-center">
                                <IoMdReturnLeft className="text-primary" />
                                <p className="text-xl text-primary cursor-pointer hover:underline">
                                    Change selection
                                </p>
                            </div>
                        }
                    </div>


                    {
                        selectionMode ?
                            <div>
                                <div className="grid grid-cols-3 grid-flow-row gap-x-4">
                                    <div className="col-span-1 relative">
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
                                        <div className="flex justify-end items-center gap-2 mt-2">
                                            <button type="button" className="px-2 py-1 text-sm border rounded disabled:opacity-50" disabled={propPage === 1} onClick={() => setPropPage(p => Math.max(1, p - 1))}>Prev</button>
                                            <span className="text-sm text-zinc-600">
                                                Page {(propertyList as any)?.data?.data?.meta?.currentPage ?? propPage}
                                                {(propertyList as any)?.data?.data?.meta?.lastPage ? ` of ${(propertyList as any)?.data?.data?.meta?.lastPage}` : ''}
                                            </span>
                                            <button type="button" className="px-2 py-1 text-sm border rounded disabled:opacity-50"
                                                disabled={Boolean((propertyList as any)?.data?.data?.meta?.lastPage) && propPage >= Number((propertyList as any)?.data?.data?.meta?.lastPage)}
                                                onClick={() => setPropPage(p => p + 1)}
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                    <div className="col-span-1 relative">
                                        <label htmlFor="city" className="text-lg zinc-900 font-medium">Unit</label>
                                        <CustomFilterDropdown
                                            placeholder={`E.g. Standard`}
                                            options={selectedProperty?.units?.map((el: IPropertyUnit) => el?.name)}
                                            handleSelection={
                                                // (val) => formik.setFieldValue("city", val)
                                                (val) => handleUnitSelection(selectedProperty, val)
                                            }
                                            selected={selectedUnit?.name!}
                                            disabled={!selectedProperty}
                                        />
                                    </div>
                                    <div className="col-span-1 relative">
                                        <label htmlFor="city" className="text-lg zinc-900 font-medium">Guest</label>
                                        <AdjustableFilterDropdown
                                            placeholder={`E.g. Abiola Graham`}
                                            options={users?.map(el => el?.email)}
                                            handleSelection={
                                                // (val) => formik.setFieldValue("city", val)
                                                (val) => handleUserSelection(val)
                                            }
                                            searchTerm={userSearchTerm}
                                            setSearchTerm={setUserSearchTerm}
                                            isLoading={usersLoading}
                                            disabled={users.length === 0}
                                        />
                                    </div>
                                </div>
                                <button onClick={() => setSelectionMode(false)} type="button" disabled={!selectedProperty || !selectedUser || !selectedUnit} className="mt-3 border border-primary rounded-lg px-5 py-2.5 text-lg font-medium text-primary hover:bg-primary/90 hover:text-white disabled:hover:text-primary disabled:hover:bg-transparent disabled:opacity-25 disabled:cursor-not-allowed " >
                                    Book
                                </button>
                            </div>
                            :
                            <>
                                <section className="flex justify-between gap-8 w-full">
                                    <div className="w-full max-w-[67%] relative">
                                        <Swiper
                                            loop={true}
                                            modules={[Navigation, Autoplay]}
                                            spaceBetween={5}
                                            slidesPerView={1}
                                            navigation
                                            autoplay
                                            className="rewind"
                                        >
                                            {
                                                selectedUnit?.media?.map((el: any, index: any) => (
                                                    <SwiperSlide key={index}>
                                                        <Image
                                                            alt={`${el?.name}_img_${index}`}
                                                            src={el.media_url || el.mediaUrl || "/png/placeholder.png"}
                                                            className="w-full max-h-[30rem] rounded-xl"
                                                            width={900}
                                                            height={900}
                                                        />
                                                    </SwiperSlide>
                                                ))
                                            }
                                        </Swiper>
                                    </div>
                                    <div className='w-full flex flex-col gap-y-3'>
                                        <div className='size-full flex flex-col justify-center items-center bg-background rounded-xl'>
                                            <p className='text-base text-zinc-800 font-medium text-center mb-1'>
                                                Guest
                                            </p>
                                            <Image
                                                alt={`owner_img`}
                                                src={(selectedUser?.profile?.profileImage || selectedUser?.profile?.profile_image) ?? '/png/sample_owner.png'}
                                                className="w-full max-w-[14rem] rounded-xl my-3"
                                                width={400}
                                                height={400}
                                            />
                                            <p className='text-base text-zinc-800 font-medium text-center mb-1'>
                                                {`${selectedUser?.profile?.firstName ?? 'Roofus'} ${selectedUnit?.property?.owner?.profile?.lastName ?? 'James'}`}
                                            </p>
                                            <p className='text-sm text-zinc-800 font-medium text-center'>
                                                {`${selectedUser?.email ?? 'rjames@hotmail.com'}`}
                                            </p>
                                        </div>
                                        <div className='flex justify-between items-center gap-5 w-full'>
                                            <button onClick={() => router.push(PAGE_ROUTES.dashboard.userManagement.guests.details(selectedUser?.id!))} className="text-center w-full cursor-pointer border border-primary rounded-lg px-5 py-2.5 text-lg font-medium text-primary hover:bg-primary/90 hover:text-white disabled:hover:bg-white disabled:opacity-75 disabled:cursor-not-allowed">
                                                View Guest
                                            </button>
                                        </div>
                                    </div>
                                </section>

                                <section className='my-6 w-full'>
                                    <div className='w-full flex justify-between'>
                                        <div className='w-full flex flex-col'>
                                            <h3 className="text-3xl font-normal text-zinc-800">
                                                {selectedUnit?.name}
                                            </h3>
                                            <div className="flex gap-2 items-center mt-2 text-xl text-zinc-600">
                                                <IoLocationOutline />
                                                <p className="text-base">
                                                    {selectedUnit?.property?.address ?? '17a Abdulrahmon Sanni St, Alagbado, Lagos 102213, Lagos'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex justify-center items-center gap-0 pr-3 leading-3 ">
                                            <div className="flex flex-col justify-center items-center gap-0 pr-3 leading-3 ">
                                                <p className="text-xl text-primary font-medium mt-5 mb-0 w-full">
                                                    ₦{formatMoney(selectedUnit?.pricePerNight ?? 0)}
                                                </p>
                                                <p className="text-sm font-medium text-zinc-600">
                                                    Per night
                                                </p>
                                            </div>+
                                            <div className="flex flex-col justify-center items-center gap-0 px-3 leading-3">
                                                <p className="text-xl text-primary font-medium mt-5 mb-0 w-full">
                                                    ₦{formatMoney(selectedUnit?.cautionFee ?? 0)}
                                                </p>
                                                <p className="text-sm font-medium text-zinc-600 text-center">
                                                    Caution fee
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
                                                APRT-{selectedUnit?.propertyId}
                                            </p>
                                        </div>
                                        <div className="flex items-center">
                                            <CalendarIcon color="#a6a4a4" />
                                            <p className="text-zinc-900 text-sm ml-2">{formatDate("11-24-2024")}</p>
                                        </div>
                                        <div className="flex items-center">
                                            <p className="text-zinc-500 text-base">Property type:</p>
                                            <p className="text-zinc-900 text-base ml-3">
                                                {selectedUnit?.property?.propertyType ?? PropertyType.BUNGALOW}
                                            </p>
                                        </div>
                                        <div className="flex items-center">
                                            <p className="text-zinc-500 text-base">Owner:</p>
                                            <p className="text-teal-800 text-base ml-3 cursor-pointer hover:underline">
                                                {`${selectedUnit?.property?.owner?.profile?.firstName ?? 'Adekunle'} ${selectedUnit?.property?.owner?.profile?.lastName ?? 'Raji'}`}
                                            </p>
                                        </div>
                                        <div className="flex items-center">
                                            <p className="text-zinc-500 text-base">Agent:</p>
                                            <p className="text-teal-800 text-base ml-3 cursor-pointer hover:underline">
                                                {`${selectedUnit?.property?.agent?.profile?.firstName ?? 'Kate'} ${selectedUnit?.property?.agent?.profile?.lastName ?? 'Osamudiamen'}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="my-5">
                                        <div className="w-full flex gap-3">
                                            {
                                                selectedUnit?.amenities &&
                                                selectedUnit?.amenities.map((el, index) =>
                                                    <div key={index} className="w-fit flex items-center justify-center px-5 py-2  bg-zinc-200 rounded-lg text-[14px]">
                                                        {el.name}
                                                    </div>
                                                )
                                            }
                                        </div>
                                    </div>
                                </section>
                            </>

                    }



                    {
                        !selectionMode &&
                        <form className={`my-6`}>
                            <div className="my-14">
                                <DateInput
                                    checkInDate={formik.values.start_date}
                                    checkOutDate={formik.values.end_date}
                                    onCheckInDateSelect={(val) => formik.setFieldValue('start_date', (val))}
                                    onCheckOutDateSelect={(val) => formik.setFieldValue('end_date', (val))}
                                    availableDates={selectedUnit?.availability?.filter(el => {
                                        return {
                                            date: el?.date
                                        }
                                    })}
                                    showTwoMonths={true}
                                    width="100%"
                                />
                                {!formik.values.start_date && (
                                    <p className="text-xs text-red-500 mt-1">Select a check-in date</p>
                                )}
                                {!formik.values.end_date && (
                                    <p className="text-xs text-red-500 mt-1">Select a check-out date</p>
                                )}
                            </div>
                            <div className="mt-10">
                                <div className="grid grid-cols-3 grid-flow-row gap-y-5 gap-x-10 size-full">
                                    <div className="relative">
                                        <div className="text-zinc-500 text-sm flex gap-3 items-center">
                                            <UsersIcon color="#191919" className="size-5" />
                                            <label htmlFor="end-date" className="text-lg zinc-900 font-medium mt-1">Guests</label>
                                        </div>
                                        <div className="reative mt-2">
                                            <input
                                                id="guests"
                                                type="number"
                                                placeholder="0"
                                                value={formik.values.guests_count}
                                                onChange={(e) => formik.setFieldValue('guests_count', (e.target.value))}
                                                className="w-full border border-zinc-400 rounded-lg px-3 py-5 h-14 text-lg"
                                                min={1}
                                                max={10}
                                            />
                                            <p className="text-xs text-zinc-500 mt-1">Min 1, Max 10 guests per booking</p>
                                        </div>
                                    </div>


                                    <div className="relative">
                                        <div className="text-zinc-500 text-sm flex gap-3 items-center">
                                            <UnitIcon color="#191919" className="size-5" />
                                            <label htmlFor="end-date" className="text-lg zinc-900 font-medium mt-1">Units</label>
                                        </div>
                                        <div className="reative mt-2">
                                            <input
                                                id="units"
                                                type="number"
                                                placeholder="0"
                                                value={formik.values.unit_count}
                                                onChange={(e) => formik.setFieldValue('unit_count', (e.target.value))}
                                                className="w-full border border-zinc-400 rounded-lg px-3 py-5 h-14 text-lg"
                                            />
                                        </div>
                                    </div>

                                    {/* {
                                        user && user.role === UserRole.ADMIN &&
                                        <div className=" relative">
                                            <div className="text-zinc-500 text-sm flex gap-3 items-center">
                                                <HiOutlineTicket  color="#191919" className="size-5"/>
                                                <label htmlFor="end-date" className="text-lg zinc-900 font-medium mt-1">Status</label>
                                            </div>
                                            <CustomDropdown
                                                selected={status}
                                                handleSelection={(val) => formik.setFieldValue('status', (val))}
                                                options={Object.values(BookingStatus)}
                                            />
                                        </div>
                                    } */}
                                </div>

                            </div>

                            <section className="flex justify-between items-center mt-24">
                                <div>
                                    <p className="mb-3 text-base text-zinc-500 font-medium border border-zinc-500 px-3 py-auto rounded-full w-fit">Total price</p>
                                    <div className="relative flex justify-between ">
                                        <TbCurrencyNaira className="size-10" />
                                        <p className="text-[2.5rem] text-zinc-700">{formatMoney(Number(formik.values.total_price))}</p>
                                        <PriceTagIcon color="#191919" className="size-6 ml-1" />
                                    </div>
                                </div>
                                <div className="w-3/6 flex justify-end items-center gap-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!(selectedProperty && selectedUnit && selectedUser)) {
                                                toast.error('Select a property, unit and guest to continue', { duration: 4000, style: { maxWidth: '500px', width: 'max-content' } });
                                                return;
                                            }
                                            if (!(formik.values.start_date && formik.values.end_date)) {
                                                toast.error('Select check-in and check-out dates', { duration: 4000, style: { maxWidth: '500px', width: 'max-content' } });
                                                return;
                                            }
                                            if ((formik.values.guests_count || 0) < 1 || (formik.values.unit_count || 0) < 1) {
                                                toast.error('Guests and units must be at least 1', { duration: 4000, style: { maxWidth: '500px', width: 'max-content' } });
                                                return;
                                            }
                                            formik.handleSubmit();
                                        }}
                                        disabled={isPending}
                                        className="border border-teal-700 bg-transparent text-primary/90 hover:text-white hover:bg-primary/90 rounded-lg px-5 py-2.5  text-lg font-medium disabled:hover:bg-white disabled:opacity-75 disabled:cursor-not-allowed"
                                    >
                                        {isPending ? <Spinner /> : 'Proceed'}
                                    </button>
                                </div>
                            </section>
                        </form>
                    }
                </div>
            </div>
        </section>
    )
}
'use client'

import { TbCurrencyNaira } from "react-icons/tb";
import { CalendarIcon, PriceTagIcon, UnitIcon, UsersIcon } from "../../icons";
import { formatDate, formatDateToYYYYMMDD, formatMoney, getDayDifference } from "@/src/lib/utils";
import { useFormik } from "formik";
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import CustomFilterDropdown from "../../ui/customFilterDropDown";
import { GetAllProperties, GetSingleProperty } from "@/src/lib/request-handlers/propertyMgt";
import { GetAllUsers } from "@/src/lib/request-handlers/userMgt";
import { useEffect, useState, useMemo } from "react";
import { IProperty, IPropertyUnit, PropertyType } from "../../properties-mgt/types";
import { IUser } from "@/src/lib/types";
import AdjustableFilterDropdown from "../../ui/AdjustableFilterDropdown";
import { IoLocationOutline } from "react-icons/io5";
import { IoMdReturnLeft } from "react-icons/io";
import BookingAvailabilityCalendar from "./BookingAvailabilityCalendar";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import { addYears } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { CreateBooking } from "@/src/lib/request-handlers/bookingMgt";
import Spinner from "../../ui/Spinner";
import { useAuth } from "@/src/hooks/useAuth";
import toast from "react-hot-toast";
import { UserRole } from "@/src/lib/enums";
import { useMediaQuery } from "@mui/material";
import { UploadPaymentProof } from "@/src/lib/request-handlers/bookingMgt";
import { HiOutlineCloudUpload } from "react-icons/hi";
import { MdOutlinePayments } from "react-icons/md";

export default function CreateBookingView() {
    const router = useRouter();
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const isMobile = useMediaQuery("(max-width: 768px)");

    // State
    const [userSearchTerm, setUserSearchTerm] = useState<string>('')
    const [propertySearchTerm, setPropertySearchTerm] = useState<string>('')
    const [unitSearchTerm, setUnitSearchTerm] = useState<string>('')
    const [propPage, setPropPage] = useState<number>(1);
    const propSize = 12;

    // Queries
    const { data: propertyList, isLoading: propertiesLoading } = GetAllProperties(propPage, propSize, propertySearchTerm);
    const { data: userList, isLoading: usersLoading } = GetAllUsers(1, 12, userSearchTerm)
    const { mutate, isPending } = CreateBooking();
    const { mutate: uploadProof, isPending: isUploading } = UploadPaymentProof();

    // Local Data State
    const [selectionMode, setSelectionMode] = useState<boolean>(true)
    const [properties, setProperties] = useState<IProperty[]>([])
    const [users, setUsers] = useState<IUser[]>([])

    // Selection State
    const [selectedProperty, setSeletedProperty] = useState<IProperty | any | null>(null)
    const [selectedUnit, setSeletedUnit] = useState<IPropertyUnit | null>(null)
    const [selectedUser, setSeletedUser] = useState<IUser | null>(null)
    const [isNewGuest, setIsNewGuest] = useState<boolean>(false)

    // Fetch full property details to get units
    const { data: singlePropertyData, isLoading: isLoadingPropertyDetails } = GetSingleProperty(selectedProperty?.id);
    const fullPropertyDetails = singlePropertyData?.data?.data;

    const formik = useFormik({
        initialValues: {
            user_id: 0,
            unit_id: 0,
            start_date: null,
            end_date: null,
            guests_count: 1,
            unit_count: 1,
            total_price: 0,
            payment_method: 'cash',
            payment_proof_url: '',
            payment_notes: '',
            mark_as_paid: false,
            // Onboarding fields
            guest_first_name: '',
            guest_last_name: '',
            guest_email: '',
            guest_phone: '',
        },
        onSubmit: async (values) => {
            // Validation: proof is mandatory for bank transfer if marking as paid
            if (values.mark_as_paid && values.payment_method === 'bank_transfer' && !values.payment_proof_url) {
                toast.error('Proof of payment is mandatory for bank transfers');
                return;
            }

            const payload = {
                ...values,
                start_date: formatDateToYYYYMMDD(values.start_date!),
                end_date: formatDateToYYYYMMDD(values.end_date!),
                // Ensure user_id is null if we are creating a new guest
                user_id: isNewGuest ? null : values.user_id
            };

            mutate(
                {
                    payload: payload as any,
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
        const selected = filteredProperties[0];
        setSeletedProperty(selected);
        setPropertySearchTerm(name);
        setSeletedUnit(null);
        setUnitSearchTerm('');
        formik.setFieldValue('unit_id', 0);
    }

    const handleUnitSelection = (name: string) => {
        // Use full details to find the unit
        const unit = fullPropertyDetails?.units?.find((u: IPropertyUnit) => u.name === name);
        console.log('DEBUG: Selected Unit:', unit);
        if (unit) {
            console.log('DEBUG: Unit Availability:', unit.availability);
            setSeletedUnit(unit);
            formik.setFieldValue('unit_id', unit.id);
            formik.setFieldValue('unit_count', 1);
        }
    }

    // Effect to inspect full details
    useEffect(() => {
        if (fullPropertyDetails) {
            console.log('DEBUG: Full Property Details:', fullPropertyDetails);
        }
    }, [fullPropertyDetails]);

    // Effect to sync properties list
    useEffect(() => {
        const fromItems = (propertyList as any)?.data?.data?.items ?? (propertyList as any)?.data?.items;
        const fromData = (propertyList as any)?.data?.data?.data?.data ?? [];
        const next = Array.isArray(fromItems) ? fromItems : (Array.isArray(fromData) ? fromData : []);
        setProperties(next as IProperty[])
    }, [propertyList])

    // Effect to sync users list
    useEffect(() => {
        const fromItems = (userList as any)?.data?.data?.items ?? (userList as any)?.data?.items;
        const fromData = (userList as any)?.data?.data?.data ?? [];
        const next = Array.isArray(fromItems) ? fromItems : (Array.isArray(fromData) ? fromData : []);
        setUsers(next as IUser[])
    }, [userList])

    const { values, setFieldValue } = formik;

    // Effect to calculate price
    useEffect(() => {
        const days = getDayDifference(values.start_date as any, values.end_date as any)

        // Robust access to price and caution fee
        const pricePerNight = Number(selectedUnit?.pricePerNight ?? selectedUnit?.price_per_night ?? 0);
        const cautionFee = Number(selectedUnit?.cautionFee ?? selectedUnit?.caution_fee ?? 0);

        const firstPrice = days * (values.unit_count || 0) * pricePerNight;
        const grandPrice = firstPrice + cautionFee;
        setFieldValue('total_price', grandPrice)

    }, [
        values.unit_count,
        values.start_date,
        values.end_date,
        selectedUnit, // simplified dependency
        setFieldValue,
    ])

    // Memoize blocked dates calculation to ensure re-render when unit_count changes
    const blockedDates = useMemo(() => {
        if (!selectedUnit?.availability) return [];

        const requestedUnits = Number(formik.values.unit_count || 1);

        return selectedUnit.availability
            .filter((el: any) => {
                const isBlackout = el?.is_blackout ?? el?.isBlackout ?? false;
                const count = Number(el?.count ?? 0);

                // Block if:
                // 1. Explicitly blacked out
                // 2. Remaining count is 0 or less
                // 3. Remaining count is less than requested units
                return isBlackout || count <= 0 || count < requestedUnits;
            })
            .map((el: any) => ({ date: el?.date }));
    }, [selectedUnit?.availability, formik.values.unit_count]);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        uploadProof(
            { payload: formData },
            {
                onSuccess: (data: any) => {
                    const url = data?.data?.data?.url;
                    if (url) {
                        formik.setFieldValue('payment_proof_url', url);
                        toast.success('Payment proof uploaded successfully');
                    }
                },
                onError: (error: any) => {
                    console.error('Upload Error - Full object:', error);
                    console.error('Upload Error - Response:', error?.response);
                    console.error('Upload Error - Response Data:', error?.response?.data);

                    let errorDetail = 'Failed to upload payment proof';

                    try {
                        if (error?.response?.data?.detail) {
                            errorDetail = error.response.data.detail;
                        } else if (error?.response?.data?.message) {
                            errorDetail = error.response.data.message;
                        } else if (error?.message) {
                            errorDetail = error.message;
                        }
                    } catch (e) {
                        console.error('Error parsing error details:', e);
                    }

                    console.error('Upload Error Detail:', errorDetail);
                    toast.error(errorDetail);
                }
            }
        );
    };

    return (
        <section className="bg-zinc-50 min-h-screen p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-semibold text-zinc-900">Create New Booking</h1>
                    {(selectedProperty || selectedUnit || selectedUser || formik.dirty) && (
                        <div onClick={() => {
                            setSeletedProperty(null);
                            setSeletedUnit(null);
                            setSeletedUser(null);
                            formik.resetForm();
                            setSelectionMode(true);
                        }} className="flex gap-2 items-center cursor-pointer text-zinc-500 hover:text-zinc-800 transition-colors">
                            <IoMdReturnLeft />
                            <span className="text-sm font-medium">Reset Form</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* LEFT COLUMN: FORM INPUTS */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* 1. Property Details Section */}
                        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
                            <h2 className="text-xl font-medium text-zinc-800 mb-6 flex items-center gap-2">
                                <span className="bg-primary/10 text-primary p-1.5 rounded-lg"><UnitIcon className="w-5 h-5" color="currentColor" /></span>
                                Property & Unit
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-700">Select Property</label>
                                    <AdjustableFilterDropdown
                                        placeholder="Search for a property..."
                                        options={properties?.map((prop: any) => prop.name).filter(Boolean) ?? []}
                                        handleSelection={(val) => handlePropertySelection(val)}
                                        searchTerm={propertySearchTerm}
                                        setSearchTerm={setPropertySearchTerm}
                                        isLoading={propertiesLoading}
                                    />
                                    {selectedProperty && (
                                        <div className="mt-4 p-4 bg-zinc-50 rounded-lg border border-zinc-100 flex gap-4 items-center animate-in fade-in slide-in-from-top-2 duration-300">
                                            {selectedProperty.images?.[0] ? (
                                                <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                                                    <Image src={selectedProperty.images[0]} alt={selectedProperty.name} fill className="object-cover" />
                                                </div>
                                            ) : (<div className="w-16 h-16 bg-zinc-200 rounded-md flex items-center justify-center text-zinc-400"><UnitIcon /></div>)}
                                            <div>
                                                <p className="font-medium text-zinc-900 line-clamp-1">{selectedProperty.name}</p>
                                                <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1"><IoLocationOutline /> {selectedProperty.address ?? 'No address'}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-700">Select Unit</label>
                                    <AdjustableFilterDropdown
                                        placeholder="Search for a unit..."
                                        // Use fullPropertyDetails here
                                        options={fullPropertyDetails?.units?.map((el: IPropertyUnit) => el?.name).filter(Boolean) ?? []}
                                        searchTerm={unitSearchTerm}
                                        setSearchTerm={setUnitSearchTerm}
                                        handleSelection={(val) => handleUnitSelection(val)}
                                        isLoading={isLoadingPropertyDetails}
                                        disabled={!selectedProperty}
                                    />
                                    {selectedUnit && (
                                        <div className="mt-4 p-4 bg-zinc-50 rounded-lg border border-zinc-100 flex gap-4 items-center animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center flex-shrink-0 border border-teal-100">
                                                <UnitIcon className="w-5 h-5" color="currentColor" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-zinc-900">{selectedUnit.name}</p>
                                                <p className="text-xs text-zinc-500 mt-0.5">
                                                    Max Guests: <span className="font-medium text-zinc-700">{selectedUnit.maxGuests ?? selectedUnit.max_guests ?? '-'}</span> •
                                                    Price: <span className="font-medium text-primary">{formatMoney(selectedUnit.pricePerNight ?? selectedUnit.price_per_night ?? 0)}/night</span>
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 2. Guest Details Section */}
                        <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
                            <h2 className="text-xl font-medium text-zinc-800 mb-6 flex items-center gap-2">
                                <span className="bg-blue-50 text-blue-600 p-1.5 rounded-lg"><UsersIcon className="w-5 h-5" color="currentColor" /></span>
                                Guest & Stay
                            </h2>

                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-4 p-1 bg-zinc-100 rounded-lg w-fit">
                                    <button
                                        type="button"
                                        onClick={() => setIsNewGuest(false)}
                                        className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${!isNewGuest ? 'bg-white shadow-sm text-primary' : 'text-zinc-500 hover:text-zinc-700'}`}
                                    >
                                        Existing Guest
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsNewGuest(true)}
                                        className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all ${isNewGuest ? 'bg-white shadow-sm text-primary' : 'text-zinc-500 hover:text-zinc-700'}`}
                                    >
                                        New Guest Onboarding
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {!isNewGuest ? (
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-zinc-700">Select Guest</label>
                                            <AdjustableFilterDropdown
                                                placeholder="Search by name or email..."
                                                options={userList?.data?.data?.data?.map((user: any) => user.email).filter(Boolean) ?? []}
                                                handleSelection={(val) => {
                                                    const selected = userList?.data?.data?.data?.find((user: any) => user.email === val);
                                                    setUserSearchTerm(val);
                                                    setSeletedUser(selected);
                                                    formik.setFieldValue('user_id', selected?.id);
                                                }}
                                                searchTerm={userSearchTerm}
                                                setSearchTerm={setUserSearchTerm}
                                                isLoading={usersLoading}
                                            />
                                            {selectedUser && (
                                                <div className="mt-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 font-medium border border-zinc-200">
                                                        {selectedUser.profile?.firstName?.[0] ?? 'G'}{selectedUser.profile?.lastName?.[0] ?? ''}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-zinc-900">{selectedUser.profile?.firstName ?? 'Guest'} {selectedUser.profile?.lastName ?? ''}</p>
                                                        <p className="text-xs text-zinc-500">{selectedUser.email}</p>
                                                    </div>
                                                    <button type="button" onClick={() => router.push(PAGE_ROUTES.dashboard.userManagement.guests.details(selectedUser.id))} className="ml-auto text-xs font-medium text-primary underline hover:text-primary/80">View Profile</button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="col-span-1 space-y-4 animate-in fade-in slide-in-from-left-2 duration-300">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-zinc-500 uppercase">First Name</label>
                                                    <input
                                                        type="text"
                                                        className="w-full h-11 px-4 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                                        placeholder="e.g. John"
                                                        {...formik.getFieldProps('guest_first_name')}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-zinc-500 uppercase">Last Name</label>
                                                    <input
                                                        type="text"
                                                        className="w-full h-11 px-4 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                                        placeholder="e.g. Doe"
                                                        {...formik.getFieldProps('guest_last_name')}
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-zinc-500 uppercase">Email Address <span className="text-red-500">*</span></label>
                                                    <input
                                                        type="email"
                                                        className="w-full h-11 px-4 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                                        placeholder="guest@example.com"
                                                        {...formik.getFieldProps('guest_email')}
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-semibold text-zinc-500 uppercase">Phone Number</label>
                                                    <input
                                                        type="tel"
                                                        className="w-full h-11 px-4 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                                        placeholder="+234..."
                                                        {...formik.getFieldProps('guest_phone')}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-zinc-700">Guests</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        disabled={!selectedUnit}
                                                        max={selectedUnit?.maxGuests ?? selectedUnit?.max_guests ?? 10}
                                                        className="w-full h-14 pl-4 pr-4 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all disabled:bg-zinc-100 disabled:text-zinc-400"
                                                        value={formik.values.guests_count}
                                                        onChange={(e) => {
                                                            const val = Number(e.target.value);
                                                            const max = selectedUnit?.maxGuests ?? selectedUnit?.max_guests ?? 10;
                                                            if (val <= max) {
                                                                formik.setFieldValue('guests_count', val);
                                                            } else {
                                                                toast.error(`Max guests for this unit is ${max}`);
                                                                formik.setFieldValue('guests_count', max);
                                                            }
                                                        }}
                                                    />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none">People</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-zinc-700">Units</label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        disabled={!selectedUnit}
                                                        max={selectedUnit?.count ?? 1}
                                                        className="w-full h-14 pl-4 pr-4 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all disabled:bg-zinc-100 disabled:text-zinc-400"
                                                        value={formik.values.unit_count}
                                                        onChange={(e) => {
                                                            const val = Number(e.target.value);
                                                            const max = selectedUnit?.count ?? 1;
                                                            if (val < 1) {
                                                                formik.setFieldValue('unit_count', 1);
                                                            } else if (val > max) {
                                                                toast.error(`Only ${max} units available`);
                                                                formik.setFieldValue('unit_count', max);
                                                            } else {
                                                                formik.setFieldValue('unit_count', val);
                                                            }
                                                        }}
                                                    />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 text-sm pointer-events-none">Qty</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700">Stay Duration</label>
                                <BookingAvailabilityCalendar
                                    checkInDate={formik.values.start_date}
                                    checkOutDate={formik.values.end_date}
                                    onCheckInDateSelect={(date) => formik.setFieldValue('start_date', date)}
                                    onCheckOutDateSelect={(date) => formik.setFieldValue('end_date', date)}
                                    isMobileView={isMobile}
                                    maxDate={addYears(new Date(), 1)}
                                    blockedDates={blockedDates}
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    * Bookings are limited to 1 year in advance.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: BOOKING SUMMARY (STICKY) */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl border border-zinc-200 shadow-lg p-6 sticky top-8">
                            <h3 className="text-lg font-semibold text-zinc-900 mb-6 border-b border-zinc-100 pb-4">Booking Summary</h3>

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">Guest</span>
                                    <span className="text-zinc-900 font-medium text-right w-1/2 truncate">
                                        {isNewGuest
                                            ? (formik.values.guest_first_name || formik.values.guest_email || 'New Guest')
                                            : (selectedUser?.profile?.firstName ? `${selectedUser.profile.firstName} ${selectedUser.profile.lastName || ''}` : selectedUser?.email || '-')}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">Property</span>
                                    <span className="text-zinc-900 font-medium text-right w-1/2 truncate">{selectedProperty?.name || '-'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">Unit Type</span>
                                    <span className="text-zinc-900 font-medium">{selectedUnit?.name || '-'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">Dates</span>
                                    <div className="text-right">
                                        {formik.values.start_date && formik.values.end_date ? (
                                            <>
                                                <span className="block text-zinc-900 font-medium">{formatDate(formik.values.start_date as any)}</span>
                                                <span className="block text-zinc-400 text-xs">to {formatDate(formik.values.end_date as any)}</span>
                                            </>
                                        ) : <span className="text-zinc-400">-</span>}
                                    </div>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">Duration</span>
                                    <span className="text-zinc-900 font-medium">
                                        {formik.values.start_date && formik.values.end_date
                                            ? `${getDayDifference(formik.values.start_date as any, formik.values.end_date as any)} Nights`
                                            : '-'}
                                    </span>
                                </div>
                            </div>

                            {/* Pricing Breakdown */}
                            <div className="bg-zinc-50 rounded-lg p-4 mb-6 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-600">Rate (x{formik.values.unit_count || 1} units)</span>
                                    <span className="font-medium text-zinc-900">
                                        {selectedUnit
                                            ? formatMoney(Number(selectedUnit.pricePerNight ?? selectedUnit.price_per_night ?? 0) * (formik.values.unit_count || 1))
                                            : '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-600">Caution Fee</span>
                                    <span className="font-medium text-zinc-900">
                                        {selectedUnit
                                            ? formatMoney(Number(selectedUnit.cautionFee ?? selectedUnit.caution_fee ?? 0))
                                            : '-'}
                                    </span>
                                </div>
                                <div className="border-t border-zinc-200 mt-2 pt-3 flex justify-between items-center">
                                    <span className="font-semibold text-zinc-900">Total</span>
                                    <span className="text-xl font-bold text-primary">{formatMoney(formik.values.total_price)}</span>
                                </div>
                            </div>

                            {/* Payment Handling Section */}
                            <div className="border-t border-zinc-100 pt-6 mt-6 space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <MdOutlinePayments className="text-primary text-lg" />
                                    <h4 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider">Payment Information</h4>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 bg-zinc-50 p-3 rounded-lg border border-zinc-200 cursor-pointer hover:bg-zinc-100 transition-colors"
                                        onClick={() => formik.setFieldValue('mark_as_paid', !formik.values.mark_as_paid)}>
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-primary rounded focus:ring-primary border-zinc-300"
                                            checked={formik.values.mark_as_paid}
                                            onChange={() => { }} // Handled by div click
                                        />
                                        <span className="text-sm font-medium text-zinc-700">Mark as Paid</span>
                                    </div>

                                    {formik.values.mark_as_paid && (
                                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-zinc-500 uppercase">Payment Method</label>
                                                <select
                                                    className="w-full h-11 px-3 border border-zinc-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                    value={formik.values.payment_method}
                                                    onChange={(e) => formik.setFieldValue('payment_method', e.target.value)}
                                                >
                                                    <option value="cash">Cash</option>
                                                    <option value="pos">POS</option>
                                                    <option value="bank_transfer">Bank Transfer</option>
                                                    <option value="online">Online / Other</option>
                                                </select>
                                            </div>

                                            {(formik.values.payment_method === 'bank_transfer' || formik.values.payment_method === 'pos') && (
                                                <div className="space-y-2">
                                                    <label className="text-xs font-semibold text-zinc-500 uppercase">
                                                        Proof of Payment {formik.values.payment_method === 'bank_transfer' && <span className="text-red-500">*</span>}
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type="file"
                                                            id="proof-upload"
                                                            className="hidden"
                                                            accept="image/*,application/pdf"
                                                            onChange={handleFileUpload}
                                                            disabled={isUploading}
                                                        />
                                                        <label
                                                            htmlFor="proof-upload"
                                                            className={`flex items-center justify-center gap-2 w-full h-11 border-2 border-dashed ${formik.values.payment_proof_url ? 'border-primary bg-primary/5 text-primary' : 'border-zinc-300 text-zinc-500'} rounded-lg cursor-pointer hover:border-primary hover:text-primary transition-all text-sm font-medium`}
                                                        >
                                                            {isUploading ? <Spinner /> : (
                                                                <>
                                                                    <HiOutlineCloudUpload className="text-lg" />
                                                                    {formik.values.payment_proof_url ? 'Receipt Uploaded' : 'Upload Receipt'}
                                                                </>
                                                            )}
                                                        </label>
                                                        {formik.values.payment_proof_url && (
                                                            <button
                                                                type="button"
                                                                onClick={() => formik.setFieldValue('payment_proof_url', '')}
                                                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600 transition-colors"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-zinc-500 uppercase">Payment Notes</label>
                                                <textarea
                                                    className="w-full p-3 border border-zinc-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                                                    placeholder="Enter any notes about this payment..."
                                                    rows={2}
                                                    value={formik.values.payment_notes}
                                                    onChange={(e) => formik.setFieldValue('payment_notes', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={() => formik.handleSubmit()}
                                disabled={!formik.isValid || !formik.dirty || isPending || !selectedProperty || !selectedUnit || (!isNewGuest && !selectedUser) || (isNewGuest && !formik.values.guest_email) || !formik.values.start_date || isUploading}
                                className="w-full h-12 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-all mt-6 flex items-center justify-center gap-2"
                            >
                                {isPending ? <Spinner /> : (
                                    <>
                                        <span>Confirm Booking</span>
                                        <PriceTagIcon color="white" />
                                    </>
                                )}
                            </button>
                            {(!selectedProperty || !selectedUnit || (!isNewGuest && !selectedUser) || (isNewGuest && !formik.values.guest_email) || !formik.values.start_date) && (
                                <p className="text-xs text-center text-zinc-400 mt-2">Complete all fields to proceed</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
'use client'

import { useEffect, useRef, useState } from "react";
import { FaRegBuilding } from "react-icons/fa";
import { IAmenity, ICreatePropertyUnit, IProperty, MediaType } from "../types";
import MultipleChoice from "@/components/ui/MultipleChoice";
import { FaArrowLeftLong, FaPlus } from "react-icons/fa6";
import CustomDropzone from "@/components/ui/CustomDropzone";
import { useFormik } from 'formik';
import { useAuth } from "@/src/hooks/useAuth";
import Spinner from "@/components/ui/Spinner";
import { GetAmenities, GetSingleProperty } from "@/src/lib/request-handlers/propertyMgt";
import { fixedAmenities } from "@/src/data/amenities";
import CustomModal from "@/components/ui/CustomModal";
import { CreatePropertyUnit, UploadPropertyUnitMedia } from "@/src/lib/request-handlers/unitMgt";
import { CreateAmenityForm } from "../all-properties/CreatePropertyView";
import { IoBedOutline } from "react-icons/io5";
import { TbCurrencyNaira, TbToolsKitchen } from "react-icons/tb";
import { PiBathtub } from "react-icons/pi";
import { LuSofa, LuUsers } from "react-icons/lu";
import { UserRole } from "@/src/lib/enums";
import { formatMoney } from "@/src/lib/utils";
import { useRouter } from "next/navigation";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import Link from "next/link";
import { BsHouses } from "react-icons/bs";
import toast from "react-hot-toast";
import { Icon } from "@iconify/react";
import CustomCheckbox from "@/components/ui/customCheckbox";


export default function CreateUnitView({ propertyId }: { propertyId: string | number }) {
    const { user } = useAuth();
    const { mutate, isPending } = CreatePropertyUnit();
    const { data: fetchedAmenites } = GetAmenities();
    const { mutate: uploadMedia } = UploadPropertyUnitMedia();
    const { data: propertyData, isLoading } = GetSingleProperty(propertyId);

    const [availableAmenities, setAvailableAmenities] = useState<IAmenity[]>(fixedAmenities);
    const [uploadedMedia, setUploadedMedia] = useState<File[]>([]);
    const uploadRef = useRef<{ url: string; file: File }[]>([]);
    const [showAmenityForm, setShowAmenityForm] = useState<boolean>(false)
    const [loadedProperty, setLoadedProperty] = useState<IProperty>()
    const router = useRouter();

    const sortAmenities = (amenities: IAmenity[], newAmeities: string[]) => {
        const sortedAmenities = []
        let prevAmenityNames = amenities.map((a) => a.name);
        for (const amenity of newAmeities) {
            if (prevAmenityNames.includes(amenity)) {
                const pos = prevAmenityNames.indexOf(amenity)
                sortedAmenities.push(amenities[pos].id)
            }
        }

        return sortedAmenities;
    }

    useEffect(() => {
        setAvailableAmenities(fetchedAmenites?.data?.data)
    }, [fetchedAmenites])

    useEffect(() => {
        setLoadedProperty(propertyData?.data?.data)
    }, [propertyData])

    const formik =
        useFormik({
            initialValues: {
                name: "",
                description: "",
                price_per_night: "",
                max_guests: 0,
                count: 0,
                is_whole_property: false,
                bedroom_count: 0,
                living_room_count: 0,
                kitchen_count: 0,
                bathroom_count: 0,
                caution_fee: "0.00",
                amenities: [],
                amenityNames: [],
            },

            onSubmit: (values) => {
                const sortedAmenities = sortAmenities(availableAmenities, values.amenityNames);

                const payload: ICreatePropertyUnit[] = [{
                    ...values,
                    amenities: sortedAmenities,
                }]

                mutate({
                    propertyId: String(propertyId),
                    payload
                },
                    {
                        onSuccess: (response) => {
                            const unitId = response?.data?.data[0]?.id
                            const formData = new FormData();

                            if (unitId) {
                                if (uploadedMedia.length > 0) {
                                    uploadedMedia?.forEach(file => {
                                        formData.append("media_file", file);
                                    });

                                    formData.append("media_type", MediaType.IMAGE);
                                    formData.append("is_featured", "true");

                                    uploadMedia(
                                        {
                                            propertyId: String(propertyId),
                                            unitId,
                                            payload: formData,
                                        },
                                        {
                                            onError: (error: any) =>
                                                toast.error(error.status === 422 ? 'Media file(s) include Invalid format' : 'Media upload failed', {
                                                    duration: 6000,
                                                    style: {
                                                        maxWidth: '500px',
                                                        width: 'max-content'
                                                    }
                                                }),
                                        }
                                    );


                                    toast.success('Property unit created successfully', {
                                        duration: 6000,
                                        style: {
                                            maxWidth: '500px',
                                            width: 'max-content'
                                        }
                                    })
                                }
                            }

                            router.push(PAGE_ROUTES.dashboard.propertyManagement.allProperties.units.details(propertyId, unitId))
                        },
                        onError: () =>
                            toast.error('Something went wrong', {
                                duration: 6000,
                                style: {
                                    maxWidth: '500px',
                                    width: 'max-content'
                                }
                            })
                    })
            },
        });


    return (
        <div className="relative">
            {/* Header section refined */}
            <div className="flex items-center justify-between mb-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Link href={PAGE_ROUTES.dashboard.propertyManagement.allProperties.details(propertyId)} className="text-xs font-bold text-primary hover:underline flex items-center gap-1 transition-all">
                            <FaArrowLeftLong className="text-[10px]" /> {loadedProperty?.name}
                        </Link>
                    </div>
                    <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Create New Unit</h2>
                    <p className="text-sm font-medium text-zinc-500">Define the features, configuring and pricing for your new unit</p>
                </div>
                <div className="p-2.5 bg-primary/10 rounded-xl">
                    <Icon icon="solar:add-square-bold-duotone" className="text-2xl text-primary" />
                </div>
            </div>

            {
                showAmenityForm &&
                <CustomModal
                    title="Create Amenity"
                    onClose={() => setShowAmenityForm(false)}
                    isOpen={showAmenityForm}
                >
                    <CreateAmenityForm show={setShowAmenityForm} />
                </CustomModal>
            }

            <form
                id="create-unit-form"
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-20"
                onSubmit={(e) => { e.preventDefault(); formik.handleSubmit(); }}
            >
                {/* Main Form Content - Left Side */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Basic Information Section */}
                    <div className="bg-white border border-zinc-200 rounded-3xl p-8 space-y-6 shadow-sm">
                        <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                            <Icon icon="solar:info-circle-bold-duotone" className="text-xl text-primary" />
                            Basic Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2 space-y-2">
                                <label htmlFor="name" className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Unit Name</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary text-zinc-400">
                                        <FaRegBuilding />
                                    </div>
                                    <input
                                        id="name"
                                        type="text"
                                        placeholder="e.g. Luxury Penthouse Suite"
                                        value={formik.values.name}
                                        onChange={formik.handleChange}
                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label htmlFor="description" className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Description</label>
                                <div className="relative">
                                    <textarea
                                        id="description"
                                        maxLength={300}
                                        rows={4}
                                        placeholder="Provide a compelling description of this unit..."
                                        value={formik.values.description}
                                        onChange={formik.handleChange}
                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-4 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium resize-none"
                                    />
                                    <div className="absolute bottom-3 right-3 text-[10px] font-bold text-zinc-400">
                                        {formik.values.description.length}/300
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Configurations Section */}
                    <div className="bg-white border border-zinc-200 rounded-3xl p-8 space-y-6 shadow-sm">
                        <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                            <Icon icon="solar:widget-3-bold-duotone" className="text-xl text-primary" />
                            Unit Configuration
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                            {[
                                { id: 'bedroom_count', label: 'Bedrooms', icon: IoBedOutline },
                                { id: 'kitchen_count', label: 'Kitchens', icon: TbToolsKitchen },
                                { id: 'bathroom_count', label: 'Bathrooms', icon: PiBathtub },
                                { id: 'living_room_count', label: 'Lounges', icon: LuSofa },
                                { id: 'max_guests', label: 'Max Guests', icon: LuUsers }
                            ].map((field) => (
                                <div key={field.id} className="space-y-2">
                                    <label htmlFor={field.id} className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">{field.label}</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors group-focus-within:text-primary text-zinc-400">
                                            <field.icon className="text-lg" />
                                        </div>
                                        <input
                                            id={field.id}
                                            type="number"
                                            value={formik.values[field.id as keyof typeof formik.initialValues] as any}
                                            onChange={(e) => formik.setFieldValue(field.id, Number(e.target.value))}
                                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-11 pr-3 py-3 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-zinc-900"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="pt-4 mt-2 border-t border-zinc-100 flex items-center justify-between">
                            <CustomCheckbox
                                label="This unit represents the whole property"
                                checked={formik.values.is_whole_property}
                                onChange={(val: boolean) => formik.setFieldValue("is_whole_property", val)}
                            />
                            <div className="w-1/4 space-y-2">
                                <label htmlFor="count" className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Total Units Avail.</label>
                                <input
                                    id="count"
                                    type="number"
                                    value={formik.values.count}
                                    onChange={(e) => formik.setFieldValue('count', Number(e.target.value))}
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-zinc-900"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Amenities Section */}
                    <div className="bg-white border border-zinc-200 rounded-3xl p-8 space-y-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                                <Icon icon="solar:star-bold-duotone" className="text-xl text-primary" />
                                Amenities
                            </h3>
                            {user?.role === UserRole.ADMIN && (
                                <button
                                    type="button"
                                    onClick={() => setShowAmenityForm(true)}
                                    className="text-[10px] font-bold text-primary hover:text-primary/70 transition-colors flex items-center gap-1"
                                >
                                    <FaPlus className="text-[8px]" /> ADD CUSTOM AMENITY
                                </button>
                            )}
                        </div>
                        <div className="bg-zinc-50/50 border border-zinc-100 rounded-2xl p-6">
                            <MultipleChoice
                                options={availableAmenities?.map(el => el.name)}
                                selected={formik.values.amenityNames}
                                onChange={(val) => formik.setFieldValue("amenityNames", [...val])}
                            />
                        </div>
                    </div>

                    {/* Media Section */}
                    <div className="bg-white border border-zinc-200 rounded-3xl p-8 space-y-6 shadow-sm">
                        <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                            <Icon icon="solar:camera-bold-duotone" className="text-xl text-primary" />
                            Gallery & Media
                        </h3>
                        <div className="w-full mx-auto">
                            <CustomDropzone
                                onDrop={setUploadedMedia}
                                multiple
                                previewsRef={uploadRef}
                            />
                        </div>
                    </div>
                </div>

                {/* Sidebar Sticky Content - Right Side */}
                <div className="lg:col-span-4 space-y-8 sticky top-8">
                    {/* Pricing Strategy Card */}
                    <div className="bg-zinc-900 rounded-[2.5rem] p-8 text-white shadow-xl shadow-zinc-900/20 relative overflow-hidden group border border-zinc-800">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32" />

                        <h3 className="text-lg font-bold mb-8 flex items-center gap-2 relative z-10">
                            <Icon icon="solar:tag-bold-duotone" className="text-xl text-primary" />
                            Pricing Strategy
                        </h3>

                        <div className="space-y-6 relative z-10">
                            <div className="space-y-2">
                                <label htmlFor="price_per_night" className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Price Per Night</label>
                                <div className="relative group/input">
                                    <div className="absolute inset-y-0 left-3 flex items-center h-full pointer-events-none">
                                        <TbCurrencyNaira className="text-2xl text-zinc-600 group-focus-within/input:text-primary transition-colors" />
                                    </div>
                                    <input
                                        id="price_per_night"
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={formik.values.price_per_night}
                                        onChange={(e) => formik.setFieldValue('price_per_night', e.target.value)}
                                        className="w-full bg-white/[0.04] border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:bg-white/[0.08] focus:border-primary/50 outline-none transition-all font-bold text-2xl text-white placeholder:text-zinc-800"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="caution_fee" className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Caution Fee (Refundable)</label>
                                <div className="relative group/input">
                                    <div className="absolute inset-y-0 left-3 flex items-center h-full pointer-events-none">
                                        <TbCurrencyNaira className="text-2xl text-zinc-600 group-focus-within/input:text-primary transition-colors" />
                                    </div>
                                    <input
                                        id="caution_fee"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formik.values.caution_fee}
                                        onChange={(e) => formik.setFieldValue('caution_fee', (String(e.target.value)))}
                                        className="w-full bg-white/[0.04] border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:bg-white/[0.08] focus:border-primary/50 outline-none transition-all font-bold text-2xl text-white placeholder:text-zinc-800"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/10">
                                <div className="flex flex-col items-center text-center">
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Total Revenue Display</p>
                                    <div className="flex items-center justify-center gap-1">
                                        <TbCurrencyNaira className="text-3xl text-primary" />
                                        <span className="text-4xl font-bold tracking-tight text-white">
                                            {formatMoney(Number(formik.values.price_per_night) + Number(formik.values.caution_fee))}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Static Action Buttons Card */}
                    <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-4">
                        <button
                            form="create-unit-form"
                            type="submit"
                            disabled={isPending}
                            className="w-full h-14 bg-primary text-white text-sm font-bold rounded-2xl hover:bg-primary/90 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isPending ? <Spinner /> : <><Icon icon="solar:check-read-bold" className="text-lg" /> CREATE UNIT</>}
                        </button>

                        <Link
                            href={PAGE_ROUTES.dashboard.propertyManagement.allProperties.details(propertyId)}
                            className="w-full h-12 border border-zinc-200 text-zinc-600 text-[11px] font-bold rounded-xl hover:bg-zinc-50 transition-all uppercase tracking-wider flex items-center justify-center"
                        >
                            CANCEL
                        </Link>
                    </div>
                </div>
            </form>
        </div>
    );
}
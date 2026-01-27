import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { IAmenity, IPropertyMedia, IPropertyUnit, IUpdatePropertyUnit, MediaType, } from "../types";
import { useDispatch } from "react-redux";
import { useAuth } from "@/src/hooks/useAuth";
import { AssignUnitAmenities, DeletePropertyUnit, GetSinglePropertyUnit, UpdatePropertyUnit, UploadPropertyUnitMedia } from "@/src/lib/request-handlers/unitMgt";
import { useFormik } from "formik";
import { FaPlus, FaRegBuilding } from "react-icons/fa";
import MultipleChoice from "../../ui/MultipleChoice";
import { showAlert } from "@/src/lib/slices/alertDialogSlice";
import Image from "next/image";
import { PriceTagIcon, TrashIcon } from "../../icons";
import CustomDropzone from "../../ui/CustomDropzone";
import CustomCheckbox from "../../ui/customCheckbox";
import { IoBedOutline, IoCloudUploadOutline } from "react-icons/io5";
import { UserRole } from "@/src/lib/enums";
import { TbCurrencyNaira, TbToolsKitchen } from "react-icons/tb";
import { formatMoney } from "@/src/lib/utils";
import { PiBathtub } from "react-icons/pi";
import { LuSofa, LuUsers } from "react-icons/lu";
import Spinner from "../../ui/Spinner";
import toast from "react-hot-toast";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import { GetAmenities } from "@/src/lib/request-handlers/propertyMgt";
import { Icon } from "@iconify/react/dist/iconify.js";

export default function EditUnitView({
    handleEditMode,
    unitData,
    propertyId,
    unitId,
}: {
    handleEditMode: Dispatch<SetStateAction<boolean>>,
    unitData: IPropertyUnit,
    propertyId: string | number,
    unitId: string | number,
}) {
    const { data: unitDetails, isLoading } = GetSinglePropertyUnit(propertyId, unitId)
    const { data: fetchedAmenites } = GetAmenities();
    const [unit, setUnit] = useState<IPropertyUnit>(unitData);
    const [amenities, setAmenities] = useState<IAmenity[]>([]);
    const dispatch = useDispatch();
    const { mutate, isPending } = UpdatePropertyUnit();
    const { mutate: deleteMutation, isPending: deleteIsPending } = DeletePropertyUnit()
    const { mutate: uploadMedia, data: uploadData, isPending: uploadedMediaPending } = UploadPropertyUnitMedia();
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const [media, setMedia] = useState<IPropertyMedia[]>(unitData?.media ?? [])
    const [uploadedMedia, setUploadedMedia] = useState<File[]>([])
    const uploadRef = useRef<{ url: string; file: File }[]>([]);
    const { mutate: assignAmenity } = AssignUnitAmenities();

    useEffect(() => {
        setUnit(unitDetails?.data?.data)
        setMedia(unitDetails?.data?.data?.media)
    }, [unitDetails])

    useEffect(() => {
        setAmenities(fetchedAmenites?.data?.data)
    }, [fetchedAmenites])


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

    const removeParam = (param: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete(param); // Remove the specified query param

        const newQueryString = params.toString();
        router.push(newQueryString ? `?${newQueryString}` : pathname, { scroll: false });
    };


    const formik =
        useFormik({
            initialValues: {
                name: unit?.name ?? "",
                description: unit?.description ?? "",
                pricePerNight: unit?.pricePerNight ?? unit?.price_per_night ?? "0.00",
                cautionFee: unit?.cautionFee ?? unit?.caution_fee ?? "0.00",
                maxGuests: unit?.maxGuests ?? unit?.max_guests ?? 0,
                count: unit?.count ?? 0,
                isWholeProperty: unit?.isWholeProperty ?? unit?.is_whole_property ?? false,
                bedroomCount: unit?.bedroomCount ?? unit?.bedroom_count ?? 0,
                livingRoomCount: unit?.livingRoomCount ?? unit?.living_room_count ?? 0,
                kitchenCount: unit?.kitchenCount ?? unit?.kitchen_count ?? 0,
                bathroomCount: unit?.bathroomCount ?? unit?.bathroom_count ?? 0,
                amenities: (unit?.amenities || []).map((el: any) => el.id),
                amenityNames: (unit?.amenities || []).map((el: any) => el.name),
            },
            enableReinitialize: true,
            onSubmit: (values) => {
                const sortedAmenities = sortAmenities(amenities, values.amenityNames);

                const updatePayload: IUpdatePropertyUnit = {
                    name: values.name,
                    description: values.description,
                    price_per_night: values.pricePerNight,
                    caution_fee: values.cautionFee,
                    max_guests: values.maxGuests,
                    count: values.count,
                    is_whole_property: Boolean(values.isWholeProperty),
                    bedroom_count: values.bedroomCount,
                    living_room_count: values.livingRoomCount,
                    kitchen_count: values.kitchenCount,
                    bathroom_count: values.bathroomCount,
                    amenities: sortedAmenities,
                };
                mutate({
                    propertyId: String(unit?.propertyId || propertyId),
                    unitId: String(unit?.id || unitId),
                    payload: updatePayload,
                },
                    {
                        onSuccess: () => {
                            toast.success('Unit updated successfully', {
                                duration: 6000,
                                style: {
                                    maxWidth: '500px',
                                    width: 'max-content'
                                }
                            })
                            removeParam('edit');
                            handleEditMode(false);
                        },
                        onError: () =>
                            toast.error('Failed to update unit', {
                                duration: 6000,
                                style: {
                                    maxWidth: '500px',
                                    width: 'max-content'
                                }
                            })
                    })
            },
        });

    const handleDeleteImage = (e: number) => {
        dispatch(
            showAlert({
                title: "Are you sure?",
                description: `This action cannot be undone. This will permanently delete the image ${e}.`,
                confirmText: "Delete",
                cancelText: "Cancel",
                onConfirm: () => {
                    console.log(e);
                },
            })
        );
    }

    const handleDelete = () => {
        dispatch(
            showAlert({
                title: "Are you sure?",
                description: "This action cannot be undone. This will permanently delete this property unit.",
                confirmText: "Delete",
                cancelText: "Cancel",
                onConfirm: () => {
                    deleteMutation(
                        { propertyId: String(unit?.propertyId || propertyId), unitId: String(unit?.id || unitId) },
                        {
                            onSuccess: (response) => {
                                removeParam('edit')
                                toast.success(response?.data?.message, {
                                    duration: 6000,
                                    style: {
                                        maxWidth: '500px',
                                        width: 'max-content'
                                    }
                                });

                                router.push(PAGE_ROUTES.dashboard.propertyManagement.allProperties.details(unit.propertyId))
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
                },
            })
        );
    };


    useEffect(() => {
        if (uploadData?.data) {
            // Ensure uploadData.data is an array before spreading
            setMedia((prev) => [...prev, ...(Array.isArray(uploadData.data) ? uploadData.data.map(el => el?.data?.mediaUrl) : [uploadData.data?.data])]);
            if (uploadData.status === 201) {
                uploadRef.current.forEach(({ url }) => URL.revokeObjectURL(url)); // Revoke object URLs
                uploadRef.current = []
            }
        }
    }, [uploadData]);

    return (
        <div className="relative">
            {/* Header section remains similar but refined */}
            <div className="flex items-center justify-between mb-8">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Edit Unit Details</h2>
                    <p className="text-sm font-medium text-zinc-500">Update the features, pricing, and media for {unitData?.name}</p>
                </div>
                <div className="p-2.5 bg-primary/10 rounded-xl">
                    <Icon icon="solar:pen-new-square-bold-duotone" className="text-2xl text-primary" />
                </div>
            </div>

            <form
                id="edit-unit-form"
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
                                { id: 'bedroomCount', label: 'Bedrooms', icon: IoBedOutline },
                                { id: 'kitchenCount', label: 'Kitchens', icon: TbToolsKitchen },
                                { id: 'bathroomCount', label: 'Bathrooms', icon: PiBathtub },
                                { id: 'livingRoomCount', label: 'Lounges', icon: LuSofa },
                                { id: 'maxGuests', label: 'Max Guests', icon: LuUsers }
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

                        <div className="pt-4 mt-2 border-t border-zinc-100">
                            <CustomCheckbox
                                label="This unit represents the whole property"
                                checked={formik.values.isWholeProperty}
                                onChange={(val: boolean) => formik.setFieldValue("isWholeProperty", val)}
                            />
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
                                <button type="button" className="text-[10px] font-bold text-primary hover:text-primary/70 transition-colors flex items-center gap-1">
                                    <FaPlus className="text-[8px]" /> ADD CUSTOM AMENITY
                                </button>
                            )}
                        </div>
                        <div className="bg-zinc-50/50 border border-zinc-100 rounded-2xl p-6">
                            <MultipleChoice
                                options={amenities?.map(el => el.name)}
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
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {media?.map((el, index) => (
                                <div key={index} className="relative aspect-video rounded-xl overflow-hidden group shadow-sm border border-zinc-100">
                                    <Image
                                        src={el.mediaUrl}
                                        alt={`unit_img_${index}`}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div
                                        onClick={() => handleDeleteImage(el.id)}
                                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer"
                                    >
                                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                                            <TrashIcon className="w-4" color="white" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8">
                            <CustomDropzone
                                onDrop={setUploadedMedia}
                                multiple
                                previewsRef={uploadRef}
                            />
                            {uploadedMedia.length > 0 && (
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        const formData = new FormData();
                                        uploadedMedia.forEach(file => formData.append("media_file", file));
                                        formData.append("media_type", MediaType.IMAGE);
                                        formData.append("is_featured", "true");
                                        uploadMedia({ propertyId: String(propertyId), unitId: String(unitId), payload: formData }, {
                                            onSuccess: () => toast.success('Media uploaded successfully'),
                                            onError: () => toast.error('Upload failed')
                                        });
                                    }}
                                    disabled={uploadedMediaPending}
                                    className="mt-4 flex items-center gap-2 px-6 py-3 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50"
                                >
                                    {uploadedMediaPending ? <Spinner /> : <><IoCloudUploadOutline className="text-lg" /> UPLOAD NEW MEDIA</>}
                                </button>
                            )}
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
                                <label htmlFor="price-per-night" className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Price Per Night</label>
                                <div className="relative group/input">
                                    <div className="absolute inset-y-0 left-3 flex items-center h-full pointer-events-none">
                                        <TbCurrencyNaira className="text-2xl text-zinc-600 group-focus-within/input:text-primary transition-colors" />
                                    </div>
                                    <input
                                        id="price-per-night"
                                        type="number"
                                        value={formik.values.pricePerNight}
                                        onChange={(e) => formik.setFieldValue('pricePerNight', e.target.value)}
                                        className="w-full bg-white/[0.04] border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:bg-white/[0.08] focus:border-primary/50 outline-none transition-all font-bold text-2xl text-white placeholder:text-zinc-800"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="caution-fee" className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Caution Fee (Refundable)</label>
                                <div className="relative group/input">
                                    <div className="absolute inset-y-0 left-3 flex items-center h-full pointer-events-none">
                                        <TbCurrencyNaira className="text-2xl text-zinc-600 group-focus-within/input:text-primary transition-colors" />
                                    </div>
                                    <input
                                        id="caution-fee"
                                        type="number"
                                        value={formik.values.cautionFee}
                                        onChange={(e) => formik.setFieldValue('cautionFee', e.target.value)}
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
                                            {formatMoney(Number(formik.values.pricePerNight) + Number(formik.values.cautionFee))}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Static Action Buttons Card */}
                    <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-4">
                        <button
                            form="edit-unit-form"
                            type="submit"
                            disabled={isPending}
                            className="w-full h-14 bg-primary text-white text-sm font-bold rounded-2xl hover:bg-primary/90 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isPending ? <Spinner /> : <><Icon icon="solar:check-read-bold" className="text-lg" /> SAVE CHANGES</>}
                        </button>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => { removeParam('edit'); handleEditMode(false); }}
                                className="h-12 border border-zinc-200 text-zinc-600 text-[11px] font-bold rounded-xl hover:bg-zinc-50 transition-all uppercase tracking-wider"
                            >
                                CANCEL
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="h-12 border border-red-100 bg-red-50 text-red-600 text-[11px] font-bold rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider"
                            >
                                <TrashIcon className="w-3.5" color="currentColor" /> DELETE UNIT
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
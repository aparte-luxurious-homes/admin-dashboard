'use client'

import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { FaRegBuilding } from "react-icons/fa";
import { FaMapLocationDot, FaPlus, FaArrowLeftLong } from "react-icons/fa6";
import { TrashIcon } from "../../icons";
import { SlLocationPin } from "react-icons/sl";
import CustomDropdown from "../../ui/customDropdown";
import { IAmenity, IProperty, IPropertyMedia, IUpdateProperty, MediaType, PropertyType, PropertyVerificationStatus } from "../types";
import CustomFilterDropdown from "../../ui/customFilterDropDown";
import CustomCheckbox from "../../ui/customCheckbox";
import MultipleChoice from "../../ui/MultipleChoice";
import { ALL_COUNTRIES } from "@/src/data/countries";
import { IoCloudUploadOutline } from "react-icons/io5";
import Image from "next/image";
import { showAlert } from "@/src/lib/slices/alertDialogSlice";
import { useDispatch } from "react-redux";
import CustomDropzone from "../../ui/CustomDropzone";
import { useFormik } from 'formik';
import { DeleteProperty, FeatureProperty, UpdateProperty, UploadPropertyMedia } from "@/src/lib/request-handlers/propertyMgt";
import { useAuth } from "@/src/hooks/useAuth";
import { UserRole } from "@/src/lib/enums";
import Spinner from "../../ui/Spinner";
import { CreateAmenityForm } from "./CreatePropertyView";
import CustomModal from "../../ui/CustomModal";
import { useRouter, useSearchParams } from "next/navigation";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import toast from "react-hot-toast";
import { usePathname } from 'next/navigation';
import { Icon } from "@iconify/react";

import axios from "axios";


export default function EditPropertyView({
    handleEditMode,
    propertyData,
    availableAmenities,
}: {
    handleEditMode: Dispatch<SetStateAction<boolean>>,
    propertyData: IProperty,
    availableAmenities: IAmenity[],
}) {
    // ... logic ...
    const handleGeocode = async () => {
        const { address, city, state, country } = formik.values;
        if (!address) {
            toast.error("Please enter a physical address first");
            return;
        }
        const fullAddress = `${address}, ${city}, ${state}, ${country}`;
        const toastId = toast.loading("Fetching coordinates...");

        try {
            const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
            const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
                params: {
                    address: fullAddress,
                    key: apiKey
                }
            });

            if (response.data.status === 'OK' && response.data.results.length > 0) {
                const { lat, lng } = response.data.results[0].geometry.location;
                formik.setFieldValue('latitude', lat);
                formik.setFieldValue('longitude', lng);
                toast.success(`Coordinates found: ${lat}, ${lng}`, { id: toastId });
            } else {
                toast.error("Coordinates not found for this address. Please enter manually.", { id: toastId });
            }
        } catch (error) {
            console.error("Geocoding failed:", error);
            toast.error("Failed to fetch coordinates. Please enter manually.", { id: toastId });
        }
    };
    const dispatch = useDispatch();
    const pathname = usePathname();
    const { mutate, isPending } = UpdateProperty()
    const { mutate: deleteMutation, isPending: deleteIsPending } = DeleteProperty()
    const {
        mutate: uploadMedia,
        data: uploadData,
        isPending: uploadedMediaPending
    } = UploadPropertyMedia();
    const { mutate: featureProperty } = FeatureProperty();

    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [media, setMedia] = useState<IPropertyMedia[]>(propertyData?.media ?? [])
    const [uploadedMedia, setUploadedMedia] = useState<File[]>([])
    const uploadRef = useRef<{ url: string; file: File }[]>([]);
    const [showAmenityForm, setShowAmenityForm] = useState<boolean>(false)


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

    const formik =
        useFormik({
            initialValues: {
                name: propertyData?.name ?? "",
                address: propertyData?.address ?? "",
                type: propertyData?.propertyType ?? PropertyType.DUPLEX,
                country: propertyData?.country ?? "Nigeria",
                state: propertyData?.state ?? "Lagos",
                city: propertyData?.city ?? "Ikeja",
                description: propertyData?.description ?? "",
                latitude: propertyData?.latitude ?? 0,
                longitude: propertyData?.longitude ?? 0,
                ownerId: propertyData?.ownerId ?? 0,
                units: String(propertyData?.units?.length) ?? "0",
                isVerified: propertyData?.isVerified ?? false,
                isFeatured: propertyData?.isFeatured ?? false,
                petsAllowed: propertyData?.isPetAllowed ?? false,
                amenities: propertyData?.amenities.map((el) => el.id),
                amenityNames: propertyData?.amenities.map((el) => el.name),
            },

            onSubmit: (values: any) => {
                const sortedAmenities = sortAmenities(availableAmenities, values.amenityNames)

                if (values.isFeatured !== propertyData.isFeatured)   // Update isFeatured if changed
                    featureProperty({ propertyId: propertyData.id })

                const updatePayload: IUpdateProperty = {
                    ...values,
                    amenities: sortedAmenities,
                    property_type: values.type,
                    is_pet_allowed: values.petsAllowed,
                };

                mutate({                                            // Update proprety
                    propertyId: propertyData.id,
                    payload: updatePayload,
                },
                    {
                        onSuccess: () => {
                            toast.success('Property update successfull', {
                                duration: 6000,
                                style: {
                                    maxWidth: '500px',
                                    width: 'max-content'
                                }
                            }),
                                removeParam('edit')
                            handleEditMode(false);
                        },
                        onError: () =>
                            toast.error('Something went wrong, Please try again later', {
                                duration: 6000,
                                style: {
                                    maxWidth: '500px',
                                    width: 'max-content'
                                }
                            }),
                    })
            },
        }
        );


    const removeParam = (param: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete(param); // Remove the specified query param

        const newQueryString = params.toString();
        router.push(newQueryString ? `?${newQueryString}` : pathname, { scroll: false });
    };

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
                description: "This action cannot be undone. This will permanently delete this property.",
                confirmText: "Delete",
                cancelText: "Cancel",
                onConfirm: () => {
                    deleteMutation(
                        { propertyId: propertyData.id },
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
                                if (response.status === 204)
                                    router.push(PAGE_ROUTES.dashboard.propertyManagement.allProperties.base)
                            }
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
            {/* Header section refined */}
            <div className="flex items-center justify-between mb-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <button
                            onClick={() => { removeParam('edit'); handleEditMode(false); }}
                            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 transition-all"
                        >
                            <FaArrowLeftLong className="text-[10px]" /> Back to Details
                        </button>
                    </div>
                    <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Edit {propertyData.name}</h2>
                    <p className="text-sm font-medium text-zinc-500">Update the core identity and configuration of this property</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleDelete}
                        disabled={deleteIsPending}
                        className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                        title="Delete Property"
                    >
                        {deleteIsPending ? <Spinner /> : <Icon icon="solar:trash-bin-trash-bold-duotone" className="text-2xl" />}
                    </button>
                    <div className="p-2.5 bg-primary/10 rounded-xl">
                        <Icon icon="solar:pen-new-square-bold-duotone" className="text-2xl text-primary" />
                    </div>
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
                id="edit-property-form"
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
                            <div className="md:col-span-1 space-y-2">
                                <label htmlFor="name" className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Property Name</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary text-zinc-400">
                                        <FaRegBuilding />
                                    </div>
                                    <input
                                        id="name"
                                        type="text"
                                        placeholder="e.g. Aparte Luxury Suites"
                                        value={formik.values.name}
                                        onChange={formik.handleChange}
                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-1 space-y-2">
                                <label htmlFor="type" className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Property Type</label>
                                <CustomDropdown
                                    selected={formik.values.type}
                                    handleSelection={(val) => formik.setFieldValue("type", val)}
                                    options={Object.values(PropertyType)}
                                />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label htmlFor="description" className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Description</label>
                                <div className="relative">
                                    <textarea
                                        id="description"
                                        maxLength={300}
                                        rows={4}
                                        placeholder="Provide a compelling description of this property..."
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

                    {/* Location Section */}
                    <div className="bg-white border border-zinc-200 rounded-3xl p-8 space-y-6 shadow-sm">
                        <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                            <Icon icon="solar:map-point-bold-duotone" className="text-xl text-primary" />
                            Location & Address
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-3 space-y-2">
                                <label htmlFor="address" className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Physical Address</label>
                                <div className="flex gap-3">
                                    <div className="relative group flex-1">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary text-zinc-400">
                                            <SlLocationPin className="text-lg" />
                                        </div>
                                        <input
                                            id="address"
                                            type="text"
                                            placeholder="Street Number, Building Name, Area"
                                            value={formik.values.address}
                                            onChange={formik.handleChange}
                                            className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleGeocode}
                                        className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                                        title="Auto-detect coordinates from address"
                                    >
                                        <FaMapLocationDot className="text-xl" />
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:col-span-3 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="latitude" className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Latitude</label>
                                    <input
                                        id="latitude"
                                        type="number"
                                        step="any"
                                        placeholder="0.0000"
                                        value={formik.values.latitude}
                                        onChange={formik.handleChange}
                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-xs"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="longitude" className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Longitude</label>
                                    <input
                                        id="longitude"
                                        type="number"
                                        step="any"
                                        placeholder="0.0000"
                                        value={formik.values.longitude}
                                        onChange={formik.handleChange}
                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-xs"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Country</label>
                                <CustomFilterDropdown
                                    placeholder={`E.g. ${formik.values.country}`}
                                    options={Object.keys(ALL_COUNTRIES)}
                                    handleSelection={(val) => formik.setFieldValue("country", val)}
                                    selected={formik.values.country}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">State</label>
                                <CustomFilterDropdown
                                    placeholder={`E.g. Lagos`}
                                    options={Object.keys(ALL_COUNTRIES[formik.values.country])}
                                    handleSelection={(val) => formik.setFieldValue("state", val)}
                                    selected={Object.keys(ALL_COUNTRIES[formik.values.country])?.includes(formik.values.state) ? formik.values.state : ''}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">City</label>
                                <CustomFilterDropdown
                                    placeholder={`E.g. Ikeja`}
                                    options={ALL_COUNTRIES[formik.values.country][formik.values.state]}
                                    handleSelection={(val) => formik.setFieldValue("city", val)}
                                    selected={ALL_COUNTRIES[formik.values.country][formik.values.state]?.includes(formik.values.city) ? formik.values.city : ''}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Verifications & Amenities Section */}
                    <div className="bg-white border border-zinc-200 rounded-3xl p-8 space-y-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                                <Icon icon="solar:star-bold-duotone" className="text-xl text-primary" />
                                Amenities & Features
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

                        <div className="bg-zinc-50/50 border border-zinc-100 rounded-2xl p-6 space-y-6">
                            <MultipleChoice
                                options={availableAmenities?.map(am => am.name)}
                                selected={formik.values.amenityNames}
                                onChange={(val) => {
                                    formik.setFieldValue("amenityNames", [...val]);
                                }}
                            />

                            <div className="pt-6 border-t border-zinc-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <CustomCheckbox
                                    label="Pets are allowed"
                                    checked={formik.values.petsAllowed}
                                    onChange={(val) => formik.setFieldValue("petsAllowed", val)}
                                />
                                {user?.role === UserRole.ADMIN && (
                                    <CustomCheckbox
                                        label="Is Featured"
                                        checked={formik.values.isFeatured}
                                        onChange={(val) => formik.setFieldValue("isFeatured", val)}
                                    />
                                )}
                                {user?.role === UserRole.ADMIN && propertyData?.verifications?.[0]?.status === PropertyVerificationStatus.VERIFIED && (
                                    <CustomCheckbox
                                        label="Is verified"
                                        checked={formik.values.isVerified}
                                        onChange={(val) => formik.setFieldValue("isVerified", val)}
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Media Section */}
                    <div className="bg-white border border-zinc-200 rounded-3xl p-8 space-y-6 shadow-sm">
                        <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                            <Icon icon="solar:camera-bold-duotone" className="text-xl text-primary" />
                            Property Gallery
                        </h3>

                        {/* Existing Media */}
                        {media.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
                                {media.map((item) => (
                                    <div key={item.id} className="relative group aspect-square rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200 shadow-sm">
                                        <Image
                                            src={item.mediaUrl}
                                            alt="Property"
                                            fill
                                            className="object-cover transition-transform group-hover:scale-105"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteImage(item.id)}
                                            className="absolute top-2 right-2 p-1.5 bg-red-500/90 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                                        >
                                            <Icon icon="solar:trash-bin-trash-bold" className="text-lg" />
                                        </button>
                                        {item.isFeatured && (
                                            <div className="absolute top-2 left-2 px-2 py-0.5 bg-primary text-[8px] font-bold text-white rounded shadow-sm">FEATURED</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="w-full mx-auto">
                            <CustomDropzone
                                onDrop={setUploadedMedia}
                                multiple
                                previewsRef={uploadRef}
                            />
                        </div>

                        {
                            uploadedMedia.length > 0 &&
                            <button
                                onClick={(e) => {
                                    e.preventDefault()

                                    const formData = new FormData();

                                    uploadedMedia?.forEach(file => {
                                        formData.append("media_file", file);
                                    });

                                    formData.append("media_type", MediaType.IMAGE);
                                    formData.append("is_featured", "true");

                                    uploadMedia(
                                        {
                                            propertyId: propertyData.id,
                                            payload: formData,
                                        },
                                        {
                                            onSuccess: () =>
                                                toast.success('Property media uploaded successfully', {
                                                    duration: 6000,
                                                    style: {
                                                        maxWidth: '500px',
                                                        width: 'max-content'
                                                    }
                                                }),
                                            onError: (error: any) =>
                                                toast.error(error.status === 422 ? 'Media file(s) include invalid format' : 'Media upload failed', {
                                                    duration: 6000,
                                                    style: {
                                                        maxWidth: '500px',
                                                        width: 'max-content'
                                                    }
                                                }),

                                        }
                                    );

                                }}
                                className={`flex justify-center gap-4 items-center px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold rounded-2xl mt-6 transition-all shadow-lg shadow-zinc-900/10 disabled:cursor-not-allowed disabled:opacity-75 tracking-widest`}
                                disabled={uploadedMediaPending}
                            >
                                {
                                    uploadedMediaPending ?
                                        <Spinner color="white" />
                                        :
                                        <>
                                            <Icon icon="solar:upload-bold-duotone" className="text-xl" />
                                            <span>UPLOAD NEW MEDIA</span>
                                        </>
                                }
                            </button>
                        }
                    </div>
                </div>

                {/* Sidebar Sticky Content - Right Side */}
                <div className="lg:col-span-4 space-y-8 sticky top-8">
                    {/* Management Notice Card */}
                    <div className="bg-zinc-900 rounded-[2.5rem] p-8 text-white shadow-xl shadow-zinc-900/20 relative overflow-hidden group border border-zinc-800">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32" />
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 relative z-10">
                            <Icon icon="solar:settings-bold-duotone" className="text-xl text-primary" />
                            Management
                        </h3>
                        <p className="text-sm text-zinc-400 leading-relaxed mb-6 relative z-10">
                            Keep your property information accurate. Changes here will be reflected immediately across the platform.
                        </p>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                                    <Icon icon="solar:info-circle-bold-duotone" className="text-xl" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Ownership</p>
                                    <p className="text-xs font-bold text-white">{propertyData.owner?.profile?.firstName} {propertyData.owner?.profile?.lastName}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-4">
                        <button
                            form="edit-property-form"
                            type="submit"
                            disabled={isPending || uploadedMediaPending}
                            className="w-full h-14 bg-primary text-white text-sm font-bold rounded-2xl hover:bg-primary/90 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isPending ? <Spinner /> : <><Icon icon="solar:check-read-bold" className="text-lg" /> SAVE CHANGES</>}
                        </button>

                        <button
                            type="button"
                            onClick={() => { removeParam('edit'); handleEditMode(false); }}
                            className="w-full h-12 border border-zinc-200 text-zinc-600 text-[11px] font-bold rounded-xl hover:bg-zinc-50 transition-all uppercase tracking-wider flex items-center justify-center"
                        >
                            CANCEL
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
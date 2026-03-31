'use client'

import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { FaRegBuilding } from "react-icons/fa";
import { FaMapLocationDot, FaPlus, FaArrowLeftLong } from "react-icons/fa6";
import { TrashIcon } from "../../icons";
import { SlLocationPin } from "react-icons/sl";
import CustomDropdown from "../../ui/customDropdown";
import { DocumentType, IAmenity, IProperty, IPropertyDocument, IPropertyMedia, IUpdateProperty, MediaType, PropertyType, PropertyVerificationStatus } from "../types";
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
import { DeleteProperty, FeatureProperty, UpdateProperty, UpdateBookingMode, UploadPropertyMedia, DeletePropertyMedia, UploadPropertyDocument, GetPropertyDocuments } from "@/src/lib/request-handlers/propertyMgt";
import { BookingMode } from "../types";
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
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";
const libraries: any = ["places"];

function AddressAutocomplete({ formik, isLoaded }: { formik: any, isLoaded: boolean }) {
    const {
        ready,
        value,
        suggestions: { status, data },
        setValue,
        clearSuggestions,
    } = usePlacesAutocomplete({
        requestOptions: {
            componentRestrictions: { country: "ng" }
        },
        debounce: 300,
        defaultValue: formik.values.address
    });

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
        formik.setFieldValue('address', e.target.value);
    };

    const handleSelect = async (description: string) => {
        setValue(description, false);
        formik.setFieldValue('address', description);
        clearSuggestions();

        try {
            const results = await getGeocode({ address: description });
            const { lat, lng } = await getLatLng(results[0]);
            formik.setFieldValue('latitude', lat);
            formik.setFieldValue('longitude', lng);

            results[0].address_components.forEach((component: any) => {
                const types = component.types;
                if (types.includes('locality')) {
                    formik.setFieldValue('city', component.long_name);
                } else if (types.includes('administrative_area_level_1')) {
                    formik.setFieldValue('state', component.long_name);
                } else if (types.includes('country')) {
                    formik.setFieldValue('country', component.long_name);
                }
            });
        } catch (error) {
            console.error("Error geocoding selection:", error);
        }
    };

    return (
        <div className="relative group w-full">
            <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary text-zinc-400 z-10">
                <SlLocationPin className="text-base sm:text-lg" />
            </div>
            <input
                value={value}
                onChange={handleInput}
                disabled={!isLoaded}
                placeholder={isLoaded ? "Search for an address..." : "Loading Map API..."}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl sm:rounded-2xl pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3.5 text-sm sm:text-base focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
            />
            {status === "OK" && (
                <ul className="absolute z-50 w-full bg-white border border-zinc-200 rounded-lg sm:rounded-xl mt-1 shadow-lg max-h-48 sm:max-h-60 overflow-auto text-sm">
                    {(data as any[]).map(({ place_id, description }: { place_id: string, description: string }) => (
                        <li
                            key={place_id}
                            onClick={() => handleSelect(description)}
                            className="px-3 sm:px-4 py-2 sm:py-3 hover:bg-zinc-50 cursor-pointer text-xs sm:text-sm font-medium border-b border-zinc-100 last:border-0"
                        >
                            {description}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default function EditPropertyView({
    handleEditMode,
    propertyData,
    availableAmenities,
}: {
    handleEditMode: Dispatch<SetStateAction<boolean>>,
    propertyData: IProperty,
    availableAmenities: IAmenity[],
}) {
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
    const { mutate: updateBookingMode } = UpdateBookingMode();
    const { mutate: deleteMedia, isPending: deleteMediaPending } = DeletePropertyMedia();

    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [media, setMedia] = useState<IPropertyMedia[]>(propertyData?.media ?? [])
    const [uploadedMedia, setUploadedMedia] = useState<File[]>([])
    const uploadRef = useRef<{ url: string; file: File }[]>([]);
    const [showAmenityForm, setShowAmenityForm] = useState<boolean>(false)

    // Document upload state
    const { mutate: uploadDoc, isPending: docUploadPending } = UploadPropertyDocument();
    const { data: docsData, refetch: refetchDocs } = GetPropertyDocuments(propertyData.id);
    const [documents, setDocuments] = useState<IPropertyDocument[]>([]);
    const [selectedDocType, setSelectedDocType] = useState<DocumentType>(DocumentType.UTILITY_BILL);

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries
    });

    if (loadError) {
        console.error("Google Maps load error:", loadError);
    }

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

    const formik = useFormik({
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
            bookingMode: (propertyData?.bookingMode ?? propertyData?.booking_mode ?? BookingMode.INSTANT) as BookingMode,
            amenities: propertyData?.amenities.map((el) => el.id),
            amenityNames: propertyData?.amenities.map((el) => el.name),
        },

        onSubmit: (values: any) => {
            const sortedAmenities = sortAmenities(availableAmenities, values.amenityNames)

            if (values.isFeatured !== propertyData.isFeatured)   // Update isFeatured if changed
                featureProperty({ propertyId: propertyData.id })

            const currentBookingMode = propertyData.bookingMode ?? propertyData.booking_mode ?? BookingMode.INSTANT;
            if (values.bookingMode !== currentBookingMode)
                updateBookingMode({ propertyId: propertyData.id, booking_mode: values.bookingMode })

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
                        if (uploadedMedia.length > 0) {
                            const formData = new FormData();
                            uploadedMedia.forEach(file => {
                                formData.append("media_file", file);
                            });
                            formData.append("media_type", MediaType.IMAGE);
                            formData.append("is_featured", "true");

                            uploadMedia({
                                propertyId: propertyData.id,
                                payload: formData,
                            });
                        }

                        toast.success('Property update successful', {
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
    });

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

    const removeParam = (param: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete(param);
        const newQueryString = params.toString();
        router.push(newQueryString ? `?${newQueryString}` : pathname, { scroll: false });
    };

    const handleDeleteImage = (id: string) => {
        dispatch(
            showAlert({
                title: "Are you sure?",
                description: `This action cannot be undone. This will permanently delete the image.`,
                confirmText: "Delete",
                cancelText: "Cancel",
                onConfirm: () => {
                    deleteMedia({
                        propertyId: propertyData.id,
                        mediaId: id
                    }, {
                        onSuccess: () => {
                            toast.success("Image deleted successfully");
                        },
                        onError: (error: any) => {
                            toast.error(error?.response?.data?.detail || "Failed to delete image");
                        }
                    });
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
            setMedia((prev) => [...prev, ...(Array.isArray(uploadData.data) ? uploadData.data.map(el => el?.data?.media_url || el?.data?.mediaUrl) : [uploadData.data?.data])]);
            if (uploadData.status === 201) {
                uploadRef.current.forEach(({ url }) => URL.revokeObjectURL(url));
                uploadRef.current = []
            }
        }
    }, [uploadData]);

    useEffect(() => {
        const docs = docsData?.data?.data?.data ?? docsData?.data?.data ?? [];
        if (Array.isArray(docs)) setDocuments(docs);
    }, [docsData]);

    return (
        <div className="relative">
            {/* Header Section - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-5 md:mb-6">
                <div className="space-y-0.5 sm:space-y-1">
                    <div className="flex items-center gap-2 mb-1 sm:mb-2">
                        <button
                            onClick={() => { removeParam('edit'); handleEditMode(false); }}
                            className="text-[10px] sm:text-xs font-bold text-primary hover:underline flex items-center gap-1 transition-all"
                        >
                            <FaArrowLeftLong className="text-[8px] sm:text-[10px]" /> Back
                        </button>
                    </div>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-zinc-900 tracking-tight">Edit {propertyData.name}</h2>
                    <p className="text-xs sm:text-sm font-medium text-zinc-500">Update property details</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
                    <button
                        onClick={handleDelete}
                        disabled={deleteIsPending}
                        className="p-1.5 sm:p-2 bg-red-50 text-red-500 rounded-lg sm:rounded-xl hover:bg-red-100 transition-colors"
                        title="Delete Property"
                    >
                        {deleteIsPending ? <Spinner /> : <Icon icon="solar:trash-bin-trash-bold-duotone" className="text-lg sm:text-xl" />}
                    </button>
                    <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg sm:rounded-xl">
                        <Icon icon="solar:pen-new-square-bold-duotone" className="text-lg sm:text-xl text-primary" />
                    </div>
                </div>
            </div>

            {showAmenityForm && (
                <CustomModal
                    title="Create Amenity"
                    onClose={() => setShowAmenityForm(false)}
                    isOpen={showAmenityForm}
                >
                    <CreateAmenityForm show={setShowAmenityForm} />
                </CustomModal>
            )}

            <form
                id="edit-property-form"
                className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5 lg:gap-6 items-start pb-10 sm:pb-12 md:pb-16 lg:pb-20"
                onSubmit={(e) => { e.preventDefault(); formik.handleSubmit(); }}
            >
                {/* Main Form Content - Left Side */}
                <div className="lg:col-span-8 space-y-4 md:space-y-5 lg:space-y-6">
                    {/* Basic Information Section */}
                    <div className="bg-white border border-zinc-200 rounded-xl md:rounded-2xl lg:rounded-3xl p-4 sm:p-5 md:p-6 lg:p-8 space-y-4 md:space-y-5 shadow-sm">
                        <h3 className="text-base sm:text-lg font-bold text-zinc-900 flex items-center gap-1.5">
                            <Icon icon="solar:info-circle-bold-duotone" className="text-lg sm:text-xl text-primary" />
                            Basic Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                            <div className="md:col-span-1 space-y-1.5">
                                <label htmlFor="name" className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Property Name</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary text-zinc-400">
                                        <FaRegBuilding className="text-sm sm:text-base" />
                                    </div>
                                    <input
                                        id="name"
                                        type="text"
                                        placeholder="Property name"
                                        value={formik.values.name}
                                        onChange={formik.handleChange}
                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl sm:rounded-2xl pl-9 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3.5 text-sm sm:text-base focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-1 space-y-1.5">
                                <label htmlFor="type" className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Property Type</label>
                                <CustomDropdown
                                    selected={formik.values.type}
                                    handleSelection={(val) => formik.setFieldValue("type", val)}
                                    options={Object.values(PropertyType)}
                                />
                            </div>
                            <div className="md:col-span-2 space-y-1.5">
                                <label htmlFor="description" className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Description</label>
                                <div className="relative">
                                    <textarea
                                        id="description"
                                        maxLength={300}
                                        rows={3}
                                        placeholder="Describe this property..."
                                        value={formik.values.description}
                                        onChange={formik.handleChange}
                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-sm sm:text-base focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium resize-none"
                                    />
                                    <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 text-[8px] sm:text-[10px] font-bold text-zinc-400 bg-white/80 px-1.5 py-0.5 rounded">
                                        {formik.values.description.length}/300
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Location Section */}
                    <div className="bg-white border border-zinc-200 rounded-xl md:rounded-2xl lg:rounded-3xl p-4 sm:p-5 md:p-6 lg:p-8 space-y-4 md:space-y-5 shadow-sm">
                        <h3 className="text-base sm:text-lg font-bold text-zinc-900 flex items-center gap-1.5">
                            <Icon icon="solar:map-point-bold-duotone" className="text-lg sm:text-xl text-primary" />
                            Location & Address
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                            <div className="md:col-span-3 space-y-1.5">
                                <label htmlFor="address" className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Physical Address</label>
                                <div className="space-y-3 sm:space-y-4">
                                    <AddressAutocomplete formik={formik} isLoaded={isLoaded} />

                                    {isLoaded && (
                                        <div className="w-full h-[200px] sm:h-[250px] md:h-[280px] lg:h-[300px] rounded-xl sm:rounded-2xl overflow-hidden border border-zinc-200">
                                            <GoogleMap
                                                mapContainerStyle={{ height: '100%', width: '100%' }}
                                                center={{ lat: formik.values.latitude || 6.5244, lng: formik.values.longitude || 3.3792 }}
                                                zoom={formik.values.latitude ? 15 : 12}
                                                onClick={(e: any) => {
                                                    if (e.latLng) {
                                                        formik.setFieldValue('latitude', e.latLng.lat());
                                                        formik.setFieldValue('longitude', e.latLng.lng());
                                                    }
                                                }}
                                            >
                                                {formik.values.latitude && formik.values.longitude && (
                                                    <Marker
                                                        position={{ lat: formik.values.latitude, lng: formik.values.longitude }}
                                                        draggable={true}
                                                        onDragEnd={(e: any) => {
                                                            if (e.latLng) {
                                                                formik.setFieldValue('latitude', e.latLng.lat());
                                                                formik.setFieldValue('longitude', e.latLng.lng());
                                                            }
                                                        }}
                                                    />
                                                )}
                                            </GoogleMap>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:col-span-3 gap-3 sm:gap-4">
                                <div className="space-y-1">
                                    <label htmlFor="latitude" className="text-[8px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Latitude</label>
                                    <input
                                        id="latitude"
                                        type="number"
                                        step="any"
                                        placeholder="0.0000"
                                        value={formik.values.latitude}
                                        onChange={formik.handleChange}
                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label htmlFor="longitude" className="text-[8px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Longitude</label>
                                    <input
                                        id="longitude"
                                        type="number"
                                        step="any"
                                        placeholder="0.0000"
                                        value={formik.values.longitude}
                                        onChange={formik.handleChange}
                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Country</label>
                                <CustomFilterDropdown
                                    placeholder={formik.values.country}
                                    options={Object.keys(ALL_COUNTRIES)}
                                    handleSelection={(val) => formik.setFieldValue("country", val)}
                                    selected={formik.values.country}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">State</label>
                                <CustomFilterDropdown
                                    placeholder="Lagos"
                                    options={Object.keys(ALL_COUNTRIES[formik.values.country] || {})}
                                    handleSelection={(val) => formik.setFieldValue("state", val)}
                                    selected={Object.keys(ALL_COUNTRIES[formik.values.country] || {})?.includes(formik.values.state) ? formik.values.state : ''}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">City</label>
                                <CustomFilterDropdown
                                    placeholder="Ikeja"
                                    options={ALL_COUNTRIES[formik.values.country]?.[formik.values.state] || []}
                                    handleSelection={(val) => formik.setFieldValue("city", val)}
                                    selected={ALL_COUNTRIES[formik.values.country]?.[formik.values.state]?.includes(formik.values.city) ? formik.values.city : ''}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Amenities & Features Section */}
                    <div className="bg-white border border-zinc-200 rounded-xl md:rounded-2xl lg:rounded-3xl p-4 sm:p-5 md:p-6 lg:p-8 space-y-4 md:space-y-5 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <h3 className="text-base sm:text-lg font-bold text-zinc-900 flex items-center gap-1.5">
                                <Icon icon="solar:star-bold-duotone" className="text-lg sm:text-xl text-primary" />
                                Amenities & Features
                            </h3>
                            {user?.role === UserRole.ADMIN && (
                                <button
                                    type="button"
                                    onClick={() => setShowAmenityForm(true)}
                                    className="text-[8px] sm:text-[10px] font-bold text-primary hover:text-primary/70 transition-colors flex items-center gap-1"
                                >
                                    <FaPlus className="text-[6px] sm:text-[8px]" /> ADD AMENITY
                                </button>
                            )}
                        </div>

                        <div className="bg-zinc-50/50 border border-zinc-100 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 space-y-4 sm:space-y-5">
                            <MultipleChoice
                                options={availableAmenities?.map(am => am.name) || []}
                                selected={formik.values.amenityNames}
                                onChange={(val) => formik.setFieldValue("amenityNames", [...val])}
                            />

                            <div className="pt-4 sm:pt-5 border-t border-zinc-100 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <CustomCheckbox
                                    label="Pets allowed"
                                    checked={formik.values.petsAllowed}
                                    onChange={(val) => formik.setFieldValue("petsAllowed", val)}
                                />
                                {user?.role === UserRole.ADMIN && (
                                    <CustomCheckbox
                                        label="Featured"
                                        checked={formik.values.isFeatured}
                                        onChange={(val) => formik.setFieldValue("isFeatured", val)}
                                    />
                                )}
                                {user?.role === UserRole.ADMIN && propertyData?.verifications?.[0]?.status === PropertyVerificationStatus.VERIFIED && (
                                    <CustomCheckbox
                                        label="Verified"
                                        checked={formik.values.isVerified}
                                        onChange={(val) => formik.setFieldValue("isVerified", val)}
                                    />
                                )}
                            </div>

                            {/* Booking Mode */}
                            <div className="pt-4 sm:pt-5 border-t border-zinc-100">
                                <h4 className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 sm:mb-3 flex items-center gap-1.5">
                                    <Icon icon="solar:calendar-mark-bold-duotone" className="text-sm sm:text-base text-primary" />
                                    Booking Mode
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                                    <button
                                        type="button"
                                        onClick={() => formik.setFieldValue("bookingMode", BookingMode.INSTANT)}
                                        className={`flex items-start gap-2 p-2.5 sm:p-3 rounded-lg sm:rounded-xl border-2 text-left transition-all ${formik.values.bookingMode === BookingMode.INSTANT ? 'border-primary bg-primary/5' : 'border-zinc-200 bg-white hover:border-zinc-300'}`}
                                    >
                                        <Icon icon="solar:bolt-bold-duotone" className={`text-lg sm:text-xl mt-0.5 flex-shrink-0 ${formik.values.bookingMode === BookingMode.INSTANT ? 'text-primary' : 'text-zinc-400'}`} />
                                        <div className="min-w-0">
                                            <p className={`text-xs sm:text-sm font-bold ${formik.values.bookingMode === BookingMode.INSTANT ? 'text-primary' : 'text-zinc-700'}`}>Instant Book</p>
                                            <p className="text-[8px] sm:text-[10px] text-zinc-500 mt-0.5 line-clamp-2">Guests book immediately.</p>
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => formik.setFieldValue("bookingMode", BookingMode.REQUEST_TO_BOOK)}
                                        className={`flex items-start gap-2 p-2.5 sm:p-3 rounded-lg sm:rounded-xl border-2 text-left transition-all ${formik.values.bookingMode === BookingMode.REQUEST_TO_BOOK ? 'border-primary bg-primary/5' : 'border-zinc-200 bg-white hover:border-zinc-300'}`}
                                    >
                                        <Icon icon="solar:hand-shake-bold-duotone" className={`text-lg sm:text-xl mt-0.5 flex-shrink-0 ${formik.values.bookingMode === BookingMode.REQUEST_TO_BOOK ? 'text-primary' : 'text-zinc-400'}`} />
                                        <div className="min-w-0">
                                            <p className={`text-xs sm:text-sm font-bold ${formik.values.bookingMode === BookingMode.REQUEST_TO_BOOK ? 'text-primary' : 'text-zinc-700'}`}>Request to Book</p>
                                            <p className="text-[8px] sm:text-[10px] text-zinc-500 mt-0.5 line-clamp-2">You approve requests.</p>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Media Section */}
                    <div className="bg-white border border-zinc-200 rounded-xl md:rounded-2xl lg:rounded-3xl p-4 sm:p-5 md:p-6 lg:p-8 space-y-4 md:space-y-5 shadow-sm">
                        <h3 className="text-base sm:text-lg font-bold text-zinc-900 flex items-center gap-1.5">
                            <Icon icon="solar:camera-bold-duotone" className="text-lg sm:text-xl text-primary" />
                            Property Gallery
                        </h3>

                        {/* Existing Media */}
                        {media.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-5">
                                {media.map((item) => (
                                    <div key={item.id} className="relative group aspect-square rounded-lg sm:rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200 shadow-sm">
                                        <Image
                                            src={item.media_url || item.mediaUrl || "/png/placeholder.png"}
                                            alt="Property"
                                            fill
                                            className="object-cover transition-transform group-hover:scale-105"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteImage(item.id)}
                                            className="absolute top-1 right-1 p-1 bg-red-500/90 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                                        >
                                            <Icon icon="solar:trash-bin-trash-bold" className="text-xs sm:text-sm" />
                                        </button>
                                        {item.isFeatured && (
                                            <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-primary text-[6px] sm:text-[8px] font-bold text-white rounded shadow-sm">FEATURED</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="w-full">
                            <CustomDropzone
                                onDrop={setUploadedMedia}
                                multiple
                                previewsRef={uploadRef}
                            />
                        </div>

                        {uploadedMedia.length > 0 && (
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
                                                toast.success('Media uploaded successfully', {
                                                    duration: 6000,
                                                    style: {
                                                        maxWidth: '500px',
                                                        width: 'max-content'
                                                    }
                                                }),
                                            onError: (error: any) =>
                                                toast.error(error.status === 422 ? 'Invalid format' : 'Upload failed', {
                                                    duration: 6000,
                                                    style: {
                                                        maxWidth: '500px',
                                                        width: 'max-content'
                                                    }
                                                }),
                                        }
                                    );
                                }}
                                className="w-full flex justify-center items-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 bg-zinc-900 hover:bg-zinc-800 text-white text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl mt-4 transition-all shadow-lg disabled:opacity-75"
                                disabled={uploadedMediaPending}
                            >
                                {uploadedMediaPending ? (
                                    <Spinner color="white" />
                                ) : (
                                    <>
                                        <Icon icon="solar:upload-bold-duotone" className="text-base sm:text-lg" />
                                        <span>UPLOAD {uploadedMedia.length} NEW IMAGE{uploadedMedia.length > 1 ? 'S' : ''}</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {/* Documents Section */}
                    <div className="bg-white border border-zinc-200 rounded-xl md:rounded-2xl lg:rounded-3xl p-4 sm:p-5 md:p-6 lg:p-8 space-y-4 md:space-y-5 shadow-sm">
                        <h3 className="text-base sm:text-lg font-bold text-zinc-900 flex items-center gap-1.5">
                            <Icon icon="solar:file-text-bold-duotone" className="text-lg sm:text-xl text-primary" />
                            Ownership Documents
                        </h3>
                        <p className="text-[10px] sm:text-xs text-zinc-500">Upload proof of ownership documents (PDF, JPG, PNG). These will be reviewed during verification.</p>

                        {/* Existing Documents */}
                        {documents.length > 0 && (
                            <div className="space-y-2">
                                {documents.map((doc) => (
                                    <div key={doc.id} className="flex items-center justify-between p-2.5 sm:p-3 bg-zinc-50 rounded-lg sm:rounded-xl border border-zinc-100 group">
                                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                            <Icon icon="solar:file-text-bold-duotone" className="text-base sm:text-lg text-primary flex-shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-xs sm:text-sm font-bold text-zinc-800 truncate">{(doc.document_type as string)?.replace(/_/g, ' ')}</p>
                                                <p className="text-[8px] sm:text-[10px] text-zinc-400 capitalize">{doc.status?.toLowerCase()}</p>
                                            </div>
                                        </div>
                                        <a href={doc.document_url} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-500 flex-shrink-0">
                                            <Icon icon="solar:eye-bold-duotone" className="text-sm sm:text-base" />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Upload New Document */}
                        <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t border-zinc-100">
                            <div className="space-y-1.5">
                                <label className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Document Type</label>
                                <CustomDropdown
                                    selected={selectedDocType}
                                    options={Object.values(DocumentType)}
                                    handleSelection={(val) => setSelectedDocType(val as DocumentType)}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1 mb-1.5 block">Select File</label>
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const formData = new FormData();
                                            formData.append('document_file', file);
                                            formData.append('document_type', selectedDocType);
                                            uploadDoc({
                                                propertyId: propertyData.id,
                                                payload: formData
                                            }, {
                                                onSuccess: () => {
                                                    toast.success('Document uploaded successfully');
                                                    refetchDocs();
                                                },
                                                onError: (err: any) => {
                                                    toast.error(err?.response?.data?.detail || 'Document upload failed');
                                                }
                                            });
                                            e.target.value = '';
                                        }
                                    }}
                                    disabled={docUploadPending}
                                    className="w-full text-xs sm:text-sm file:mr-3 sm:file:mr-4 file:py-1.5 sm:file:py-2 file:px-3 sm:file:px-4 file:rounded-lg sm:file:rounded-xl file:border-0 file:text-xs sm:file:text-sm file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 file:cursor-pointer cursor-pointer disabled:opacity-50"
                                />
                                {docUploadPending && (
                                    <div className="flex items-center gap-2 mt-2 text-xs text-zinc-500">
                                        <Spinner /> Uploading document...
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Sticky Content - Right Side */}
                <div className="lg:col-span-4 space-y-4 md:space-y-5 sticky top-4 sm:top-6">
                    {/* Management Notice Card */}
                    <div className="bg-zinc-900 rounded-xl md:rounded-2xl lg:rounded-3xl p-4 sm:p-5 md:p-6 text-white shadow-xl shadow-zinc-900/20 relative overflow-hidden border border-zinc-800">
                        <div className="absolute top-0 right-0 w-40 sm:w-48 md:w-56 lg:w-64 h-40 sm:h-48 md:h-56 lg:h-64 bg-primary/5 rounded-full blur-[60px] sm:blur-[80px] -mr-16 sm:-mr-20 lg:-mr-24 -mt-16 sm:-mt-20 lg:-mt-24" />
                        <h3 className="text-base sm:text-lg font-bold mb-3 flex items-center gap-1.5 relative z-10">
                            <Icon icon="solar:settings-bold-duotone" className="text-lg sm:text-xl text-primary" />
                            Management
                        </h3>
                        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mb-4 sm:mb-5 relative z-10">
                            Keep property information accurate.
                        </p>
                        <div className="p-3 sm:p-4 bg-white/5 rounded-lg sm:rounded-xl border border-white/5 relative z-10">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-primary/20 rounded-lg sm:rounded-xl flex items-center justify-center text-primary flex-shrink-0">
                                    <Icon icon="solar:info-circle-bold-duotone" className="text-base sm:text-lg md:text-xl" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[8px] sm:text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Ownership</p>
                                    <p className="text-xs sm:text-sm font-bold text-white truncate">
                                        {propertyData.owner?.profile?.firstName} {propertyData.owner?.profile?.lastName}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="bg-white border border-zinc-200 rounded-xl md:rounded-2xl lg:rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
                        <button
                            form="edit-property-form"
                            type="submit"
                            disabled={isPending || uploadedMediaPending}
                            className="w-full h-10 sm:h-12 bg-primary text-white text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl hover:bg-primary/90 hover:shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                            {isPending ? <Spinner /> : <><Icon icon="solar:check-read-bold" className="text-sm sm:text-base" /> SAVE</>}
                        </button>

                        <button
                            type="button"
                            onClick={() => { removeParam('edit'); handleEditMode(false); }}
                            className="w-full h-9 sm:h-10 border border-zinc-200 text-zinc-600 text-[10px] sm:text-xs font-bold rounded-lg sm:rounded-xl hover:bg-zinc-50 transition-all uppercase tracking-wider flex items-center justify-center"
                        >
                            CANCEL
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
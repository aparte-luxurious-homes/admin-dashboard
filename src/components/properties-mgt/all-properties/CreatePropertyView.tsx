'use client'

import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { FaRegBuilding } from "react-icons/fa";
import { SlLocationPin } from "react-icons/sl";
import CustomDropdown from "../../ui/customDropdown";
import { IAmenity, ICreateProperty, MediaType, PropertyType } from "../types";
import CustomFilterDropdown from "../../ui/customFilterDropDown";
import CustomCheckbox from "../../ui/customCheckbox";
import MultipleChoice from "../../ui/MultipleChoice";
import { ALL_COUNTRIES } from "@/src/data/countries";
import { FaPlus, FaMapLocationDot, FaArrowLeftLong } from "react-icons/fa6";
import CustomDropzone from "../../ui/CustomDropzone";
import { useFormik } from 'formik';
import { CreateAmenity, CreateProperty, UploadPropertyMedia } from "@/src/lib/request-handlers/propertyMgt";
import { useAuth } from "@/src/hooks/useAuth";
import Spinner from "../../ui/Spinner";
import { GetAmenities, GetSingleProperty } from "@/src/lib/request-handlers/propertyMgt";
import { GetAllUsers } from "@/src/lib/request-handlers/userMgt";
import AdjustableFilterDropdown from "../../ui/AdjustableFilterDropdown";
import { fixedAmenities } from "@/src/data/amenities";
import CustomModal from "../../ui/CustomModal";
import { UserRole } from "@/src/lib/enums";
import { useRouter } from "next/navigation";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import toast from "react-hot-toast";
import { Icon } from "@iconify/react";
import Link from "next/link";
import axios from "axios";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete";
const libraries: any = ["places"];


export function CreateAmenityForm({ show }: { show: Dispatch<SetStateAction<boolean>> }) {
    const [name, setName] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const { mutate, isPending } = CreateAmenity();

    const handleCreate = () => {
        if (!name.trim()) {
            setError("Amenity name cannot be empty.");
            return;
        }
        setError(null);
        mutate(
            { name },
            {
                onSuccess: () => {
                    toast.success('Amenity created successfully', {
                        duration: 6000,
                        style: {
                            maxWidth: '500px',
                            width: 'max-content'
                        }
                    }),
                        show(false);
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
        );
    };

    return (
        <div className="py-3 px-1 w-full">
            <input
                id="name"
                type="text"
                placeholder="E.g GYM"
                value={name}
                onChange={e => {
                    setName(e.target.value.toUpperCase());
                    if (error) setError(null); // Clear error when user types
                }}
                className="w-full border border-zinc-400 rounded-lg p-3 text-lg"
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            <div className="flex justify-end mt-6">
                <button
                    onClick={handleCreate}
                    disabled={isPending}
                    className="cursor-pointer border border-primary rounded-lg px-5 py-1.5 text-lg font-medium text-primary hover:bg-primary/90 hover:text-white disabled:hover:bg-white disabled:opacity-75 disabled:cursor-not-allowed"
                >
                    {isPending ? <Spinner /> : "Create"}
                </button>
            </div>
        </div>
    );
}

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

            results[0].address_components.forEach(component => {
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
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary text-zinc-400 z-10">
                <SlLocationPin className="text-lg" />
            </div>
            <input
                value={value}
                onChange={handleInput}
                disabled={!ready || !isLoaded}
                placeholder="Search for an address..."
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
            />
            {status === "OK" && (
                <ul className="absolute z-50 w-full bg-white border border-zinc-200 rounded-xl mt-1 shadow-lg max-h-60 overflow-auto">
                    {data.map(({ place_id, description }) => (
                        <li
                            key={place_id}
                            onClick={() => handleSelect(description)}
                            className="px-4 py-3 hover:bg-zinc-50 cursor-pointer text-sm font-medium border-b border-zinc-100 last:border-0"
                        >
                            {description}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}


export default function CreatePropertyView({ }) {
    const { user } = useAuth();
    const router = useRouter();
    const { mutate, isPending } = CreateProperty();
    const { data: fetchedAmenites } = GetAmenities();
    const { mutate: uploadMedia } = UploadPropertyMedia();

    const { data: userList, isLoading: usersLoading } = GetAllUsers(1, 100, '');
    const [availableAmenities, setAvailableAmenities] = useState<IAmenity[]>(fixedAmenities);
    const [uploadedMedia, setUploadedMedia] = useState<File[]>([]);
    const uploadRef = useRef<{ url: string; file: File }[]>([]);
    const [showAmenityForm, setShowAmenityForm] = useState<boolean>(false)
    const [isNewOwner, setIsNewOwner] = useState<boolean>(true);
    const [selectedOwner, setSelectedOwner] = useState<any | null>(null);
    const [ownerSearchTerm, setOwnerSearchTerm] = useState<string>('');

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries
    });

    const sortAmenities = (amenities: IAmenity[] = [], newAmeities: string[] = []): number[] => {
        const sortedAmenities: number[] = []
        const safeAmenities = Array.isArray(amenities) ? amenities : [];
        const safeNew = Array.isArray(newAmeities) ? newAmeities : [];
        const prevAmenityNames = safeAmenities.map((a) => a.name);
        for (const amenity of safeNew) {
            if (prevAmenityNames.includes(amenity)) {
                const pos = prevAmenityNames.indexOf(amenity)
                sortedAmenities.push(safeAmenities[pos].id)
            }
        }

        return sortedAmenities;
    }

    useEffect(() => {
        setAvailableAmenities(fetchedAmenites?.data?.data ?? fixedAmenities)
    }, [fetchedAmenites])

    const formik =
        useFormik({
            initialValues: {
                name: "",
                address: "",
                property_type: PropertyType.DUPLEX,
                country: "Nigeria",
                state: "Lagos",
                city: "Ikeja",
                description: "",
                latitude: 0,
                longitude: 0,
                // kyc_id: 0,
                ownerId: 0,
                owner_name: "",
                owner_email: "",
                is_pet_allowed: false,
                amenities: [],
                amenityIds: [],
            },

            onSubmit: (values) => {
                const sortedAmenities = sortAmenities(availableAmenities, values.amenities);

                const payload: ICreateProperty = {
                    ...values,
                    amenities: sortedAmenities,
                }

                mutate({
                    payload
                },
                    {
                        onSuccess: (response) => {
                            const propertyId = response?.data?.data?.id
                            const formData = new FormData();

                            if (propertyId) {

                                if (uploadedMedia.length > 0) {
                                    uploadedMedia?.forEach(file => {
                                        formData.append("media_file", file);
                                    });

                                    formData.append("media_type", MediaType.IMAGE);
                                    formData.append("is_featured", "true");

                                    uploadMedia(
                                        {
                                            propertyId,
                                            payload: formData,
                                        },
                                        {
                                            onError: (error: any) =>
                                                toast.error(error.status === 422 ? 'Invalid media file format' : 'Media upload failed', {
                                                    duration: 6000,
                                                    style: {
                                                        maxWidth: '500px',
                                                        width: 'max-content'
                                                    }
                                                }),
                                        },
                                    );
                                }

                                toast.success('Property created successfully', {
                                    duration: 6000,
                                    style: {
                                        maxWidth: '500px',
                                        width: 'max-content'
                                    }
                                }),

                                    router.push(PAGE_ROUTES.dashboard.propertyManagement.allProperties.details(propertyId))
                            }
                        },
                        onError: (error: any) =>
                            toast.error(error?.response?.data?.detail || error?.response?.data?.message || 'Something went wrong', {
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
        // This is kept for backward compatibility if needed, but the map/autocomplete should handle this now
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


    return (
        <div className="relative">
            {/* Header section refined */}
            <div className="flex items-center justify-between mb-8">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Link href={PAGE_ROUTES.dashboard.propertyManagement.allProperties.base} className="text-xs font-bold text-primary hover:underline flex items-center gap-1 transition-all">
                            <FaArrowLeftLong className="text-[10px]" /> Back to Properties
                        </Link>
                    </div>
                    <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Create New Property</h2>
                    <p className="text-sm font-medium text-zinc-500">Define the core identity and location of your new property listing</p>
                </div>
                <div className="p-2.5 bg-primary/10 rounded-xl">
                    <Icon icon="solar:home-add-bold-duotone" className="text-2xl text-primary" />
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
                id="create-property-form"
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
                                <label htmlFor="property_type" className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Property Type</label>
                                <CustomDropdown
                                    selected={formik.values.property_type}
                                    handleSelection={(val) => formik.setFieldValue("property_type", val)}
                                    options={Object.values(PropertyType)}
                                />
                            </div>
                            {(user?.role === UserRole.ADMIN || user?.role === UserRole.AGENT) && (
                                <div className="md:col-span-2 space-y-4 pt-4 border-t border-zinc-100 mt-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Owner Assignment</h4>
                                        <div className="flex items-center gap-2 p-1 bg-zinc-100 rounded-xl w-fit">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsNewOwner(false);
                                                    formik.setFieldValue('owner_email', '');
                                                    formik.setFieldValue('owner_name', '');
                                                }}
                                                className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all ${!isNewOwner ? 'bg-white shadow-sm text-primary' : 'text-zinc-500 hover:text-zinc-700'}`}
                                            >
                                                EXISTING OWNER
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsNewOwner(true);
                                                    setSelectedOwner(null);
                                                    formik.setFieldValue('ownerId', 0);
                                                }}
                                                className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all ${isNewOwner ? 'bg-white shadow-sm text-primary' : 'text-zinc-500 hover:text-zinc-700'}`}
                                            >
                                                ONBOARD NEW
                                            </button>
                                        </div>
                                    </div>

                                    {!isNewOwner ? (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Search Existing Owner</label>
                                            <AdjustableFilterDropdown
                                                placeholder="Search by name or email..."
                                                options={(userList?.data?.data?.data ?? userList?.data?.data?.items ?? [])?.filter((u: any) => u.role === UserRole.OWNER)?.map((u: any) => u.email).filter(Boolean) ?? []}
                                                handleSelection={(val) => {
                                                    const users = (userList?.data?.data?.data ?? userList?.data?.data?.items ?? []);
                                                    const selected = users.find((u: any) => u.email === val);
                                                    setOwnerSearchTerm(val);
                                                    setSelectedOwner(selected);
                                                    formik.setFieldValue('ownerId', selected?.id);
                                                }}
                                                searchTerm={ownerSearchTerm}
                                                setSearchTerm={setOwnerSearchTerm}
                                                isLoading={usersLoading}
                                            />
                                            {selectedOwner && (
                                                <div className="mt-3 p-3 bg-primary/5 rounded-2xl border border-primary/10 flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                                                        <Icon icon="mdi:account-check" className="text-xl" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-zinc-900">{selectedOwner.profile?.firstName ?? 'Owner'} {selectedOwner.profile?.lastName ?? ''}</p>
                                                        <p className="text-[10px] font-medium text-zinc-500">{selectedOwner.email}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="space-y-2">
                                                <label htmlFor="owner_name" className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Owner Full Name</label>
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary text-zinc-400">
                                                        <Icon icon="mdi:account-box-outline" />
                                                    </div>
                                                    <input
                                                        id="owner_name"
                                                        type="text"
                                                        placeholder="e.g. Jane Doe"
                                                        value={formik.values.owner_name}
                                                        onChange={formik.handleChange}
                                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label htmlFor="owner_email" className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Owner Email Address</label>
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary text-zinc-400">
                                                        <Icon icon="mdi:email-outline" />
                                                    </div>
                                                    <input
                                                        id="owner_email"
                                                        type="email"
                                                        placeholder="e.g. jane@example.com"
                                                        value={formik.values.owner_email}
                                                        onChange={formik.handleChange}
                                                        className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
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
                                <div className="space-y-4">
                                    <AddressAutocomplete
                                        formik={formik}
                                        isLoaded={isLoaded}
                                    />

                                    {isLoaded && (
                                        <div className="w-full h-[300px] rounded-2xl overflow-hidden border border-zinc-200">
                                            <GoogleMap
                                                mapContainerStyle={{ height: '100%', width: '100%' }}
                                                center={{ lat: formik.values.latitude || 6.5244, lng: formik.values.longitude || 3.3792 }}
                                                zoom={formik.values.latitude ? 15 : 12}
                                                onClick={(e) => {
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
                                                        onDragEnd={(e) => {
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
                                    options={ALL_COUNTRIES[formik.values.country] ? Object.keys(ALL_COUNTRIES[formik.values.country]) : []}
                                    handleSelection={(val) => formik.setFieldValue("state", val)}
                                    selected={ALL_COUNTRIES[formik.values.country] && Object.keys(ALL_COUNTRIES[formik.values.country])?.includes(formik.values.state) ? formik.values.state : ''}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">City</label>
                                <CustomFilterDropdown
                                    placeholder={`E.g. Ikeja`}
                                    options={(ALL_COUNTRIES[formik.values.country] && ALL_COUNTRIES[formik.values.country][formik.values.state]) ? ALL_COUNTRIES[formik.values.country][formik.values.state] : []}
                                    handleSelection={(val) => formik.setFieldValue("city", val)}
                                    selected={(ALL_COUNTRIES[formik.values.country] && ALL_COUNTRIES[formik.values.country][formik.values.state])?.includes(formik.values.city) ? formik.values.city : ''}
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
                                selected={formik.values.amenities}
                                onChange={(val) => {
                                    formik.setFieldValue("amenities", [...val]);
                                }}
                            />

                            <div className="pt-6 border-t border-zinc-100">
                                <CustomCheckbox
                                    label="Pets are allowed in this property"
                                    checked={formik.values.is_pet_allowed}
                                    onChange={(val) => formik.setFieldValue("is_pet_allowed", val)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Media Section */}
                    <div className="bg-white border border-zinc-200 rounded-3xl p-8 space-y-6 shadow-sm">
                        <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                            <Icon icon="solar:camera-bold-duotone" className="text-xl text-primary" />
                            Property Gallery
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
                    {/* Info Card */}
                    <div className="bg-zinc-900 rounded-[2.5rem] p-8 text-white shadow-xl shadow-zinc-900/20 relative overflow-hidden group border border-zinc-800">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32" />
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 relative z-10">
                            <Icon icon="solar:shield-check-bold-duotone" className="text-xl text-primary" />
                            Listing Notice
                        </h3>
                        <p className="text-sm text-zinc-400 leading-relaxed mb-6 relative z-10">
                            Listing a new property will require a verification process by an assigned agent before it becomes publicly available to guests.
                        </p>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
                                    <Icon icon="solar:bell-bing-bold-duotone" className="text-xl" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Verification Status</p>
                                    <p className="text-xs font-bold text-white">Pending Creation</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Static Action Buttons Card */}
                    <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-4">
                        <button
                            form="create-property-form"
                            type="submit"
                            disabled={isPending}
                            className="w-full h-14 bg-primary text-white text-sm font-bold rounded-2xl hover:bg-primary/90 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isPending ? <Spinner /> : <><Icon icon="solar:check-read-bold" className="text-lg" /> CREATE PROPERTY</>}
                        </button>

                        <Link
                            href={PAGE_ROUTES.dashboard.propertyManagement.allProperties.base}
                            className="w-full h-12 border border-zinc-200 text-zinc-600 text-[11px] font-bold rounded-xl hover:bg-zinc-50 transition-all uppercase tracking-wider flex items-center justify-center"
                        >
                            CANCEL
                        </Link>
                    </div>
                </div>
            </form >
        </div >
    );
}
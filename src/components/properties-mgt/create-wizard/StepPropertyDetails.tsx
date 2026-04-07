'use client';

import { useState } from 'react';
import { useFormik } from 'formik';
import { Icon } from '@iconify/react';
import { FaRegBuilding } from 'react-icons/fa';
import { SlLocationPin } from 'react-icons/sl';
import { FaPlus } from 'react-icons/fa6';
import { GoogleMap, Marker } from '@react-google-maps/api';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';
import CustomDropdown from '@/components/ui/customDropdown';
import CustomFilterDropdown from '@/components/ui/customFilterDropDown';
import AdjustableFilterDropdown from '@/components/ui/AdjustableFilterDropdown';
import CustomCheckbox from '@/components/ui/customCheckbox';
import MultipleChoice from '@/components/ui/MultipleChoice';
import CustomModal from '@/components/ui/CustomModal';
import { ALL_COUNTRIES } from '@/src/data/countries';
import { CreateAmenityForm } from '../all-properties/CreatePropertyView';
import { GetAllUsers } from '@/src/lib/request-handlers/userMgt';
import { UserRole } from '@/src/lib/enums';
import { IAmenity, PropertyType } from '../types';
import { PropertyFormValues } from './types';

interface StepPropertyDetailsProps {
    formik: ReturnType<typeof useFormik<PropertyFormValues>>;
    availableAmenities: IAmenity[];
    userRole?: string;
    isLoaded: boolean;
}

function AddressAutocomplete({ formik, isLoaded }: { formik: ReturnType<typeof useFormik<PropertyFormValues>>; isLoaded: boolean }) {
    const {
        ready,
        value,
        suggestions: { status, data },
        setValue,
        clearSuggestions,
    } = usePlacesAutocomplete({
        requestOptions: {
            componentRestrictions: { country: 'ng' },
        },
        debounce: 300,
        defaultValue: formik.values.address,
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
            console.error('Error geocoding selection:', error);
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
                disabled={!isLoaded}
                placeholder={isLoaded ? 'Search for an address...' : 'Loading Map API...'}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium"
            />
            {status === 'OK' && (
                <ul className="absolute z-50 w-full bg-white border border-zinc-200 rounded-xl mt-1 shadow-lg max-h-60 overflow-auto">
                    {(data as any[]).map(({ place_id, description }: { place_id: string; description: string }) => (
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

export default function StepPropertyDetails({ formik, availableAmenities, userRole, isLoaded }: StepPropertyDetailsProps) {
    const [isNewOwner, setIsNewOwner] = useState<boolean>(true);
    const [selectedOwner, setSelectedOwner] = useState<any | null>(null);
    const [ownerSearchTerm, setOwnerSearchTerm] = useState<string>('');
    const [showAmenityModal, setShowAmenityModal] = useState<boolean>(false);

    const showOwnerSection =
        userRole === UserRole.ADMIN ||
        userRole === UserRole.SUPER_ADMIN ||
        userRole === UserRole.AGENT;

    const { data: userList, isLoading: usersLoading } = GetAllUsers(1, 100, ownerSearchTerm, UserRole.OWNER);

    const handleMapClick = async (e: any) => {
        if (e.latLng) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            formik.setFieldValue('latitude', lat);
            formik.setFieldValue('longitude', lng);

            try {
                const results = await getGeocode({ location: { lat, lng } });
                if (results[0]) {
                    formik.setFieldValue('address', results[0].formatted_address);
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
                }
            } catch (error) {
                console.error('Reverse geocoding failed:', error);
            }
        }
    };

    const handleMarkerDragEnd = async (e: any) => {
        if (e.latLng) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            formik.setFieldValue('latitude', lat);
            formik.setFieldValue('longitude', lng);

            try {
                const results = await getGeocode({ location: { lat, lng } });
                if (results[0]) {
                    formik.setFieldValue('address', results[0].formatted_address);
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
                }
            } catch (error) {
                console.error('Reverse geocoding failed:', error);
            }
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {showAmenityModal && (
                <CustomModal
                    title="Create Amenity"
                    onClose={() => setShowAmenityModal(false)}
                    isOpen={showAmenityModal}
                >
                    <CreateAmenityForm show={setShowAmenityModal} />
                </CustomModal>
            )}

            {/* Basic Information */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
                <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                    <Icon icon="solar:info-circle-bold-duotone" className="text-xl text-primary" />
                    Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label htmlFor="name" className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">
                            Property Name <span className="text-primary">*</span>
                        </label>
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
                    <div className="space-y-2">
                        <label htmlFor="property_type" className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">
                            Property Type <span className="text-primary">*</span>
                        </label>
                        <CustomDropdown
                            selected={formik.values.property_type}
                            handleSelection={(val) => formik.setFieldValue('property_type', val)}
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

            {/* Owner Assignment */}
            {showOwnerSection && (
                <div className="bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                            <Icon icon="solar:user-bold-duotone" className="text-xl text-primary" />
                            Owner Assignment
                        </h3>
                        <div className="flex items-center gap-2 p-1 bg-zinc-100 rounded-xl w-fit">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsNewOwner(false);
                                    formik.setFieldValue('owner_email', '');
                                    formik.setFieldValue('owner_name', '');
                                }}
                                className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                                    !isNewOwner ? 'bg-white shadow-sm text-primary' : 'text-zinc-500 hover:text-zinc-700'
                                }`}
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
                                className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                                    isNewOwner ? 'bg-white shadow-sm text-primary' : 'text-zinc-500 hover:text-zinc-700'
                                }`}
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
                                options={(userList?.data?.data?.data ?? userList?.data?.data?.items ?? [])?.map((u: any) => u.email).filter(Boolean) ?? []}
                                handleSelection={(val) => {
                                    const users = userList?.data?.data?.data ?? userList?.data?.data?.items ?? [];
                                    const selected = users.find((u: any) => u.email === val);
                                    setOwnerSearchTerm(selected?.email || val);
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
                                        <p className="text-xs font-bold text-zinc-900">
                                            {selectedOwner.profile?.firstName ?? 'Owner'} {selectedOwner.profile?.lastName ?? ''}
                                        </p>
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

            {/* Location & Address */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
                <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                    <Icon icon="solar:map-point-bold-duotone" className="text-xl text-primary" />
                    Location & Address
                </h3>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="address" className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">
                            Physical Address <span className="text-primary">*</span>
                        </label>
                        <AddressAutocomplete formik={formik} isLoaded={isLoaded} />
                    </div>

                    {isLoaded && (
                        <div className="w-full h-[300px] rounded-2xl overflow-hidden border border-zinc-200">
                            <GoogleMap
                                mapContainerStyle={{ height: '100%', width: '100%' }}
                                center={{
                                    lat: formik.values.latitude || 6.5244,
                                    lng: formik.values.longitude || 3.3792,
                                }}
                                zoom={formik.values.latitude ? 15 : 12}
                                onClick={handleMapClick}
                            >
                                {formik.values.latitude && formik.values.longitude && (
                                    <Marker
                                        position={{
                                            lat: formik.values.latitude,
                                            lng: formik.values.longitude,
                                        }}
                                        draggable={true}
                                        onDragEnd={handleMarkerDragEnd}
                                    />
                                )}
                            </GoogleMap>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label htmlFor="latitude" className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Latitude</label>
                            <input
                                id="latitude"
                                type="number"
                                step="any"
                                placeholder="0.0000"
                                value={formik.values.latitude ?? ''}
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
                                value={formik.values.longitude ?? ''}
                                onChange={formik.handleChange}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-xs"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">
                                Country <span className="text-primary">*</span>
                            </label>
                            <CustomFilterDropdown
                                placeholder={`E.g. ${formik.values.country}`}
                                options={Object.keys(ALL_COUNTRIES)}
                                handleSelection={(val) => formik.setFieldValue('country', val)}
                                selected={formik.values.country}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">
                                State <span className="text-primary">*</span>
                            </label>
                            <CustomFilterDropdown
                                placeholder="E.g. Lagos"
                                options={
                                    ALL_COUNTRIES[formik.values.country]
                                        ? Object.keys(ALL_COUNTRIES[formik.values.country])
                                        : []
                                }
                                handleSelection={(val) => formik.setFieldValue('state', val)}
                                selected={
                                    ALL_COUNTRIES[formik.values.country] &&
                                    Object.keys(ALL_COUNTRIES[formik.values.country])?.includes(formik.values.state)
                                        ? formik.values.state
                                        : ''
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">
                                City <span className="text-primary">*</span>
                            </label>
                            <CustomFilterDropdown
                                placeholder="E.g. Ikeja"
                                options={
                                    ALL_COUNTRIES[formik.values.country] &&
                                    ALL_COUNTRIES[formik.values.country][formik.values.state]
                                        ? ALL_COUNTRIES[formik.values.country][formik.values.state]
                                        : []
                                }
                                handleSelection={(val) => formik.setFieldValue('city', val)}
                                selected={
                                    (ALL_COUNTRIES[formik.values.country] &&
                                        ALL_COUNTRIES[formik.values.country][formik.values.state])?.includes(formik.values.city)
                                        ? formik.values.city
                                        : ''
                                }
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Amenities & Features */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                        <Icon icon="solar:star-bold-duotone" className="text-xl text-primary" />
                        Amenities & Features
                    </h3>
                    {(userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN) && (
                        <button
                            type="button"
                            onClick={() => setShowAmenityModal(true)}
                            className="text-[10px] font-bold text-primary hover:text-primary/70 transition-colors flex items-center gap-1"
                        >
                            <FaPlus className="text-[8px]" /> ADD CUSTOM AMENITY
                        </button>
                    )}
                </div>

                <div className="bg-zinc-50/50 border border-zinc-100 rounded-2xl p-6 space-y-6">
                    <MultipleChoice
                        options={availableAmenities?.map((am) => am.name) ?? []}
                        selected={formik.values.amenities}
                        onChange={(val) => {
                            formik.setFieldValue('amenities', [...val]);
                        }}
                    />

                    <div className="pt-6 border-t border-zinc-100">
                        <CustomCheckbox
                            label="Pets are allowed in this property"
                            checked={formik.values.is_pet_allowed}
                            onChange={(val) => formik.setFieldValue('is_pet_allowed', val)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

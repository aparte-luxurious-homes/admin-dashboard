'use client'

import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { FaRegBuilding } from "react-icons/fa";
import { FaMapLocationDot } from "react-icons/fa6";
import { SlLocationPin } from "react-icons/sl";
import CustomDropdown from "../../ui/customDropdown";
import { IAmenity, ICreateProperty, MediaType, PropertyType } from "../types";
import CustomFilterDropdown from "../../ui/customFilterDropDown";
import CustomCheckbox from "../../ui/customCheckbox";
import MultipleChoice from "../../ui/MultipleChoice";
import { ALL_COUNTRIES } from "@/src/data/countries";
import { FaPlus } from "react-icons/fa6";
import CustomDropzone from "../../ui/CustomDropzone";
import { useFormik } from 'formik';
import { CreateAmenity, CreateProperty, UploadPropertyMedia } from "@/src/lib/request-handlers/propertyMgt";
import { useAuth } from "@/src/hooks/useAuth";
import Spinner from "../../ui/Spinner";
import { GetAmenities } from "@/src/lib/request-handlers/propertyMgt";
import { fixedAmenities } from "@/src/data/amenities";
import CustomModal from "../../ui/CustomModal";
import { UserRole } from "@/src/lib/enums";
import { useRouter } from "next/navigation";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";
import toast from "react-hot-toast";


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


export default function CreatePropertyView({}) {
    const { user } = useAuth();
    const router = useRouter();
    const { mutate, isPending } = CreateProperty();
    const { data: fetchedAmenites } = GetAmenities();
    const { mutate: uploadMedia } = UploadPropertyMedia();

    const [availableAmenities, setAvailableAmenities] = useState<IAmenity[]>(fixedAmenities);
    const [uploadedMedia, setUploadedMedia] = useState<File[]>([]);
    const uploadRef = useRef<{ url: string; file: File }[]>([]);
    const [showAmenityForm, setShowAmenityForm] = useState<boolean>(false)

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
                address:  "",
                property_type: PropertyType.DUPLEX,
                country: "Nigeria",
                state: "Lagos",
                city: "Ikeja",
                description: "",
                latitude: 0,
                longitude: 0,
                // kyc_id: 0,
                ownerId: 0,
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


    return (
        <div className="p-10 w-full">
            <div className="w-full border border-zinc-500/20 bg-white rounded-xl p-10 min-h-[50vh]">
                <>
                    <div className="my-5">
                        <p className="text-[2rem]">
                            Create new property
                        </p>
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

                    <form className="my-6">
                        <div className="grid grid-cols-3 grid-flow-row gap-x-8 gap-y-5">
                            <div className="col-span-2 relative">
                                <label htmlFor="name" className="text-lg zinc-900 font-medium">Name</label>
                                <div className="relative mt-2">
                                    <FaRegBuilding className="absolute top-[35%] left-3 text-zinc-400"/>
                                    <input
                                        id="name"
                                        type="text" 
                                        placeholder="Magodo Crystal Springs Hotel and Resort"
                                        value={formik.values.name}
                                        onChange={formik.handleChange}
                                        className="w-full border border-zinc-400 rounded-lg pl-10 pr-3 py-5 h-14 text-lg"
                                    />
                                </div>
                            </div>
                            <div className="col-span-1 relative">
                                <label htmlFor="type" className="text-lg zinc-900 font-medium">Type</label>
                                <CustomDropdown
                                    selected={formik.values.property_type}
                                    handleSelection={(val) => formik.setFieldValue("property_type", val)}
                                    options={Object.values(PropertyType)}
                                />
                            </div>
                            <div className="col-span-3 flex gap-5 justify-between items-end">
                                <div className="relative w-full">
                                    <label htmlFor="address" className="text-lg zinc-900 font-medium">Address</label>
                                    <div className="reative mt-2">
                                        <SlLocationPin className="absolute top-[57%] left-3 text-zinc-500/90 text-xl"/>
                                        <input
                                            id="address"
                                            type="text" 
                                            placeholder="Magodo Crystal Springs Hotel and Resort"
                                            value={formik.values.address}
                                            onChange={formik.handleChange}
                                            className="w-full border border-zinc-400 rounded-lg pl-10 pr-3 py-5 h-14 text-lg"
                                        />
                                    </div>
                                </div>
                                <div className="cursor-pointer bg-primary/90 rounded-md size-14 flex justify-center items-center hover:bg-primary ease-in-out duration-200">
                                    <FaMapLocationDot className="text-zinc-100 text-xl"/>
                                </div>
                            </div>
                            <div className="col-span-1 relative">
                                <label htmlFor="country" className="text-lg zinc-900 font-medium">Country</label>
                                <CustomFilterDropdown
                                    placeholder={`E.g. ${formik.values.country}`}
                                    options={Object.keys(ALL_COUNTRIES)} 
                                    handleSelection={(val) => formik.setFieldValue("country", val)}
                                    selected={formik.values.country}
                                />
                            </div>
                            <div className="col-span-1 relative">
                                <label htmlFor="state" className="text-lg zinc-900 font-medium">State</label>
                                <CustomFilterDropdown
                                    placeholder={`E.g. ${formik.values.state}`} 
                                    options={Object.keys(ALL_COUNTRIES[formik.values.country])} 
                                    handleSelection={(val) => formik.setFieldValue("state", val)}
                                    selected={Object.keys(ALL_COUNTRIES[formik.values.country])?.includes(formik.values.state) ? formik.values.state : ''}
                                />
                            </div>
                            <div className="col-span-1 relative">
                                <label htmlFor="city" className="text-lg zinc-900 font-medium">City</label>
                                <CustomFilterDropdown
                                    placeholder={`E.g. ${formik.values.city}`} 
                                    options={ALL_COUNTRIES[formik.values.country][formik.values.state]} 
                                    handleSelection={(val) => formik.setFieldValue("city", val)}
                                    selected={ALL_COUNTRIES[formik.values.country][formik.values.state]?.includes(formik.values.city) ? formik.values.city : ''}
                                />
                            </div>
                            <div className="col-span-3 ">
                                <label htmlFor="description" className="text-lg zinc-900 font-medium">Description</label>
                                <div className="relative mt-2">
                                    <span className="absolute bottom-3 right-3 text-base font-normal">{`${formik.values.description.length}/300`}</span>
                                    <textarea
                                        id="description"
                                        maxLength={300}
                                        rows={6}
                                        placeholder={'Unique attractive details about your property...'}
                                        value={formik.values.description}
                                        onChange={formik.handleChange}
                                        className="size-full border border-zinc-400 rounded-lg p-3 text-lg"
                                    />
                                </div>
                            </div>
                            <div className="col-span-2 relative mt-3">
                                <label htmlFor="units" className="text-lg zinc-900 font-medium">Verifications</label>
                                <div className="w-full flex justify-between gap-10 items-center">
                                    <div className="flex flex-col gap-5 justify-between items-left w-fit mt-4">
                                        <CustomCheckbox 
                                            label="Pets allowed"
                                            checked={formik.values.is_pet_allowed}
                                            onChange={(val) => formik.setFieldValue("is_pet_allowed", val)}
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="col-span-3 relative flex flex-col items-start mt-5">
                                <label htmlFor="amenities" className="text-lg zinc-900 font-medium mb-4">Amenities</label>
                                <MultipleChoice
                                    options={availableAmenities?.map(am => am.name)}
                                    selected={formik.values.amenities}
                                    onChange={(val) => {
                                        formik.setFieldValue("amenities", [...val]); // Ensure a new array reference
                                    }} 
                                />

                                {
                                    user?.role === UserRole.ADMIN &&
                                    <div onClick={() => setShowAmenityForm(true)} className="flex justify-center gap-4 items-center px-5 py-3 bg-primary/90 hover:bg-primary text-white rounded-lg mt-5 cursor-pointer">
                                        <FaPlus />
                                        <span>
                                            New Amenity
                                        </span>
                                    </div>
                                }
                            </div>
                            
                            <div className="col-span-3 relative flex flex-col items-start mt-10 mb-16">
                                <label htmlFor="Media" className="text-lg zinc-900 font-medium mb-4">Upload images of property</label>
                                <div className="w-full mt-4 mx-auto">
                                    <CustomDropzone 
                                        onDrop={setUploadedMedia}
                                        multiple
                                        previewsRef={uploadRef}              
                                    />
                                </div>
                            </div>
                        </div>
                    </form>

                    <div className="flex justify-end items-center gap-5 mt-3">
                        <button type="button" onClick={() => formik.handleSubmit()} disabled={ isPending }  className="cursor-pointer border border-primary rounded-lg px-5 py-2.5 text-lg font-medium text-primary hover:bg-primary/90 hover:text-white disabled:hover:bg-white disabled:opacity-75 disabled:cursor-not-allowed">
                            {isPending ? <Spinner /> : 'Save'}
                        </button>
                    </div>
                </>
            </div>
        </div>
    );
}
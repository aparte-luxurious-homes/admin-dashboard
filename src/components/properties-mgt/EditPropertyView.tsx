'use client'

import { Dispatch, SetStateAction, useState } from "react";
import { FaRegBuilding } from "react-icons/fa";
import { FaMapLocationDot } from "react-icons/fa6";
import { TrashIcon } from "../icons";
import { SlLocationPin } from "react-icons/sl";
import CustomDropdown from "../ui/customDropdown";
import { IProperty, IPropertyMedia, IUpdateProperty, PropertyType } from "./types";
import CustomFilterDropdown from "../ui/customFilterDropDown";
import CustomCheckbox from "../ui/customCheckbox";
import MultipleChoice from "../ui/MultipleChoice";
import { ALL_COUNTRIES } from "@/src/data/countries";
import { availableAmenities } from "@/src/data/amenities";
import { FaPlus } from "react-icons/fa6";
import { IoCloudUploadOutline } from "react-icons/io5";
import Image from "next/image";
import { showAlert } from "@/src/lib/slices/alertDialogSlice";
import { useDispatch } from "react-redux";
import CustomDropzone from "../ui/CustomDropzone";
import { useFormik } from 'formik';
import { UseUpdateProperty } from "@/src/lib/request-handlers/propertyMgt";
import { useAuth } from "@/src/hooks/useAuth";
import { UserRole } from "@/src/lib/enums";
import Spinner from "../ui/Spinner";


export default function EditPropertyView({  
    handleEditMode,
    propertyData 
}: { 
    handleEditMode: Dispatch<SetStateAction<boolean>>, 
    propertyData: IProperty
}) {
    const dispatch = useDispatch();
    const { mutate, isPending } = UseUpdateProperty()
    const { user } = useAuth();

    const [media, _] = useState<IPropertyMedia[]>(propertyData?.media??[])

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
                kyc_id: propertyData?.kycId ?? 0,
                ownerId: propertyData?.ownerId ?? 0,
                units: String(propertyData?.units?.length) ?? "0",
                isVerified: propertyData?.isVerified ?? false,
                isFeatured: propertyData?.isFeatured ?? false,
                petsAllowed: propertyData?.isPetAllowed ?? false,
                amenities: propertyData?.amenities.map((el) => el.amenity.name) ?? [],
            },
        onSubmit: (values) => {
            const updatePayload: IUpdateProperty = {
                ...values,
                property_type: values.type,
                is_pet_allowed: values.petsAllowed,
            };
            mutate({
                propertyId: propertyData.id,
                payload: updatePayload,
            },
            {
                onSuccess: () => {
                    handleEditMode(false);
                }
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
                description: "This action cannot be undone. This will permanently delete this property.",
                confirmText: "Delete",
                cancelText: "Cancel",
                onConfirm: () => {
                    console.log("Item deleted!");
                },
            })
        );
    };



    return(
        <>
            <div className="mt-10">
                <p className="text-[2rem]">
                    Edit details of this property
                </p>
            </div>

            <div className="h-px w-full bg-zinc-400/30 my-5" />

            <form className="my-6">
                <div className="grid grid-cols-3 grid-flow-row gap-x-8 gap-y-5">
                    <div className="col-span-2 relative">
                        <label htmlFor="name" className="text-lg zinc-900 font-medium">Name</label>
                        <div className="relative mt-2">
                            <FaRegBuilding className="absolute top-[60%] left-3 text-zinc-400"/>
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
                            selected={formik.values.type}
                            handleSelection={(val) => formik.setFieldValue("type", val)}
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
                            {/* <div className="relative w-1/3">
                                <div className="relative mt-2">
                                    <BsHouses className="absolute top-[30%] left-3 text-zinc-500/90 text-xl"/>
                                    <input
                                        id="units"
                                        type="number"
                                        placeholder="0"
                                        min={0}
                                        value={units}
                                        onChange={(e) => setUnits(e.target.value)}
                                        className="w-1/2 border border-zinc-400 rounded-lg pl-12 pr-3 py-5 h-14 text-xl"
                                    />
                                </div>
                            </div> */}
                            <div className="flex flex-col gap-5 justify-between items-left w-fit mt-4">
                                {
                                    user.role === UserRole.ADMIN &&
                                    <CustomCheckbox 
                                        label="Is verified"
                                        checked={formik.values.isVerified}
                                        onChange={(val) => formik.setFieldValue("isVerified", val)}
                                    />
                                }
                                {
                                    user.role === UserRole.ADMIN &&
                                    <CustomCheckbox 
                                        label="Is Published"
                                        checked={formik.values.isFeatured}
                                        onChange={(val) => formik.setFieldValue("isFeatured", val)}
                                    />
                                }
                                <CustomCheckbox 
                                    label="Pets allowed"
                                    checked={formik.values.petsAllowed}
                                    onChange={(val) => formik.setFieldValue("petsAllowed", val)}
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="col-span-3 relative flex flex-col items-start mt-5">
                        <label htmlFor="amenities" className="text-lg zinc-900 font-medium mb-4">Amenities</label>
                        <MultipleChoice
                            options={availableAmenities}
                            selected={formik.values.amenities}
                            onChange={(val) => formik.setFieldValue("amenities", val)}
                        />
                        <div className="flex justify-center gap-4 items-center px-5 py-3 bg-primary/90 hover:bg-primary text-white rounded-lg mt-10 cursor-pointer">
                            <FaPlus />
                            <span>
                                New Amenity
                            </span>
                        </div>
                    </div>
                    
                    <div className="col-span-3 relative flex flex-col items-start mt-8">
                        <label htmlFor="Media" className="text-lg zinc-900 font-medium mb-4">Media</label>
                        <div className="flex gap-3">
                            {
                                media.map((el, index) => 
                                    <div
                                        key={index}
                                        className="relative rounded-md overflow-hidden group"
                                    >
                                        <Image
                                            src={el.mediaUrl}
                                            alt={`${name}_img_${el.id}`}
                                            width={200}
                                            height={200}
                                        />

                                        <div
                                            onClick={() => handleDeleteImage(el.id)}
                                            className="cursor-pointer absolute inset-0 bg-red-600 bg-opacity-80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                        >
                                            <span className="text-white text-lg font-semibold pl-1">
                                                <TrashIcon className="size-8" color="white" />
                                            </span>
                                        </div>
                                    </div>
                                )
                            }
                        </div>

                        <div className="w-full mt-14 mx-auto">
                            <CustomDropzone onDrop={function (acceptedFiles: File[]): void {
                                throw new Error("Function not implemented.");
                            } }                            
                            />
                        </div>
                        <div className="flex justify-center gap-4 items-center px-5 py-3 bg-primary/90 hover:bg-primary text-white rounded-lg mt-5 cursor-pointer">
                            <IoCloudUploadOutline className="text-2xl text-medium"/>
                            <span>
                                Upload
                            </span>
                        </div>
                    </div>
                </div>
            </form>

            <div className="flex justify-end items-center gap-5 mt-3">
                <button onClick={() => formik.handleSubmit()} disabled={isPending}  className="cursor-pointer border border-primary rounded-lg px-5 py-2.5 text-lg font-medium text-primary hover:bg-primary/90 hover:text-white disabled:hover:bg-white disabled:opacity-75 disabled:cursor-not-allowed">
                    {isPending ? <Spinner /> : 'Save'}
                </button>
                <button onClick={() => handleEditMode(false)} disabled={isPending}  className="cursor-pointer rounded-lg px-5 py-2.5 text-lg font-medium text-white bg-zinc-500 hover:bg-zinc-600 disabled:opacity-75 disabled:cursor-not-allowed">
                    Cancel
                </button>
                <button onClick={handleDelete} disabled={isPending}  className="cursor-pointer border border-red-500 rounded-md px-3 py-2.5 text-lg text-white bg-red-600 hover:bg-red-700 disabled:opacity-75 disabled:cursor-not-allowed">
                    <TrashIcon className="size-6" color="white" />
                </button>
            </div>
        </>
    );
}
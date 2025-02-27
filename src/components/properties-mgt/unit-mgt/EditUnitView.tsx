import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { IAmenity, IPropertyMedia, IPropertyUnit, IUpdatePropertyUnit, MediaType,  } from "../types";
import { useDispatch } from "react-redux";
import { useAuth } from "@/src/hooks/useAuth";
import { AssignUnitAmenities, UpdatePropertyUnit, UploadPropertyUnitMedia } from "@/src/lib/request-handlers/unitMgt";
import { useFormik } from "formik";
import { FaPlus, FaRegBuilding } from "react-icons/fa";
import MultipleChoice from "../../ui/MultipleChoice";
import { showAlert } from "@/src/lib/slices/alertDialogSlice";
import Image from "next/image";
import { TrashIcon } from "../../icons";
import CustomDropzone from "../../ui/CustomDropzone";
import { IoBedOutline, IoCloudUploadOutline } from "react-icons/io5";
import { UserRole } from "@/src/lib/enums";
import { TbCurrencyNaira, TbToolsKitchen } from "react-icons/tb";
import { areArraysEqual, formatMoney } from "@/src/lib/utils";
import { PiBathtub } from "react-icons/pi";
import { LuSofa, LuUsers } from "react-icons/lu";
import Spinner from "../../ui/Spinner";

export default function EditUnitView({  
    handleEditMode,
    unitData,
    availableAmenities,
}: { 
    handleEditMode: Dispatch<SetStateAction<boolean>>, 
    unitData: IPropertyUnit,
    availableAmenities: IAmenity[]
}) {

    const dispatch = useDispatch();
    const { mutate, isPending } = UpdatePropertyUnit();
    const { mutate: uploadMedia, data: uploadData, isPending: uploadedMediaPending } = UploadPropertyUnitMedia();
    const { user } = useAuth();

    const [media, setMedia] = useState<IPropertyMedia[]>(unitData?.media??[])
    const [amenities, setAmenities] = useState<string[]>(unitData?.amenities?.map((el) => el.amenity.name))
    const [uploadedMedia, setUploadedMedia] = useState<File[]>([])
    const uploadRef = useRef<{ url: string; file: File }[]>([]);
    const { mutate: assignAmenity   } = AssignUnitAmenities(); 
    

    const sortAmenities = (amenities: IAmenity[], newAmeities: string[]) => {
        const sortedAmenities = []
        let prevAmenityNames = amenities.map((a) => a.name);
        for (const amenity of newAmeities) {
            if (prevAmenityNames.includes(amenity)) {
                const pos = prevAmenityNames.indexOf(amenity)
                sortedAmenities.push(amenities[pos])
            }
        }

        return sortedAmenities;
    }


    const formik = 
        useFormik({
            initialValues: {
                name: unitData?.name ?? "",
                description: unitData?.description ?? "",
                pricePerNight: unitData?.pricePerNight ?? "0.00",
                cautionFee: unitData?.cautionFee ?? "0.00",
                maxGuests: unitData?.maxGuests ?? 0,
                count: unitData?.count ?? 0,
                isWholeProperty: unitData?.isWholeProperty ?? 0,
                bedroomCount: unitData?.bedroomCount ?? 0,
                livingRoomCount: unitData?.livingRoomCount ?? 0,
                kitchenCount: unitData?.kitchenCount ?? 0,
                bathroomCount: unitData?.bathroomCount ?? 0,
                amenities: unitData?.amenities.map((el) => el.amenity.name) ?? [],
            },
        onSubmit: (values) => {
            const newAmenities = sortAmenities(availableAmenities, values.amenities);
            if (
                !areArraysEqual( // Change the need for this on the backend
                    unitData?.amenities.map((el) => el.amenity.id),
                    newAmenities.map(el => el.id), 
                ))
                {
                    assignAmenity({                              // Update amenity asignments if changed
                        propertyId: unitData.propertyId, 
                        unitId: unitData.id,
                        payload: {
                            amenity_ids: newAmenities.map(el => el.id)
                        },
                    })
                }

            const updatePayload: IUpdatePropertyUnit = {
                ...values,
            };
            mutate({
                propertyId: unitData.propertyId,
                unitId: unitData.id,
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
                description: "This action cannot be undone. This will permanently delete the unit.",
                confirmText: "Delete",
                cancelText: "Cancel",
                onConfirm: () => {
                    console.log("Item deleted!");
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
        <>
            <div className="mt-10">
                <p className="text-[2rem]">
                    Edit details of this unit
                </p>
            </div>

            <div className="h-px w-full bg-zinc-400/30 my-5" />

            <form className="my-6">
                <div className="grid grid-cols-3 grid-flow-row gap-x-4 gap-y-5">
                    <div className="col-span-3 relative">
                        <label htmlFor="name" className="text-lg zinc-900 font-medium">Name</label>
                        <div className="reative mt-2">
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

                    <div className="col-span-1">
                        <label htmlFor="name" className="text-lg zinc-900 font-medium">Bedroom</label>
                        <div className="relative mt-2">
                            <IoBedOutline className="text-xl absolute top-[30%] left-3 text-zinc-400"/>
                            <input
                                id="bedroom"
                                type="number" 
                                placeholder=""
                                value={formik.values.bedroomCount}
                                onChange={(e) => formik.setFieldValue('bedroomCount', (e.target.value))}
                                className="w-full border border-zinc-400 rounded-lg pl-10 pr-3 py-5 h-14 text-lg"
                            />
                        </div>
                    </div>
                    <div className="col-span-1 ">
                        <label htmlFor="name" className="text-lg zinc-900 font-medium">Kitchen</label>
                        <div className="relative mt-2">
                            <TbToolsKitchen className="text-xl absolute top-[30%] left-3 text-zinc-400"/>
                            <input
                                id="kitchen"
                                type="number" 
                                placeholder=""
                                value={formik.values.kitchenCount}
                                onChange={(e) => formik.setFieldValue('kitchenCount', (e.target.value))}
                                className="w-full border border-zinc-400 rounded-lg pl-10 pr-3 py-5 h-14 text-lg"
                            />
                        </div>
                    </div>
                    <div className="col-span-1">
                        <label htmlFor="name" className="text-lg zinc-900 font-medium">Bathroom</label>
                        <div className="relative mt-2">
                            <PiBathtub className="text-xl absolute top-[30%] left-3 text-zinc-400"/>
                            <input
                                id="bathroom"
                                type="number" 
                                placeholder=""
                                value={formik.values.bathroomCount}
                                onChange={(e) => formik.setFieldValue('bathroomCount', (e.target.value))}
                                className="w-full border border-zinc-400 rounded-lg pl-10 pr-3 py-5 h-14 text-lg"
                            />
                        </div>
                    </div>
                    <div className="col-span-1">
                        <label htmlFor="name" className="text-lg zinc-900 font-medium">Living room</label>
                        <div className="relative mt-2">
                            <LuSofa className="text-xl absolute top-[30%] left-3 text-zinc-400"/>
                            <input
                                id="living-room"
                                type="number" 
                                placeholder=""
                                value={formik.values.livingRoomCount}
                                onChange={(e) => formik.setFieldValue('livingRoomCount', (e.target.value))}
                                className="w-full border border-zinc-400 rounded-lg pl-10 pr-3 py-5 h-14 text-lg"
                            />
                        </div>
                    </div>
                    <div className="col-span-1">
                        <label htmlFor="name" className="text-lg zinc-900 font-medium">Guests <span className="font-normal text-base"><em>(max)</em></span></label>
                        <div className="relative mt-2">
                            <LuUsers className="text-xl absolute top-[30%] left-3 text-zinc-400"/>
                            <input
                                id="max-guests"
                                type="number" 
                                placeholder=""
                                value={formik.values.maxGuests}
                                onChange={(e) => formik.setFieldValue('maxGuests', (e.target.value))}
                                className="w-full border border-zinc-400 rounded-lg pl-10 pr-3 py-5 h-14 text-lg"
                            />
                        </div>
                    </div>
                    
                    <div className="col-span-3 relative flex flex-col items-start mt-10">
                        <label htmlFor="amenities" className="text-lg zinc-900 font-medium mb-4">Amenities</label>
                        <MultipleChoice
                            options={availableAmenities?.map(el => 
                                el.name
                            )}
                            selected={formik.values.amenities}
                            onChange={(val) => {
                                formik.setFieldValue("amenities", [...val]); // Ensure a new array reference
                            }} 
                        />

                        {
                            user?.role === UserRole.ADMIN &&
                            <div className="flex justify-center gap-4 items-center px-5 py-3 bg-primary/90 hover:bg-primary text-white rounded-lg mt-10 cursor-pointer">
                                <FaPlus className="text-base "/>
                                <span>
                                    New Amenity
                                </span>
                            </div>
                        }
                    </div>


                    
                    <div className="col-span-3 relative flex flex-col items-start mt-10 mb-20">
                        <label htmlFor="Media" className="text-lg zinc-900 font-medium mb-4">Media</label>
                        <div className="flex gap-3">
                            {
                                media?.map((el, index) => 
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

                                    uploadMedia({
                                        propertyId: unitData.propertyId,
                                        unitId: unitData.id,
                                        payload: formData,
                                    });

                                } }
                                className={`flex justify-center gap-4 items-center px-5 py-3 bg-primary/90 hover:bg-primary text-white rounded-lg mt-5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-75`}
                                disabled={uploadedMediaPending}
                            >
                                {
                                    uploadedMediaPending ? 
                                    <Spinner /> 
                                    : 
                                    <>
                                        <IoCloudUploadOutline className="text-2xl text-medium"/>
                                        <span>
                                            Upload
                                        </span>
                                    </>
                                }
                            </button>
                        }
                    </div>


                    
                    <div className="col-span-3 relative my-10">
                        <label htmlFor="name" className="text-lg zinc-900 font-medium">Prices</label>
                        <div className="flex flex-col justify-center w-full p-2">
                            <div className="flex justify-between items-center">
                                <p className="text-lg text-zinc-900 font-normal">
                                    Price per night
                                </p>
                                <div className="relative mt-2">
                                    <TbCurrencyNaira className="absolute top-[25%] left-2.5 text-[25px]"/>
                                    <input
                                        id="price-per-night"
                                        type="number"
                                        value={formik.values.pricePerNight}
                                        onChange={(e) => formik.setFieldValue('pricePerNight', (String(e.target.value)))}
                                        className="w-full border border-zinc-400 rounded-lg pl-10 pr-3 py-3 h-14 text-lg"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-lg text-zinc-900 font-normal">
                                    Caution fee{` `}
                                    <span className="text-sm text-zinc-500 font-normal"><em>(Amount paid incase of damge to property)</em></span>
                                </p>
                                <div className="relative mt-2">
                                    <TbCurrencyNaira className="absolute top-[25%] left-2.5 text-[25px]"/>
                                    <input
                                        id="caution-fee"
                                        type="number"
                                        value={formik.values.cautionFee}
                                        onChange={(e) => formik.setFieldValue('cautionFee', (String(e.target.value)))}
                                        className="w-full border border-zinc-400 rounded-lg pl-10 pr-3 py-3 h-14 text-lg"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-lg text-zinc-900 font-semibold italic">
                                    Total
                                </p>
                                <div className="relative mt-4 pl-2">
                                    <TbCurrencyNaira className="absolute top-[25%] left-2.5 text-[25px]"/>
                                    <input
                                        id="total"
                                        type="text"
                                        disabled
                                        value={formatMoney(Number(formik.values.pricePerNight) + Number(formik.values.cautionFee))}
                                        className="w-full border-none outline-none pl-8 pr-3 py-3 h-14 text-lg italic font-semibold bg-none"
                                    />
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </form>
            
            
            <div className="flex justify-end items-center gap-5 mt-3">
                <button onClick={() => formik.handleSubmit()} disabled={isPending} className="cursor-pointer border border-primary rounded-lg px-5 py-2.5 text-lg font-medium text-primary hover:bg-primary/90 hover:text-white disabled:hover:bg-white disabled:opacity-75 disabled:cursor-not-allowed">
                    {isPending ? <Spinner /> : 'Save'}
                </button>
                <button onClick={() => handleEditMode(false)} disabled={isPending} className="cursor-pointer rounded-lg px-5 py-2.5 text-lg font-medium text-white bg-zinc-500 hover:bg-zinc-600 disabled:opacity-75 disabled:cursor-not-allowed">
                    Cancel
                </button>
                <button onClick={handleDelete} disabled={isPending} className="cursor-pointer border border-red-500 rounded-md px-3 py-2.5 text-lg text-white bg-red-600 hover:bg-red-700 disabled:opacity-75 disabled:cursor-not-allowed">
                    <TrashIcon className="size-6" color="white" />
                </button>
            </div>
        </>
    );
}
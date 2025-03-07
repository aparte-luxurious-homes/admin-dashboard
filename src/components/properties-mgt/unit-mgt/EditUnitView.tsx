import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { IAmenity, IPropertyMedia, IPropertyUnit, IUpdatePropertyUnit, MediaType,  } from "../types";
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

export default function EditUnitView({  
    handleEditMode,
    unitData,
    propertyId,
    unitId,
}: { 
    handleEditMode: Dispatch<SetStateAction<boolean>>, 
    unitData: IPropertyUnit,
    propertyId: number,
    unitId: number,
}) {
    const { data: unitDetails, isLoading } = GetSinglePropertyUnit(propertyId, unitId)
    const { data: fetchedAmenites } = GetAmenities();
    const [unit, setUnit] = useState<IPropertyUnit>(unitData);
    const [amenities, setAmenities] = useState<IAmenity[]>([]);
    const dispatch = useDispatch();
    const { mutate, isPending } = UpdatePropertyUnit();
    const  { mutate: deleteMutation, isPending: deleteIsPending } = DeletePropertyUnit()
    const { mutate: uploadMedia, data: uploadData, isPending: uploadedMediaPending } = UploadPropertyUnitMedia();
    const { user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const [media, setMedia] = useState<IPropertyMedia[]>(unitData?.media??[])
    const [uploadedMedia, setUploadedMedia] = useState<File[]>([])
    const uploadRef = useRef<{ url: string; file: File }[]>([]);
    const { mutate: assignAmenity   } = AssignUnitAmenities();
    
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
                pricePerNight: unit?.pricePerNight ?? "0.00",
                cautionFee: unit?.cautionFee ?? "0.00",
                maxGuests: unit?.maxGuests ?? 0,
                count: unit?.count ?? 0,
                isWholeProperty: unit?.isWholeProperty ?? 0,
                bedroomCount: unit?.bedroomCount ?? 0,
                livingRoomCount: unit?.livingRoomCount ?? 0,
                kitchenCount: unit?.kitchenCount ?? 0,
                bathroomCount: unit?.bathroomCount ?? 0,
                amenities: unit?.amenities.map((el) => el.id),
                amenityNames: unit?.amenities.map((el) => el.name),
            },
        onSubmit: (values) => {
            const sortedAmenities = sortAmenities(amenities, values.amenityNames);
            
            const updatePayload: IUpdatePropertyUnit = {
                ...values,
                amenities: sortedAmenities,
            };
            mutate({
                propertyId: unit.propertyId,
                unitId: unit.id,
                payload: updatePayload,
            },
            {
                onSuccess: () => {
                    removeParam('edit');
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
                description: "This action cannot be undone. This will permanently delete this property unit.",
                confirmText: "Delete",
                cancelText: "Cancel",
                onConfirm: () => {
                    deleteMutation(
                        { propertyId: unit.propertyId, unitId: unit.id },
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
                                    router.push(PAGE_ROUTES.dashboard.propertyManagement.allProperties.details(unit.propertyId))
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
                            options={amenities?.map(el => 
                                el.name
                            )}
                            selected={formik.values.amenityNames}
                            onChange={(val) => {
                                formik.setFieldValue("amenityNames", [...val]); // Ensure a new array reference
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
                                        propertyId: unit.propertyId,
                                        unitId: unit.id,
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

                        </div>
                    </div>
                </div>
            </form>
            
            
            <div className="flex justify-between items-center gap-5 mt-3">
                <div>
                    <p className="mb-3 text-base text-zinc-500 font-medium border border-zinc-500 px-3 py-auto rounded-full w-fit">Total price per night</p>
                    <div className="relative flex justify-between ">
                        <TbCurrencyNaira className="size-10"/>
                        <p className="text-[2.5rem] text-zinc-600">{formatMoney(Number(formik.values.pricePerNight) + Number(formik.values.cautionFee))}</p>
                        <PriceTagIcon color="#191919" className="size-6 ml-1"/>
                    </div>
                </div>
                <div className="w-3/6 flex justify-end items-center gap-6">
                    <button onClick={() => formik.handleSubmit()} disabled={isPending} className="cursor-pointer border border-primary rounded-lg px-5 py-2.5 text-lg font-medium text-primary hover:bg-primary/90 hover:text-white disabled:hover:bg-white disabled:opacity-75 disabled:cursor-not-allowed">
                        {isPending ? <Spinner /> : 'Save'}
                    </button>
                    <button onClick={() => {removeParam('edit'); handleEditMode(false)}} disabled={isPending} className="cursor-pointer rounded-lg px-5 py-2.5 text-lg font-medium text-white bg-zinc-500 hover:bg-zinc-600 disabled:opacity-75 disabled:cursor-not-allowed">
                        Cancel
                    </button>
                    <button onClick={handleDelete} disabled={isPending} className="cursor-pointer border border-red-500 rounded-md px-3 py-2.5 text-lg text-white bg-red-600 hover:bg-red-700 disabled:opacity-75 disabled:cursor-not-allowed">
                        <TrashIcon className="size-6" color="white" />
                    </button>
                </div>
            </div>
        </>
    );
}
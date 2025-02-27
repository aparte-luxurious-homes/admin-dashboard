'use client'

import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { FaRegBuilding } from "react-icons/fa";
import CustomDropdown from "@/components/ui/customDropdown";
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
import { AssignUnitAmenities, CreatePropertyUnit, UploadPropertyUnitMedia } from "@/src/lib/request-handlers/unitMgt";
import { CreateAmenityForm } from "../CreatePropertyView";
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


export default function CreateUnitView({ propertyId } : { propertyId: number }) {
    const { user } = useAuth();
    const { mutate, isPending } = CreatePropertyUnit();
    const { data: fetchedAmenites } = GetAmenities();
    const { mutate: assignUnitAmenity } = AssignUnitAmenities(); 
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
                sortedAmenities.push(amenities[pos])
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
                description:  "",
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
                amenityIds: [],
            },

        onSubmit: (values) => {
            const newAmenities = sortAmenities(availableAmenities, values.amenities);

            const payload: ICreatePropertyUnit[] = [{
                ...values,
            }]
            
            mutate({
                propertyId,
                payload
            },
            {
                onSuccess: (response) => {
                    const unitId = response?.data?.data?.id 
                    const formData = new FormData();

                    if (propertyId) {
                        assignUnitAmenity({                              // Update amenity asignments if changed
                            propertyId,
                            unitId,
                            payload: {
                                amenity_ids: newAmenities.map(el => el.id)
                            },
                        })

                        if (uploadedMedia.length > 0) {  
                            uploadedMedia?.forEach(file => {
                                formData.append("media_file", file);
                            });
                        
                            formData.append("media_type", MediaType.IMAGE);
                            formData.append("is_featured", "true");

                            uploadMedia({
                                propertyId,
                                unitId,
                                payload: formData,
                            });
                        }
                    }

                    router.push(PAGE_ROUTES.dashboard.propertyManagement.allProperties.details(propertyId))

                }
            })         
        },
    });


    return (
        <div className="p-10 w-full">
            <div className="w-full border border-zinc-500/20 bg-white rounded-xl p-10 min-h-[50vh]">
                <>
                    <Link href={PAGE_ROUTES.dashboard.propertyManagement.allProperties.details(propertyId)} className="text-[1.5rem] italic font-normal hover:underline hover:text-primary/90 flex gap-3 items-center">
                        <FaArrowLeftLong className="text-base" />
                        <p>
                            {loadedProperty?.name}
                        </p>
                    </Link>
                    <div className="my-5">
                        <p className="text-[2rem]">
                            Create new unit
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
                                        value={formik.values.bedroom_count}
                                        onChange={(e) => formik.setFieldValue('bedroom_count', (e.target.value))}
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
                                        value={formik.values.kitchen_count}
                                        onChange={(e) => formik.setFieldValue('kitchen_count', (e.target.value))}
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
                                        value={formik.values.bathroom_count}
                                        onChange={(e) => formik.setFieldValue('bathroom_count', (e.target.value))}
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
                                        value={formik.values.living_room_count}
                                        onChange={(e) => formik.setFieldValue('living_room_count', (e.target.value))}
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
                                        value={formik.values.max_guests}
                                        onChange={(e) => formik.setFieldValue('max_guests', (e.target.value))}
                                        className="w-full border border-zinc-400 rounded-lg pl-10 pr-3 py-5 h-14 text-lg"
                                    />
                                </div>
                            </div>
                            <div className="col-span-1">
                                <label htmlFor="name" className="text-lg zinc-900 font-medium">Units available</label>
                                <div className="relative mt-2">
                                    <BsHouses className="text-xl absolute top-[30%] left-3 text-zinc-400"/>
                                    <input
                                        id="count"
                                        type="number" 
                                        placeholder=""
                                        value={formik.values.count}
                                        onChange={(e) => formik.setFieldValue('count', (e.target.value))}
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
                                    <div onClick={() => setShowAmenityForm(true)} className="flex justify-center gap-4 items-center px-5 py-3 bg-primary/90 hover:bg-primary text-white rounded-lg mt-5 cursor-pointer">
                                        <FaPlus className="text-base "/>
                                        <span>
                                            New Amenity
                                        </span>
                                    </div>
                                }
                            </div>


                            
                            <div className="col-span-3 relative flex flex-col items-start mt-10 mb-20">
                                <label htmlFor="name" className="text-lg zinc-900 font-medium">Upload unit images</label>
                                <div className="w-full mt-5 mx-auto">
                                    <CustomDropzone 
                                        onDrop={setUploadedMedia}
                                        multiple
                                        previewsRef={uploadRef}              
                                    />
                                </div>
                            </div>


                            
                            <div className="col-span-3 relative mt-5 mb-10">
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
                                                value={formik.values.price_per_night}
                                                onChange={(e) => formik.setFieldValue('price_per_night', (String(e.target.value)))}
                                                className="w-full border border-zinc-400 rounded-lg pl-10 pr-3 py-3 h-14 text-lg"
                                            />
                                        </div>
                                    </div>
                                    {/* <div className="flex justify-between items-center">
                                        <p className="text-lg text-zinc-900 font-normal">
                                            Caution fee{` `}
                                            <span className="text-sm text-zinc-500 font-normal"><em>(Amount paid incase of damge to property)</em></span>
                                        </p>
                                        <div className="relative mt-2">
                                            <TbCurrencyNaira className="absolute top-[25%] left-2.5 text-[25px]"/>
                                            <input
                                                id="caution-fee"
                                                type="number"
                                                value={formik.values.caution_fee}
                                                onChange={(e) => formik.setFieldValue('cautionFee', (String(e.target.value)))}
                                                className="w-full border border-zinc-400 rounded-lg pl-10 pr-3 py-3 h-14 text-lg"
                                            />
                                        </div>
                                    </div> */}
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
                                                value={formatMoney(Number(formik.values.price_per_night))}
                                                className="w-full border-none outline-none pl-8 pr-3 py-3 h-14 text-lg italic font-semibold bg-none"
                                            />
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </form>

                    <div className="flex justify-end items-center gap-5 mt-3">
                        <button onClick={() => formik.handleSubmit()} disabled={ isPending }  className="cursor-pointer border border-primary rounded-lg px-5 py-2.5 text-lg font-medium text-primary hover:bg-primary/90 hover:text-white disabled:hover:bg-white disabled:opacity-75 disabled:cursor-not-allowed">
                            {isPending ? <Spinner /> : 'Save'}
                        </button>
                    </div>
                </>
            </div>
        </div>
    );
}
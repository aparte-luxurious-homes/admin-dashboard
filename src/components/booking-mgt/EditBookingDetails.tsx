import { useFormik } from "formik";
import { PriceTagIcon, ReturnIcon, UnitIcon, UsersIcon } from "../icons";
import CustomDropdown from "../ui/customDropdown";
import { BookingStatus } from "./types";
import { SetStateAction, useState, Dispatch } from "react";
import { HiOutlineTicket } from "react-icons/hi2";
import { TbCurrencyNaira } from "react-icons/tb";
import { formatMoney } from "@/src/lib/utils";

export default function EditBookingDetails({
    handleEditMode,
 }: { 
    handleEditMode: Dispatch<SetStateAction<boolean>>, 
  }) {

    const [status, setStatus] = useState<BookingStatus>(BookingStatus.CANCELLED)

    const formik = useFormik({
        initialValues: {
            startDate: "",
            endDate: "",
            guestsCount: 0,
            unitCount: 0,
            totalPrice: 0,
        },
        onSubmit: async (values, { setSubmitting }) => {}
    })


    return (
        <section>
            <form className="my-6">
                <div className="grid grid-cols-3 grid-flow-row gap-x-4 gap-y-5">

                    <div className="relative">
                        <div className="text-zinc-500 text-sm flex gap-3 items-center">
                            <ReturnIcon className="size-5"/>
                            <label htmlFor="start-date" className="text-lg zinc-900 font-medium mt-1">Check-in</label>
                        </div>
                        <div className="reative mt-2">
                            <input
                                id="start-date"
                                type="date" 
                                // value={formik.values.name}
                                // onChange={formik.handleChange}
                                className="w-full border border-zinc-400 rounded-lg px-3 py-5 h-14 text-lg"
                            />
                        </div>
                    </div>

                    <div className="relative">
                        <div className="text-zinc-500 text-sm flex gap-3 items-center">
                            <ReturnIcon className="size-5 scale-x-[-1]"/>
                            <label htmlFor="end-date" className="text-lg zinc-900 font-medium mt-1">Check-in</label>
                        </div>
                        <div className="reative mt-2">
                            <input
                                id="end-date"
                                type="date" 
                                // value={formik.values.name}
                                // onChange={formik.handleChange}
                                className="w-full border border-zinc-400 rounded-lg px-3 py-5 h-14 text-lg"
                            />
                        </div>
                    </div>

                    <div className="relative">
                        <div className="text-zinc-500 text-sm flex gap-3 items-center">
                            <UsersIcon color="#191919"  className="size-5"/>
                            <label htmlFor="end-date" className="text-lg zinc-900 font-medium mt-1">Check-in</label>
                        </div>
                        <div className="reative mt-2">
                            <input
                                id="guests"
                                type="number" 
                                placeholder="0" 
                                // value={formik.values.name}
                                // onChange={formik.handleChange}
                                className="w-full border border-zinc-400 rounded-lg px-3 py-5 h-14 text-lg"
                            />
                        </div>
                    </div>
                    
                    
                    <div className="relative">
                        <div className="text-zinc-500 text-sm flex gap-3 items-center">
                            <UnitIcon color="#191919" className="size-5"/>
                            <label htmlFor="end-date" className="text-lg zinc-900 font-medium mt-1">Units</label>
                        </div>
                        <div className="reative mt-2">
                            <input
                                id="units"
                                type="number"
                                placeholder="0" 
                                // value={formik.values.name}
                                // onChange={formik.handleChange}
                                className="w-full border border-zinc-400 rounded-lg px-3 py-5 h-14 text-lg"
                            />
                        </div>
                    </div>
                    
                    
                    <div className=" relative">
                        <div className="text-zinc-500 text-sm flex gap-3 items-center">
                            <HiOutlineTicket  color="#191919" className="size-5"/>
                            <label htmlFor="end-date" className="text-lg zinc-900 font-medium mt-1">Status</label>
                        </div>
                        <CustomDropdown
                            selected={status}
                            handleSelection={(val) => setStatus(val)}
                            options={Object.values(BookingStatus)}
                        />
                    </div>



                </div>

                <section className="flex justify-between items-center mt-24">
                    <div>
                        <p className="mb-3 text-base text-zinc-500 font-medium border border-zinc-500 px-3 py-auto rounded-full w-fit">Total price</p>
                        <div className="relative flex justify-between ">
                            <TbCurrencyNaira className="size-10"/>
                            <p className="text-[2.5rem] text-zinc-600">{formatMoney(Number(345555))}</p>
                            <PriceTagIcon color="#191919" className="size-6 ml-1"/>
                        </div>
                    </div>
                    <div className="w-3/6 flex justify-end items-center gap-6">
                        <button type="button" onClick={() => handleEditMode(false)} className="bg-zinc-500 text-white hover:bg-zinc-400 rounded-lg px-7 py-2 h-14 text-xl">
                            Save
                        </button>
                        <button type="button" onClick={() => handleEditMode(false)} className="bg-red-600 text-white hover:bg-red-500 rounded-lg px-7 py-2 h-14 text-xl">
                            Cancel
                        </button>
                    </div>
                </section>
            </form>
        </section>
    );
}
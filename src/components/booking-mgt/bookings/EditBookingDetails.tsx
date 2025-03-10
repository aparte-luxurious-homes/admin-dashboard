import { useFormik } from "formik";
import { PriceTagIcon, ReturnIcon, UnitIcon, UsersIcon } from "../../icons";
import CustomDropdown from "../../ui/customDropdown";
import { BookingStatus, IBooking } from "../types";
import { SetStateAction, useState, Dispatch, useEffect } from "react";
import { HiOutlineTicket } from "react-icons/hi2";
import { TbCurrencyNaira } from "react-icons/tb";
import { formatMoney } from "@/src/lib/utils";
import { useRouter } from "next/navigation";
import { usePathname, useSearchParams } from "next/navigation";
import { GetBookingDetails, UpdateBookingDetails } from "@/src/lib/request-handlers/bookingMgt";
import Loader from "../../loader";
import { useAuth } from "@/src/hooks/useAuth";
import { UserRole } from "@/src/lib/enums";
import Spinner from "../../ui/Spinner";

export default function EditBookingDetails({
    handleEditMode,
    bookingId,
    bookingData,
 }: { 
    handleEditMode: Dispatch<SetStateAction<boolean>>,
    bookingId: number,
    bookingData: IBooking,
  }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { user } = useAuth();
    const [details, setDetails] = useState<IBooking>(bookingData);
    const [status, setStatus] = useState<BookingStatus>(bookingData?.status??BookingStatus.COMPLETED)
    const { data: bookingDetails, isLoading } = GetBookingDetails(bookingId);
    const { mutate, isPending } = UpdateBookingDetails();

    const removeParam = (param: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete(param); // Remove the specified query param
    
        const newQueryString = params.toString();
        router.push(newQueryString ? `?${newQueryString}` : pathname, { scroll: false });
    };


    const formik = useFormik({
        initialValues: {
            unit_id: details?.id??bookingId,
            start_date: details?.startDate??'',
            end_date: details?.endDate??'',
            guests_count: details?.guestsCount??0,
            unit_count: details?.unitCount??0,
            status: details?.status??bookingData?.status,
        },
        onSubmit: async (values) => {
            mutate(
                {
                    bookingId,
                    payload: { ...values }
                },
                {
                    onSuccess: () => {
                        removeParam('edit'); 
                        handleEditMode(false)
                    }
                }
            )
        }
    })

    useEffect(() => {
        setDetails(bookingDetails?.data?.data)
        setStatus(bookingDetails?.data?.data?.status)
    }, [bookingDetails])


    return (
        <section>
            {
                isLoading || !bookingDetails ?
                <Loader />
                :
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
                                    value={formik.values.start_date}
                                    onChange={(e) => formik.setFieldValue('start_date', (e.target.value))}
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
                                    value={formik.values.end_date}
                                    onChange={(e) => formik.setFieldValue('end_date', (e.target.value))}
                                    className="w-full border border-zinc-400 rounded-lg px-3 py-5 h-14 text-lg"
                                />
                            </div>
                        </div>

                        <div className="relative">
                            <div className="text-zinc-500 text-sm flex gap-3 items-center">
                                <UsersIcon color="#191919"  className="size-5"/>
                                <label htmlFor="end-date" className="text-lg zinc-900 font-medium mt-1">Guests</label>
                            </div>
                            <div className="reative mt-2">
                                <input
                                    id="guests"
                                    type="number" 
                                    placeholder="0" 
                                    value={formik.values.guests_count}
                                    onChange={(e) => formik.setFieldValue('guests_count', (e.target.value))}
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
                                    value={formik.values.unit_count}
                                    onChange={(e) => formik.setFieldValue('unit_count', (e.target.value))}
                                    className="w-full border border-zinc-400 rounded-lg px-3 py-5 h-14 text-lg"
                                />
                            </div>
                        </div>
                        
                        {
                            user && user.role === UserRole.ADMIN &&
                            <div className=" relative">
                                <div className="text-zinc-500 text-sm flex gap-3 items-center">
                                    <HiOutlineTicket  color="#191919" className="size-5"/>
                                    <label htmlFor="end-date" className="text-lg zinc-900 font-medium mt-1">Status</label>
                                </div>
                                <CustomDropdown
                                    selected={status}
                                    handleSelection={(val) => formik.setFieldValue('status', (val))}
                                    options={Object.values(BookingStatus)}
                                />
                            </div>
                        }



                    </div>

                    <section className="flex justify-between items-center mt-24">
                        <div>
                            <p className="mb-3 text-base text-zinc-500 font-medium border border-zinc-500 px-3 py-auto rounded-full w-fit">Total price</p>
                            <div className="relative flex justify-between ">
                                <TbCurrencyNaira className="size-10"/>
                                <p className="text-[2.5rem] text-zinc-600">{formatMoney(Number(bookingData?.totalPrice))}</p>
                                <PriceTagIcon color="#191919" className="size-6 ml-1"/>
                            </div>
                        </div>
                        <div className="w-3/6 flex justify-end items-center gap-6">
                            <button type="button" onClick={() => formik.handleSubmit()} disabled={isPending||isLoading} className="border border-teal-700 bg-transparent text-teal-700 hover:text-white hover:bg-teal-800 rounded-lg px-5 py-2.5  text-lg font-medium disabled:hover:bg-white disabled:opacity-75 disabled:cursor-not-allowed">
                                {isPending ? <Spinner /> : 'Save'}
                            </button>
                            <button type="button" onClick={() => {removeParam('edit'); handleEditMode(false)}} disabled={isPending||isLoading} className="bg-zinc-500 text-white hover:bg-zinc-400 rounded-lg px-5 py-2.5  text-lg font-medium  disabled:opacity-75 disabled:cursor-not-allowed">
                                Cancel
                            </button>
                        </div>
                    </section>
                </form>
            }
        </section>
    );
}
import { useFormik } from "formik";
import { PriceTagIcon, ReturnIcon, UnitIcon, UsersIcon } from "../../icons";
import CustomDropdown from "../../ui/customDropdown";
import { BookingStatus, IBooking } from "../types";
import { SetStateAction, useState, Dispatch, useEffect } from "react";
import { HiOutlineTicket } from "react-icons/hi2";
import { TbCurrencyNaira } from "react-icons/tb";
import { formatMoney, getDayDifference } from "@/src/lib/utils";
import { useRouter } from "next/navigation";
import { usePathname, useSearchParams } from "next/navigation";
import { GetBookingDetails, UpdateBookingDetails, UploadPaymentProof } from "@/src/lib/request-handlers/bookingMgt";
import Loader from "../../loader";
import { useAuth } from "@/src/hooks/useAuth";
import { UserRole } from "@/src/lib/enums";
import Spinner from "../../ui/Spinner";
import { toast } from "react-hot-toast";
import { IoMdReturnLeft } from "react-icons/io";
import { MdOutlinePayments } from "react-icons/md";
import { HiOutlineCloudUpload } from "react-icons/hi";
import Image from "next/image";

export default function EditBookingDetails({
    handleEditMode,
    bookingId,
    bookingData,
}: {
    handleEditMode: Dispatch<SetStateAction<boolean>>,
    bookingId: string | number,
    bookingData: IBooking,
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { user } = useAuth();
    const { data: bookingDetails, isLoading } = GetBookingDetails(String(bookingId));
    const { mutate, isPending } = UpdateBookingDetails();
    const { mutate: uploadProof, isPending: isUploading } = UploadPaymentProof();

    const [details, setDetails] = useState<IBooking>(bookingData);

    useEffect(() => {
        if (bookingDetails?.data?.data) {
            setDetails(bookingDetails.data.data);
        }
    }, [bookingDetails]);

    const removeParam = (param: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete(param); // Remove the specified query param

        const newQueryString = params.toString();
        router.push(newQueryString ? `?${newQueryString}` : pathname, { scroll: false });
    };

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            unit_id: details?.unitId ?? details?.unit_id ?? bookingData?.unitId ?? bookingData?.unit_id,
            start_date: details?.startDate ?? details?.start_date ?? bookingData?.startDate ?? '',
            end_date: details?.endDate ?? details?.end_date ?? bookingData?.endDate ?? '',
            guests_count: details?.guestsCount ?? details?.guests_count ?? bookingData?.guestsCount ?? 0,
            unit_count: details?.unitCount ?? details?.unit_count ?? bookingData?.unitCount ?? 0,
            status: details?.status ?? bookingData?.status,
            payment_method: details?.payment_method ?? 'cash',
            payment_proof_url: details?.payment_proof_url ?? '',
            payment_notes: details?.payment_notes ?? '',
            mark_as_paid: false,
            total_price: details?.totalPrice ?? details?.total_price ?? bookingData?.totalPrice ?? 0,
        },
        onSubmit: async (values) => {
            mutate(
                {
                    bookingId,
                    payload: { ...values }
                },
                {
                    onSuccess: () => {
                        toast.success('Booking updated successfully', {
                            duration: 6000,
                            style: {
                                maxWidth: '500px',
                                width: 'max-content'
                            }
                        });
                        removeParam('edit');
                        handleEditMode(false)
                    },
                    onError: (error: any) => {
                        console.error(error);
                        toast.error(error?.response?.data?.detail || error.message, {
                            duration: 6000,
                            style: {
                                maxWidth: '500px',
                                width: 'max-content'
                            }
                        });
                    }
                }
            )
        }
    });

    const { values, setFieldValue, handleSubmit, isValid } = formik;
    const { start_date, end_date, unit_count } = values;

    const [calculatedTotal, setCalculatedTotal] = useState<number>(Number(bookingData?.totalPrice || 0));

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (start_date && end_date) {
            const days = getDayDifference(start_date, end_date);
            const pricePerNight = Number(details?.unit?.pricePerNight ?? details?.unit?.price_per_night ?? bookingData?.unit?.pricePerNight ?? bookingData?.unit?.price_per_night ?? 0);
            const cautionFee = Number(details?.unit?.cautionFee ?? details?.unit?.caution_fee ?? bookingData?.unit?.cautionFee ?? bookingData?.unit?.caution_fee ?? 0);

            const newTotal = (days * unit_count * pricePerNight) + cautionFee;
            setCalculatedTotal(newTotal);
            setFieldValue('total_price', newTotal);
        }
    }, [start_date, end_date, unit_count, details, bookingData, setFieldValue]);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            toast.error('Invalid file type. Please upload an image or PDF.');
            event.target.value = ''; // Reset input
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size exceeds 5MB limit.');
            event.target.value = ''; // Reset input
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        uploadProof(
            { payload: formData },
            {
                onSuccess: (data: any) => {
                    const url = data?.data?.data?.url;
                    if (url) {
                        setFieldValue('payment_proof_url', url);
                        toast.success('Payment proof uploaded successfully');
                    }
                },
                onError: (error: any) => {
                    console.error('Upload Error:', error);
                    toast.error(error?.response?.data?.detail || 'Failed to upload payment proof');
                }
            }
        );
    };

    return (
        <section className="bg-zinc-50 min-h-screen p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-semibold text-zinc-900">Edit Booking Details</h1>
                    <div onClick={() => {
                        removeParam('edit');
                        handleEditMode(false);
                    }} className="flex gap-2 items-center cursor-pointer text-zinc-500 hover:text-zinc-800 transition-colors">
                        <IoMdReturnLeft />
                        <span className="text-sm font-medium">Cancel & Return</span>
                    </div>
                </div>

                {isLoading || !bookingDetails ? (
                    <Loader />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        {/* LEFT COLUMN: FORM INPUTS */}
                        <div className="lg:col-span-2 space-y-8">

                            {/* 1. Guest & Stay Details */}
                            <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
                                <h2 className="text-xl font-medium text-zinc-800 mb-6 flex items-center gap-2">
                                    <span className="bg-blue-50 text-blue-600 p-1.5 rounded-lg"><UsersIcon className="w-5 h-5" color="currentColor" /></span>
                                    Stay Details
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-700">Check-in Date</label>
                                        <input
                                            type="date"
                                            className="w-full h-12 px-4 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                            value={values.start_date}
                                            onChange={(e) => setFieldValue('start_date', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-700">Check-out Date</label>
                                        <input
                                            type="date"
                                            className="w-full h-12 px-4 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                            value={values.end_date}
                                            onChange={(e) => setFieldValue('end_date', e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-700">Guests</label>
                                        <input
                                            type="number"
                                            min="1"
                                            className="w-full h-12 px-4 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                            value={values.guests_count}
                                            onChange={(e) => setFieldValue('guests_count', Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-700">Units</label>
                                        <input
                                            type="number"
                                            min="1"
                                            className="w-full h-12 px-4 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                                            value={values.unit_count}
                                            onChange={(e) => {
                                                const val = Number(e.target.value);
                                                const max = details?.unit?.count ?? bookingData?.unit?.count ?? 1;
                                                if (val < 1) setFieldValue('unit_count', 1);
                                                else if (val > max) {
                                                    toast.error(`Only ${max} units available`);
                                                    setFieldValue('unit_count', max);
                                                } else {
                                                    setFieldValue('unit_count', val);
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 2. Payment Information */}
                            {(user && (user.role === UserRole.ADMIN || user.role === UserRole.MANAGER)) && (
                                <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
                                    <h2 className="text-xl font-medium text-zinc-800 mb-6 flex items-center gap-2">
                                        <span className="bg-green-50 text-green-600 p-1.5 rounded-lg"><MdOutlinePayments className="w-5 h-5" /></span>
                                        Payment Information
                                    </h2>

                                    <div className="space-y-6">
                                        {/* Status & Mark as Paid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-zinc-700">Booking Status</label>
                                                <div className="relative">
                                                    <CustomDropdown
                                                        selected={values.status}
                                                        handleSelection={(val) => setFieldValue('status', (val))}
                                                        options={Object.values(BookingStatus)}
                                                    />
                                                </div>
                                            </div>

                                            {values.status !== BookingStatus.CONFIRMED && (
                                                <div className="flex items-center h-full pt-6">
                                                    <div className="flex items-center gap-3 bg-zinc-50 p-3 rounded-lg border border-zinc-200 cursor-pointer hover:bg-zinc-100 transition-colors w-full"
                                                        onClick={() => setFieldValue('mark_as_paid', !values.mark_as_paid)}>
                                                        <input
                                                            type="checkbox"
                                                            className="w-4 h-4 text-primary rounded focus:ring-primary border-zinc-300"
                                                            checked={values.mark_as_paid}
                                                            onChange={() => { }}
                                                        />
                                                        <span className="text-sm font-medium text-zinc-700">Mark as Paid & Confirm</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Payment Details */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-zinc-700">Payment Method</label>
                                                <select
                                                    className="w-full h-12 px-3 border border-zinc-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                    value={values.payment_method}
                                                    onChange={(e) => setFieldValue('payment_method', e.target.value)}
                                                >
                                                    <option value="cash">Cash</option>
                                                    <option value="pos">POS</option>
                                                    <option value="bank_transfer">Bank Transfer</option>
                                                    <option value="online">Online / Other</option>
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-zinc-700">Proof of Payment</label>
                                                <div className="relative">
                                                    <input
                                                        type="file"
                                                        id="proof-upload-edit"
                                                        className="hidden"
                                                        accept="image/*,application/pdf"
                                                        onChange={handleFileUpload}
                                                        disabled={isUploading}
                                                    />
                                                    <label
                                                        htmlFor="proof-upload-edit"
                                                        className={`flex items-center justify-center gap-2 w-full h-12 border-2 border-dashed ${values.payment_proof_url ? 'border-primary bg-primary/5 text-primary' : 'border-zinc-300 text-zinc-500'} rounded-lg cursor-pointer hover:border-primary hover:text-primary transition-all text-sm font-medium`}
                                                    >
                                                        {isUploading ? <Spinner /> : (
                                                            <>
                                                                <HiOutlineCloudUpload className="text-lg" />
                                                                {values.payment_proof_url ? 'Change Receipt' : 'Upload Receipt'}
                                                            </>
                                                        )}
                                                    </label>
                                                    {values.payment_proof_url && (
                                                        <a
                                                            href={values.payment_proof_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="absolute -bottom-6 right-0 text-xs text-primary underline"
                                                        >
                                                            View Current Receipt
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-zinc-700">Payment Notes</label>
                                            <textarea
                                                className="w-full p-3 border border-zinc-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                                                placeholder="Enter any notes about this payment..."
                                                rows={3}
                                                value={values.payment_notes}
                                                onChange={(e) => setFieldValue('payment_notes', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* RIGHT COLUMN: SUMMARY (STICKY) */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-xl border border-zinc-200 shadow-lg p-6 sticky top-8">
                                <h3 className="text-lg font-semibold text-zinc-900 mb-6 border-b border-zinc-100 pb-4">Booking Summary</h3>

                                <div className="space-y-4 mb-8">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">Dates</span>
                                        <div className="text-right">
                                            {values.start_date && values.end_date ? (
                                                <>
                                                    <span className="block text-zinc-900 font-medium">{values.start_date}</span>
                                                    <span className="block text-zinc-400 text-xs">to {values.end_date}</span>
                                                </>
                                            ) : <span className="text-zinc-400">-</span>}
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">Duration</span>
                                        <span className="text-zinc-900 font-medium">
                                            {values.start_date && values.end_date
                                                ? `${getDayDifference(values.start_date, values.end_date)} Nights`
                                                : '-'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-500">Unit</span>
                                        <span className="text-zinc-900 font-medium text-right w-1/2 truncate">{details?.unit?.name}</span>
                                    </div>
                                </div>

                                {/* Pricing Breakdown */}
                                <div className="bg-zinc-50 rounded-lg p-4 mb-6 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-600">Rate (x{values.unit_count})</span>
                                        <span className="font-medium text-zinc-900">
                                            {formatMoney(Number(details?.unit?.pricePerNight ?? details?.unit?.price_per_night ?? 0) * values.unit_count)}
                                        </span>
                                    </div>
                                    <div className="border-t border-zinc-200 mt-2 pt-3 flex justify-between items-center">
                                        <span className="font-semibold text-zinc-900">Total</span>
                                        <span className="text-xl font-bold text-primary">{formatMoney(calculatedTotal)}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleSubmit()}
                                    disabled={!isValid || isPending || isUploading}
                                    className="w-full h-12 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                >
                                    {isPending ? <Spinner /> : (
                                        <>
                                            <span>Save Changes</span>
                                            <PriceTagIcon color="white" />
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={() => { removeParam('edit'); handleEditMode(false); }}
                                    className="w-full h-12 mt-3 bg-white border border-zinc-300 text-zinc-700 font-medium rounded-lg hover:bg-zinc-50 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
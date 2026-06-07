"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { formatMoney, formatDate, formatDateToYYYYMMDD } from "@/src/lib/utils";
import { 
    useBookingExtensions, 
    useRequestExtension, 
    useApproveExtension, 
    useRejectExtension, 
    useCancelExtension 
} from "@/src/hooks/useExtensions";
import { ExtensionStatus, UserRole } from "@/src/lib/enums";
import { usePermissions } from "@/src/hooks/usePermissions";
import { Skeleton } from "@/src/components/ui/skeleton";
import Modal from "../../modal/Modal";
import { toast } from "react-hot-toast";

interface BookingExtensionsProps {
    bookingId: string;
    currentEndDate: string;
    bookingStatus: string;
}

export default function BookingExtensions({ bookingId, currentEndDate, bookingStatus }: BookingExtensionsProps) {
    const { isAdmin, isOwner, isAgent } = usePermissions();
    const { data, isLoading } = useBookingExtensions(bookingId);
    
    const [requestModalOpen, setRequestModalOpen] = useState(false);
    const [newEndDate, setNewEndDate] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("online");
    const [markAsPaid, setMarkAsPaid] = useState(false);
    
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectingExtensionId, setRejectingExtensionId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState("");

    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [cancellingExtensionId, setCancellingExtensionId] = useState<string | null>(null);
    
    const requestExtension = useRequestExtension();
    const approveExtension = useApproveExtension();
    const rejectExtension = useRejectExtension();
    const cancelExtension = useCancelExtension();

    const formattedCurrentEndDate = currentEndDate ? formatDateToYYYYMMDD(currentEndDate) : "";

    const extensions = data?.items || [];

    const handleRequest = () => {
        if (!newEndDate) {
            toast.error("Please select a new end date");
            return;
        }
        requestExtension.mutate({
            bookingId,
            data: {
                new_end_date: newEndDate,
                payment_method: paymentMethod,
                mark_as_paid: isAdmin ? markAsPaid : undefined
            }
        }, {
            onSuccess: () => {
                setRequestModalOpen(false);
                setNewEndDate("");
            }
        });
    };

    const handleReject = () => {
        if (!rejectingExtensionId) return;
        rejectExtension.mutate({
            bookingId,
            extensionId: rejectingExtensionId,
            reason: rejectReason
        }, {
            onSuccess: () => {
                setRejectModalOpen(false);
                setRejectReason("");
                setRejectingExtensionId(null);
            }
        });
    };

    const handleCancel = () => {
        if (!cancellingExtensionId) return;
        cancelExtension.mutate({
            bookingId,
            extensionId: cancellingExtensionId
        }, {
            onSuccess: () => {
                setCancelModalOpen(false);
                setCancellingExtensionId(null);
            }
        });
    };

    const getStatusStyle = (status: ExtensionStatus) => {
        switch (status) {
            case ExtensionStatus.PENDING_PAYMENT: return "bg-amber-50 text-amber-600 border-amber-100";
            case ExtensionStatus.AWAITING_OWNER_APPROVAL: return "bg-purple-50 text-purple-600 border-purple-100";
            case ExtensionStatus.APPROVED: return "bg-blue-50 text-blue-600 border-blue-100";
            case ExtensionStatus.CONFIRMED: return "bg-green-50 text-green-600 border-green-100";
            case ExtensionStatus.REJECTED: return "bg-red-50 text-red-600 border-red-100";
            case ExtensionStatus.CANCELLED: return "bg-gray-50 text-gray-600 border-gray-100";
            default: return "bg-gray-50 text-gray-500";
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-sm sm:text-base font-semibold text-zinc-800">Stay Extensions</h3>
                {(isAdmin || isAgent || isOwner) && bookingStatus === "CHECKED_IN" && (
                    <button 
                        onClick={() => setRequestModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs hover:bg-primary/90 transition-colors shadow-sm"
                    >
                        <Icon icon="solar:calendar-add-bold" />
                        <span>Request Extension</span>
                    </button>
                )}
            </div>

            <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white shadow-sm">
                {isLoading ? (
                    <div className="p-4 space-y-3">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : extensions.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium uppercase tracking-wider">
                                <tr>
                                    <th className="px-4 py-3">ID</th>
                                    <th className="px-4 py-3">New End Date</th>
                                    <th className="px-4 py-3">Amount</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {extensions.map((ext) => (
                                    <tr key={ext.id} className="hover:bg-zinc-50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-zinc-900">{ext.extension_id}</td>
                                        <td className="px-4 py-3 text-zinc-600">{formatDate(ext.new_end_date)}</td>
                                        <td className="px-4 py-3 font-semibold text-zinc-800">{formatMoney(ext.extension_amount)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusStyle(ext.status)}`}>
                                                {ext.status.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end items-center gap-1.5">
                                                {(isAdmin || isOwner) && (ext.status === ExtensionStatus.AWAITING_OWNER_APPROVAL || ext.status === ExtensionStatus.PENDING_PAYMENT) && (
                                                    <>
                                                        <button 
                                                            onClick={() => approveExtension.mutate({ bookingId, extensionId: ext.id })}
                                                            disabled={approveExtension.isPending}
                                                            className="flex items-center gap-1 px-2 py-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-green-200 bg-green-50/30 text-[10px] font-bold uppercase disabled:opacity-50"
                                                            title="Approve"
                                                        >
                                                            <Icon icon="solar:check-circle-bold" width="14" />
                                                            <span>APPROVE</span>
                                                        </button>
                                                        <button 
                                                            onClick={() => {
                                                                setRejectingExtensionId(ext.id);
                                                                setRejectModalOpen(true);
                                                            }}
                                                            disabled={rejectExtension.isPending}
                                                            className="flex items-center gap-1 px-2 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200 bg-red-50/30 text-[10px] font-bold uppercase disabled:opacity-50"
                                                            title="Reject"
                                                        >
                                                            <Icon icon="solar:close-circle-bold" width="14" />
                                                            <span>REJECT</span>
                                                        </button>
                                                    </>
                                                )}
                                                {(isAdmin || isOwner) && (ext.status === ExtensionStatus.PENDING_PAYMENT || ext.status === ExtensionStatus.AWAITING_OWNER_APPROVAL || ext.status === ExtensionStatus.APPROVED) && (
                                                    <button 
                                                        onClick={() => {
                                                            setCancellingExtensionId(ext.id);
                                                            setCancelModalOpen(true);
                                                        }}
                                                        disabled={cancelExtension.isPending}
                                                        className="flex items-center gap-1 px-2 py-1.5 text-zinc-500 hover:bg-zinc-100 rounded-lg transition-colors border border-zinc-200 bg-zinc-50 text-[10px] font-bold uppercase disabled:opacity-50"
                                                        title="Cancel"
                                                    >
                                                        <Icon icon="solar:trash-bin-trash-bold" width="14" />
                                                        <span>CANCEL</span>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-8 text-center bg-zinc-50/50">
                        <Icon icon="solar:calendar-search-bold" className="mx-auto text-3xl text-zinc-300 mb-2" />
                        <p className="text-zinc-500 text-sm">No stay extensions requested for this booking.</p>
                    </div>
                )}
            </div>

            {/* Request Modal */}
            <Modal
                isOpen={requestModalOpen}
                onClose={() => setRequestModalOpen(false)}
                title="Request Stay Extension"
                content={
                    <div className="space-y-4">
                        <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex gap-3">
                            <Icon icon="solar:info-circle-bold" className="text-amber-500 text-lg flex-shrink-0" />
                            <div className="text-[11px] text-amber-700 leading-relaxed">
                                Current end date: <span className="font-bold">{formatDate(currentEndDate)}</span>. 
                                Extensions are subject to availability and property booking rules.
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">New Departure Date</label>
                            <input 
                                type="date" 
                                min={formattedCurrentEndDate}
                                value={newEndDate}
                                onChange={(e) => setNewEndDate(e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Payment Method</label>
                            <select 
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                            >
                                <option value="online">Online Payment</option>
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="cash">Cash (Direct)</option>
                            </select>
                        </div>

                        {isAdmin && (
                            <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer"
                                        checked={markAsPaid}
                                        onChange={(e) => setMarkAsPaid(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                                <div>
                                    <span className="block text-[11px] font-bold text-zinc-700">Mark as Paid</span>
                                    <span className="block text-[10px] text-zinc-500">Bypass payment gateway (Admin Only)</span>
                                </div>
                            </div>
                        )}
                    </div>
                }
                footer={
                    <div className="flex gap-2 justify-end w-full">
                        <button 
                            onClick={() => setRequestModalOpen(false)}
                            className="px-4 py-2 border border-zinc-300 rounded-xl text-xs sm:text-sm hover:bg-zinc-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleRequest}
                            disabled={requestExtension.isPending}
                            className="px-4 py-2 bg-primary text-white rounded-xl text-xs sm:text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center min-w-[120px]"
                        >
                            {requestExtension.isPending ? <Icon icon="line-md:loading-twotone-loop" /> : "Submit Request"}
                        </button>
                    </div>
                }
            />

            {/* Rejection Modal */}
            <Modal
                isOpen={rejectModalOpen}
                onClose={() => setRejectModalOpen(false)}
                title="Reject Extension Request"
                content={
                    <div className="space-y-3">
                        <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed font-medium">
                            Please provide a reason for rejecting this stay extension request.
                        </p>
                        <textarea
                            rows={4}
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="e.g., Property is booked for these dates."
                            className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 resize-none bg-zinc-50 font-medium transition-all"
                        />
                    </div>
                }
                footer={
                    <div className="flex gap-2 justify-end w-full">
                        <button 
                            onClick={() => setRejectModalOpen(false)}
                            className="px-4 py-2 border border-zinc-300 rounded-xl text-xs sm:text-sm hover:bg-zinc-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleReject}
                            disabled={rejectExtension.isPending || !rejectReason.trim()}
                            className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs sm:text-sm hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 disabled:opacity-50"
                        >
                            {rejectExtension.isPending ? "Rejecting..." : "Confirm Rejection"}
                        </button>
                    </div>
                }
            />

            {/* Cancel Modal */}
            <Modal
                isOpen={cancelModalOpen}
                onClose={() => setCancelModalOpen(false)}
                title="Cancel Extension"
                content={
                    <div className="space-y-3">
                        <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed font-medium">
                            Are you sure you want to cancel this extension request? This action cannot be undone.
                        </p>
                    </div>
                }
                footer={
                    <div className="flex gap-2 justify-end w-full">
                        <button 
                            onClick={() => setCancelModalOpen(false)}
                            className="px-4 py-2 border border-zinc-300 rounded-xl text-xs sm:text-sm hover:bg-zinc-50 transition-colors"
                        >
                            No, keep it
                        </button>
                        <button 
                            onClick={handleCancel}
                            disabled={cancelExtension.isPending}
                            className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs sm:text-sm hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 disabled:opacity-50 min-w-[120px]"
                        >
                             {cancelExtension.isPending ? <Icon icon="line-md:loading-twotone-loop" className="mx-auto" /> : "Yes, cancel extension"}
                        </button>
                    </div>
                }
            />
        </div>
    );
}

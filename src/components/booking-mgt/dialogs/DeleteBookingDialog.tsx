import React, { useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";

interface DeleteBookingDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    bookingId?: string;
    isPending?: boolean;
}

export default function DeleteBookingDialog({
    isOpen,
    onClose,
    onConfirm,
    bookingId,
    isPending = false,
}: DeleteBookingDialogProps) {
    const [reason, setReason] = useState("");

    const handleConfirm = () => {
        onConfirm(reason || "Deleted by admin");
        setReason("");
    };

    const handleCancel = () => {
        setReason("");
        onClose();
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent className="sm:max-w-[500px]">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-semibold text-gray-900">
                        Delete Booking?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-500 mt-2">
                        Are you sure you want to delete booking <strong>{bookingId}</strong>? This action cannot be undone.
                        The booking will be soft-deleted, and unit availability will be restored.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="mt-6 flex flex-col gap-2">
                    <label htmlFor="reason" className="text-sm font-medium text-gray-700">
                        Cancellation Reason (Optional)
                    </label>
                    <textarea
                        id="reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g., Guest requested cancellation, Double booking..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm min-h-[100px] outline-none"
                    />
                </div>

                <AlertDialogFooter className="mt-8 gap-3 sm:gap-0">
                    <AlertDialogCancel
                        onClick={handleCancel}
                        disabled={isPending}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        disabled={isPending}
                        className="bg-red-600 text-white hover:bg-red-700 border-none"
                    >
                        {isPending ? "Deleting..." : "Delete Booking"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

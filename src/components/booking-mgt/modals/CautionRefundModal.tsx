import { useState } from 'react';
import Modal from '../../modal/Modal';

interface CautionRefundModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (shouldRefund: boolean, notes: string) => void;
    isPending?: boolean;
}

export function CautionRefundModal({ isOpen, onClose, onConfirm, isPending }: CautionRefundModalProps) {
    const [shouldRefund, setShouldRefund] = useState(true);
    const [notes, setNotes] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(shouldRefund, notes);
    };

    const content = (
        <form onSubmit={handleSubmit} className="text-left">
            <p className="text-sm text-gray-500 mb-6 text-center">
                Please confirm the condition of the property. This action will be recorded and cannot be undone.
            </p>

            <div className="space-y-4">
                <div className="flex items-center justify-center gap-6 bg-gray-50 p-3 rounded-lg border border-gray-100 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="refund"
                            checked={shouldRefund}
                            onChange={() => setShouldRefund(true)}
                            className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300"
                        />
                        <span className="text-sm font-medium text-gray-700">Approve Refund</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="refund"
                            checked={!shouldRefund}
                            onChange={() => setShouldRefund(false)}
                            className="w-4 h-4 text-red-600 focus:ring-red-500 border-gray-300"
                        />
                        <span className="text-sm font-medium text-gray-700">Reject / Withhold</span>
                    </label>
                </div>

                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                        Notes / Condition Report <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="notes"
                        rows={4}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border resize-none"
                        placeholder={shouldRefund ? "Optional notes regarding Checkout..." : "Reason for withholding caution fee..."}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        required={!shouldRefund}
                    />
                </div>

                <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={onClose}
                        disabled={isPending}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className={`px-4 py-2 rounded-lg text-sm font-medium text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${shouldRefund
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-red-600 hover:bg-red-700'
                            }`}
                        disabled={isPending || (!shouldRefund && !notes.trim())}
                    >
                        {isPending ? 'Processing...' : shouldRefund ? 'Confirm Verification' : 'Confirm Withholding'}
                    </button>
                </div>
            </div>
        </form>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Verify Checkout & Caution Fee Action"
            content={content}
        />
    );
}

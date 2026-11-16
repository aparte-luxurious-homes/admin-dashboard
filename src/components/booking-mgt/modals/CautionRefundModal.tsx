import { useState } from 'react';
import Modal from '../../modal/Modal';

export type CautionRefundRecipient = 'GUEST' | 'AGENT' | 'OWNER';

export const CAUTION_REFUND_RECIPIENTS: { value: CautionRefundRecipient; label: string }[] = [
    { value: 'GUEST', label: 'Guest' },
    { value: 'AGENT', label: 'Agent' },
    { value: 'OWNER', label: 'Owner' },
];

export function cautionRefundRecipientLabel(value?: string | null): string {
    const match = CAUTION_REFUND_RECIPIENTS.find((r) => r.value === String(value || '').toUpperCase());
    return match ? match.label : '';
}

interface CautionRefundModalProps {
    isOpen: boolean;
    onClose: () => void;
    // `recipient` is null when the caution fee is withheld: nobody is refunded.
    onConfirm: (shouldRefund: boolean, notes: string, recipient: CautionRefundRecipient | null) => void;
    isPending?: boolean;
}

export function CautionRefundModal({ isOpen, onClose, onConfirm, isPending }: CautionRefundModalProps) {
    const [shouldRefund, setShouldRefund] = useState(true);
    const [notes, setNotes] = useState('');
    // No default: the admin must name who is paid before money moves.
    const [recipient, setRecipient] = useState<CautionRefundRecipient | ''>('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (shouldRefund && !recipient) return;
        onConfirm(shouldRefund, notes, shouldRefund ? (recipient as CautionRefundRecipient) : null);
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

                {shouldRefund && (
                    <div>
                        <label htmlFor="refund-recipient" className="block text-sm font-medium text-gray-700 mb-1">
                            Refund Recipient <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="refund-recipient"
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 border bg-white"
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value as CautionRefundRecipient | '')}
                            required
                        >
                            <option value="" disabled>
                                Select who receives the refund
                            </option>
                            {CAUTION_REFUND_RECIPIENTS.map((r) => (
                                <option key={r.value} value={r.value}>
                                    {r.label}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

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
                        disabled={isPending || (shouldRefund ? !recipient : !notes.trim())}
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

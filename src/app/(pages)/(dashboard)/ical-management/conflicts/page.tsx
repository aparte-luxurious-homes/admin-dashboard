"use client";

import { MESSAGES } from '@/src/lib/messages';
import { useState } from "react";
import { Icon } from "@iconify/react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { GetConflicts, ResolveConflict } from "@/src/lib/request-handlers/icalMgt";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useDispatch } from "react-redux";
import { showAlert } from "@/src/lib/slices/alertDialogSlice";

export default function PlatformConflictsPage() {
    const dispatch = useDispatch();
    const [page, setPage] = useState(1);
    const { data: conflictsData, isLoading } = GetConflicts("UNRESOLVED", page, 20);
    const { mutate: resolveConflict, isPending: isResolving } = ResolveConflict();

    const conflicts = conflictsData?.data?.data?.items || [];
    const totalPages = conflictsData?.data?.data?.pages || 1;

    const handleResolve = (conflictId: string) => {
        dispatch(
            showAlert({
                title: "Mark as Resolved?",
                description: "Are you sure this conflict has been handled manually?",
                confirmText: "Resolve",
                cancelText: "Cancel",
                onConfirm: () => {
                    resolveConflict(conflictId, {
                        onSuccess: () => toast.success(MESSAGES.MSG_CONFLICT_MARKED_AS_RESOLVED),
                        onError: () => toast.error(MESSAGES.MSG_FAILED_TO_RESOLVE_CONFLICT)
                    });
                }
            })
        );
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">iCal Conflicts</h1>
                    <p className="text-sm text-zinc-600 mt-1">Review and resolve double-bookings detected by iCal Sync.</p>
                </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-6 space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : conflicts.length === 0 ? (
                    <div className="p-12 text-center text-zinc-500">
                        <Icon icon="solar:shield-check-bold-duotone" className="text-5xl mx-auto mb-4 opacity-20 text-green-500" />
                        <p>No unresolved conflicts found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Unit ID</th>
                                    <th className="px-6 py-4">Aparte Booking ID</th>
                                    <th className="px-6 py-4">External UID</th>
                                    <th className="px-6 py-4">Detected At</th>
                                    <th className="px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {conflicts.map((conflict: any) => (
                                    <tr key={conflict.id} className="hover:bg-zinc-50">
                                        <td className="px-6 py-4 text-zinc-900 font-medium">
                                            {conflict.unit_id}
                                        </td>
                                        <td className="px-6 py-4 text-zinc-500">
                                            {conflict.aparte_booking_id}
                                        </td>
                                        <td className="px-6 py-4 text-zinc-500 max-w-[150px] truncate" title={conflict.external_uid}>
                                            {conflict.external_uid}
                                        </td>
                                        <td className="px-6 py-4 text-zinc-500">
                                            {format(new Date(conflict.created_at), 'PP p')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleResolve(conflict.id)}
                                                disabled={isResolving}
                                                className="px-3 py-1.5 bg-green-50 text-green-700 font-semibold rounded-lg hover:bg-green-100 disabled:opacity-50"
                                            >
                                                Resolve
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                
                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-zinc-200 flex justify-center gap-2">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-3 py-1 border rounded disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="px-3 py-1 text-zinc-600 text-sm">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-3 py-1 border rounded disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

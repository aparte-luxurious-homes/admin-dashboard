"use client";

import { useAdminReviews, useFlagReview, useUnflagReview, useRestoreReview, useRemoveReview } from "@/src/hooks/useReviews";
import { useState } from "react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Icon } from "@iconify/react";
import { DotsIcon, FilterIcon, SearchIcon, TrashIcon } from "@/src/components/icons";
import TablePagination from "@/src/components/TablePagination";
import { showAlert } from "@/src/lib/slices/alertDialogSlice";
import { useDispatch } from "react-redux";
import { toast } from "react-hot-toast";
import { useRef, useEffect } from "react";
import { usePermissions } from "@/src/hooks/usePermissions";

const ReviewsView = () => {
    const [page, setPage] = useState(1);
    const [propertyId, setPropertyId] = useState<string>("");
    const pageSize = 10;
    const dispatch = useDispatch();
    const { isAdmin } = usePermissions();

    const { data, isLoading, refetch } = useAdminReviews({
        page,
        size: pageSize,
        property_id: propertyId || undefined,
    });

    const { mutate: flagReview } = useFlagReview();
    const { mutate: unflagReview } = useUnflagReview();
    const { mutate: restoreReview } = useRestoreReview();
    const { mutate: removeReview } = useRemoveReview();

    const [selectedRow, setSelectedRow] = useState<number | null>(null);
    const [modalPosition, setModalPosition] = useState<{ top: number; left: number } | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    const handleDotsClick = (event: React.MouseEvent, index: number) => {
        event.stopPropagation();
        setSelectedRow(index);
        const rect = (event.target as HTMLElement).getBoundingClientRect();
        setModalPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX - 100 });
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                setSelectedRow(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const reviews = data?.items || [];
    const totalCount = data?.total || 0;

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Icon
                        key={star}
                        icon={star <= rating ? "mdi:star" : "mdi:star-outline"}
                        className={`w-4 h-4 ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="p-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gray-50/50">
                    <div className="flex justify-between items-center gap-4 flex-wrap mb-6">
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">Review & Rating Management</h1>
                            <p className="text-sm text-gray-500 mt-1">Monitor and moderate property reviews across the platform</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1 max-w-full sm:max-w-md relative">
                            <input
                                type="text"
                                value={propertyId}
                                onChange={(e) => setPropertyId(e.target.value)}
                                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                                placeholder="Filter by Property UUID..."
                            />
                            <SearchIcon className="absolute top-[50%] -translate-y-1/2 left-3 w-5" color="#9CA3AF" />
                        </div>
                        <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 shadow-sm">
                            Total Reviews: <span className="text-primary">{totalCount}</span>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="p-8 space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : reviews.length > 0 ? (
                        <table className="w-full text-left border-collapse text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200 uppercase tracking-wider text-xs">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-gray-700">Property</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700">User</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700">Rating</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700">Comment</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700 text-center">Status</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700">Date</th>
                                    <th className="px-6 py-4 font-semibold text-gray-700 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {reviews.map((review: any, index: number) => (
                                    <tr key={review.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900 truncate max-w-[150px]">
                                            {review.property_id}
                                        </td>
                                        <td className="px-6 py-4 text-gray-700 truncate max-w-[150px]">
                                            {review.user_id}
                                        </td>
                                        <td className="px-6 py-4">
                                            {renderStars(review.rating)}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 truncate max-w-[200px]" title={review.comment}>
                                            {review.comment || (
                                                <span className="text-gray-400 italic text-xs">No comment</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                {review.is_removed ? (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-700 font-bold uppercase">
                                                        Removed
                                                    </span>
                                                ) : review.is_flagged ? (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-100 text-red-700 font-bold uppercase">
                                                        Flagged
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-green-100 text-green-700 font-bold uppercase">
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-xs">
                                            {new Date(review.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end items-center" onClick={(e) => handleDotsClick(e, index)}>
                                                <DotsIcon className="w-5 cursor-pointer hover:text-primary transition-colors text-gray-400" />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 bg-white">
                            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                                <Icon icon="hugeicons:album-not-found-01" width="32" height="32" className="text-gray-300" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No reviews found</h3>
                            <p className="text-sm text-gray-500">Wait for guests to start sharing their experiences</p>
                        </div>
                    )}
                </div>

                {!isLoading && reviews.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center bg-gray-50/30">
                        <TablePagination
                            total={totalCount}
                            currentPage={page}
                            setPage={setPage}
                            itemsPerPage={pageSize}
                            firstPage={1}
                        />
                    </div>
                )}
            </div>

            {/* Context Menu */}
            {selectedRow !== null && modalPosition && (
                <div
                    ref={modalRef}
                    className="fixed bg-white shadow-xl rounded-lg z-50 border border-gray-200 overflow-hidden min-w-[150px] animate-in fade-in slide-in-from-right-2 duration-100"
                    style={{ top: modalPosition.top, left: modalPosition.left }}
                >
                    {isAdmin && (
                        <>
                            {!reviews[selectedRow].is_flagged ? (
                                <button
                                    className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 transition-colors border-b border-gray-100 group"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const review = reviews[selectedRow];
                                        dispatch(showAlert({
                                            title: "Flag Review",
                                            description: "Are you sure you want to flag this review? This will alert other users that it may contain inappropriate content.",
                                            confirmText: "Flag",
                                            cancelText: "Cancel",
                                            onConfirm: () => flagReview(review.id)
                                        }));
                                        setSelectedRow(null);
                                    }}
                                >
                                    <Icon icon="mdi:flag" className="text-gray-400 group-hover:text-amber-500" width="18" />
                                    <span>Flag Review</span>
                                </button>
                            ) : (
                                <button
                                    className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 transition-colors border-b border-gray-100 group"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const review = reviews[selectedRow];
                                        dispatch(showAlert({
                                            title: "Unflag Review",
                                            description: "Are you sure you want to unflag this review?",
                                            confirmText: "Unflag",
                                            cancelText: "Cancel",
                                            onConfirm: () => unflagReview(review.id)
                                        }));
                                        setSelectedRow(null);
                                    }}
                                >
                                    <Icon icon="mdi:flag-off" className="text-gray-400 group-hover:text-green-500" width="18" />
                                    <span>Unflag Review</span>
                                </button>
                            )}

                            {reviews[selectedRow].is_removed ? (
                                <button
                                    className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 transition-colors border-b border-gray-100 group last:border-b-0"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const review = reviews[selectedRow];
                                        dispatch(showAlert({
                                            title: "Restore Review",
                                            description: "Are you sure you want to restore this review? It will be visible on the platform again.",
                                            confirmText: "Restore",
                                            cancelText: "Cancel",
                                            onConfirm: () => restoreReview(review.id)
                                        }));
                                        setSelectedRow(null);
                                    }}
                                >
                                    <Icon icon="mdi:restore" className="text-gray-400 group-hover:text-blue-500" width="18" />
                                    <span>Restore Review</span>
                                </button>
                            ) : (
                                <button
                                    className="w-full flex items-center gap-2 px-4 py-3 hover:bg-red-50 cursor-pointer text-sm text-red-600 transition-colors border-b border-gray-100 group last:border-b-0"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const review = reviews[selectedRow];
                                        dispatch(showAlert({
                                            title: "Remove Review",
                                            description: "Are you sure you want to remove this review? This action is permanent and it will no longer be visible on the platform.",
                                            confirmText: "Remove",
                                            cancelText: "Cancel",
                                            onConfirm: () => removeReview(review.id)
                                        }));
                                        setSelectedRow(null);
                                    }}
                                >
                                    <Icon icon="mdi:trash-can" className="text-red-400 group-hover:text-red-600" width="18" />
                                    <span>Remove Review</span>
                                </button>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default ReviewsView;

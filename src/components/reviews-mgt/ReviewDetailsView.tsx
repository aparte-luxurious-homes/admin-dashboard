"use client";

import { useParams, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { ArrowIcon } from "@/src/components/icons";
import { useReviewDetails, useFlagReview, useRemoveReview } from "@/src/hooks/useReviews";
import Spinner from "@/src/components/ui/Spinner";
import { format } from "date-fns";
import toast from "react-hot-toast";

const ReviewDetailsView = () => {
    const { id } = useParams();
    const reviewId = id as string;
    const router = useRouter();

    const { data: reviewResponse, isLoading } = useReviewDetails(reviewId);
    const review = reviewResponse?.data;

    const flagMutation = useFlagReview();
    const removeMutation = useRemoveReview();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Spinner color="#124452" />
            </div>
        );
    }

    if (!review) {
        return (
            <div className="p-12 text-center bg-white rounded-3xl border border-zinc-100 shadow-sm">
                <Icon icon="solar:star-broken" className="mx-auto text-5xl text-zinc-200 mb-4" />
                <h3 className="text-xl font-bold text-zinc-900">Review not found</h3>
                <button onClick={() => router.back()} className="mt-4 text-primary font-bold hover:underline text-sm tracking-tight uppercase">
                    GO BACK
                </button>
            </div>
        );
    }

    const handleFlag = () => {
        if (window.confirm("Are you sure you want to flag this review as inappropriate?")) {
            flagMutation.mutate(reviewId);
        }
    };

    const handleRemove = () => {
        if (window.confirm("CRITICAL: This will PERMANENTLY remove this review. Continue?")) {
            removeMutation.mutate(reviewId, {
                onSuccess: () => router.push('/reviews')
            });
        }
    };

    return (
        <div className="space-y-6 px-4 py-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <button onClick={() => router.back()} className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline group">
                        <ArrowIcon className="w-3.5 h-3.5 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
                        BACK TO REVIEWS
                    </button>
                    <h1 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
                        Moderation Hub
                        <span className="text-sm font-bold text-zinc-400 bg-zinc-100 px-3 py-1 rounded-full px-2">#{reviewId.split('-')[0].toUpperCase()}</span>
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleFlag}
                        disabled={flagMutation.isPending || review.is_flagged}
                        className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-xs transition-all shadow-lg ${review.is_flagged ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed' : 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/20'}`}
                    >
                        <Icon icon="solar:danger-bold" width="18" />
                        {review.is_flagged ? 'FLAGGED' : 'FLAG CONTENT'}
                    </button>
                    <button 
                        onClick={handleRemove}
                        disabled={removeMutation.isPending}
                        className="flex items-center gap-2 px-5 py-3 bg-red-600 text-white hover:bg-red-700 rounded-2xl transition-all font-bold text-xs shadow-lg shadow-red-600/20"
                    >
                        <Icon icon="solar:trash-bin-trash-bold" width="18" />
                        PURGE REVIEW
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Content Card */}
                    <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-8 sm:p-12 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 text-zinc-50 opacity-10 select-none">
                            <Icon icon="solar:quote-bold" width="120" />
                        </div>
                        
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Icon 
                                        key={i} 
                                        icon="solar:star-bold" 
                                        className={`text-2xl ${i < review.rating ? 'text-amber-400' : 'text-zinc-100'}`} 
                                    />
                                ))}
                                <span className="ml-2 text-2xl font-black text-zinc-900">{review.rating.toFixed(1)}</span>
                            </div>

                            <p className="text-xl sm:text-2xl font-medium text-zinc-700 leading-relaxed italic pr-8">
                                "{review.comment || "The reviewer did not provide a written comment."}"
                            </p>

                            <div className="flex items-center gap-4 pt-4">
                                <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center text-white text-xl font-black">
                                    {String(review.user_id).charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-zinc-900 uppercase tracking-tight">Verified Guest</p>
                                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest leading-none">ID: {review.user_id}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Meta Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div className="bg-emerald-50/50 border border-emerald-100 rounded-3xl p-6 flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <Icon icon="solar:calendar-bold" width="24" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Submission Date</p>
                                <p className="text-sm font-bold text-zinc-900">{format(new Date(review.created_at), "MMMM d, yyyy")}</p>
                                <p className="text-[10px] text-zinc-400 font-bold">{format(new Date(review.created_at), "h:mm a")}</p>
                            </div>
                         </div>
                         <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6 flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                                <Icon icon="solar:home-bold" width="24" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Target Property</p>
                                <p className="text-sm font-bold text-zinc-900">ID: {review.property_id.split('-')[0].toUpperCase()}</p>
                                <p className="text-[10px] text-zinc-400 font-bold">Booking ref: {review.booking_id.split('-')[0].toUpperCase()}</p>
                            </div>
                         </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Security/Audit */}
                    <div className="bg-zinc-50 border border-zinc-200 rounded-[2rem] p-8 space-y-6 shadow-sm">
                        <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">Platform Integrity</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-zinc-600">Reported/Flagged</span>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded ${review.is_flagged ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                    {review.is_flagged ? 'YES' : 'CLEAN'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-zinc-600">Visibility</span>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded ${review.is_removed ? 'bg-zinc-400 text-white' : 'bg-primary/10 text-primary'}`}>
                                    {review.is_removed ? 'HIDDEN' : 'PUBLIC'}
                                </span>
                            </div>
                            <div className="pt-4 mt-4 border-t border-zinc-200">
                                <p className="text-[10px] leading-relaxed text-zinc-400 font-medium">
                                    Flagging a review will keep it public but mark it for moderator attention. Purging will remove it permanently for all users.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReviewDetailsView;

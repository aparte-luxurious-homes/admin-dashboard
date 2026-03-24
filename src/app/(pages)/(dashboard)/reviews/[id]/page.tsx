"use client";

import { useParams, useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { ArrowIcon } from "@/src/components/icons";
import { PAGE_ROUTES } from "@/src/lib/routes/page_routes";

const ReviewDetailsPage = () => {
    const { id } = useParams();
    const router = useRouter();

    return (
        <div className="p-6">
            <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary mb-6 transition-colors"
            >
                <ArrowIcon className="w-4 h-4" />
                <span>Back to Reviews</span>
            </button>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-500 mb-6">
                    <Icon icon="mdi:star-outline" width="40" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Review Summary: {id}</h1>
                <p className="text-gray-500 max-w-md mb-8">
                    Detailed review moderation and response tools are coming soon. Administrators will be able to directly reply to guests and manage content visibility.
                </p>
                <div className="flex gap-4">
                    <button 
                         onClick={() => router.push(PAGE_ROUTES.dashboard.reviews.base)}
                         className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors"
                    >
                        Return to List
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReviewDetailsPage;

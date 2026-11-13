"use client";

import { useAgentReferralStats } from "@/src/hooks/useReferrals";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Icon } from "@iconify/react";

const ReferralStatsPage = () => {
    const { data: stats, isLoading } = useAgentReferralStats();

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-xl font-semibold text-gray-900">Referral Performance</h1>
                <p className="text-sm text-gray-500 mt-1">Detailed breakdown of your referral impact and earnings</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <Icon icon="mdi:account-group" width="24" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Growth</span>
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Referrals</p>
                    {isLoading ? <Skeleton className="h-10 w-24 mb-6" /> : <p className="text-4xl font-bold text-gray-900 mb-6 tracking-tight">{stats?.total_referrals || 0}</p>}
                    <div className="pt-4 border-t border-gray-50 flex items-center gap-2">
                        <span className="text-xs text-green-600 font-bold flex items-center"><Icon icon="mdi:trending-up" className="mr-1" /> Active</span>
                        <span className="text-xs text-gray-400">program member</span>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
                            <Icon icon="mdi:calendar-check" width="24" />
                        </div>
                         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Revenue</span>
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Bookings via Referral</p>
                    {isLoading ? <Skeleton className="h-10 w-24 mb-6" /> : <p className="text-4xl font-bold text-gray-900 mb-6 tracking-tight">{stats?.total_bookings || 0}</p>}
                    <div className="pt-4 border-t border-gray-50">
                         <span className="text-xs text-gray-500">Contributing to platform volume</span>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                            <Icon icon="mdi:star-circle" width="24" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</span>
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Active Referrals</p>
                    {isLoading ? <Skeleton className="h-10 w-24 mb-6" /> : <p className="text-4xl font-bold text-gray-900 mb-6 tracking-tight">{stats?.active_referrals || 0}</p>}
                    <div className="pt-4 border-t border-gray-50">
                        <span className="text-xs text-blue-600 font-medium">Currently engaged on platform</span>
                    </div>
                </div>
            </div>
            
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 flex flex-col md:flex-row items-center gap-8">
                <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-50">
                    <Icon icon="mdi:trophy-variant" width="40" className="text-amber-500" />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Top Referrer Rewards</h3>
                    <p className="text-sm text-gray-600 max-w-md">Our high-performing agents enjoy exclusive bonuses and early access to premium features. Keep sharing your code!</p>
                </div>
                <div className="px-6 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 uppercase tracking-widest cursor-not-allowed opacity-60">
                    Details Coming Soon
                </div>
            </div>
        </div>
    );
};

export default ReferralStatsPage;

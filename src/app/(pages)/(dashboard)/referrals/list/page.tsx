"use client";

import { useMyReferrals, useAgentReferralStats } from "@/src/hooks/useReferrals";
import { useState } from "react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Icon } from "@iconify/react";
import TablePagination from "@/src/components/TablePagination";
import { toast } from "react-hot-toast";

const MyReferralsPage = () => {
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const { data: stats, isLoading: statsLoading } = useAgentReferralStats();
    const { data: myReferralsData, isLoading: referralsLoading } = useMyReferrals({
        page,
        size: pageSize,
    });

    const referrals = myReferralsData?.items || [];
    const totalCount = myReferralsData?.total || 0;

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-xl font-semibold text-gray-900">My Referrals</h1>
                <p className="text-sm text-gray-500 mt-1">Track people you've invited to the platform and rewards you've earned</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-primary/20 transition-all duration-200 group">
                    <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors duration-200">
                        <Icon icon="mdi:account-group" width="24" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Referrals</p>
                        <p className="text-2xl font-bold text-gray-900 leading-tight tracking-tight">{stats?.total_referrals || 0}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-primary/20 transition-all duration-200 group">
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors duration-200">
                        <Icon icon="mdi:account-star" width="24" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Active Referrals</p>
                        <p className="text-2xl font-bold text-gray-900 leading-tight tracking-tight">{stats?.active_referrals || 0}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:border-primary/20 transition-all duration-200 group">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                        <Icon icon="mdi:calendar-check" width="24" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Bookings Made</p>
                        <p className="text-2xl font-bold text-gray-900 leading-tight tracking-tight">{stats?.total_bookings || 0}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gray-50/50">
                    <h3 className="text-lg font-semibold text-gray-900">Registered Referrals</h3>
                    <p className="text-sm text-gray-500">List of users who joined using your referral code</p>
                </div>

                <div className="overflow-x-auto">
                    {referralsLoading ? (
                        <div className="p-8 space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : referrals.length > 0 ? (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200 font-semibold text-gray-700 uppercase tracking-wider text-xs">
                                <tr>
                                    <th className="px-6 py-4">Name</th>
                                    <th className="px-6 py-4">Email</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Joined On</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {referrals.map((item: any) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                                        <td className="px-6 py-4 text-gray-600">{item.email}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-50 text-indigo-700 font-bold uppercase ring-1 ring-inset ring-indigo-700/10">
                                                {item.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ring-1 ring-inset ${item.is_active ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-red-50 text-red-700 ring-red-600/20'}`}>
                                                {item.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500">
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="py-20 flex flex-col items-center justify-center text-gray-500">
                            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                                <Icon icon="mdi:account-off" width="32" className="text-gray-300" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No referrals yet</h3>
                            <p className="text-sm text-gray-500">Share your code to start building your network!</p>
                        </div>
                    )}
                </div>

                {!referralsLoading && referrals.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-200">
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
        </div>
    );
};

export default MyReferralsPage;

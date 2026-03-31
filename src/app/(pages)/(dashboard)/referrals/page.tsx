"use client";

import { useAdminReferralRelationships, useMyReferralInfo } from "@/src/hooks/useReferrals";
import { usePermissions } from "@/src/hooks/usePermissions";
import { useState } from "react";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Icon } from "@iconify/react";
import TablePagination from "@/src/components/TablePagination";
import { toast } from "react-hot-toast";

const ReferralsPage = () => {
    const { isAdmin, isAgent } = usePermissions();
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const { data: adminData, isLoading: adminLoading } = useAdminReferralRelationships({
        page,
        size: pageSize,
    });

    const { data: myReferralInfo, isLoading: infoLoading } = useMyReferralInfo();

    const stats = adminData?.total || 0;
    const relationships = adminData?.items || [];

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Referral Program</h1>
                    <p className="text-sm text-gray-500 mt-1">Track referrals and platform growth through our partner network</p>
                </div>
            </div>

            {/* Referral Code Card (For Agents/Admins) */}
            {myReferralInfo && (
                <div className="bg-primary rounded-2xl p-6 text-white shadow-lg shadow-primary/20 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                            <Icon icon="mdi:ticket-percent" width="28" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold">Your Referral Program</h2>
                            <p className="text-primary-foreground/80 text-sm">Share your code and earn rewards when others join Aparte</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white/10 p-2 rounded-xl backdrop-blur-md border border-white/20">
                        <div className="px-4 py-2 bg-white text-primary font-bold rounded-lg tracking-wider uppercase">
                            {myReferralInfo.code}
                        </div>
                        <button 
                            onClick={() => copyToClipboard(myReferralInfo.code)}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <Icon icon="mdi:content-copy" width="20" />
                        </button>
                    </div>
                </div>
            )}

            {isAdmin && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Referral Relationships</h3>
                        <p className="text-sm text-gray-500">Global view of all referred connections</p>
                    </div>

                    <div className="overflow-x-auto">
                        {adminLoading ? (
                            <div className="p-8 space-y-4">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ) : relationships.length > 0 ? (
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200 font-semibold text-gray-700 uppercase tracking-wider text-xs">
                                    <tr>
                                        <th className="px-6 py-4">Referrer</th>
                                        <th className="px-6 py-4">Referred User</th>
                                        <th className="px-6 py-4">Code Used</th>
                                        <th className="px-6 py-4 text-center">Date Joined</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {relationships.map((rel: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{rel.referrer_name}</div>
                                                <div className="text-xs text-gray-500 font-mono">{rel.referrer_id}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{rel.referred_user_name}</div>
                                                <div className="text-xs text-gray-500 font-mono">{rel.referred_user_id}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-bold uppercase tracking-wider">
                                                    {rel.referral_code_used}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center text-gray-500">
                                                {new Date(rel.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="py-20 flex flex-col items-center justify-center text-gray-500">
                                <Icon icon="mdi:account-group-outline" width="48" className="opacity-20 mb-2" />
                                <p>No referral relationships found yet</p>
                            </div>
                        )}
                    </div>

                    {!adminLoading && relationships.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-200">
                            <TablePagination
                                total={stats}
                                currentPage={page}
                                setPage={setPage}
                                itemsPerPage={pageSize}
                                firstPage={1}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ReferralsPage;

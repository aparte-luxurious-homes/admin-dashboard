"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { GetPlatformFeeds, ForcePollFeed, DisableFeed, EnableFeed } from "@/src/lib/request-handlers/icalMgt";
import { Skeleton } from "@/src/components/ui/skeleton";

export default function PlatformFeedsPage() {
    const [page, setPage] = useState(1);
    const { data: feedsData, isLoading } = GetPlatformFeeds("INBOUND", page, 20);
    const { mutate: forcePoll, isPending: isPolling } = ForcePollFeed();
    const { mutate: disableFeed, isPending: isDisabling } = DisableFeed();
    const { mutate: enableFeed, isPending: isEnabling } = EnableFeed();

    const feeds = feedsData?.data?.data?.items || [];
    const totalPages = feedsData?.data?.data?.pages || 1;

    const handleForcePoll = (feedId: string) => {
        forcePoll(feedId, {
            onSuccess: () => toast.success("Sync triggered successfully."),
            onError: () => toast.error("Failed to trigger sync.")
        });
    };

    const handleDisable = (feedId: string) => {
        disableFeed(feedId, {
            onSuccess: () => toast.success("Feed disabled."),
            onError: () => toast.error("Failed to disable feed.")
        });
    };

    const handleEnable = (feedId: string) => {
        enableFeed(feedId, {
            onSuccess: () => toast.success("Feed enabled."),
            onError: () => toast.error("Failed to enable feed.")
        });
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 w-full max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Platform Feeds</h1>
                    <p className="text-sm text-zinc-600 mt-1">Manage all inbound iCal syncs across the platform.</p>
                </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="p-6 space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                ) : feeds.length === 0 ? (
                    <div className="p-12 text-center text-zinc-500">
                        <Icon icon="solar:link-broken-bold-duotone" className="text-5xl mx-auto mb-4 opacity-20" />
                        <p>No platform feeds found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Unit / Label</th>
                                    <th className="px-6 py-4">URL</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Last Synced</th>
                                    <th className="px-6 py-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {feeds.map((feed: any) => (
                                    <tr key={feed.id} className="hover:bg-zinc-50">
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-zinc-900">{feed.label || 'Untitled'}</p>
                                            <p className="text-xs text-zinc-500">{feed.unit_id}</p>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-500 max-w-[200px] truncate" title={feed.url}>
                                            {feed.url}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                                                feed.last_status === 'OK' ? 'bg-green-100 text-green-700' :
                                                feed.last_status === 'BROKEN' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {feed.last_status || 'PENDING'}
                                            </span>
                                            {!feed.is_active && (
                                                <span className="ml-2 px-2 py-1 bg-zinc-100 text-zinc-600 rounded-full text-[10px] font-bold">DISABLED</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-zinc-500">
                                            {feed.last_polled_at ? format(new Date(feed.last_polled_at), 'PP p') : 'Never'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleForcePoll(feed.id)}
                                                    disabled={isPolling || !feed.is_active}
                                                    title="Force Sync"
                                                    className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 disabled:opacity-50"
                                                >
                                                    <Icon icon="solar:refresh-bold-duotone" />
                                                </button>
                                                {feed.is_active ? (
                                                    <button
                                                        onClick={() => handleDisable(feed.id)}
                                                        disabled={isDisabling}
                                                        title="Disable Feed"
                                                        className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 disabled:opacity-50"
                                                    >
                                                        <Icon icon="solar:forbidden-circle-bold-duotone" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleEnable(feed.id)}
                                                        disabled={isEnabling}
                                                        title="Enable Feed"
                                                        className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100 disabled:opacity-50"
                                                    >
                                                        <Icon icon="solar:check-circle-bold-duotone" />
                                                    </button>
                                                )}
                                            </div>
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

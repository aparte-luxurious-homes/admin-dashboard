import { MESSAGES } from '@/src/lib/messages';
import { useState } from "react";
import { Icon } from "@iconify/react";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { showAlert } from "@/src/lib/slices/alertDialogSlice";
import {
    GetOutboundUrl,
    RotateOutboundUrl,
    GetInboundFeeds,
    AddInboundFeed,
    SyncFeed,
    DeleteFeed
} from "@/src/lib/request-handlers/icalMgt";
import { Skeleton } from "../../ui/skeleton";
import { format } from "date-fns";

export default function CalendarSyncView({ unitId }: { unitId: string | number }) {
    const dispatch = useDispatch();

    // Outbound state
    const { data: outboundData, isLoading: isLoadingOutbound } = GetOutboundUrl(unitId);
    const { mutate: rotateOutbound, isPending: isRotating } = RotateOutboundUrl();
    const outboundUrl = outboundData?.data?.data?.feed_url || outboundData?.data?.data?.url || "";

    // Inbound state
    const { data: inboundData, isLoading: isLoadingInbound } = GetInboundFeeds(unitId);
    const { mutate: addFeed, isPending: isAdding } = AddInboundFeed();
    const { mutate: syncFeed, isPending: isSyncing } = SyncFeed();
    const { mutate: deleteFeed, isPending: isDeleting } = DeleteFeed();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newFeedUrl, setNewFeedUrl] = useState("");
    const [newFeedLabel, setNewFeedLabel] = useState("");

    const rawFeeds = inboundData?.data?.data || [];
    const feeds = Array.isArray(rawFeeds) ? rawFeeds.filter((feed: any) => feed.label) : [];

    const handleCopy = () => {
        if (!outboundUrl) return;
        navigator.clipboard.writeText(outboundUrl);
        toast.success(MESSAGES.MSG_LINK_COPIED_TO_CLIPBOARD);
    };

    const handleRotate = () => {
        dispatch(
            showAlert({
                title: "Are you sure?",
                description: "This will instantly break the sync with any external platforms (like Airbnb) where you previously pasted this link. You will need to copy the new link and update it everywhere.",
                confirmText: "Regenerate",
                cancelText: "Cancel",
                onConfirm: () => {
                    rotateOutbound(unitId, {
                        onSuccess: () => toast.success(MESSAGES.MSG_OUTBOUND_LINK_REGENERATED)
                    });
                }
            })
        );
    };

    const handleAddFeed = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFeedUrl || !newFeedLabel) return;
        addFeed({ unitId, payload: { url: newFeedUrl, label: newFeedLabel } }, {
            onSuccess: () => {
                toast.success(MESSAGES.MSG_FEED_ADDED_SUCCESSFULLY);
                setIsAddModalOpen(false);
                setNewFeedUrl("");
                setNewFeedLabel("");
            },
            onError: (err: any) => {
                const errMsg = err?.response?.data?.message || err?.response?.data?.detail || "Failed to add feed.";
                // If detail is an array (FastAPI validation error), extract the first message
                const finalMsg = Array.isArray(errMsg) ? errMsg[0]?.msg : errMsg;
                toast.error(typeof finalMsg === 'string' ? finalMsg : "Failed to add feed.");
            }
        });
    };

    const handleSync = (feedId: string | number) => {
        syncFeed({ unitId, feedId }, {
            onSuccess: () => toast.success(MESSAGES.MSG_FEED_SYNCED_SUCCESSFULLY),
            onError: (err: any) => {
                if (err?.response?.status === 429) {
                    toast.error(err?.response?.data?.message || "Please wait before syncing again.");
                } else {
                    toast.error(MESSAGES.MSG_FAILED_TO_SYNC_FEED);
                }
            }
        });
    };

    const handleDelete = (feedId: string | number) => {
        dispatch(
            showAlert({
                title: "Remove feed?",
                description: "This will remove the feed and all its imported blocked dates. This action cannot be undone.",
                confirmText: "Remove",
                cancelText: "Cancel",
                onConfirm: () => {
                    deleteFeed({ unitId, feedId }, {
                        onSuccess: () => toast.success(MESSAGES.MSG_FEED_REMOVED)
                    });
                }
            })
        );
    };

    return (
        <div className="space-y-8 mt-10">
            <h2 className="text-2xl font-bold text-zinc-900 border-b border-zinc-100 pb-4">
                Calendar Sync
            </h2>

            {/* Outbound Sync */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                    <Icon icon="solar:export-bold-duotone" className="text-primary text-2xl" />
                    <h3 className="text-lg font-bold text-zinc-900">Export Calendar (Outbound)</h3>
                </div>
                <p className="text-sm text-zinc-600 max-w-3xl">
                    Copy this link and paste it into external platforms like Airbnb or Booking.com so they can block dates when someone books on Aparte.
                </p>

                {isLoadingOutbound ? (
                    <Skeleton className="h-12 w-full" />
                ) : (
                    <div className="flex flex-col sm:flex-row gap-3 mt-4">
                        <input
                            type="text"
                            readOnly
                            value={outboundUrl || "No link generated yet"}
                            className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2 text-sm text-zinc-700 outline-none"
                        />
                        <button
                            onClick={handleCopy}
                            disabled={!outboundUrl}
                            className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-50"
                        >
                            Copy Link
                        </button>
                        <button
                            onClick={handleRotate}
                            disabled={isRotating}
                            className="px-4 py-2 border border-red-200 text-red-600 bg-red-50 rounded-lg font-semibold hover:bg-red-100 transition disabled:opacity-50"
                        >
                            {isRotating ? "..." : "Regenerate Link"}
                        </button>
                    </div>
                )}
            </div>

            {/* Inbound Sync */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Icon icon="solar:import-bold-duotone" className="text-primary text-2xl" />
                        <h3 className="text-lg font-bold text-zinc-900">Import Calendar (Inbound)</h3>
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-4 py-2 bg-zinc-900 text-white rounded-lg font-semibold text-sm hover:bg-zinc-800 transition"
                    >
                        Add Feed
                    </button>
                </div>
                <p className="text-sm text-zinc-600 max-w-3xl">
                    Paste links from external platforms here so Aparte can block those dates on your calendar to prevent double-bookings.
                </p>

                {isLoadingInbound ? (
                    <div className="space-y-2 mt-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ) : feeds.length === 0 ? (
                    <div className="py-10 text-center text-zinc-500 border border-dashed border-zinc-200 rounded-xl bg-zinc-50">
                        <p>No inbound feeds added yet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto mt-4">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold">
                                <tr>
                                    <th className="px-4 py-3 rounded-tl-lg">Label</th>
                                    <th className="px-4 py-3">URL</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Last Synced</th>
                                    <th className="px-4 py-3 rounded-tr-lg">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {feeds.map((feed: any) => (
                                    <tr key={feed.id} className="hover:bg-zinc-50">
                                        <td className="px-4 py-3 font-medium text-zinc-900">{feed.label}</td>
                                        <td className="px-4 py-3 text-zinc-500 max-w-[200px] truncate">{feed.url}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${feed.last_status === 'OK' ? 'bg-green-100 text-green-700' :
                                                    feed.last_status === 'BROKEN' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {feed.last_status || 'PENDING'}
                                            </span>
                                            {!feed.is_active && (
                                                <span className="ml-2 px-2 py-1 bg-zinc-100 text-zinc-600 rounded-full text-[10px] font-bold">DISABLED</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-zinc-500">
                                            {feed.last_polled_at ? format(new Date(feed.last_polled_at), 'PP p') : 'Never'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleSync(feed.id)}
                                                    disabled={isSyncing || !feed.is_active}
                                                    title="Sync Now"
                                                    className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 disabled:opacity-50"
                                                >
                                                    <Icon icon="solar:refresh-bold-duotone" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(feed.id)}
                                                    disabled={isDeleting}
                                                    title="Remove Feed"
                                                    className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 disabled:opacity-50"
                                                >
                                                    <Icon icon="solar:trash-bin-trash-bold-duotone" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Feed Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Add Inbound Feed</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                                <Icon icon="solar:close-circle-bold" className="text-2xl" />
                            </button>
                        </div>
                        <form onSubmit={handleAddFeed} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Label</label>
                                <input
                                    type="text"
                                    value={newFeedLabel}
                                    onChange={e => setNewFeedLabel(e.target.value)}
                                    placeholder="e.g., Airbnb"
                                    required
                                    className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Feed URL</label>
                                <input
                                    type="url"
                                    value={newFeedUrl}
                                    onChange={e => setNewFeedUrl(e.target.value)}
                                    placeholder="https://..."
                                    required
                                    className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 border border-zinc-200 text-zinc-700 rounded-lg hover:bg-zinc-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isAdding}
                                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                                >
                                    {isAdding ? "Adding..." : "Add Feed"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

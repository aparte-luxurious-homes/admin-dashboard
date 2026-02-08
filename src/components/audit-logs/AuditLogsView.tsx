"use client"

import { Skeleton } from "@/src/components/ui/skeleton";
import { useState, useEffect, useCallback } from "react";
import axiosRequest from "@/src/lib/api";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import { FilterIcon, SearchIcon } from "@/src/components/icons";
import TablePagination from "@/src/components/TablePagination";

interface AuditLog {
    id: string;
    userId?: string | null;
    userEmail?: string | null;
    userName?: string | null;
    action: string;
    requestId?: string | null;
    ipAddress?: string | null;
    deviceType?: string | null;
    urlAccessed?: string | null;
    createdAt: string;
}

const AuditLogsView = () => {
    const [data, setData] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchValue, setSearchValue] = useState<string>("");
    const [rowCount, setRowCount] = useState(0);
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const fetchAuditLogs = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axiosRequest.get("/admin/audit-logs", {
                params: {
                    page: page,
                    size: pageSize,
                    action: searchValue || undefined,
                },
            });
            const result = response.data.data;
            setData(result.data);
            setRowCount(result.meta.total);
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Failed to fetch audit logs");
        } finally {
            setLoading(false);
        }
    }, [page, searchValue]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchAuditLogs();
        }, 500); // Debounce search
        return () => clearTimeout(timer);
    }, [fetchAuditLogs]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchValue(e.target.value);
        setPage(1); // Reset to first page on search
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="p-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gray-50/50">
                    <div className="flex justify-between items-center gap-4 flex-wrap mb-6">
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">Audit Logs</h1>
                            <p className="text-sm text-gray-500 mt-1">Track and monitor all system activities</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex-1 max-w-md relative">
                            <input
                                type="text"
                                value={searchValue}
                                onChange={handleSearchChange}
                                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                                placeholder="Search by action..."
                            />
                            <SearchIcon className="absolute top-[50%] -translate-y-1/2 left-3 w-5" color="#9CA3AF" />
                        </div>
                        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700 font-medium">
                            <FilterIcon className="w-4 h-4" color="#6B7280" />
                            <span>Filter</span>
                        </button>
                        <div className="ml-auto bg-white px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 shadow-sm">
                            Total Logs: <span className="text-primary">{rowCount}</span>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-8 space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : data.length > 0 ? (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    <th className="px-6 py-4">Timestamp</th>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Action</th>
                                    <th className="px-6 py-4">IP Address</th>
                                    <th className="px-6 py-4">Device</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {data.map((log) => (
                                    <tr
                                        key={log.id}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {formatDate(log.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="flex flex-col">
                                                {log.userName ? (
                                                    <>
                                                        <span className="font-medium text-gray-900">{log.userName}</span>
                                                        <span className="text-xs text-gray-500">{log.userEmail || "--"}</span>
                                                    </>
                                                ) : log.userEmail ? (
                                                    <span className="font-medium text-gray-900">{log.userEmail}</span>
                                                ) : (
                                                    <span className="text-gray-500">System</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            <div className="max-w-md">
                                                {log.action}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {log.ipAddress || "--"}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            <div className="max-w-xs truncate" title={log.deviceType || "--"}>
                                                {log.deviceType || "--"}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                <Icon icon="hugeicons:album-not-found-01" width="32" height="32" className="text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No audit logs found</h3>
                            <p className="text-sm text-gray-500">Try adjusting your search</p>
                        </div>
                    )}
                </div>

                {!loading && data.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-200">
                        <TablePagination
                            total={rowCount}
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

export default AuditLogsView;

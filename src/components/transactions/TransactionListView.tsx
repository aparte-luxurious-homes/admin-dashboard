"use client"

import { Skeleton } from "@/src/components/ui/skeleton";
import { useState, useEffect, useCallback, useRef } from "react";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import axiosRequest from "@/src/lib/api";
import Badge from "@/src/components/badge";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import { DotsIcon, FilterIcon, SearchIcon } from "@/src/components/icons";
import TablePagination from "@/src/components/TablePagination";
import { LuEye } from "react-icons/lu";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";
import { formatDate, formatMoney } from "@/src/lib/utils";

interface Transaction {
    id: string;
    user_id: string | number;
    amount: string | number;
    currency: string;
    transaction_type: string;
    action: string;
    status: string;
    created_at: string;
    reference: string;
    user?: {
        email: string;
        first_name?: string;
        last_name?: string;
        firstName?: string;
        lastName?: string;
    };
    customer_email?: string;
    customerEmail?: string;
}

interface TransactionListViewProps {
    title: string;
    description: string;
    basePath: string; // e.g., "/transactions/payments"
    apiUrl: string;   // e.g., API_ROUTES.payments.base
    filters?: {
        tx_type?: string;
        action?: string;
    };
}

const TransactionListView = ({ title, description, basePath, apiUrl, filters }: TransactionListViewProps) => {
    const router = useRouter();
    const [data, setData] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchValue, setSearchValue] = useState<string>("");
    const [rowCount, setRowCount] = useState(0);
    const [page, setPage] = useState(1);
    const pageSize = 10;

    const [isOpen, setIsOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState<number | null>(null);
    const [modalPosition, setModalPosition] = useState<{ top: number; left: number } | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    const handleDownload = (type: "CSV" | "PDF") => {
        if (type === "CSV") {
            downloadCSV(data);
        } else if (type === "PDF") {
            downloadPDF(data);
        }
        setIsOpen(false);
    };

    const downloadCSV = (data: Transaction[]) => {
        if (!data.length) return;
        const headers = ["ID", "User ID", "Email", "Type", "Action", "Amount", "Status", "Date"];
        const csvContent = data.map(tx => [
            tx.id,
            tx.user_id,
            tx.user?.email || tx.customer_email || tx.customerEmail || "",
            tx.transaction_type,
            tx.action,
            `${tx.currency} ${tx.amount}`,
            tx.status,
            tx.created_at
        ].map(value => `"${value}"`).join(","));
        const csvString = [headers.join(","), ...csvContent].join("\n");
        const blob = new Blob([csvString], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${title.toLowerCase().replace(/\s+/g, '_')}_export.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const downloadPDF = (data: Transaction[]) => {
        if (!data.length) return;
        const doc = new jsPDF();
        doc.text(`${title} Report`, 10, 10);
        const headers = ["ID", "Email", "Type", "Amount", "Status", "Date"];
        const rows = data.map(tx => [
            String(tx.id).substring(0, 8),
            tx.user?.email || tx.customer_email || tx.customerEmail || "--",
            tx.transaction_type || "--",
            `${tx.currency} ${Number(tx.amount).toLocaleString()}`,
            tx.status || "--",
            tx.created_at ? new Date(tx.created_at).toLocaleDateString() : "--"
        ]);
        autoTable(doc, {
            head: [headers],
            body: rows,
            styles: { fontSize: 8, cellPadding: 2 },
            theme: "grid",
        });
        doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}_export.pdf`);
    };

    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axiosRequest.get(apiUrl, {
                params: {
                    page: page,
                    size: pageSize,
                    search: searchValue || undefined,
                    tx_type: filters?.tx_type,
                    action: filters?.action,
                },
            });

            // Handle both direct array and paginated response
            const responseData = response.data.data;
            let items = [];
            let total = 0;

            if (responseData.items && Array.isArray(responseData.items)) {
                items = responseData.items;
                total = responseData.total || responseData.meta?.total || items.length;
            } else if (Array.isArray(responseData)) {
                items = responseData;
                total = items.length;
            } else if (responseData.data && Array.isArray(responseData.data)) {
                items = responseData.data;
                total = responseData.meta?.total || items.length;
            }

            setData(items);
            setRowCount(total);
        } catch (err: any) {
            toast.error(err.response?.data?.message || `Failed to fetch transactions`);
        } finally {
            setLoading(false);
        }
    }, [page, searchValue, apiUrl, filters]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTransactions();
        }, 500);
        return () => clearTimeout(timer);
    }, [fetchTransactions]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchValue(e.target.value);
        setPage(1);
    };

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

    const detailButtons = [
        {
            label: "View Details",
            Icon: <LuEye />,
            onClick: () => {
                if (selectedRow !== null) {
                    router.push(`${basePath}/${data[selectedRow].id}`);
                }
                setSelectedRow(null);
            },
        }
    ];

    return (
        <div className="p-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden text-black">
                <div className="p-6 border-b border-gray-200 bg-gray-50/50">
                    <div className="flex justify-between items-center gap-4 flex-wrap mb-6">
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
                            <p className="text-sm text-gray-500 mt-1">{description}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <button
                                    onClick={() => setIsOpen(!isOpen)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700 font-medium"
                                >
                                    <Icon icon="mdi:printer" className="w-4 h-4" />
                                    <span>Export</span>
                                </button>
                                {isOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-20 overflow-hidden">
                                        <button onClick={() => handleDownload("CSV")} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors border-b border-gray-100">Export as CSV</button>
                                        <button onClick={() => handleDownload("PDF")} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors">Export as PDF</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex-1 max-w-md relative">
                            <input
                                type="text"
                                value={searchValue}
                                onChange={handleSearchChange}
                                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm bg-white"
                                placeholder="Search by reference or user ID..."
                            />
                            <SearchIcon className="absolute top-[50%] -translate-y-1/2 left-3 w-5" color="#9CA3AF" />
                        </div>
                        <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700 font-medium bg-white">
                            <FilterIcon className="w-4 h-4" color="#6B7280" />
                            <span>Filter</span>
                        </button>
                        <div className="ml-auto bg-white px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 shadow-sm">
                            Total Records: <span className="text-primary">{rowCount}</span>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
                    {loading ? (
                        <div className="p-8 space-y-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    ) : data.length > 0 ? (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                                    <th className="px-6 py-4">Transaction ID</th>
                                    <th className="px-6 py-4">Customer Email</th>
                                    <th className="px-6 py-4">Type / Action</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4">Date Created</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {data.map((tx, index) => (
                                    <tr
                                        key={tx.id}
                                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={() => router.push(`${basePath}/${tx.id}`)}
                                    >
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            {tx.reference?.substring(0, 18) || String(tx.id).substring(0, 8)}...
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-gray-900">{tx.user?.email || tx.customer_email || tx.customerEmail || "--/--"}</span>
                                                <span className="text-[10px] text-gray-500 font-mono uppercase">UID: {tx.user_id}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-gray-900">{tx.transaction_type}</span>
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${tx.action === 'CREDIT' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                                    {tx.action}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                                            {formatMoney(tx.amount)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Badge status={tx.status?.toLowerCase()} />
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {tx.created_at ? formatDate(tx.created_at) : "--/--"}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end items-center" onClick={(event) => handleDotsClick(event, index)}>
                                                <DotsIcon className="w-5 cursor-pointer hover:text-primary transition-colors text-gray-400" />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 px-4">
                            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                                <Icon icon="hugeicons:album-not-found-01" width="32" height="32" className="text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No transactions found</h3>
                            <p className="text-sm text-gray-500 max-w-xs text-center">We couldn't find any transaction records matching your current filters.</p>
                        </div>
                    )}
                </div>

                {!loading && data.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/30">
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

            {/* Context Menu */}
            {selectedRow !== null && modalPosition && (
                <div
                    ref={modalRef}
                    className="fixed bg-white shadow-xl rounded-lg z-50 border border-gray-200 overflow-hidden min-w-[150px]"
                    style={{ top: modalPosition.top, left: modalPosition.left }}
                >
                    {detailButtons.map((button, idx) => (
                        <button
                            key={idx}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 transition-colors border-b last:border-b-0 border-gray-100"
                            onClick={(e) => {
                                e.stopPropagation();
                                button.onClick();
                            }}
                        >
                            <span className="text-gray-400 text-lg">{button.Icon}</span>
                            <span className="font-medium">{button.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TransactionListView;

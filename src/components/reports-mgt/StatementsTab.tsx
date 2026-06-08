"use client";

import React, { useState } from "react";
import { GetStatements, downloadReportFile } from "@/src/lib/request-handlers/reportsMgt";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import toast from "react-hot-toast";
import { FiDownload } from "react-icons/fi";
import { format } from "date-fns";
import TablePagination from "@/src/components/TablePagination";
import Spinner from "@/src/components/ui/Spinner";

interface IStatement {
    year: number;
    month: number;
    status: string;
    delivered_at: string;
    bookings_count?: number;
    gross_revenue?: number;
    net_to_wallet?: number;
}

export default function StatementsTab() {
    const { data: statementsData, isLoading, error } = GetStatements();
    const statements: IStatement[] = statementsData?.data?.data || [];
    
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleDownload = async (year: number, month: number, formatType: 'pdf' | 'csv') => {
        const id = `${year}-${month}-${formatType}`;
        try {
            setDownloadingId(id);
            const url = API_ROUTES.reports.statements.download(year, month);
            
            // Format month name for filename
            const date = new Date(year, month - 1);
            const monthName = format(date, "MMMM");
            const filename = `Statement_${monthName}_${year}.${formatType}`;
            
            await downloadReportFile(url, formatType, filename);
            toast.success(`${formatType.toUpperCase()} downloaded successfully`);
        } catch (err: any) {
            console.error("Download failed:", err);
            const errorMsg = err?.response?.data?.message || err?.message || "Failed to download statement";
            toast.error(errorMsg);
        } finally {
            setDownloadingId(null);
        }
    };

    const paginatedStatements = statements.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Past Statements</h2>
                        <p className="text-sm text-gray-500">Download statements for any past month.</p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <Spinner className="w-8 h-8 text-primary" />
                    </div>
                ) : error ? (
                    <div className="text-red-500 py-4">Failed to load statements. Please try again later.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 rounded-tl-lg">Month</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Delivered On</th>
                                    <th className="px-6 py-4 rounded-tr-lg text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedStatements.length > 0 ? (
                                    paginatedStatements.map((stmt, index) => {
                                        const date = new Date(stmt.year, stmt.month - 1);
                                        const monthYear = format(date, "MMMM yyyy");
                                        const deliveredDate = stmt.delivered_at ? format(new Date(stmt.delivered_at), "d MMM yyyy, hh:mm a") : "—";
                                        
                                        return (
                                            <tr key={`${stmt.year}-${stmt.month}-${index}`} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-gray-900">{monthYear}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                                                        stmt.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : 
                                                        stmt.status === 'FAILED' ? 'bg-red-100 text-red-700' : 
                                                        'bg-gray-100 text-gray-700'
                                                    }`}>
                                                        {stmt.status || 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-500">{deliveredDate}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <button 
                                                            onClick={() => handleDownload(stmt.year, stmt.month, 'pdf')}
                                                            disabled={downloadingId === `${stmt.year}-${stmt.month}-pdf`}
                                                            className="flex items-center gap-1.5 text-primary hover:text-primary/80 disabled:opacity-50 text-sm font-medium transition-colors"
                                                        >
                                                            {downloadingId === `${stmt.year}-${stmt.month}-pdf` ? (
                                                                <Spinner className="w-4 h-4" />
                                                            ) : (
                                                                <FiDownload className="w-4 h-4" />
                                                            )}
                                                            PDF
                                                        </button>
                                                        <span className="text-gray-300">|</span>
                                                        <button 
                                                            onClick={() => handleDownload(stmt.year, stmt.month, 'csv')}
                                                            disabled={downloadingId === `${stmt.year}-${stmt.month}-csv`}
                                                            className="flex items-center gap-1.5 text-primary hover:text-primary/80 disabled:opacity-50 text-sm font-medium transition-colors"
                                                        >
                                                            {downloadingId === `${stmt.year}-${stmt.month}-csv` ? (
                                                                <Spinner className="w-4 h-4" />
                                                            ) : (
                                                                <FiDownload className="w-4 h-4" />
                                                            )}
                                                            CSV
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                                            No statements available.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        
                        {statements.length > 0 && (
                            <TablePagination
                                component="div"
                                count={statements.length}
                                page={page}
                                onPageChange={handleChangePage}
                                rowsPerPage={rowsPerPage}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                                rowsPerPageOptions={[10, 25, 50]}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

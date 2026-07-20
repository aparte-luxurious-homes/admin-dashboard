"use client";

import React, { useState } from "react";
import { requestReportDownload } from "@/src/lib/request-handlers/reportsMgt";
import { GetAllProperties } from "@/src/lib/request-handlers/propertyMgt";
import { API_ROUTES } from "@/src/lib/routes/endpoints";
import toast from "react-hot-toast";
import { FiDownload } from "react-icons/fi";
import Spinner from "@/src/components/ui/Spinner";
import { UserRole } from "@/src/lib/enums";
import { useAuth } from "@/src/hooks/useAuth";

export default function BookingReportsTab({ targetOwnerId }: { targetOwnerId?: string }) {
    const { user } = useAuth();
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [propertyId, setPropertyId] = useState("");
    const [status, setStatus] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("");
    
    const [exportingFormat, setExportingFormat] = useState<string | null>(null);

    // Fetch properties for the dropdown
    const { data: propertiesData } = GetAllProperties(1, 100, "", user?.role as UserRole, user?.id);
    const properties = propertiesData?.data?.data?.items || [];

    const handleExport = async (formatType: 'pdf' | 'csv' | 'xlsx') => {
        try {
            setExportingFormat(formatType);
            
            // Build query params
            const queryParams = new URLSearchParams({ format: formatType });
            if (startDate) queryParams.append("start_date", startDate);
            if (endDate) queryParams.append("end_date", endDate);
            if (propertyId) queryParams.append("property_id", propertyId);
            if (status) queryParams.append("status", status);
            if (paymentMethod) queryParams.append("payment_method", paymentMethod);
            if (targetOwnerId) queryParams.append("target_owner_id", targetOwnerId);
            
            const baseUrl = user?.role === 'AGENT' 
                ? API_ROUTES.agents.bookings.export 
                : API_ROUTES.reports.bookings.export;
            const url = `${baseUrl}?${queryParams.toString()}`;
            
            await requestReportDownload(url, formatType);
            toast.success(`${formatType.toUpperCase()} export generated successfully`);
        } catch (err: any) {
            console.error("Export failed:", err);
            const errorMsg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || "Failed to export report";
            toast.error(errorMsg);
        } finally {
            setExportingFormat(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Generate Booking Report</h2>
                    <p className="text-sm text-gray-500">Customize your report using the filters below.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {/* Date Range */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Start Date</label>
                        <input 
                            type="date" 
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">End Date</label>
                        <input 
                            type="date" 
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                        />
                    </div>

                    {/* Property Filter */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Property</label>
                        <select 
                            value={propertyId}
                            onChange={(e) => setPropertyId(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                        >
                            <option value="">All Properties</option>
                            {properties.map((p: any) => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Booking Status</label>
                        <select 
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                        >
                            <option value="">All Statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="CANCELLED">Cancelled</option>
                            <option value="COMPLETED">Completed</option>
                        </select>
                    </div>

                    {/* Payment Method Filter */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-gray-700">Payment Method</label>
                        <select 
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                        >
                            <option value="">All Payment Methods</option>
                            <option value="PAYSTACK">Paystack</option>
                            <option value="TRANSFER">Bank Transfer</option>
                            <option value="CASH">Cash</option>
                            <option value="POS">POS</option>
                        </select>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-4 pt-6 border-t border-gray-100">
                    <span className="text-sm font-medium text-gray-700 mr-2">Export As:</span>
                    
                    <button 
                        onClick={() => handleExport('pdf')}
                        disabled={!!exportingFormat}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-700 rounded-md shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors text-sm font-medium"
                    >
                        {exportingFormat === 'pdf' ? <Spinner width="16" height="16" color="currentColor" /> : <FiDownload className="w-4 h-4" />}
                        Export to PDF
                    </button>
                    
                    <button 
                        onClick={() => handleExport('csv')}
                        disabled={!!exportingFormat}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-green-200 text-green-700 rounded-md shadow-sm hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors text-sm font-medium"
                    >
                        {exportingFormat === 'csv' ? <Spinner width="16" height="16" color="currentColor" /> : <FiDownload className="w-4 h-4" />}
                        Export to CSV
                    </button>
                    
                    <button 
                        onClick={() => handleExport('xlsx')}
                        disabled={!!exportingFormat}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-md shadow-sm hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors text-sm font-medium"
                    >
                        {exportingFormat === 'xlsx' ? <Spinner width="16" height="16" color="currentColor" /> : <FiDownload className="w-4 h-4" />}
                        Export to Excel (.xlsx)
                    </button>
                </div>
            </div>
        </div>
    );
}

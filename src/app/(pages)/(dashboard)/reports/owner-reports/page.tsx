"use client";

import React, { useState } from "react";
import BookingReportsTab from "@/src/components/reports-mgt/BookingReportsTab";
import StatementsTab from "@/src/components/reports-mgt/StatementsTab";
import { InfoIcon } from "lucide-react";

type TabId = 'reports' | 'statements';

export default function OwnerReportsPage() {
    const [activeTab, setActiveTab] = useState<TabId>('reports');

    const tabs = [
        { id: 'reports', label: 'Booking Reports' },
        { id: 'statements', label: 'Statements' },
    ] as const;

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {activeTab === 'reports' ? 'Reports' : 'Statements'}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {activeTab === 'reports' 
                            ? 'Generate and download reports of your bookings. Use filters below to customize your report.'
                            : 'View and download your monthly statements. Statements are automatically generated on the 1st of each month for the previous month\'s activity.'}
                    </p>
                </div>
                
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 transition-colors shrink-0">
                    <InfoIcon className="w-4 h-4" />
                    How {activeTab === 'reports' ? 'reports' : 'statements'} work
                </button>
            </div>

            {/* Custom Tab Navigation */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                                    ${isActive 
                                        ? 'border-primary text-primary' 
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }
                                `}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-4">
                {activeTab === 'reports' && <BookingReportsTab />}
                {/* StatementsTab only mounts when activeTab === 'statements', ensuring data isn't fetched prematurely */}
                {activeTab === 'statements' && <StatementsTab />}
            </div>
        </div>
    );
}

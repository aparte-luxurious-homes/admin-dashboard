'use client'

import Dashboard from "@/src/layouts/dashboard";
import MobileOverlay from "@/src/components/MobileOverlay";
import { Suspense } from "react";
import Loader from "@/src/components/loader";
import 'swiper/css';
import 'swiper/css/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <main className="max-w-[1920] mx-auto w-full bg-background text-zinc-900">
            <MobileOverlay />
            <Dashboard>
                <Suspense fallback={<Loader message="Loading..." />}>
                    <div className="animate-fadeIn">
                        {children}
                    </div>
                </Suspense>
            </Dashboard>
        </main>
    );
}
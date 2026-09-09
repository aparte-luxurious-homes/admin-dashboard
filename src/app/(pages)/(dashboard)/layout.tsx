'use client'

import Dashboard from "@/src/layouts/dashboard";
import MobileOverlay from "@/src/components/MobileOverlay";
import AgentAccessGate from "@/src/components/auth/AgentAccessGate";
import { Suspense } from "react";
import Loader from "@/src/components/loader";
import 'swiper/css';
import 'swiper/css/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <main className="max-w-[1920px] mx-auto w-full bg-background text-zinc-900">
            <MobileOverlay />
            <AgentAccessGate>
                <Dashboard>
                    <Suspense fallback={<Loader message="Loading..." />}>
                        <div className="animate-fadeIn">
                            {children}
                        </div>
                    </Suspense>
                </Dashboard>
            </AgentAccessGate>
        </main>
    );
}
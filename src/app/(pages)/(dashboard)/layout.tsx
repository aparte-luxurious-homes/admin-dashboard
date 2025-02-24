import Dashboard from "@/src/layouts/dashboard";
import 'swiper/css';
import 'swiper/css/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <main className="max-w-[1920] mx-auto w-full bg-background text-zinc-900">
            <Dashboard>
                {children}
            </Dashboard>
        </main>
    );
};
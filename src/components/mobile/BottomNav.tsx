"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useMobileMenu } from "../../contexts/MobileMenuContext";
import { UserRole } from "@/lib/enums";
import { TilesIcon, PropertiesIcon, BookingIcon, FinancialsIcon } from "@/components/icons";
import { IoMenu } from "react-icons/io5";
import { PAGE_ROUTES } from "@/lib/routes/page_routes";

interface NavItem {
  label: string;
  href: string;
  pathMatch: string;
  icon: (active: boolean) => React.ReactNode;
}

const BOTTOM_NAV_ITEMS: NavItem[] = [
  {
    label: "Home",
    href: PAGE_ROUTES.dashboard.base,
    pathMatch: "/",
    icon: (active) => <TilesIcon className="w-5" color={active ? "#124452" : "#9ca3af"} />,
  },
  {
    label: "Properties",
    href: PAGE_ROUTES.dashboard.propertyManagement.allProperties.base,
    pathMatch: "/property-management",
    icon: (active) => <PropertiesIcon className="w-5" color={active ? "#124452" : "#9ca3af"} />,
  },
  {
    label: "Bookings",
    href: PAGE_ROUTES.dashboard.bookingManagement.bookings.base,
    pathMatch: "/booking-management",
    icon: (active) => <BookingIcon className="w-5" color={active ? "#124452" : "#9ca3af"} />,
  },
  {
    label: "Wallet",
    href: PAGE_ROUTES.dashboard.wallet.base,
    pathMatch: "/wallet",
    icon: (active) => <FinancialsIcon className="w-5" color={active ? "#124452" : "#9ca3af"} />,
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { open } = useMobileMenu();

  const showWallet = user?.role === UserRole.OWNER || user?.role === UserRole.AGENT;

  const items = BOTTOM_NAV_ITEMS.filter((item) => {
    if (item.pathMatch === "/wallet" && !showWallet) return false;
    return true;
  });

  const isActive = (item: NavItem) => {
    if (item.pathMatch === "/") return pathname === "/";
    return pathname.startsWith(item.pathMatch);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16">
        {items.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.pathMatch}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full gap-0.5 transition-colors ${
                active ? "text-primary" : "text-gray-400"
              }`}
            >
              {item.icon(active)}
              <span className={`text-[10px] ${active ? "font-semibold" : "font-medium"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* More button — opens sidebar */}
        <button
          onClick={open}
          className="flex flex-col items-center justify-center w-full h-full gap-0.5 text-gray-400"
        >
          <IoMenu size={20} />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </div>
    </nav>
  );
}

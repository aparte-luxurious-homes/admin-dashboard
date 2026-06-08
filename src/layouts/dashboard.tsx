"use client";

import Image from "next/image";
import { BellIcon, SettingsIcon } from "@/components/icons";
import { NAV_LINKS } from "../lib/routes/nav_links";
import SideNav from "../components/sidenav";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { PAGE_ROUTES } from "../lib/routes/page_routes";
import { useAuth } from "../hooks/useAuth";
import { useState, useEffect, useMemo } from "react";
import { IoMenu, IoClose } from "react-icons/io5";
import Cookies from "js-cookie";
import { toast } from "react-hot-toast";
import axiosRequest from "../lib/api";
import { API_ROUTES } from "../lib/routes/endpoints";
import { Icon } from "@iconify/react/dist/iconify.js";
import Loader from "../components/loader";
import AutoBreadcrumb from "../components/breadcrumb/AutoBreadcrumb";
import { GetGatewayBalances } from "../lib/request-handlers/integrationsMgt";
import { UserRole } from "../lib/enums";
import { ANALYTICS_CONFIGURED, clearConsent } from "../lib/analytics";
import { MobileMenuContext } from "../contexts/MobileMenuContext";
import BottomNav from "../components/mobile/BottomNav";

const TIER_CONFIG = {
  BRONZE: { label: "Bronze", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-300", icon: "solar:medal-ribbons-star-bold-duotone" },
  SILVER: { label: "Silver", color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-300", icon: "solar:medal-ribbons-star-bold-duotone" },
  GOLD:   { label: "Gold",   color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-300", icon: "solar:medal-ribbons-star-bold-duotone" },
} as const;

export default function Dashboard({ children }: { children: React.ReactNode }) {
  const { user, isFetching } = useAuth();
  const router = useRouter();
  const currentRoute = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const firstLetter = user?.email ? user.email.charAt(0).toUpperCase() : "?";
  const isAdmin = user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN
    || user?.role === UserRole.OPERATIONS_ADMIN || user?.role === UserRole.ANALYST;
  const { data: gatewayData, isLoading: gatewayLoading } = GetGatewayBalances(isAdmin);

  const [agentTier, setAgentTier] = useState<"BRONZE" | "SILVER" | "GOLD" | null>(null);

  useEffect(() => {
    if (user?.role !== UserRole.AGENT) return;
    axiosRequest.get(API_ROUTES.network.me)
      .then((res) => {
        const tier = res?.data?.data?.current_tier;
        if (tier) setAgentTier(tier);
      })
      .catch(() => {});
  }, [user?.role]);

  // Handle click to navigate
  const handleClick = () => {
    router.push(`/settings`);
  };

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    const token = Cookies.get("token");

    // console.log('[Dashboard] Auth check:', {
    //   hasToken: !!token,
    //   hasUser: !!user,
    //   userId: user?.id,
    //   isFetching
    // });

    // If no token and no user in Redux, redirect to login
    if (!token && !user) {
      // console.log('[Dashboard] No token and no user - redirecting to login');
      router.replace(PAGE_ROUTES.auth.login);
      return;
    }

    // If we have user data (either from Redux persistence or fresh fetch), show dashboard
    if (user && user.id) {
      // console.log('[Dashboard] User authenticated:', user.email);
      setIsCheckingAuth(false);
      return;
    }

    // If we have a token but no user, wait briefly for fetch to complete
    if (token && !user) {
      if (isFetching) {
        // console.log('[Dashboard] Token exists, fetching user...');
        setIsCheckingAuth(true);
      } else {
        // console.log('[Dashboard] Token exists but no user and not fetching - might be invalid token');
        // Give it a moment for query to start
        const timeout = setTimeout(() => {
          // Re-check token and user after timeout
          const currentToken = Cookies.get("token");
          const currentUser = user;

          if (currentToken && !currentUser) {
            // console.log('[Dashboard] Token appears invalid after waiting, removing and redirecting');
            Cookies.remove("token");
            router.replace(PAGE_ROUTES.auth.login);
          }
        }, 2000); // Wait 2 seconds for profile fetch

        return () => clearTimeout(timeout);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isFetching, router]);

  const mobileMenuCtx = useMemo(
    () => ({
      isOpen: isMobileMenuOpen,
      open: () => setIsMobileMenuOpen(true),
      close: () => setIsMobileMenuOpen(false),
    }),
    [isMobileMenuOpen]
  );

  // Route-level RBAC: if the current path matches a NAV_LINK entry whose `allow`
  // list excludes the current user's role, kick them back to the dashboard root.
  // Covers direct URL access (sidebar filtering alone doesn't stop /transactions/withdrawals
  // from rendering for an OWNER who types the URL).
  useEffect(() => {
    if (!user || !currentRoute) return;

    const role = user.role as UserRole;
    for (const link of NAV_LINKS) {
      // Skip nav sections the current role cannot see — prevents a shared child
      // link (e.g. /network/mentorship in both "Network" and "Network Management")
      // from incorrectly blocking a role that is allowed by one section but not the other.
      if (!link.allow.includes(role)) continue;

      if (link.children && link.children.length > 0) {
        for (const child of link.children) {
          if (child.link !== "#" && currentRoute.startsWith(child.link)) {
            if (child.allow.length > 0 && !child.allow.includes(role)) {
              toast.error("You don't have access to that page");
              router.replace(PAGE_ROUTES.dashboard.base);
              return;
            }
          }
        }
      } else if (link.link !== "#" && currentRoute.startsWith(link.link) && link.link !== PAGE_ROUTES.dashboard.base) {
        if (link.allow.length > 0 && !link.allow.includes(role)) {
          toast.error("You don't have access to that page");
          router.replace(PAGE_ROUTES.dashboard.base);
          return;
        }
      }
    }
  }, [user, currentRoute, router]);

  // Show loader while checking authentication or fetching user
  if (isCheckingAuth || (isFetching && !user)) {
    return <Loader message="Loading dashboard..." />;
  }

  // Don't render dashboard if no user (safety check)
  if (!user) {
    return null;
  }

  const handleLogOut = async () => {
    try {
      await axiosRequest.post("/auth/logout");
    } catch {
      // Proceed with client-side logout even if API call fails
    }

    // Clear cookie first so any in-flight check sees no token
    Cookies.remove("token", { path: "/" });

    // Synchronously clear redux-persist storage. persistor.purge() is async
    // and races the navigation; clearing localStorage directly is reliable.
    try {
      localStorage.removeItem("persist:auth");
    } catch {
      /* ignore (SSR / privacy mode) */
    }

    // Hard navigation with replace() — does NOT add a history entry, which
    // prevents the back-forward refresh loop. We deliberately skip dispatch
    // (clearUser) and queryClient.removeQueries here: those trigger a
    // Dashboard re-render whose auth-check effect fires a competing
    // router.replace() before window.location takes over. After
    // window.location.replace the JS context tears down anyway.
    window.location.replace("/auth/login");
  };

  // Re-open the cookie-consent banner. Clearing + reloading re-evaluates the
  // analytics gate from scratch, so already-loaded scripts stop and the banner
  // shows again for a fresh choice.
  const openCookieSettings = () => {
    clearConsent();
    window.location.reload();
  };

  return (
    <MobileMenuContext.Provider value={mobileMenuCtx}>
    <div className="h-screen size-full relative">
      {/* Mobile Menu Toggle — hidden on small screens where bottom nav is shown */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="hidden md:flex lg:hidden fixed top-4 left-4 z-50 p-3 rounded-lg bg-primary text-white hover:bg-primary/90
                   shadow-lg active:scale-95 transition-transform min-w-[48px] min-h-[48px] items-center justify-center"
        aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
      >
        {isMobileMenuOpen ? <IoClose size={28} /> : <IoMenu size={28} />}
      </button>

      {/* Sidemenu */}
      <div
        className={`
                fixed lg:absolute w-[85%] sm:w-[75%] lg:w-[26%] xl:w-[20%] 2xl:w-[18%] 
                bg-primary text-background h-full 
                transition-transform duration-300 ease-in-out z-40
                ${isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
          }
            `}
      >
        <div className="size-full">
          <div className="w-full flex justify-center items-center ">
            <div className="relative mt-8 mb-14">
              <Image
                src="/svg/logo_text_white.svg"
                alt="logo"
                height={170}
                width={170}
              />
              {user?.role === "ADMIN" ? (
              <Image
                src="/svg/admin_text.svg"
                alt="admin"
                className="absolute -bottom-1 right-0.5"
                height={30}
                width={30}
              />
              ) : user?.role === "AGENT" ? (
                <h3 className="absolute right-0.5 font-tt-firs-neue-trl">
                  AGENT
                </h3>
              ) : null}
            </div>
          </div>
          <div
            className={`
                            w-full h-[82%] overflow-y-auto
                            [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-teal-800
                        `}
          >
            {NAV_LINKS.map((el, index) =>
              el.allow.includes(user?.role) ? (
                <SideNav
                  key={index}
                  index={index}
                  link={el}
                  role={user?.role}
                  route={currentRoute}
                  onNavigate={() => setIsMobileMenuOpen(false)}
                />
              ) : null
            )}
          </div>
          {/* Footer: Cookie settings (production only) + Logout — extra bottom
              padding on mobile to clear the bottom nav */}
          <div className="absolute bottom-0 w-full flex flex-col items-center border-t-2 border-teal-700/70 bg-primary pb-16 md:pb-0">
            {ANALYTICS_CONFIGURED && (
              <button
                onClick={openCookieSettings}
                className="text-left flex gap-4 pl-7 py-3 hover:bg-teal-600/60 w-full text-white/70 hover:text-white items-center"
              >
                <Icon icon="mdi:cookie-outline" width="18" height="18" />
                <span className="text-sm">Cookie settings</span>
              </button>
            )}
            <button
              onClick={handleLogOut}
              className="text-left flex gap-4 pl-7 py-4 hover:bg-teal-600/60 w-full text-white min-h-[56px] items-center"
            >
              <Icon icon="ic:baseline-logout" width="20" height="20" style={{ color: "white" }} />
              <span className="text-base">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`
                lg:ml-[26%] xl:ml-[20%] 2xl:ml-[18%] w-full lg:w-[74%] xl:w-[80%] 2xl:w-[82%] 
                transition-all duration-300 ease-in-out flex flex-col h-screen overflow-hidden
            `}
      >
        <div className="w-full h-14 md:h-20 flex-shrink-0 flex justify-between items-center px-4 sm:px-6 lg:px-10 bg-white border-b border-b-zinc-200/80">
          {/* Spacer for tablet menu button (hidden on mobile where bottom nav is used) */}
          <div className="hidden md:block lg:hidden w-12"></div>

          <div className="w-1/2 hidden md:block">
            <AutoBreadcrumb />
          </div>
          <div className="w-full md:w-1/2 xl:w-2/3 flex justify-end gap-2 sm:gap-3 items-center">
            {/* Gateway Balances — admin only.
                data-clarity-mask: keep merchant balances out of Clarity session
                recordings (defense in depth on top of project-level mask mode). */}
            {isAdmin && (
              <div data-clarity-mask="true" className="hidden lg:flex items-center gap-3 mr-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                {gatewayLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="w-px h-4 bg-gray-200" />
                    <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
                  </div>
                ) : (() => {
                  const balances = gatewayData?.data?.data ?? {};
                  const fmt = (n: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
                  return (
                    <>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${balances.paystack?.isAvailable ? "bg-green-500" : "bg-red-400"}`} />
                        <span className="text-[10px] font-medium text-gray-500">PS</span>
                        <span className="text-xs font-bold text-gray-800">
                          {balances.paystack?.isAvailable ? fmt(balances.paystack.available) : "N/A"}
                        </span>
                      </div>
                      <div className="w-px h-4 bg-gray-200" />
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${balances.monnify?.isAvailable ? "bg-green-500" : "bg-red-400"}`} />
                        <span className="text-[10px] font-medium text-gray-500">MN</span>
                        <span className="text-xs font-bold text-gray-800">
                          {balances.monnify?.isAvailable ? fmt(balances.monnify.available) : "N/A"}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {agentTier && (() => {
              const cfg = TIER_CONFIG[agentTier];
              return (
                <span className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                  <Icon icon={cfg.icon} width="14" />
                  {cfg.label}
                </span>
              );
            })()}
            <div
              className="flex items-center cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
              onClick={handleClick}
            >
              {user?.profile?.profileImage ? (
                <Image
                  src={user?.profile?.profileImage}
                  alt="profile"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="w-10 h-10 flex items-center justify-center bg-[#124452] text-white text-lg font-bold rounded-full">
                  {firstLetter}
                </div>
              )}

              <div className="ml-2 text-[12px] hidden sm:block">
                <p className="">{user?.profile?.firstName || "Welcome Back"}</p>
                <p className="-mt-1 text-zinc-400 truncate max-w-[120px]">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="px-2 sm:px-1 md:px-1 py-2 sm:py-1 pb-20 md:pb-2 w-full flex-1 overflow-y-auto">{children}</div>
      </div>

      {/* Bottom Navigation — mobile only */}
      <BottomNav />

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
    </MobileMenuContext.Provider>
  );
}

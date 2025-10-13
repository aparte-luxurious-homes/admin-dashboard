"use client";

import Image from "next/image";
import { BellIcon, SettingsIcon } from "@/components/icons";
import { NAV_LINKS } from "../lib/routes/nav_links";
import SideNav from "../components/sidenav";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { PAGE_ROUTES } from "../lib/routes/page_routes";
import { useAuth } from "../hooks/useAuth";
import { useState, useEffect } from "react";
import { IoMenu, IoClose } from "react-icons/io5";
import Cookies from "js-cookie";
import { toast } from "react-hot-toast";
import { useDispatch } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import { clearUser } from "../lib/slices/authSlice";
import { Icon } from "@iconify/react/dist/iconify.js";
import Loader from "../components/loader";

export default function Dashboard({ children }: { children: React.ReactNode }) {
  const { user, isFetching } = useAuth();
  const router = useRouter();
  const currentRoute = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const firstLetter = user?.email ? user.email.charAt(0).toUpperCase() : "?";

  // Handle click to navigate
  const handleClick = () => {
    router.push(`/settings`);
  };

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    const token = Cookies.get("token");
    
    // If no token and no user in Redux, redirect to login
    if (!token && !user) {
      router.replace(PAGE_ROUTES.auth.login);
      return;
    }

    // If we have user data (either from Redux persistence or fresh fetch), show dashboard
    if (user) {
      setIsCheckingAuth(false);
      return;
    }

    // If we have a token but no user, wait for fetch to complete
    if (token && !user) {
      setIsCheckingAuth(true);
      return;
    }
  }, [user, isFetching, router]);

  // Show loader while checking authentication or fetching user
  if (isCheckingAuth || (isFetching && !user)) {
    return <Loader message="Loading dashboard..." />;
  }

  // Don't render dashboard if no user (safety check)
  if (!user) {
    return null;
  }

  const handleLogOut = () => {
    Promise.all([
      Promise.resolve(Cookies.remove("token")),
      Promise.resolve(dispatch(clearUser())),
      queryClient.removeQueries({ queryKey: ["authUser"] }),
    ]).then(() => {
      // Redirect to the login page after all actions complete
      window.location.href = "/auth/login";
      toast.success("You have been logged out", {
        duration: 3000,
        style: {
          maxWidth: "500px",
          width: "max-content",
        },
      })
    });
  };

  return (
    <div className="h-screen size-full relative">
      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-primary text-white hover:bg-primary/90"
      >
        {isMobileMenuOpen ? <IoClose size={24} /> : <IoMenu size={24} />}
      </button>

      {/* Sidemenu */}
      <div
        className={`
                fixed lg:absolute w-[85%] lg:w-[26%] xl:w-[20%] 2xl:w-[18%] 
                bg-primary text-background h-full 
                transition-transform duration-300 ease-in-out z-40
                ${
                  isMobileMenuOpen
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
              <Image
                src="/svg/admin_text.svg"
                alt="admin"
                className="absolute -bottom-1 right-0.5"
                height={30}
                width={30}
              />
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
                />
              ) : null
            )}
          </div>
          <div className="absolute bottom-0 w-full flex items-center h-14 border-t-2 border-teal-700/70 bg-primary">
            <Link
              href={PAGE_ROUTES.dashboard.settings.base}
              className="flex gap-4 pl-7 py-2 hover:bg-teal-600/60 w-full"
            >
              <SettingsIcon className="w-5" color="white" />
              <p className="text-base flex items-center">Settings</p>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`
                lg:ml-[26%] xl:ml-[20%] 2xl:ml-[18%] w-full lg:w-[74%] xl:w-[80%] 2xl:w-[82%] 
                transition-all duration-300 ease-in-out
            `}
      >
        <div className="w-full h-20 flex justify-between items-center px-10 bg-white border-b border-b-zinc-200/80">
          <div className="w-1/2 hidden md:block">
            <p className="text-2xl font-medium">
              {currentRoute.split("/").length === 2 &&
              currentRoute.split("/")[1] === ""
                ? "Dashboard"
                : currentRoute
                    .split("/")[1]
                    .replace(/-/g, " ")
                    .replace(/^./, (c) => c.toUpperCase())}
            </p>
          </div>
          <div className="w-full md:w-1/2 xl:w-1/3 flex justify-end gap-3 items-center">
            {/* <Link
              href={PAGE_ROUTES.dashboard.settings.base}
              className="size-10 rounded-md bg-background hover:bg-zinc-200/80 flex justify-center items-center border border-zinc-500/20"
            >
              <SettingsIcon className="w-4" color="black" />
            </Link> */}
            <div className="hidden md:block">
              <div className="size-10 relative rounded-md bg-background hover:bg-zinc-200/80 flex justify-center items-center border border-zinc-500/20">
                <BellIcon className="w-4" color="black" />
                <div className="size-2 bg-teal-700 absolute -top-1 left-auto right-auto rounded-full" />
              </div>
            </div>
            <div
              className="flex items-center cursor-pointer"
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

              <div className="ml-2 text-[12px]">
                <p className="">{user?.profile?.firstName || "Welcome Back"}</p>
                <p className="-mt-1 text-zinc-400">{user?.email}</p>
              </div>
            </div>
            <div className="cursor-pointer" onClick={handleLogOut}>
              <Icon
                icon="ic:baseline-logout"
                width="20"
                height="20"
                style={{ color: "#f21717" }}
              />
            </div>
          </div>
        </div>
        <div className="md:px-10 px-5 w-full h-[91vh] overflow-y-auto">{children}</div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}

'use client'

import Image from "next/image";
import { BellIcon, SettingsIcon } from "@/components/icons";
import { NAV_LINKS } from "../utils/nav_links";
import SideNav from "../components/sidenav";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { PAGE_ROUTES } from "../utils/page_routes";

export default function Dashboard({ children }: { children: React.ReactNode }){
    const currentRoute = usePathname();
    console.log(currentRoute.split('/'))

    return (
        <div className="min-h-screen size-full">
            <div className="fixed w-[18%] h-full bg-primary text-background left-0 top-0 bottom-0">
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
                        {
                            NAV_LINKS.map((el, index) => 
                                <SideNav key={index} link={el} route={currentRoute} />
                            )
                        }
                    </div>
                    <div className="absolute bottom-0 w-full flex items-center h-14 border-t-2 border-teal-700/70 bg-primary">
                        <Link href={PAGE_ROUTES.dashboard.settings.base} className="flex gap-4 pl-12 py-2 hover:bg-teal-600/60 w-full">
                            <SettingsIcon className="w-5" color="white" />
                            <p className="text-base flex items-center">
                                Settings
                            </p>
                        </Link>
                    </div>
                </div>
            </div>
            <div className="fixed left-[18%] w-full">
                <div className="w-full h-20 flex items-center px-10 bg-white">
                    <div className="w-1/2">
                        <p className="text-2xl font-semi-bold">
                            {
                                currentRoute.split('/').length === 2 && currentRoute.split('/')[1] === '' 
                                    ? 'Dashboard' 
                                    : currentRoute
                                        .split('/')[currentRoute.split('/').length-1]
                                        .replace(/-/g, ' ')
                                        .replace(/^./, c => c.toUpperCase())
                            }
                        </p>
                    </div>
                    <div className="w-1/3 flex justify-end gap-5 items-center pr-5">
                        <Link href={PAGE_ROUTES.dashboard.settings.base} className="size-10 rounded-md bg-background hover:bg-zinc-200/80 flex justify-center items-center border border-zinc-500/20">
                            <SettingsIcon className="w-4" color="black" />
                        </Link>
                        <div className="size-10 relative rounded-md bg-background hover:bg-zinc-200/80 flex justify-center items-center border border-zinc-500/20">
                            <BellIcon className="w-4" color="black" />
                            <div className="size-2 bg-teal-700 absolute -top-1 left-auto right-auto rounded-full" />
                        </div>
                        <div className="flex items-center">
                            <Image
                                src="/png/sample_profile.png"
                                alt="profile"
                                width={40}
                                height={40}
                                className=""
                            />
                            <div className="ml-2 text-[12px]">
                                <p className="">Adetunji Muideen</p>
                                <p className="-mt-1 text-zinc-400">muideenadetunji@gmail.com</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="px-10 mt-5 ">
                    {children}
                </div>
            </div>
        </div>
    );
};
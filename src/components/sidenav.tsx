'use client'

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowIcon } from "../components/icons";
import { ILink } from "../utils/nav_links";

function getPathName(route: string, targetPath: string) {
    const path = route.split("/");
    if (path.includes(targetPath)) return true

    return false
}

export default function SideNav({ link, route }: { link: ILink, route: string }) {
    const [open, setOpen] = useState<boolean>(false)
    const router = useRouter();

    return (
        <div className="relative w-full cursor-pointer mb-3">
            {
                <div>
                    <div 
                        key={link.key}
                        className={`relative `}
                        onClick={() => setOpen(!open)}
                    >
                        <div className="w-full">
                            <div 
                                onClick={() => !link.secondary && router.push(link.link)}
                                className={`flex items-center gap-4 pt-3 pb-2 pl-12 hover:bg-teal-600/60 ${!link.secondary && route === '/' && link.name === 'Dashboard' && 'bg-teal-600/60'}`}>
                                {link.icon}
                                <p className="text-base flex items-center">
                                    {link.name}
                                </p>
                            </div>
                        </div>
                        {
                            link.secondary &&
                            <ArrowIcon 
                                className={`absolute top-4 right-4 transition-all ease-in-out ${open ? 'rotate-[90deg]' : 'rotate-[270deg]'} `}
                                color="white"
                            />
                        }
                    </div>
                    <div className={`flex flex-col w-full transition-all ease-in-out duration-150 ${open ? 'max-h-40 opacity-100': 'max-h-0 opacity-0'}`}>
                        {
                            link.secondary && 
                            link.children?.map((child) => 
                                <Link key={child.key} href={child.link} className={`flex items-center gap-4 pl-[5.2rem] py-2 hover:bg-teal-600/60 ${getPathName(route, child.pathName) && 'bg-teal-600/60'}`}>
                                    <p className="text-[14px] text-background/95">
                                        {child.name}
                                    </p>
                                </Link>
                            )
                        }
                    </div>
                </div>
            }
        </div>
    );
};
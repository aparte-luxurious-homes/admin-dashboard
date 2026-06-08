"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowIcon } from "../components/icons";
import { ILink, ILinkChild, NavBadgeKey } from "../lib/routes/nav_links";
import { UserRole } from "../lib/enums";
import { GetApprovalPendingCount } from "../lib/request-handlers/bookingMgt";

function NavChildBadge({ badgeKey }: { badgeKey: NavBadgeKey }) {
  if (badgeKey === "approvalPending") {
    return <ApprovalPendingBadge />;
  }
  return null;
}

function ApprovalPendingBadge() {
  const { data: count } = GetApprovalPendingCount();
  if (!count || count <= 0) return null;
  return (
    <span className="ml-auto mr-2 inline-flex items-center justify-center rounded-full bg-orange-500 px-2 py-0.5 text-xs font-semibold text-white min-w-[22px]">
      {count > 99 ? "99+" : count}
    </span>
  ); 
}

function getPathName(route: string, targetPath: string) {
  const path = route.split("/");
  if (path.includes(targetPath)) return true;

  return false;
}

export default function SideNav({
  index,
  link,
  route,
  role,
  onNavigate,
}: {
  index: number;
  link: ILink;
  route: string;
  role: UserRole;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState<boolean>(false);
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
    onNavigate?.(); // Call onNavigate callback if provided
  };

  if (!link.allow.includes(role)) return null;

  return (
    <div className="relative w-full cursor-pointer mb-1">
      {
        <div>
          <div
            key={index}
            className={`relative `}
            onClick={() => setOpen(!open)}
          >
            <div className="w-full">
              <div
                onClick={() => !link.secondary && handleNavigation(link.link)}
                className={`flex items-center gap-4 pt-3 pb-2 pl-3 xl:pl-6 rounded-md transition-colors
                                 hover:bg-white/10 focus:bg-white/10 active:bg-white/20 min-h-[48px]
<<<<<<< HEAD
                                 ${!link.secondary && route === '/' && link.name === 'Dashboard' && 'bg-white/10'}`}>
                                {link.icon}
                                <p className="text-base flex items-center pr-8 text-white/95">
                                    {link.name}
                                </p>
                            </div>
                        </div>
                        {
                            link.secondary &&
                            <ArrowIcon
                                className={`absolute top-[36%] right-4 transition-all ease-in-out ${open ? 'rotate-[90deg]' : 'rotate-[270deg]'} `}
                                color="white"
                            />
                        }
                    </div>
                    <div className={`flex flex-col w-full transition-all ease-in-out duration-150 ${open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                        {
                            link.secondary &&
                            link.children?.map((child, index) =>
                                child.allow.includes(role) ?
                                    <Link
                                        key={index}
                                        href={child.link}
                                        onClick={() => onNavigate?.()}
                                        className={`flex items-center gap-4 pl-[3rem] xl:pl-[3.85rem] py-2 rounded-md transition-colors
                                     hover:bg-white/10 active:bg-white/20 min-h-[44px] ${getPathName(route, child.pathName) && 'bg-white/10'}`}>
                                        <p className="text-[14px] text-white/90">
                                            {child.name}
                                        </p>
                                    </Link>
                                    :
                                    null
                            )
                        }
                    </div>
                </div>
            }
=======
                                 ${!link.secondary && route === "/" && link.name === "Dashboard" && "bg-white/10"}`}
              >
                {link.icon}
                <p className="text-base flex items-center pr-8 text-white/95">
                  {link.name}
                </p>
              </div>
            </div>
            {link.secondary && (
              <ArrowIcon
                className={`absolute top-[36%] right-4 transition-all ease-in-out ${open ? "rotate-[90deg]" : "rotate-[270deg]"} `}
                color="white"
              />
            )}
          </div>
          <div
            className={`flex flex-col w-full transition-all ease-in-out duration-150 overflow-hidden ${open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
          >
            {link.secondary &&
              link.children?.map((child: ILinkChild, index) =>
                child.allow.includes(role) ? (
                  <Link
                    key={index}
                    href={child.link}
                    onClick={() => onNavigate?.()}
                    className={`flex items-center gap-4 pl-[3rem] xl:pl-[3.85rem] py-2 rounded-md transition-colors
                                     hover:bg-white/10 active:bg-white/20 min-h-[44px] ${getPathName(route, child.pathName) && "bg-white/10"}`}
                  >
                    <p className="text-[14px] text-white/90 flex-1">
                      {child.name}
                    </p>
                    {child.badgeKey && (
                      <NavChildBadge badgeKey={child.badgeKey} />
                    )}
                  </Link>
                ) : null,
              )}
          </div>
>>>>>>> 0314e6133b7c7f52cf4889d851584a58a712b7c5
        </div>
      }
    </div>
  );
}

"use client";

import NextLink from "next/link";
import type { ReactNode } from "react";

interface HelpLinkProps {
  to: string;
  className?: string;
  onClick?: () => void;
  children: ReactNode;
}

export function HelpLink({ to, className, onClick, children }: HelpLinkProps) {
  return (
    <NextLink href={to} className={className} onClick={onClick}>
      {children}
    </NextLink>
  );
}

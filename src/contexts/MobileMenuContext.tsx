"use client";

import { createContext, useContext } from "react";

interface MobileMenuContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const MobileMenuContext = createContext<MobileMenuContextType>({
  isOpen: false,
  open: () => {},
  close: () => {},
});

export const useMobileMenu = () => useContext(MobileMenuContext);

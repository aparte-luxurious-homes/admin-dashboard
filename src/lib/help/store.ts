import { create } from "zustand";

interface HelpState {
  isOpen: boolean;
  activeGuideId: string | null;
  open: (guideId?: string) => void;
  close: () => void;
  setActive: (guideId: string | null) => void;
}

export const useHelpStore = create<HelpState>((set) => ({
  isOpen: false,
  activeGuideId: null,
  open: (guideId) => set({ isOpen: true, activeGuideId: guideId ?? null }),
  close: () => set({ isOpen: false }),
  setActive: (guideId) => set({ activeGuideId: guideId }),
}));

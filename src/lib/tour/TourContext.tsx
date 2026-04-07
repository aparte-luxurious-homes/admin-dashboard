"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
  useState,
  type ReactNode,
} from "react";
import { UserRole } from "../enums";
import { getTourSteps, type TourStep } from "./tourSteps";

interface TourContextType {
  restartTour: () => void;
}

const TourContext = createContext<TourContextType>({
  restartTour: () => {},
});

export const useTourContext = () => useContext(TourContext);

const TOUR_STORAGE_PREFIX = "aparte_tour_done_";

function getTourKey(userId: string | number): string {
  return `${TOUR_STORAGE_PREFIX}${userId}`;
}

function isTourCompleted(userId: string | number): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(getTourKey(userId)) === "true";
}

function markTourCompleted(userId: string | number): void {
  localStorage.setItem(getTourKey(userId), "true");
}

function clearTourCompleted(userId: string | number): void {
  localStorage.removeItem(getTourKey(userId));
}

interface TourProviderProps {
  children: ReactNode;
  userId?: string | number;
  userRole?: UserRole;
}

export function TourProvider({ children, userId, userRole }: TourProviderProps) {
  const tourRef = useRef<any>(null);
  const [shepherdLoaded, setShepherdLoaded] = useState(false);
  const ShepherdRef = useRef<any>(null);

  // Dynamically import Shepherd to avoid SSR issues
  useEffect(() => {
    if (typeof window === "undefined") return;

    Promise.all([
      import("shepherd.js"),
      // @ts-ignore -- CSS imports have no type declarations
      import("shepherd.js/dist/css/shepherd.css"),
      // @ts-ignore -- CSS imports have no type declarations
      import("./tourStyles.css"),
    ]).then(([shepherdModule]) => {
      ShepherdRef.current = shepherdModule.default || shepherdModule;
      setShepherdLoaded(true);
    });
  }, []);

  const createTour = useCallback(
    (Shepherd: any, steps: TourStep[]) => {
      // Clean up existing tour
      if (tourRef.current) {
        tourRef.current.complete();
        tourRef.current = null;
      }

      const tour = new Shepherd.Tour({
        useModalOverlay: true,
        defaultStepOptions: {
          cancelIcon: { enabled: true },
          scrollTo: { behavior: "smooth", block: "center" },
        },
      });

      const totalSteps = steps.length;

      steps.forEach((step, index) => {
        const buttons: any[] = [];

        // Skip button on first step
        if (index === 0) {
          buttons.push({
            text: "Skip Tour",
            action: () => tour.cancel(),
            classes: "shepherd-skip",
          });
        }

        // Back button (not on first step)
        if (index > 0) {
          buttons.push({
            text: "Back",
            action: () => tour.back(),
            classes: "shepherd-button-secondary",
          });
        }

        // Next / Finish button
        if (index < totalSteps - 1) {
          buttons.push({
            text: "Next",
            action: () => tour.next(),
            classes: "shepherd-button-primary",
          });
        } else {
          buttons.push({
            text: "Finish",
            action: () => tour.complete(),
            classes: "shepherd-button-primary",
          });
        }

        const stepConfig: any = {
          id: step.id,
          title: `${step.title} <span class="shepherd-step-counter">${index + 1}/${totalSteps}</span>`,
          text: step.text,
          buttons,
        };

        if (step.attachTo) {
          stepConfig.attachTo = step.attachTo;
        }

        tour.addStep(stepConfig);
      });

      // Mark completed on finish or cancel
      tour.on("complete", () => {
        if (userId) markTourCompleted(userId);
      });
      tour.on("cancel", () => {
        if (userId) markTourCompleted(userId);
      });

      tourRef.current = tour;
      return tour;
    },
    [userId]
  );

  // Auto-start tour for first-time OWNER/AGENT users
  useEffect(() => {
    if (!shepherdLoaded || !userId || !userRole) return;
    if (userRole !== UserRole.OWNER && userRole !== UserRole.AGENT) return;
    if (isTourCompleted(userId)) return;

    // Check if we're on desktop (lg breakpoint = 1024px)
    if (typeof window !== "undefined" && window.innerWidth < 1024) return;

    const steps = getTourSteps(userRole);
    const Shepherd = ShepherdRef.current;
    if (!Shepherd) return;

    const timer = setTimeout(() => {
      const tour = createTour(Shepherd, steps);
      tour.start();
    }, 1500);

    return () => clearTimeout(timer);
  }, [shepherdLoaded, userId, userRole, createTour]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (tourRef.current) {
        tourRef.current.complete();
        tourRef.current = null;
      }
    };
  }, []);

  const restartTour = useCallback(() => {
    if (!userId || !userRole || !ShepherdRef.current) return;

    clearTourCompleted(userId);

    const steps = getTourSteps(userRole);
    const tour = createTour(ShepherdRef.current, steps);

    // Small delay to allow page navigation to complete
    setTimeout(() => {
      tour.start();
    }, 800);
  }, [userId, userRole, createTour]);

  return (
    <TourContext.Provider value={{ restartTour }}>
      {children}
    </TourContext.Provider>
  );
}

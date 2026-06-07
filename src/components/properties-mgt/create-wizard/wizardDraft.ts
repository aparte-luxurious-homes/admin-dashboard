import type { PropertyFormValues, UnitFormValues, WizardStep } from "./types";

/**
 * Persists the JSON-serialisable parts of the property-create wizard
 * (formik values, units, step state) to localStorage so the agent/owner
 * doesn't lose their work if they get bounced to `/settings/personal-info`
 * to complete their profile or otherwise navigate away.
 *
 * File-based state (property media, unit media, KYC documents) cannot be
 * serialised and is intentionally NOT persisted — the wizard's existing
 * step validation will prompt the user to re-attach files on return.
 */

const STORAGE_KEY = "aparte:wizard:property-create:v1";
const DRAFT_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

export interface WizardDraft {
    values: PropertyFormValues;
    units: UnitFormValues[];
    currentStep: WizardStep;
    highestStep: WizardStep;
    savedAt: number;
}

const isBrowser = (): boolean => typeof window !== "undefined";

export function readWizardDraft(): WizardDraft | null {
    if (!isBrowser()) return null;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as WizardDraft;
        if (!parsed.savedAt || Date.now() - parsed.savedAt > DRAFT_TTL_MS) {
            window.localStorage.removeItem(STORAGE_KEY);
            return null;
        }
        return parsed;
    } catch {
        // Corrupt JSON or storage access denied — bail out silently.
        return null;
    }
}

export function writeWizardDraft(
    draft: Omit<WizardDraft, "savedAt">,
): void {
    if (!isBrowser()) return;
    try {
        const payload: WizardDraft = { ...draft, savedAt: Date.now() };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
        // Quota exceeded or storage disabled — best-effort.
    }
}

export function clearWizardDraft(): void {
    if (!isBrowser()) return;
    try {
        window.localStorage.removeItem(STORAGE_KEY);
    } catch {
        // ignore
    }
}

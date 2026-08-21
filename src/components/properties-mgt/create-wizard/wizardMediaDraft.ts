import type { DocumentType } from "../types";
import type { CategorizedMedia } from "./types";

/**
 * Persists the FILE-based parts of the property-create wizard (property
 * gallery media, per-unit media, and ownership documents) so a page refresh
 * doesn't wipe the agent/owner's uploads.
 *
 * Unlike the JSON draft in `wizardDraft.ts`, files cannot be stored in
 * localStorage — `File` objects aren't JSON-serialisable and media (especially
 * walkthrough videos) easily exceeds localStorage's ~5MB budget. IndexedDB
 * stores `File`/`Blob` values natively via the structured-clone algorithm, so
 * we use it here.
 *
 * The draft is cleared only when the listing is discontinued or successfully
 * created (mirroring `clearWizardDraft`), or when it ages past the TTL.
 */

const DB_NAME = "aparte:wizard-media";
const DB_VERSION = 1;
const STORE_NAME = "drafts";
const DRAFT_KEY = "property-create:v1";
// Matches the JSON draft TTL in wizardDraft.ts so both expire together.
const DRAFT_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

export interface WizardMediaDraft {
  propertyMedia: CategorizedMedia;
  unitMediaByCategory: Record<string, CategorizedMedia>;
  docFiles: { file: File; type: DocumentType }[];
  savedAt: number;
}

const isBrowser = (): boolean =>
  typeof window !== "undefined" && "indexedDB" in window;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function readWizardMediaDraft(): Promise<WizardMediaDraft | null> {
  if (!isBrowser()) return null;
  try {
    const db = await openDb();
    const draft = await new Promise<WizardMediaDraft | null>(
      (resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const req = tx.objectStore(STORE_NAME).get(DRAFT_KEY);
        req.onsuccess = () =>
          resolve((req.result as WizardMediaDraft | undefined) ?? null);
        req.onerror = () => reject(req.error);
      },
    );
    db.close();
    if (!draft) return null;
    if (!draft.savedAt || Date.now() - draft.savedAt > DRAFT_TTL_MS) {
      await clearWizardMediaDraft();
      return null;
    }
    return draft;
  } catch {
    // Storage blocked (private mode), corrupt DB, etc. — bail out silently.
    return null;
  }
}

export async function writeWizardMediaDraft(
  draft: Omit<WizardMediaDraft, "savedAt">,
): Promise<void> {
  if (!isBrowser()) return;
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(
        { ...draft, savedAt: Date.now() } satisfies WizardMediaDraft,
        DRAFT_KEY,
      );
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Quota exceeded or storage disabled — best-effort, nothing to do.
  }
}

export async function clearWizardMediaDraft(): Promise<void> {
  if (!isBrowser()) return;
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(DRAFT_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    db.close();
  } catch {
    // ignore
  }
}

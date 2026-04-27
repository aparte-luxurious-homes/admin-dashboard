"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

interface FreshPaymentLink {
  url: string;
  emailSent: boolean;
  smsSent: boolean;
  bookingId: string;
  guestEmail?: string | null;
  guestPhone?: string | null;
  whatsappHref?: string | null;
}

const STORAGE_PREFIX = "aparte:freshPaymentLink:";

/**
 * One-shot success card surfaced on the booking detail page right after a
 * staff-on-behalf booking creation. The data is handed off via sessionStorage
 * (keyed by booking UUID) from CreateBookingView. We read once and clear so a
 * page refresh doesn't re-show the prompt.
 */
export default function FreshPaymentLinkCard({ bookingUuid }: { bookingUuid: string }) {
  const [link, setLink] = useState<FreshPaymentLink | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!bookingUuid) return;
    try {
      const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${bookingUuid}`);
      if (raw) {
        setLink(JSON.parse(raw) as FreshPaymentLink);
        sessionStorage.removeItem(`${STORAGE_PREFIX}${bookingUuid}`);
      }
    } catch {
      // ignore
    }
  }, [bookingUuid]);

  const handleCopy = async () => {
    if (!link?.url) return;
    try {
      await navigator.clipboard.writeText(link.url);
      toast.success("Payment link copied to clipboard");
    } catch {
      toast.error("Could not copy automatically — select and copy manually");
    }
  };

  if (!link || dismissed) return null;

  return (
    <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold flex-shrink-0">
          ✓
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-emerald-900">
            Booking {link.bookingId} created — payment link ready
          </p>
          <p className="text-xs text-emerald-700 mt-0.5">
            {link.emailSent && link.guestEmail && <span>Emailed to {link.guestEmail}</span>}
            {link.emailSent && link.smsSent && link.guestPhone && " · "}
            {link.smsSent && link.guestPhone && <span>SMS sent to {link.guestPhone}</span>}
            {!link.emailSent && !link.smsSent && <span>Share the link manually below.</span>}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              type="text"
              readOnly
              value={link.url}
              className="flex-1 min-w-[240px] h-9 px-3 text-xs font-mono bg-white border border-emerald-200 rounded-md text-zinc-700 truncate"
              onFocus={(e) => e.currentTarget.select()}
            />
            <button
              type="button"
              onClick={handleCopy}
              className="h-9 px-3 text-xs font-semibold text-white bg-emerald-600 rounded-md hover:bg-emerald-700 transition-colors flex-shrink-0"
            >
              Copy
            </button>
            {link.whatsappHref && (
              <a
                href={link.whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="h-9 px-3 text-xs font-semibold text-white bg-[#25D366] rounded-md hover:bg-[#1ebe5a] transition-colors flex-shrink-0 flex items-center gap-1"
              >
                WhatsApp
              </a>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="text-emerald-700 hover:text-emerald-900 text-lg leading-none px-2"
        >
          ×
        </button>
      </div>
    </div>
  );
}

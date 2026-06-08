"use client";

type Props = {
  onAccept: () => void;
  onDecline: () => void;
};

/**
 * Cookie-consent banner for the admin dashboard. Presentational only — the
 * consent state and analytics mounting are owned by <AnalyticsProvider>.
 */
export default function ConsentBanner({ onAccept, onDecline }: Props) {
  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-[9999] px-4 pb-4 sm:px-6 sm:pb-6"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-black/5 sm:flex-row sm:items-center sm:p-6">
        <p className="flex-1 text-sm leading-relaxed text-gray-600">
          We use Google Analytics &amp; Microsoft Clarity to understand how the
          dashboard is used and improve it. Session recordings mask sensitive
          data. See our{" "}
          <a
            href="https://aparteng.com/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#124452] underline"
          >
            Privacy Policy
          </a>
          .
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={onDecline}
            className="rounded-lg px-5 py-2.5 text-sm font-semibold text-[#124452] ring-1 ring-[#124452]/30 transition-colors hover:bg-[#124452]/5"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="rounded-lg bg-[#124452] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0d343f]"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

import { MESSAGES } from '@/src/lib/messages';
import { useState } from "react";
import { FaMoneyBillWave } from "react-icons/fa";
import { MdRefresh } from "react-icons/md";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import { formatMoney } from "@/src/lib/utils";
import { UserRole } from "@/src/lib/enums";
import { BookingStatus } from "../types";
import CollapsibleSection from "../../mobile/CollapsibleSection";
import {
  RetryBookingPayment,
  ResendPaymentLink,
  ReconcileBookingPayment,
  PayBookingWithWallet,
  AttachGuestCredential,
} from "@/src/lib/request-handlers/bookingMgt";
import { GetMyWallet } from "@/src/lib/request-handlers/financeMgt";
import { getApiErrorMessage } from "@/src/lib/apiError";
import { usePermissions } from "@/src/hooks/usePermissions";
import { NormalizedBooking, getStatusColors } from "./utils";

interface BookingPaymentCardProps {
  booking: NormalizedBooking;
}

// Roles allowed to manually reconcile a booking against a gateway-side payment
// reference. Mirrors the backend gate at POST /bookings/{id}/reconcile-payment
// — SUPPORT_ADMIN is intentionally excluded (read-only on bookings).
const RECONCILE_ROLES = new Set<string>([
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.OPERATIONS_ADMIN,
]);

type ReconcileProvider = "PAYSTACK" | "MONNIFY" | "FLUTTERWAVE";

export default function BookingPaymentCard({ booking }: BookingPaymentCardProps) {
  const colors = getStatusColors(booking.status);
  const { mutate: retryPayment, isPending: isRetrying } = RetryBookingPayment();
  const { mutate: resendLink, isPending: isResending } = ResendPaymentLink();
  const { mutate: reconcilePayment, isPending: isReconciling } = ReconcileBookingPayment();
  const { role } = usePermissions();

  const canRetry =
    (booking.status === BookingStatus.PENDING ||
      booking.status === BookingStatus.PENDING_PAYMENT) &&
    booking.transactionRef;

  // Resend link is available for any unpaid booking — useful when the agent
  // forgot to dispatch the link at create time, or the original send failed.
  const canResend =
    booking.status === BookingStatus.PENDING ||
    booking.status === BookingStatus.PENDING_PAYMENT;

  // Reconcile is the power-user fallback for stuck bookings where the standard
  // Retry can't resolve (e.g. multiple alternate payment links generated; the
  // booking's stored ref points at an abandoned attempt while the actual
  // successful payment lives under a different gateway reference).
  const canReconcile =
    !!role &&
    RECONCILE_ROLES.has(role) &&
    (booking.status === BookingStatus.PENDING ||
      booking.status === BookingStatus.PENDING_PAYMENT);

  // Agents can settle an unpaid booking from their own wallet. The API also
  // requires them to have made the booking or be the property's agent.
  const canPayFromWallet = role === UserRole.AGENT && canResend;
  const { wallet: myWallet, balance: walletBalance } = GetMyWallet(canPayFromWallet);
  const { mutate: payWithWallet, isPending: isPayingWithWallet } = PayBookingWithWallet();
  const [walletConfirmOpen, setWalletConfirmOpen] = useState(false);
  // A wallet payment carries no gateway fee: the charge is the booking total.
  const walletCharge = booking.totalPrice;
  const walletShort = !myWallet || walletBalance < walletCharge;
  // The API refuses a wallet payment for a guest with no ID or face photo on
  // the booking (the wallet identifies the agent, not the guest). Say so up
  // front instead of letting the agent hit the 400.
  const walletNeedsCredentials =
    !booking.guestIdDocumentUrl && !booking.guestPhotoUrl;
  const { mutate: attachCredential, isPending: isAttaching } = AttachGuestCredential();

  const handleAttachCredential =
    (kind: "ID_DOCUMENT" | "PHOTO") => (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image (JPG, PNG or WEBP).");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image is too large. Maximum size is 10 MB.");
        return;
      }
      attachCredential(
        { bookingId: booking.id, kind, file },
        {
          onSuccess: () =>
            toast.success(kind === "ID_DOCUMENT" ? "ID document added" : "Guest photo added"),
          onError: (error: unknown) =>
            toast.error(getApiErrorMessage(error, "Failed to add the image")),
        },
      );
    };

  const handlePayFromWallet = () => {
    payWithWallet(
      { bookingId: booking.id },
      {
        onSuccess: () => {
          setWalletConfirmOpen(false);
          toast.success(
            `Paid ${formatMoney(walletCharge)} from your wallet. Booking confirmed.`,
            { duration: 6000 },
          );
        },
        onError: (error: unknown) => {
          toast.error(getApiErrorMessage(error, "Wallet payment failed"), {
            duration: 8000,
            style: { maxWidth: "420px" },
          });
        },
      },
    );
  };

  const [reconcileOpen, setReconcileOpen] = useState(false);
  const [reconcileProvider, setReconcileProvider] = useState<ReconcileProvider | "">("");
  const [reconcileRef, setReconcileRef] = useState("");

  const handleRetry = () => {
    retryPayment(
      { bookingId: booking.id },
      {
        onSuccess: (response) => {
          const result = response?.data?.data;
          if (result?.success) {
            toast.success(result.message || "Payment verified successfully!");
          } else {
            toast.error(result?.message || "Payment verification failed");
          }
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.detail || "Failed to verify payment");
        },
      },
    );
  };

  const handleResend = () => {
    resendLink(
      { bookingId: booking.id, notify: true },
      {
        onSuccess: (response) => {
          const url = response?.data?.data?.payment_link;
          if (url) {
            toast.success(MESSAGES.MSG_PAYMENT_LINK_RE_SENT_TO_GUEST);
            navigator.clipboard?.writeText(url).catch(() => {});
          }
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.detail || "Failed to resend payment link");
        },
      },
    );
  };

  const handleReconcile = () => {
    const ref = reconcileRef.trim();
    if (!reconcileProvider) {
      toast.error(MESSAGES.MSG_PICK_THE_GATEWAY_THE_REFERENCE_CAME_FROM);
      return;
    }
    if (ref.length < 4) {
      toast.error(MESSAGES.MSG_PASTE_THE_FULL_PAYMENT_REFERENCE_FROM_TH);
      return;
    }
    reconcilePayment(
      {
        bookingId: booking.id,
        provider: reconcileProvider,
        payment_reference: ref,
      },
      {
        onSuccess: (response) => {
          const data = response?.data?.data;
          if (data?.reconciled) {
            toast.success(
              `Booking confirmed via ${data.provider} reference ${data.payment_reference}`,
              { duration: 6000 },
            );
          } else {
            toast.success(data?.message || "Booking already confirmed");
          }
          setReconcileRef("");
          setReconcileProvider("");
          setReconcileOpen(false);
        },
        onError: (error: any) => {
          // Surface the backend's specific message — admin needs to see exactly
          // what went wrong (amount mismatch, status not successful, gateway
          // error, cross-booking collision).
          const detail = error?.response?.data?.detail;
          const msg =
            (typeof detail === "string" && detail) ||
            detail?.msg ||
            error?.response?.data?.message ||
            "Reconcile failed";
          toast.error(typeof msg === "string" ? msg : "Reconcile failed", {
            duration: 7000,
            style: { maxWidth: "420px" },
          });
        },
      },
    );
  };

  // Pay on the guest's behalf: get a fresh checkout URL without notifying the
  // guest, then open it in a new tab so the agent can complete payment
  // themselves (e.g., when the guest is in front of them with cash to swipe
  // on a card or do a transfer through the agent's account).
  //
  // The tab is opened inside the click and pointed at checkout when the link
  // arrives. Opening it in onSuccess, as this used to, was blocked by Safari —
  // the click is long spent by the time the gateway returns a link — and the
  // clipboard fallback was refused for the same reason, so nothing happened
  // while the toast said the link had been copied. It misfired everywhere else
  // too: `window.open` with "noopener" returns null even when the tab DOES
  // open, so Chrome reported a blocked popup over a checkout that had opened.
  const handlePayOnBehalf = () => {
    const tab = window.open("", "_blank");
    resendLink(
      { bookingId: booking.id, notify: false },
      {
        onSuccess: (response) => {
          const url = response?.data?.data?.payment_link;
          if (!url) {
            tab?.close();
            toast.error(MESSAGES.MSG_COULD_NOT_GENERATE_PAYMENT_LINK);
            return;
          }
          if (tab && !tab.closed) {
            // What "noopener" used to guarantee: the gateway's checkout page
            // gets no handle back to the dashboard.
            tab.opener = null;
            tab.location.href = url;
            toast.success(MESSAGES.MSG_OPENING_CHECKOUT_IN_A_NEW_TAB);
            return;
          }
          // Popups refused outright. Only claim the link was copied if it was;
          // otherwise take the agent to checkout in this tab.
          const copied = navigator.clipboard
            ? navigator.clipboard.writeText(url).then(() => true, () => false)
            : Promise.resolve(false);
          copied.then((ok) => {
            if (ok) {
              toast.error(MESSAGES.MSG_BROWSER_BLOCKED_THE_POPUP_LINK_COPIED_TO);
            } else {
              window.location.assign(url);
            }
          });
        },
        onError: (error: any) => {
          tab?.close();
          toast.error(error?.response?.data?.detail || "Failed to open payment link");
        },
      },
    );
  };

  return (
    <CollapsibleSection title="Payment Information" icon="solar:wallet-money-bold" colorClass={colors.bg}>
      <div className="border border-zinc-200 rounded-xl overflow-hidden">
        <div className={`px-4 sm:px-5 py-3 ${colors.bg} ${colors.border} border-b`}>
          <h2 className={`text-sm sm:text-base font-semibold ${colors.text} flex items-center gap-2`}>
            <FaMoneyBillWave />
            Payment
          </h2>
        </div>
        <div className="p-4 sm:p-5">
          <div className="space-y-2">
            <div className="flex justify-between items-center py-1 text-xs sm:text-sm">
              <span className="text-zinc-600">
                {booking.isVenue ? `Rate ${booking.rateLabel}` : "Price per night"}
              </span>
              <span className="font-medium text-zinc-800">{formatMoney(booking.pricePerNight)}</span>
            </div>
            <div className="flex justify-between items-center py-1 text-xs sm:text-sm">
              <span className="text-zinc-600">
                {booking.isVenue
                  ? booking.billingUnit === "PER_HOUR"
                    ? "Hours"
                    : booking.billingUnit === "PER_HALF_DAY"
                      ? "Sessions"
                      : "Days"
                  : "Nights"}
              </span>
              <span className="font-medium text-zinc-800">
                ×{booking.isVenue ? booking.billingDuration : booking.nights}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 text-xs sm:text-sm">
              <span className="text-zinc-600">Units</span>
              <span className="font-medium text-zinc-800">×{booking.unitCount}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-t border-zinc-200 mt-1 pt-2 text-xs sm:text-sm">
              <span className="text-zinc-600">Subtotal</span>
              <span className="font-medium text-zinc-800">{formatMoney(booking.subtotal)}</span>
            </div>
            <div className="flex justify-between items-center py-1 text-xs sm:text-sm">
              <span className="text-zinc-600">Caution fee</span>
              <span className="font-medium text-zinc-800">{formatMoney(booking.cautionFee)}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-t border-zinc-200 mt-1 pt-2 text-xs sm:text-sm">
              <span className="text-zinc-600">Booking total</span>
              <span className="font-medium text-zinc-800">{formatMoney(booking.totalPrice)}</span>
            </div>
            {booking.gatewayFee > 0 && (
              <div className="flex justify-between items-center py-1 text-xs sm:text-sm">
                <span className="text-zinc-600">
                  Payment processing fee
                  <span className="ml-1 text-[10px] text-zinc-400">(charged by gateway)</span>
                </span>
                <span className="font-medium text-zinc-800">{formatMoney(booking.gatewayFee)}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-2 border-t-2 border-zinc-300 mt-2 text-sm sm:text-base">
              <span className="font-semibold text-zinc-800">Total payable</span>
              <span className="text-lg sm:text-xl font-bold text-primary">
                {formatMoney(booking.totalPayable)}
              </span>
            </div>

            {/* Payment method */}
            {booking.paymentMethod && (
              <div className="mt-3 pt-3 border-t border-zinc-200">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Payment Method</span>
                  <span className="font-medium text-zinc-700 capitalize">
                    {booking.paymentMethod.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            )}

            {/* Transaction reference */}
            {booking.transactionRef && (
              <div className={`${!booking.paymentMethod ? "mt-3 pt-3 border-t border-zinc-200" : ""}`}>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500">Transaction Ref</span>
                  <span className="font-mono text-zinc-700">{booking.transactionRef}</span>
                </div>
              </div>
            )}

            {/* Payment proof */}
            {booking.paymentProofUrl && (
              <div className="mt-3 pt-3 border-t border-zinc-200">
                <p className="text-xs text-zinc-500 mb-2">Payment Proof</p>
                <a
                  href={booking.paymentProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-primary hover:bg-zinc-100 transition-colors"
                >
                  <Icon icon="solar:document-bold" className="text-base" />
                  View Payment Proof
                </a>
                {booking.paymentNotes && (
                  <p className="text-xs text-zinc-600 mt-2 italic">
                    Note: {booking.paymentNotes}
                  </p>
                )}
              </div>
            )}

            {/* Retry payment */}
            {canRetry && (
              <div className="mt-4 pt-4 border-t border-zinc-200">
                <button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-xs sm:text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <MdRefresh className={`text-sm ${isRetrying ? "animate-spin" : ""}`} />
                  <span>{isRetrying ? "Verifying..." : "Retry Payment"}</span>
                </button>
                <p className="text-[10px] sm:text-xs text-zinc-500 mt-1.5 text-center">
                  Click to manually verify payment status
                </p>
              </div>
            )}

            {/* Resend payment link — for stuck PENDING bookings where the
                guest never received a link or lost it. Re-issues a fresh
                gateway URL and emails + SMSes the guest. */}
            {canResend && (
              <div className={`${canRetry ? "mt-2" : "mt-4 pt-4 border-t border-zinc-200"}`}>
                {canPayFromWallet && (
                  <div className="mb-3">
                    {!walletConfirmOpen ? (
                      <button
                        onClick={() => setWalletConfirmOpen(true)}
                        disabled={isPayingWithWallet || walletShort || walletNeedsCredentials}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-xs sm:text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Icon icon="solar:wallet-money-bold" className="text-base" />
                        <span>Pay from my wallet</span>
                      </button>
                    ) : (
                      <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg space-y-2">
                        <p className="text-xs sm:text-sm text-teal-900">
                          Pay <strong>{formatMoney(walletCharge)}</strong> from your
                          wallet and confirm this booking? Any payment link the
                          guest was sent stops working.
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={handlePayFromWallet}
                            disabled={isPayingWithWallet}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-xs sm:text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                          >
                            <Icon
                              icon={isPayingWithWallet ? "mdi:loading" : "mdi:check"}
                              className={`text-base ${isPayingWithWallet ? "animate-spin" : ""}`}
                            />
                            <span>{isPayingWithWallet ? "Paying..." : "Confirm payment"}</span>
                          </button>
                          <button
                            onClick={() => setWalletConfirmOpen(false)}
                            disabled={isPayingWithWallet}
                            className="px-3 py-2 bg-white border border-zinc-300 text-zinc-700 rounded-lg text-xs sm:text-sm hover:bg-zinc-50 transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                    {walletNeedsCredentials && (
                      <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs text-amber-900">
                          To pay from your wallet, add the guest&apos;s ID document or a
                          photo of the guest first.
                        </p>
                        <div className="flex gap-2 mt-2">
                          {([
                            { kind: "ID_DOCUMENT" as const, label: "ID document", icon: "solar:card-bold" },
                            { kind: "PHOTO" as const, label: "Guest photo", icon: "solar:camera-bold" },
                          ]).map(({ kind, label, icon }) => (
                            <label
                              key={kind}
                              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-white border border-amber-300 text-amber-900 rounded-lg text-xs cursor-pointer hover:bg-amber-100 transition-colors ${isAttaching ? "opacity-50 pointer-events-none" : ""}`}
                            >
                              <Icon icon={isAttaching ? "mdi:loading" : icon} className={isAttaching ? "animate-spin" : ""} />
                              <span>{label}</span>
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                capture={kind === "PHOTO" ? "user" : "environment"}
                                className="hidden"
                                disabled={isAttaching}
                                onChange={handleAttachCredential(kind)}
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="text-[10px] sm:text-xs text-zinc-500 mt-1.5 text-center">
                      {!myWallet
                        ? "You don't have a wallet yet"
                        : walletShort
                          ? `Balance ${formatMoney(walletBalance)} doesn't cover ${formatMoney(walletCharge)}`
                          : `Balance ${formatMoney(walletBalance)} · no processing fee`}
                    </p>
                  </div>
                )}

                <button
                  onClick={handlePayOnBehalf}
                  disabled={isResending}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-xs sm:text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  <Icon icon="mdi:credit-card-fast" className={`text-base ${isResending ? "animate-pulse" : ""}`} />
                  <span>{isResending ? "Opening..." : "Pay Now on Behalf"}</span>
                </button>
                <p className="text-[10px] sm:text-xs text-zinc-500 mt-1.5 text-center">
                  Opens checkout in a new tab — guest is not notified
                </p>

                <button
                  onClick={handleResend}
                  disabled={isResending}
                  className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 bg-white border border-primary text-primary rounded-lg text-xs sm:text-sm hover:bg-primary/5 transition-colors disabled:opacity-50"
                >
                  <Icon icon="mdi:email-send-outline" className={`text-base ${isResending ? "animate-pulse" : ""}`} />
                  <span>{isResending ? "Sending..." : "Send Payment Link to Guest"}</span>
                </button>
                <p className="text-[10px] sm:text-xs text-zinc-500 mt-1.5 text-center">
                  Re-issue and email + SMS the guest a fresh checkout link
                </p>
              </div>
            )}

            {/* Reconcile by gateway reference — admin power-user fallback for
                stuck bookings where Retry can't resolve (e.g. guest paid via
                an alternate link). Default-collapsed; gated to admin tier. */}
            {canReconcile && (
              <div className="mt-3 pt-3 border-t border-dashed border-zinc-300">
                <button
                  type="button"
                  onClick={() => setReconcileOpen((v) => !v)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-lg text-xs sm:text-sm text-zinc-700 transition-colors"
                  aria-expanded={reconcileOpen}
                >
                  <span className="flex items-center gap-2">
                    <Icon icon="mdi:wrench-outline" className="text-base" />
                    Reconcile by gateway reference
                  </span>
                  <Icon
                    icon="mdi:chevron-down"
                    className={`text-base transition-transform ${reconcileOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {reconcileOpen && (
                  <div className="mt-2 space-y-2 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                    <p className="text-[11px] sm:text-xs text-amber-900 leading-relaxed">
                      Use when Retry can&apos;t resolve a stuck booking. Paste the
                      payment reference from the gateway dashboard — we&apos;ll
                      verify with the provider and finalize the booking. Amount
                      must match within ₦1.
                    </p>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-700 mb-1">
                        Provider
                      </label>
                      <select
                        value={reconcileProvider}
                        onChange={(e) => setReconcileProvider(e.target.value as ReconcileProvider | "")}
                        disabled={isReconciling}
                        className="w-full px-2.5 py-1.5 border border-zinc-300 rounded-md text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      >
                        <option value="">Select provider...</option>
                        <option value="PAYSTACK">Paystack</option>
                        <option value="MONNIFY">Monnify</option>
                        <option value="FLUTTERWAVE">Flutterwave</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-700 mb-1">
                        Payment reference
                      </label>
                      <input
                        type="text"
                        value={reconcileRef}
                        onChange={(e) => setReconcileRef(e.target.value)}
                        disabled={isReconciling}
                        placeholder="Paste reference from gateway dashboard"
                        className="w-full px-2.5 py-1.5 border border-zinc-300 rounded-md text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        autoComplete="off"
                        spellCheck={false}
                      />
                    </div>
                    <button
                      onClick={handleReconcile}
                      disabled={isReconciling || !reconcileProvider || reconcileRef.trim().length < 4}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs sm:text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Icon
                        icon={isReconciling ? "mdi:loading" : "mdi:checkbox-marked-circle-outline"}
                        className={`text-base ${isReconciling ? "animate-spin" : ""}`}
                      />
                      <span>{isReconciling ? "Verifying..." : "Reconcile Payment"}</span>
                    </button>
                    <p className="text-[10px] text-zinc-500 leading-snug">
                      Action is audit-logged with your admin account, the old
                      transaction ref, and the new gateway reference.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}

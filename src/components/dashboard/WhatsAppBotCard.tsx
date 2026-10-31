"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-hot-toast";
import QRCode from "qrcode";
import { GetPlatformWhatsApp } from "@/src/lib/request-handlers/whatsappMgt";

/**
 * "Book for clients on WhatsApp" (PRD Beat 2). Agents get the bot's number, a
 * QR of its wa.me link and a ready-made status line to post.
 *
 * Hidden unless GET /platform/whatsapp says the bot is enabled and gives a
 * link; an error (API not deployed, unapproved agent) reads as disabled.
 *
 * The QR is drawn in the browser. The links QR endpoint only encodes Aparte
 * Link pages, not an arbitrary URL such as wa.me.
 */

const statusText = (number: string) =>
    "Book a verified short-let in Lagos in under 5 minutes on WhatsApp. " +
    `Your money goes to Aparte, not a stranger. Chat: ${number}`;

function useQrDataUrl(text?: string | null) {
    const [src, setSrc] = useState<string | null>(null);
    useEffect(() => {
        if (!text) {
            setSrc(null);
            return;
        }
        let cancelled = false;
        QRCode.toDataURL(text, { margin: 1, width: 480, errorCorrectionLevel: "M", color: { dark: "#124452", light: "#ffffff" } })
            .then((url) => { if (!cancelled) setSrc(url); })
            .catch(() => { if (!cancelled) setSrc(null); });
        return () => { cancelled = true; };
    }, [text]);
    return src;
}

export default function WhatsAppBotCard() {
    const { data, isError } = GetPlatformWhatsApp();
    const link = data?.wa_link ?? null;
    const qr = useQrDataUrl(data?.enabled ? link : null);

    if (isError || !data?.enabled || !link) return null;

    const number = data.number || link.replace(/^https?:\/\/wa\.me\//, "+");
    const message = statusText(number);

    const copy = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success(`${label} copied`);
        } catch {
            toast.error("Couldn't copy. Select the text and copy it manually");
        }
    };

    const share = async () => {
        if (typeof navigator !== "undefined" && navigator.share) {
            try {
                await navigator.share({ text: message });
                return;
            } catch (err: any) {
                // The user closing the share sheet is not a failure.
                if (err?.name === "AbortError") return;
            }
        }
        copy(message, "Message");
    };

    const downloadQr = () => {
        if (!qr) return;
        const a = document.createElement("a");
        a.href = qr;
        a.download = "aparte-whatsapp-qr.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const btn = "px-3 py-2 text-sm font-medium rounded-lg inline-flex items-center justify-center gap-2";

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6">
            <div className="mb-4">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Icon icon="mdi:whatsapp" width="20" height="20" className="text-[#25D366]" />
                    Book for clients on WhatsApp
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Message the Aparte number from your phone to search, hold and send your client a
                    payment link. The booking is credited to you.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="shrink-0 self-center sm:self-start">
                    <div className="w-36 h-36 rounded-lg border border-gray-200 bg-white p-1 flex items-center justify-center">
                        {qr ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={qr} alt={`QR code for ${link}`} className="w-full h-full object-contain" />
                        ) : (
                            <div className="w-full h-full animate-pulse bg-gray-100 rounded" />
                        )}
                    </div>
                    <button onClick={downloadQr} disabled={!qr} className="mt-2 w-36 text-xs text-gray-600 hover:text-gray-900 underline disabled:opacity-50">
                        Download QR
                    </button>
                </div>

                <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm text-gray-800 truncate">
                            {number}
                        </div>
                        <div className="flex gap-2">
                            <a
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`${btn} flex-1 sm:flex-none bg-[#25D366] hover:bg-[#1ebe5b] text-white`}
                            >
                                <Icon icon="mdi:whatsapp" width="16" height="16" />
                                Open WhatsApp
                            </a>
                            <button onClick={() => copy(number, "Number")} className={`${btn} border border-gray-300 hover:bg-gray-50 text-gray-700`}>
                                <Icon icon="lucide:copy" width="15" height="15" />
                                Copy
                            </button>
                        </div>
                    </div>

                    <div className="p-3 border border-gray-200 rounded-lg">
                        <p className="text-xs font-medium text-gray-700 mb-1">Ready-made status for your clients</p>
                        <p className="text-xs text-gray-600 whitespace-pre-line">{message}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            <button onClick={() => copy(message, "Message")} className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1">
                                <Icon icon="lucide:copy" width="13" height="13" /> Copy
                            </button>
                            <button onClick={share} className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1">
                                <Icon icon="lucide:share-2" width="13" height="13" /> Share
                            </button>
                            <a
                                href={`https://wa.me/?text=${encodeURIComponent(message)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
                            >
                                <Icon icon="mdi:whatsapp" width="13" height="13" /> Post on WhatsApp
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

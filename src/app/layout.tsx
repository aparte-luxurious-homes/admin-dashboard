import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "../components/providers";
import { Suspense } from "react";
import Loader from "@/src/components/loader";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import AnalyticsProvider from "@/components/analytics/analytics-provider";

export const metadata: Metadata = {
  title: "Aparte Admin",
  description: "The official admin console of Aparte NG",
  icons: ["/svg/logo.svg"],
};

// Without viewport-fit=cover every `env(safe-area-inset-*)` in the app
// resolves to zero on iOS, so the mobile bottom navigation and the bottom
// sheets sit under the home indicator. They already ask for the inset; this
// is what makes iOS report it.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`antialiased w-full`}
        suppressHydrationWarning
      >
        <Providers>
          <Suspense fallback={<Loader />}>
            {children}
          </Suspense>
        </Providers>
        <Analytics />
        <SpeedInsights />
        {/* GA4 + Microsoft Clarity — consent-gated, production-only */}
        <AnalyticsProvider />
      </body>
    </html>
  );
}

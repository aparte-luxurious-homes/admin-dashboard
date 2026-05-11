import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "../components/providers";
import { Suspense } from "react";
import Loader from "@/src/components/loader";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { HelpDrawer } from "@/components/help/HelpDrawer";
import { HelpTrigger } from "@/components/help/HelpTrigger";
import { DeepLinkBridge } from "@/components/help/DeepLinkBridge";

export const metadata: Metadata = {
  title: "Aparte Admin",
  description: "The official admin console of Aparte NG",
  icons: ["/svg/logo.svg"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`antialiased w-full`}
        suppressHydrationWarning
      >
        <Providers>
          <Suspense fallback={<Loader />}>
            {children}
          </Suspense>
          <HelpDrawer />
          <HelpTrigger />
          <Suspense fallback={null}>
            <DeepLinkBridge />
          </Suspense>
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

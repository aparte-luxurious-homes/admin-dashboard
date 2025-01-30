import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body
        className={`antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

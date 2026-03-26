import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";

export const metadata = {
  title: "Vancouver Market Pulse — Real Estate Market Intelligence",
  description:
    "Interactive dashboard showing 10 years of Greater Vancouver real estate market data. Track benchmark prices, market trends, and investment insights across 21 areas.",
  openGraph: {
    title: "Vancouver Market Pulse",
    description: "10 years of Greater Vancouver real estate data, visualized",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="bg-[#FAFAFA] font-sans text-[#111827] antialiased">
        <NuqsAdapter>{children}</NuqsAdapter>
      </body>
    </html>
  );
}

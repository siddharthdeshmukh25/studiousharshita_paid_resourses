import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif, Poppins, Inter } from "next/font/google";
import "./globals.css";
import Providers from '@/components/providers';
import NextTopLoader from 'nextjs-toploader';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "https://resources.studiousharshita.com"),
  title: {
    default: "studiousharshita | Premium Study Resources",
    template: "%s | studiousharshita",
  },
  description: "Quality study materials and digital resources for focused learning.",
  keywords: ["study resources", "study notes", "digital study materials", "student dashboard"],
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} ${poppins.variable} ${inter.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-[#F8FAFC]">
        <NextTopLoader 
          color="#2563EB"
          initialPosition={0.3}
          crawl={true}
          crawlSpeed={200}
          height={3}
          showSpinner={false}
          speed={200}
          shadow="0 0 10px rgba(37,99,235,0.5)"
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

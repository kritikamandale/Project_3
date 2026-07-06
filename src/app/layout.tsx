import type { Metadata, Viewport } from 'next';
import { Geist_Mono, Playfair_Display, Poppins, Cinzel_Decorative } from 'next/font/google';
import './globals.css';

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const cinzel = Cinzel_Decorative({
  variable: '--font-cinzel',
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Milap — Smart Event Management',
    template: '%s | Milap',
  },
  description:
    "India's premier Pichwai-inspired smart event management platform. Plan weddings, pujas, corporate events and more with AI-powered assistance.",
  keywords: ['event management', 'wedding planning', 'India', 'vendors', 'Milap', 'Pichwai'],
  authors: [{ name: 'Milap' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Milap',
  },
  openGraph: {
    type: 'website',
    siteName: 'Milap',
    title: 'Milap — Smart Event Management',
    description: "India's premier smart event management platform",
  },
};

export const viewport: Viewport = {
  themeColor: '#3E2000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-IN"
      className={`${poppins.variable} ${playfair.variable} ${cinzel.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)] antialiased">
        {children}
      </body>
    </html>
  );
}

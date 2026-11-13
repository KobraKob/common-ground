import type { Metadata } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import { GlobalHeader } from '@/components/shared/GlobalHeader';
import { NavigationSidebar } from '@/components/shared/NavigationSidebar';
import { CelestialBackground } from '@/components/shared/CelestialBackground';
import { Providers } from '@/app/providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: 'CommonGround — Bengaluru Cross-Campus Network',
  description: 'The cross-campus student collaboration platform connecting RVCE, PESU, BMSCE, Christ, MSRIT, and IIITB.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="bg-[#0A0C12] text-[#F8F9FA] antialiased min-h-screen relative overflow-x-hidden selection:bg-amber-500/30 selection:text-[#FBBF24]">
        <Providers>
          <CelestialBackground />
          <div className="relative z-10 flex flex-col min-h-screen">
            <GlobalHeader />
            <div className="flex-1 flex max-w-7xl mx-auto w-full">
              <NavigationSidebar />
              <main className="flex-1 p-5 sm:p-6 md:p-8 lg:p-10 pb-28 md:pb-10 w-full max-w-full">
                {children}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';
import { GlobalHeader } from '@/components/shared/GlobalHeader';
import { NavigationSidebar } from '@/components/shared/NavigationSidebar';
import { CelestialBackground } from '@/components/shared/CelestialBackground';
import { Providers } from '@/app/providers';

export const metadata: Metadata = {
  title: 'CommonGround — Bengaluru Cross-Campus Night Network',
  description: 'Cross-campus student collaboration, communication, and knowledge platform connecting RVCE, PESU, BMSCE, Christ, MSRIT, IIITB, and citywide.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="bg-[#050214] text-[#F8F7FF] antialiased min-h-screen relative overflow-x-hidden selection:bg-purple-600 selection:text-white">
        <Providers>
          <CelestialBackground />
          <div className="relative z-10 flex flex-col min-h-screen">
            <GlobalHeader />
            <div className="flex-1 flex max-w-7xl mx-auto w-full">
              <NavigationSidebar />
              <main className="flex-1 p-4 md:p-6 lg:p-8 pb-24 md:pb-8 w-full max-w-full">
                {children}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}

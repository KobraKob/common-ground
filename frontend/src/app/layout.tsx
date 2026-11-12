import type { Metadata } from 'next';
import './globals.css';
import { GlobalHeader } from '@/components/shared/GlobalHeader';
import { NavigationSidebar } from '@/components/shared/NavigationSidebar';

export const metadata: Metadata = {
  title: 'CommonGround — Bengaluru Cross-Campus Network',
  description: 'Cross-campus student collaboration, communication, and knowledge platform for Bengaluru colleges.',
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
          href="https://fonts.googleapis.com/css2?family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=JetBrains+Mono:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="bg-[#F5F6FD] dark:bg-[#0E0F1A] text-[#1A1C29] dark:text-[#F5F6FD] antialiased">
        <GlobalHeader />
        <div className="flex max-w-7xl mx-auto w-full min-h-[calc(100vh-4rem)]">
          <NavigationSidebar />
          <main className="flex-1 p-4 md:p-6 lg:p-8 pb-20 md:pb-8 overflow-y-auto w-full max-w-full">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import { GlobalHeader } from '@/components/shared/GlobalHeader';
import { NavigationSidebar } from '@/components/shared/NavigationSidebar';
import { Providers } from '@/app/providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: 'CommonGround — Meet beyond your campus',
  description: 'Meet, build and learn with students from every college in Bengaluru.',
  icons: { icon: '/favicon.svg', shortcut: '/favicon.svg', apple: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={inter.variable}>
    <head><link rel="icon" type="image/svg+xml" href="/favicon.svg" /></head>
    <body className="min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--text)] antialiased">
      <Providers>
        <div className="relative z-10 flex min-h-screen flex-col">
          <GlobalHeader />
          <div className="mx-auto flex w-full max-w-[1280px] flex-1">
            <NavigationSidebar />
            <main id="main-content" className="min-w-0 flex-1 px-5 py-8 pb-28 sm:px-6 md:py-10 md:pb-10">
              {children}
            </main>
          </div>
        </div>
      </Providers>
    </body>
  </html>;
}

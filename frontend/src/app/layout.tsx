import type { Metadata } from 'next';
import './globals.css';
import { GlobalHeader } from '@/components/shared/GlobalHeader';
import { NavigationSidebar } from '@/components/shared/NavigationSidebar';
import { Providers } from '@/app/providers';
import { GlobalFooter } from '@/components/shared/GlobalFooter';

export const metadata: Metadata = {
  title: 'CommonGround — Meet beyond your campus',
  description: 'Discover student communities, projects, events and knowledge across Bengaluru campuses.',
  icons: { icon: '/favicon.svg', shortcut: '/favicon.svg', apple: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <Providers>
          <a className="cg-skip-link" href="#main-content">Skip to content</a>
          <GlobalHeader />
          <NavigationSidebar />
          <main id="main-content" className="w-full min-h-[calc(100vh-8rem)]">{children}</main>
          <GlobalFooter />
        </Providers>
      </body>
    </html>
  );
}

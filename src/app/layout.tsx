// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

import AuthProvider from '@/providers/AuthProvider';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import FloatingChat from '@/components/features/chat/FloatingChat';
import { getCurrentUserWithProfile } from '@/services/profileService';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'SecondHub — Marketplace Barang Bekas Berkualitas',
    template: '%s | SecondHub',
  },
  description:
    'Temukan dan jual barang bekas berkualitas dengan mudah. Elektronik, otomotif, fashion, dan lainnya di SecondHub.',
};

/**
 * Root Layout — the outermost shell of the entire app.
 *
 * Key decisions:
 * 1. AuthProvider wraps everything → single source of truth for auth state.
 * 2. Navbar + Footer rendered HERE → never unmount during navigation.
 * 3. Server-pre-fetched user/profile passed to AuthProvider → anti-flicker.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Server-side: pre-fetch auth state to avoid client-side flickering
  const { user, profile } = await getCurrentUserWithProfile();

  return (
    <html lang="id" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <AuthProvider
          initialUser={user ? JSON.parse(JSON.stringify(user)) : null}
          initialProfile={profile ? JSON.parse(JSON.stringify(profile)) : null}
        >
          {/* Global Navbar — persistent across all routes */}
          <Navbar />

          {/* Page Content */}
          <main className="flex-1">{children}</main>

          {/* Global Footer */}
          <Footer />

          {/* Global Floating Chat — persistent across all routes */}
          <FloatingChat />
        </AuthProvider>
      </body>
    </html>
  );
}

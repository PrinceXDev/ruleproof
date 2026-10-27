import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Geist, Geist_Mono as GeistMono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = GeistMono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'RuleProof',
  description:
    'Speak an access rule, review the test cases it produces, and verify what the API actually enforces.',
};

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
    <body>{children}</body>
  </html>
);

export default RootLayout;

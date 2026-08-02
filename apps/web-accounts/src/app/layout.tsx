import type { Metadata } from 'next';
import './globals.css';
import { ReactQueryDevShell } from './ReactQueryDevShell';

export const metadata: Metadata = { title: 'Accounts — Ally Demo' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <ReactQueryDevShell>{children}</ReactQueryDevShell>
      </body>
    </html>
  );
}

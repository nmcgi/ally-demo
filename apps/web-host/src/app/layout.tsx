import type { Metadata } from 'next';
import './globals.css';
import { StoreProvider } from '@/store/StoreProvider';
import { ReactQueryProvider } from './ReactQueryProvider';

export const metadata: Metadata = {
  title: 'Ally Demo',
  description: 'Digital banking reference platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>
          <ReactQueryProvider>{children}</ReactQueryProvider>
        </StoreProvider>
      </body>
    </html>
  );
}

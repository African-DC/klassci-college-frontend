import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/shared/Providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'KLASSCI Collège',
  description: 'Gestion scolaire pour établissements secondaires',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

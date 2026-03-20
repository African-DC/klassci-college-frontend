import type { Metadata } from 'next';
import { DM_Sans, DM_Serif_Display } from 'next/font/google';
import { Providers } from '@/components/shared/Providers';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
});

const dmSerif = DM_Serif_Display({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-serif',
});

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
      <body className={`${dmSans.variable} ${dmSerif.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

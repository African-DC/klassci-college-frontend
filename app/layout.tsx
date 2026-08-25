import type { Metadata } from 'next';
import { DM_Sans, Nunito_Sans } from 'next/font/google';
import { Providers } from '@/components/shared/Providers';
import { ChunkErrorReloader } from '@/components/shared/ChunkErrorReloader';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
});

// Police des titres : Nunito Sans (humaniste, sobre) en remplacement de
// DM Serif Display, jugé trop fantaisiste. Variable font → tous les poids
// (les titres utilisent semibold/bold). Le token Tailwind `font-serif`
// (var --font-serif) pointe désormais sur cette police pour tous les titres.
const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  variable: '--font-serif',
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://college.klassci.com';
const description =
  'KLASSCI College : la gestion scolaire simple pour les collèges et lycées. Inscriptions, notes et bulletins, paiements et présences.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'KLASSCI College',
    template: '%s | KLASSCI College',
  },
  description,
  applicationName: 'KLASSCI College',
  openGraph: {
    type: 'website',
    siteName: 'KLASSCI College',
    title: 'KLASSCI College',
    description,
    url: siteUrl,
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KLASSCI College',
    description,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${nunitoSans.variable} font-sans antialiased`}>
        <ChunkErrorReloader />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

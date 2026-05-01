import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { PageLoader } from '@/components/layout/page-loader';
import { montserrat } from './fonts';
import { cn } from '@/lib/utils';
import CartProviderWrapper from './cart-provider-wrapper';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://amazoprint.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Amazoprint | Custom Printing & Design Services',
    template: '%s | Amazoprint',
  },
  description: 'Premium custom printing and design services powered by AI. Design business cards, posters, packaging, and more with our professional online editor.',
  keywords: ['custom printing', 'online design tool', 'print on demand', 'AI design', 'business cards', 'posters', 'flyers', 'packaging', 'Amazoprint', 'graphic design'],
  authors: [{ name: 'Amazoprint Team' }],
  creator: 'Amazoprint',
  publisher: 'Amazoprint',
  applicationName: 'Amazoprint',
  icons: {
    icon: '/uploads/amazoIcon.png',
    shortcut: '/uploads/amazoIcon.png',
    apple: '/uploads/amazoIcon.png',
  },
  openGraph: {
    title: 'Amazoprint | Custom Printing & Design Services',
    description: 'Create stunning custom designs with Amazoprint. AI-powered tools for professional print results.',
    url: siteUrl,
    siteName: 'Amazoprint',
    images: [
      {
        url: '/uploads/amazoIcon.png', 
        width: 512,
        height: 512,
        alt: 'Amazoprint - Custom Printing & Design',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Amazoprint | Custom Printing & Design Services',
    description: 'The easiest way to design and print high-quality custom products.',
    images: [`${siteUrl}/uploads/amazoIcon.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
};

import { StructuredData } from '@/components/layout/structured-data';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("antialiased", montserrat.variable)}>
      <head>
        <StructuredData />
        <link rel="icon" href="/uploads/amazoIcon.png" sizes="any" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&family=Roboto&family=Open+Sans&family=Lato&family=Montserrat&family=Poppins&family=Oswald&family=Source+Sans+3&family=Raleway&family=Ubuntu&family=Playfair+Display&family=Merriweather&family=PT+Serif&family=Lora&family=Nunito&family=Roboto+Mono&family=Fira+Code&family=Outfit&family=Dancing+Script&family=Pacifico&family=Caveat&family=Righteous&family=Lobster&family=Bebas+Neue&family=Anton&family=Josefin+Sans&family=Titillium+Web&family=Quicksand&family=Rubik&family=Inconsolata&family=Cinzel&family=Amatic+SC&family=Comfortaa&family=Comic+Neue&family=Permanent+Marker&family=Bungee&family=Rakkas&family=Kalam&family=Indie+Flower&family=Satisfy&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body">
        <CartProviderWrapper>
          <PageLoader />
          {children}
          <Toaster />
        </CartProviderWrapper>
      </body>
    </html>
  );
}

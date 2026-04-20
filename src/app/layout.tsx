import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { PageLoader } from '@/components/layout/page-loader';
import { inter, oswald } from './fonts';
import { cn } from '@/lib/utils';
import CartProviderWrapper from './cart-provider-wrapper';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://amazoprint.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Amazoprint | Custom Printing & Design Services',
    template: '%s | Amazoprint',
  },
  description: 'Your one-stop shop for high-quality custom printing and design services. Use our AI tools, start a design contest, or upload your own files.',
  icons: {
    icon: '/uploads/amazoLogo.png',
    shortcut: '/uploads/amazoLogo.png',
    apple: '/uploads/amazoLogo.png',
  },
  openGraph: {
    title: 'Amazoprint | Custom Printing & Design Services',
    description: 'Your one-stop shop for high-quality custom printing and design services.',
    url: siteUrl,
    siteName: 'Amazoprint',
    images: [
      {
        url: '/uploads/amazoLogo.png', 
        width: 512,
        height: 512,
        alt: 'Amazoprint Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Amazoprint | Custom Printing & Design Services',
    description: 'Your one-stop shop for high-quality custom printing and design services.',
    images: [`${siteUrl}/uploads/amazoLogo.png`],
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("antialiased", inter.variable, oswald.variable)}>
      <head>
        <link rel="icon" href="/uploads/amazoLogo.png" sizes="any" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
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

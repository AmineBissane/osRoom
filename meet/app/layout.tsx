import '../styles/globals.css';
import '@livekit/components-styles';
import '@livekit/components-styles/prefabs';
import type { Metadata, Viewport } from 'next';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'),
  title: {
    default: 'osRoom | Virtual Meeting Platform',
    template: '%s',
  },
  description:
    'osRoom is a powerful virtual meeting platform for seamless real-time communication and collaboration.',
  twitter: {
    card: 'summary_large_image',
  },
  openGraph: {
    url: 'https://osroom.com',
    images: [
      {
        url: '/images/osroom/favicon-color.svg',
        width: 100,
        height: 100,
        type: 'image/svg+xml',
      },
    ],
    siteName: 'osRoom',
  },
  icons: {
    icon: {
      rel: 'icon',
      url: '/images/osroom/favicon-color.svg',
      type: 'image/svg+xml',
    },
  },
};

export const viewport: Viewport = {
  themeColor: '#3366cc',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body data-lk-theme="default">
        <Toaster />
        {children}
      </body>
    </html>
  );
}

import '@fontsource/bungee';
import '@fontsource/montserrat';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/700.css';
import '@fontsource/montserrat/800.css';
import './globals.css';
import { Providers } from '@/app/providers';
import { Metadata } from 'next';
import { supportedNetworks } from '@/constants/supportedNetworks';

const title = 'GRAVE';
const description = 'A cemetery for unwanted digital assets';
const baseUrl = supportedNetworks['42'].url;

export const metadata: Metadata = {
  title: title,
  description: description,
  openGraph: {
    title: title,
    description: description,
    type: 'website',
    url: baseUrl,
    images: {
      url: `${baseUrl}/images/ghoulie.jpg`,
    },
  },
  twitter: {
    images: {
      url: `${baseUrl}/images/ghoulie.jpg`,
    },
    card: 'summary_large_image',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
      </head>
      <body>
        <Providers>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: '105vh',
            }}
          >
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}

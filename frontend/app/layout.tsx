import '@fontsource/bungee';
import '@fontsource/montserrat';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/700.css';
import '@fontsource/montserrat/800.css';
import './globals.css';
import Footer from '@/components/Footer';
import NavBar from '@/components/NavBar';
import Head from 'next/head';
import { Providers } from '@/app/providers';
import { Metadata } from 'next';
import { getNetworkConfig } from '@/constants/networks';

const title = 'GRAVE';
const description = 'A cemetery for unwanted digital assets';
const baseUrl = getNetworkConfig(
  process.env.NEXT_PUBLIC_DEFAULT_NETWORK!
).baseUrl;

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
        <Head>
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
          />
        </Head>
        <body>
          <Providers>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '105vh',
              }}
            >
              <NavBar />
              <div style={{ flexGrow: 0.9 }}>{children}</div>
              <Footer />
            </div>
          </Providers>
        </body>
    </html>
  );
}

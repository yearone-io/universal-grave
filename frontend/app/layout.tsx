import '@fontsource/bungee';
import '@fontsource/montserrat';
import './globals.css';
import { WalletProvider } from '@/components/wallet/WalletProvider';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
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
      <WalletProvider>
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
              <Header />
              <div style={{ flexGrow: 0.9 }}>{children}</div>
              <Footer />
            </div>
          </Providers>
        </body>
      </WalletProvider>
    </html>
  );
}

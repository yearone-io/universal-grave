import '@fontsource/bungee';
import '@fontsource/montserrat';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/700.css';
import '@fontsource/montserrat/800.css';
import './globals.css';
import { WalletProvider } from '@/components/wallet/WalletProvider';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import Head from 'next/head';
import { Providers } from '@/app/providers';
import { Metadata } from 'next';
import { constants } from '@/app/constants';

const title = 'GRAVE';
const description = 'A cemetery for unwanted digital assets';
export const metadata: Metadata = {
  title: title,
  description: description,
  openGraph: {
    title: title,
    description: description,
    type: 'website',
    url: `${constants.DOMAIN}`,
    images: {
      url: `${constants.DOMAIN}/images/ghoulie.jpg`,
    },
  },
  twitter: {
    images: {
      url: `${constants.DOMAIN}/images/ghoulie.jpg`,
    },
    card: 'summary_large_image',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let title = 'Universal Grave';

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

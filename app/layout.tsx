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
import Script from 'next/script';

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <Script id="ug-ethereum-guard" strategy="beforeInteractive">
          {`
            (function () {
              if (typeof window === 'undefined') return;

              var fallback = {
                __ugStub: true,
                isMetaMask: false,
                selectedAddress: null,
                chainId: null,
                providers: [],
                isConnected: function () { return false; },
                request: async function () { throw new Error('No injected Ethereum provider available.'); },
                on: function () {},
                removeListener: function () {},
              };

              var current = window.ethereum && typeof window.ethereum === 'object'
                ? window.ethereum
                : fallback;

              if (!('selectedAddress' in current)) {
                try { current.selectedAddress = null; } catch (e) {}
              }

              try {
                Object.defineProperty(window, 'ethereum', {
                  configurable: true,
                  enumerable: true,
                  get: function () {
                    return current;
                  },
                  set: function (nextProvider) {
                    if (nextProvider && typeof nextProvider === 'object') {
                      if (!('selectedAddress' in nextProvider)) {
                        try { nextProvider.selectedAddress = null; } catch (e) {}
                      }
                      current = nextProvider;
                      return;
                    }
                    current = fallback;
                  },
                });
              } catch (e) {
                if (!window.ethereum || typeof window.ethereum !== 'object') {
                  window.ethereum = fallback;
                }
              }
            })();
          `}
        </Script>
      </head>
      <body suppressHydrationWarning>
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

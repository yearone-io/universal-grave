'use client';

import { walletConnect } from '@wagmi/connectors';
import { createConfig, http, injected } from 'wagmi';
import { lukso, luksoTestnet } from 'wagmi/chains';
import { supportedNetworks } from '@/constants/supportedNetworks';

/** LUKSO's public UP Modal project id. Used when the app has no project id of its own. */
const LUKSO_WALLETCONNECT_PROJECT_ID = '7d1af65dc2722192d9914b5d6eaeb421';
const defaultAppUrl = 'https://universalgrave.com';

const walletConnectProjectId = (
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || LUKSO_WALLETCONNECT_PROJECT_ID
).trim();

export const wagmiChains = [lukso, luksoTestnet] as const;

const resolveAppUrl = () => {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return defaultAppUrl;
};

const appUrl = resolveAppUrl();

const globalScope = globalThis as typeof globalThis & {
  __ugWagmiConfig?: ReturnType<typeof createConfig>;
};

// One config for the extension, the in-app browser, and WalletConnect.
// The UP modal discovers the extension through EIP-6963. A custom `lukso`
// injected id would not match `cloud.universalprofile` and would duplicate it.
export const wagmiConfig = (() => {
  if (globalScope.__ugWagmiConfig) {
    return globalScope.__ugWagmiConfig;
  }

  const config = createConfig({
    chains: wagmiChains,
    connectors: [
      injected({
        shimDisconnect: false,
        unstable_shimAsyncInject: false,
      }),
      walletConnect({
        projectId: walletConnectProjectId,
        showQrModal: false,
        metadata: {
          name: 'Universal GRAVE',
          description: 'Protect your Universal Profile from spam.',
          url: appUrl,
          icons: [`${appUrl}/images/logo-full.png`],
          redirect: {
            universal: appUrl,
          },
        },
      }),
    ],
    multiInjectedProviderDiscovery: true,
    transports: {
      [lukso.id]: http(supportedNetworks['42'].rpcUrl),
      [luksoTestnet.id]: http(supportedNetworks['4201'].rpcUrl),
    },
    ssr: true,
  });

  globalScope.__ugWagmiConfig = config;
  return config;
})();

export { walletConnectProjectId };

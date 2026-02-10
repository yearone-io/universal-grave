'use client';

import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { universalProfilesWallet } from '@rainbow-me/rainbowkit/wallets';
import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { lukso, luksoTestnet } from 'wagmi/chains';
import { supportedNetworks } from '@/constants/supportedNetworks';

const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';
const defaultAppUrl = 'https://universalgrave.com';

export const wagmiChains = [lukso, luksoTestnet] as const;

const ensureEthereumStub = () => {
  if (typeof window === 'undefined') return;
  const existingEthereum = (window as any).ethereum;
  if (existingEthereum && typeof existingEthereum === 'object') {
    if (!('selectedAddress' in existingEthereum)) {
      try {
        (existingEthereum as { selectedAddress?: string | null }).selectedAddress =
          null;
      } catch {
        // no-op: some providers expose readonly fields
      }
    }
    return;
  }
  const stubEthereum = {
    __ugStub: true,
    isMetaMask: false,
    selectedAddress: null,
    chainId: null,
    isConnected: () => false,
    request: async () => {
      throw new Error('No injected Ethereum provider available.');
    },
    on: () => {},
    removeListener: () => {},
    providers: [],
  };
  try {
    Object.defineProperty(window, 'ethereum', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: stubEthereum,
    });
  } catch {
    (window as any).ethereum = stubEthereum;
  }
};

// Only check mobile on client side to avoid SSR/hydration mismatch
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
};

const getAppUrl = () =>
  typeof window === 'undefined' ? defaultAppUrl : window.location.origin;

const getAppRedirectUrl = () =>
  typeof window === 'undefined' ? defaultAppUrl : window.location.href;

const createDesktopConnectors = () => [
  injected({
    shimDisconnect: false,
    unstable_shimAsyncInject: false,
    target: {
      id: 'lukso',
      name: 'Universal Profile',
      provider: (windowArg?: any) => windowArg?.lukso,
    },
  }),
];

const createMobileConnectors = () =>
  connectorsForWallets(
    [
      {
        groupName: 'Login with Universal Profile',
        wallets: [universalProfilesWallet],
      },
    ],
    {
      appName: 'Universal GRAVE',
      appDescription: 'Protect your Universal Profile from spam.',
      appUrl: getAppUrl(),
      appIcon: `${getAppUrl()}/images/logo-full.png`,
      projectId: walletConnectProjectId,
      walletConnectParameters: {
        metadata: {
          name: 'Universal GRAVE',
          description: 'Protect your Universal Profile from spam.',
          url: getAppUrl(),
          icons: [`${getAppUrl()}/images/logo-full.png`],
          redirect: {
            universal: getAppRedirectUrl(),
          },
        },
      },
    }
  );

// Only run on client
if (typeof window !== 'undefined') {
  ensureEthereumStub();
}

// Use a unified config that works for both mobile and desktop
// This avoids SSR hydration mismatch where server creates desktop config
// but client expects mobile config
const createUnifiedConnectors = () => {
  // On server, return desktop connectors (will be overridden on client hydration)
  if (typeof window === 'undefined') {
    return createDesktopConnectors();
  }
  // On client, check if mobile
  return isMobileDevice() ? createMobileConnectors() : createDesktopConnectors();
};

const globalScope = globalThis as typeof globalThis & {
  __ugWagmiConfig?: ReturnType<typeof createConfig>;
  __ugWagmiConnectors?: ReturnType<typeof createUnifiedConnectors>;
  __ugWagmiConfigInitialized?: boolean;
};

// Create connectors lazily on first access
const getConnectors = () => {
  if (!globalScope.__ugWagmiConnectors) {
    globalScope.__ugWagmiConnectors = createUnifiedConnectors();
  }
  return globalScope.__ugWagmiConnectors;
};

// Create a single config that handles both mobile and desktop
// The connectors determine behavior, not the config itself
export const wagmiConfig = (() => {
  if (globalScope.__ugWagmiConfig) {
    return globalScope.__ugWagmiConfig;
  }

  const config = createConfig({
    chains: wagmiChains,
    connectors: getConnectors(),
    multiInjectedProviderDiscovery: false,
    transports: {
      [lukso.id]: http(supportedNetworks['42'].rpcUrl),
      [luksoTestnet.id]: http(supportedNetworks['4201'].rpcUrl),
    },
    ssr: true, // Enable SSR support to prevent hydration issues
  });

  globalScope.__ugWagmiConfig = config;
  return config;
})();

export { walletConnectProjectId };

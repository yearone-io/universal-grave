'use client';
import '@rainbow-me/rainbowkit/styles.css';
import theme from './theme';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { CacheProvider } from '@chakra-ui/next-js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { ProfileProvider } from '@/contexts/ProfileProvider';
import { GraveProvider } from '@/contexts/GraveContext';
import { wagmiConfig } from '@/utils/wagmiConfig';
import type { ReactNode } from 'react';

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CacheProvider>
      <ColorModeScript initialColorMode="dark" type="cookie" nonce="chakra-ui" />
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider modalSize="compact">
            <ChakraProvider theme={theme}>
              <ProfileProvider>
                <GraveProvider>{children}</GraveProvider>
              </ProfileProvider>
            </ChakraProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </CacheProvider>
  );
}

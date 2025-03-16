'use client';
import theme from './theme';
import { ChakraProvider } from '@chakra-ui/react';
import { ConnectedAccountProvider } from '@/contexts/ConnectedAccountProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider theme={theme}>
      <ConnectedAccountProvider>{children}</ConnectedAccountProvider>
    </ChakraProvider>
  );
}

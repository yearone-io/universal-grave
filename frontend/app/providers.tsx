'use client';
import theme from './theme';
import { ChakraProvider } from '@chakra-ui/react';
import { ProfileProvider } from '@/contexts/ProfileProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider theme={theme}>
      <ProfileProvider>{children}</ProfileProvider>
    </ChakraProvider>
  );
}

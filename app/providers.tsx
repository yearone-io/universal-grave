'use client';
import theme from './theme';
import { ChakraProvider } from '@chakra-ui/react';
import { CacheProvider } from '@chakra-ui/next-js';
import { ProfileProvider } from '@/contexts/ProfileProvider';
import { GraveProvider } from '@/contexts/GraveContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CacheProvider>
      <ChakraProvider theme={theme}>
        <ProfileProvider>
          <GraveProvider>{children}</GraveProvider>
        </ProfileProvider>
      </ChakraProvider>
    </CacheProvider>
  );
}

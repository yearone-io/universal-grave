'use client';
import theme from './theme';
import { ChakraProvider } from '@chakra-ui/react';
import { ProfileProvider } from '@/contexts/ProfileProvider';
import { GraveProvider } from '@/contexts/GraveContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider theme={theme}>
      <ProfileProvider>
        <GraveProvider>{children}</GraveProvider>
      </ProfileProvider>
    </ChakraProvider>
  );
}

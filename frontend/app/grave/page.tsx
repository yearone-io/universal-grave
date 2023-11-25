'use client';
import { Box, Container, Flex, Image, Stack, Text } from '@chakra-ui/react';
import '../globals.css';
import JoinGraveBtn from '@/components/JoinGraveBtn';
import LspAssets from '@/components/LspAssets';
import { WalletContext } from '@/components/wallet/WalletContext';
import SignInBox from '@/components/SignInBox';
import { useContext } from 'react';
import JoinGravePannel from '@/components/joinGravePannel';

export default function Home() {
  const logoPath = '/images/logo-full.png';
  const walletContext = useContext(WalletContext);
  const { account } = walletContext;

  return (
    <Container w={'100%'} py={5} maxW="100%" pl="10%" pr="10%">
      <Stack
        direction={{ base: 'column', md: 'row' }}
        justify="space-around"
        align="center"
        w="100%"
      >
        <Box w="60%">
          {account ? (
            <Box>
              <Text fontSize="xl" fontWeight="bold" fontFamily="Bugee">
                SETTINGS
              </Text>
              <JoinGravePannel />
              <Text fontSize="xl" fontWeight="bold" fontFamily="Bugee">
                YOUR GRAVEYARD
              </Text>
              <LspAssets />
            </Box>
          ) : (
            <SignInBox />
          )}
        </Box>
        <Image
          mx={'40px'}
          src={logoPath}
          alt="Universal-Grave-logo"
          width={'300px'}
        />
      </Stack>
    </Container>
  );
}

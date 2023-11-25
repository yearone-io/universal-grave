'use client';
import { Box, Container, Flex, Image, Stack, Text } from '@chakra-ui/react';
import '../globals.css';
import LspAssets from '@/components/LspAssets';
import { WalletContext } from '@/components/wallet/WalletContext';
import SignInBox from '@/components/SignInBox';
import { useContext } from 'react';
import JoinGravePanel from '@/components/JoinGravePanel';

export default function Home() {
  const logoPath = '/images/logo-full.png';
  const walletContext = useContext(WalletContext);
  const { account } = walletContext;

  return (
    <Container maxW={'6xl'}  width={'100%'} py={5}>
      <Stack
        direction={{ base: 'column', md: 'row' }}
        justify="space-between"
        align="center"
        w="100%"
        pt='50px'
      >
        <Box w="60%">
          {account ? (
            <Box>
              <Box>
                <Text fontSize='20px' color={"white"} fontFamily="Bungee" mb='30px'>
                  SETTINGS
                </Text>
                <Box>
                  <Flex justifyContent='center'>
                    <JoinGravePanel />
                  </Flex>
                </Box>
              </Box>
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
      {account ? 
              <Box>
                <Text fontSize='20px' color='white' fontFamily="Bungee"  mb='30px' mt='30px'>
                  YOUR GRAVEYARD
                </Text>
                <LspAssets />
            </Box>
            :
          <></>
    } 
    </Container>
  );
}

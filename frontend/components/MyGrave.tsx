'use client';
import {
  Box,
  Container,
  Flex,
  Image,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from '@chakra-ui/react';
import { WalletContext } from '@/components/wallet/WalletContext';
import SignInBox from '@/components/SignInBox';
import React, { useContext } from 'react';
import JoinGravePanel from '@/components/JoinGravePanel';
import GraveContents from '@/components/GraveContents';
import ManageAllowList from '@/components/ManageAllowList';
import { formatAddress } from '@/utils/tokenUtils';

export default function MyGrave() {
  const logoPath = '/images/logo-full.png';
  const walletContext = useContext(WalletContext);
  const { account, URDLsp7, URDLsp8, networkConfig } = walletContext;

  return (
    <Container maxW={'6xl'} width={'100%'} py={5}>
      <Stack
        direction={{ base: 'column', md: 'row' }}
        justify="space-between"
        alignItems="flex-start"
        w="100%"
        pt="50px"
      >
        <Box>
          {account ? (
            <Box>
              <Box>
                <Text
                  fontSize="20px"
                  color={'white'}
                  fontFamily="Bungee"
                  mb="30px"
                >
                  SETTINGS
                </Text>
                <Box>
                  <Flex justifyContent="center">
                    <JoinGravePanel />
                  </Flex>
                </Box>
                <Box maxW={'550px'} mt='20px'>
                <Tabs isFitted >
                  <TabList pb='2px'>
                    <Tab 
                      borderTopLeftRadius={'var(--chakra-radii-lg)'}
                      _selected={{ 
                      color: 'var(--chakra-colors-dark-purple-500)', 
                      bg: 'var(--chakra-colors-dark-purple-200)',
                      fontWeight: 500
                    }}>Advanced info</Tab>
                    <Tab 
                      borderTopRightRadius={'var(--chakra-radii-lg)'}
                      _selected={{ 
                        color: 'var(--chakra-colors-dark-purple-500)', 
                        bg: 'var(--chakra-colors-dark-purple-200)',
                        fontWeight: 500
                      }}>Manage Allow List</Tab>
                  </TabList>
                  <TabPanels
                    bg='var(--chakra-colors-dark-purple-200)'
                    color='var(--chakra-colors-dark-purple-500)'
                    borderBottomRadius={'var(--chakra-radii-lg)'}

                  >
                  <TabPanel 
                      bg='var(--chakra-colors-dark-purple-200)'
                      color='var(--chakra-colors-dark-purple-500)'
                    >
                    <Box>
                      <Text><strong>LSP7</strong> Universal Receiver Delegate</Text>
                      <a
                        href={`${networkConfig.explorerURL}/address/${URDLsp7}`}
                        style={{ textDecoration: 'underline' }}
                        target="_blank"
                      >
                        {URDLsp7 ? formatAddress(URDLsp7): URDLsp7}
                      </a>
                    </Box>
                    <Box mt='20px'>
                      <Text><strong>LSP8</strong> Universal Receiver Delegate</Text>
                      <a
                        href={`${networkConfig.explorerURL}/address/${URDLsp8}`}
                        style={{ textDecoration: 'underline' }}
                        target="_blank"
                      >
                        {URDLsp8 ? formatAddress(URDLsp8): URDLsp8}
                      </a>
                    </Box>
                    </TabPanel>
                    <TabPanel>
                      <ManageAllowList />
                    </TabPanel>
                  </TabPanels>
                </Tabs>
                </Box>
              </Box>
            </Box>
          ) : (
            <SignInBox />
          )}
        </Box>
        <Image src={logoPath} alt="Universal-Grave-logo" width={'300px'} />
      </Stack>
      {account && <GraveContents account={account} />}
    </Container>
  );
}

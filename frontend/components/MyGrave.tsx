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
import SettingsNav from './SettingsNav';

export default function MyGrave() {
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
                <Box display="flex" flexDir="column">
                  <Text
                    fontSize="20px"
                    color={'white'}
                    fontFamily="Bungee"
                    mb="30px"
                  >
                    SETTINGS
                  </Text>
                </Box>
                <Box display="flex">
                  <SettingsNav />
                  <Flex justifyContent="center">
                    <JoinGravePanel />
                  </Flex>
                </Box>
              </Box>
            </Box>
          ) : (
            <SignInBox />
          )}
        </Box>
      </Stack>
      {account && <GraveContents account={account} />}
    </Container>
  );
}

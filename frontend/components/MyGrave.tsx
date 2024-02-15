'use client';
import {
  Box,
  Container,
  Image,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useColorModeValue,
  VStack,
  Flex,
} from '@chakra-ui/react';
import { WalletContext } from '@/components/wallet/WalletContext';
import SignInBox from '@/components/SignInBox';
import React, { useContext, useEffect, useState } from 'react';
import JoinGravePanel from '@/components/JoinGravePanel';
import GraveContents from '@/components/GraveContents';
import AdvancedInfoPanel from './AdvancedInfoPanel';
import ManageAllowList from './ManageAllowList';
import { hasOlderGraveDelegate } from '@/utils/urdUtils';
import { UpgradeURD } from '@/components/UpgradeURD';

const getTabOption = (tabName: string) => {
  return (
    <Tab
      fontSize="16px"
      color={'white'}
      whiteSpace="nowrap"
      fontFamily="Montserrat"
      p="6px 20px 6px 6px"
      m="0"
      gap="10px"
      width={'100%'}
      justifyContent={'start'}
      fontWeight={600}
      _selected={{
        backgroundColor: 'dark.purple.200',
        color: 'dark.purple.500',
        borderRadius: 'lg',
      }}
      _active={{
        backgroundColor: 'dark.purple.200',
        color: 'dark.purple.500',
        borderRadius: 'lg',
      }}
    >
      {tabName}
    </Tab>
  );
};

const getTabPanel = (tabName: string) => {
  const logoPath = '/images/logo-full.png';
  const bgColor = useColorModeValue('light.green.brand', 'dark.purple.200');
  let panel;
  switch (tabName) {
    case 'Subscription':
      panel = <JoinGravePanel />;
      break;
    case 'Manage Allowlist':
      panel = <ManageAllowList />;
      break;
    case 'Advanced Info':
      panel = <AdvancedInfoPanel />;
      break;
    default:
      panel = <JoinGravePanel />;
      break;
  }
  return (
    <TabPanel
      m="0 20px"
      borderRadius="lg"
      boxShadow="md"
      backgroundColor={bgColor}
      color={'dark.purple.500'}
      minHeight={'450px'}
      padding="20px"
      width={'100%'}
    >
      <Flex width={'100%'} justifyContent={'space-between'} flexWrap={'wrap'}>
        <Flex
          maxWidth={'560px'}
          textAlign="center"
          flexDirection={'column'}
          gap={3}
          alignItems={'center'}
          width={'100%'}
          padding={'0 20px'}
        >
          {panel}
        </Flex>
        <Flex>
          <Image
            src={logoPath}
            alt="Universal-Grave-logo"
            height={'410px'}
            width="266px"
            padding="25px"
          />
        </Flex>
      </Flex>
    </TabPanel>
  );
};

export default function MyGrave() {
  const walletContext = useContext(WalletContext);
  const { account } = walletContext;
  const [oldForwarderAddress, setOldForwarderAddress] = useState<
    string | null
  >();

  useEffect(() => {
    setOldForwarderAddress(hasOlderGraveDelegate(URDLsp7, URDLsp8));
  }, [URDLsp7, URDLsp8]);

  return (
    <Container maxW={'6xl'} width={'100%'} py={5}>
      <Stack
        direction={{ base: 'column', md: 'row' }}
        justify="space-between"
        alignItems="flex-start"
        w="100%"
        pt="50px"
        mb={2}
      >
        <Box width={'100%'}>
          {account ? (
            <Box width={'100%'}>
              <Box width={'100%'}>
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
                <Box>
                  <Flex justifyContent="center">
                    {oldForwarderAddress ? (
                      <UpgradeURD oldForwarderAddress={oldForwarderAddress} />
                    ) : (
                      <JoinGravePanel />
                    )}
                  </Flex>
                </Box>
                <Box display="flex" width={'100%'}>
                  <Tabs display="flex" flexDirection="row" width={'100%'}>
                    <TabList
                      display="flex"
                      flexDirection="column"
                      alignItems="start"
                      border={'none'}
                    >
                      {getTabOption('Subscription')}
                      {getTabOption('Manage Allowlist')}
                      {getTabOption('Advanced Info')}
                    </TabList>
                    <TabPanels p="0" width={'100%'} mr={'25px'}>
                      {getTabPanel('Subscription')}
                      {getTabPanel('Manage Allowlist')}
                      {getTabPanel('Advanced Info')}
                    </TabPanels>
                  </Tabs>
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

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
  Flex,
  Button,
} from '@chakra-ui/react';
import SignInBox from '@/components/SignInBox';
import React, { useEffect, useState } from 'react';
import { useProfile } from '@/contexts/ProfileProvider';
import { useGrave } from '@/contexts/GraveContext';
import AdvancedInfoPanel from './AdvancedInfoPanel';
import ManageAllowList from './ManageAllowList';
import {
  hasOlderGraveDelegate,
  urdsMatchLatestForwarder,
} from '@/utils/urdUtils';
import { UpgradeURD } from '@/components/UpgradeURD';
import Link from 'next/link';
import SendToGravePanel from './SendToGravePanel';
import { supportedNetworks } from '@/constants/supportedNetworks';
import GraveSubscription from '@/components/GraveSubscription';

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

const getTabPanel = (
  tabName: string,
  networkName: string,
  oldForwarderAddress?: string | null
) => {
  const logoPath = '/images/logo-full.png';
  let panel;
  switch (tabName) {
    case 'Subscription':
      panel = oldForwarderAddress ? (
        <UpgradeURD oldForwarderAddress={oldForwarderAddress} />
      ) : (
        <GraveSubscription />
      );
      break;
    case 'Manage Allowlist':
      panel = <ManageAllowList />;
      break;
    case 'Advanced Info':
      panel = <AdvancedInfoPanel />;
      break;
    case 'Send To Grave':
      panel = <SendToGravePanel />;
      break;
    default:
      panel = <GraveSubscription />;
      break;
  }
  return (
    <TabPanel
      m="0 20px"
      borderRadius="lg"
      boxShadow="md"
      backgroundColor={'dark.purple.200'}
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

interface GraveSettingsProps {
  networkName: string;
}

export default function GraveSettings({ networkName }: GraveSettingsProps) {
  const { profileDetailsData, isConnected, chainId } = useProfile();
  const { URDLsp7, URDLsp8, oldUrdVersion, hasUAPSubscription, setupType } =
    useGrave();
  const account = profileDetailsData?.upWallet || null;
  const [oldForwarderAddress, setOldForwarderAddress] = useState<
    string | null
  >();

  const networkConfig = chainId ? supportedNetworks[chainId.toString()] : null;

  useEffect(() => {
    setOldForwarderAddress(hasOlderGraveDelegate(URDLsp7, URDLsp8));
  }, [URDLsp7, URDLsp8]);

  const universalGraveForwarder = networkConfig?.universalGraveForwarder || '';

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
          {isConnected && account ? (
            <Box width={'100%'}>
              <Box width={'100%'}>
                <Flex
                  alignItems={'center'}
                  width="100%"
                  justifyContent={'space-between'}
                  gap={2}
                  mb="20px"
                >
                  <Text fontSize="20px" color={'white'} fontFamily="Bungee">
                    SETTINGS
                  </Text>
                  <Flex gap={2} flexWrap="wrap">
                    <Link href={`/${networkName}/grave/${account}`}>
                      <Button
                        variant="solidWhite"
                        size={'sm'}
                        fontFamily="Bungee"
                        fontSize="16px"
                        fontWeight="400"
                      >
                        View your Graveyard
                      </Button>
                    </Link>
                  </Flex>
                </Flex>
                <Box display="flex" width={'100%'}>
                  <Tabs display="flex" flexDirection="row" width={'100%'}>
                    <TabList
                      display="flex"
                      flexDirection="column"
                      alignItems="start"
                      border={'none'}
                    >
                      {getTabOption('Subscription')}
                      {urdsMatchLatestForwarder(
                        URDLsp7,
                        URDLsp8,
                        universalGraveForwarder
                      ) && getTabOption('Manage Allowlist')}

                      {urdsMatchLatestForwarder(
                        URDLsp7,
                        URDLsp8,
                        universalGraveForwarder
                      ) && getTabOption('Send To Grave')}

                      {getTabOption('Advanced Info')}
                    </TabList>
                    <TabPanels p="0" width={'100%'} mr={'25px'}>
                      {getTabPanel(
                        'Subscription',
                        networkName,
                        oldForwarderAddress
                      )}
                      {urdsMatchLatestForwarder(
                        URDLsp7,
                        URDLsp8,
                        universalGraveForwarder
                      ) && getTabPanel('Manage Allowlist', networkName)}
                      {urdsMatchLatestForwarder(
                        URDLsp7,
                        URDLsp8,
                        universalGraveForwarder
                      ) && getTabPanel('Send To Grave', networkName)}
                      {getTabPanel('Advanced Info', networkName)}
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
    </Container>
  );
}

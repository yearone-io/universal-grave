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
  Flex,
  Button,
} from '@chakra-ui/react';
import { WalletContext } from '@/components/wallet/WalletContext';
import SignInBox from '@/components/SignInBox';
import React, { useContext, useEffect, useState } from 'react';
import JoinGravePanel from '@/components/JoinGravePanel';
import AdvancedInfoPanel from './AdvancedInfoPanel';
import ManageAllowList from './ManageAllowList';
import { hasJoinedTheGrave } from '@/utils/universalProfile';
import { hasOlderGraveDelegate } from '@/utils/urdUtils';
import { UpgradeURD } from '@/components/UpgradeURD';
import Link from 'next/link';

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

const getTabPanel = (tabName: string, oldForwarderAddress?: string | null) => {
  const logoPath = '/images/logo-full.png';
  const bgColor = useColorModeValue('light.green.brand', 'dark.purple.200');
  let panel;
  switch (tabName) {
    case 'Subscription':
      panel = oldForwarderAddress ? (
        <UpgradeURD oldForwarderAddress={oldForwarderAddress} />
      ) : (
        <JoinGravePanel />
      );
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
  const { account, URDLsp7, URDLsp8, networkConfig, graveVault } =
    walletContext;
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
                  {graveVault && (
                    <Link href={`/grave/${account}`}>
                      <Button
                        color={'dark.purple.500'}
                        border={
                          '1px solid var(--chakra-colors-dark-purple-500)'
                        }
                        size={'sm'}
                        fontFamily="Bungee"
                        fontSize="16px"
                        fontWeight="400"
                      >
                        View your Graveyard
                      </Button>
                    </Link>
                  )}
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
                      {hasJoinedTheGrave(
                        URDLsp7,
                        URDLsp8,
                        networkConfig.universalGraveForwarder
                      ) && getTabOption('Manage Allowlist')}

                      {getTabOption('Advanced Info')}
                    </TabList>
                    <TabPanels p="0" width={'100%'} mr={'25px'}>
                      {getTabPanel('Subscription', oldForwarderAddress)}
                      {hasJoinedTheGrave(
                        URDLsp7,
                        URDLsp8,
                        networkConfig.universalGraveForwarder
                      ) && getTabPanel('Manage Allowlist')}
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
    </Container>
  );
}

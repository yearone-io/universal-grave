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
  useColorModeValue,
} from '@chakra-ui/react';
import { WalletContext } from '@/components/wallet/WalletContext';
import SignInBox from '@/components/SignInBox';
import React, { useContext } from 'react';
import JoinGravePanel from '@/components/JoinGravePanel';
import GraveContents from '@/components/GraveContents';
import ManageAllowList from '@/components/ManageAllowList';
import { formatAddress } from '@/utils/tokenUtils';
import SettingsNav from './SettingsNav';
import ManageAllowListPanel from './ManageAllowListPanel';
import AdvanceInfoPanel from './AdvanceInfoPanel';

export default function MyGrave() {
  const walletContext = useContext(WalletContext);
  const { account, URDLsp7, URDLsp8, networkConfig } = walletContext;
  const bgColor = useColorModeValue('light.green.brand', 'dark.purple.200');

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
                  <Tabs display="flex" flexDirection="row">
                    <TabList display="flex" flexDirection="column">
                      <Tab
                        fontSize="16px"
                        color={'white'}
                        fontFamily="Bungee"
                        textAlign="left"
                      >
                        Subscriptions
                      </Tab>
                      <Tab
                        fontSize="16px"
                        color={'white'}
                        fontFamily="Bungee"
                        textAlign="left"
                      >
                        Manage Allow List
                      </Tab>
                      <Tab
                        fontSize="16px"
                        color={'white'}
                        fontFamily="Bungee"
                        textAlign="left"
                      >
                        Advance Info
                      </Tab>
                    </TabList>
                    <TabPanels>
                      <TabPanel>
                        <Box
                          borderRadius="lg"
                          boxShadow="md"
                          backgroundColor={bgColor}
                          color={'dark.purple.500'}
                        >
                          <JoinGravePanel />
                        </Box>
                      </TabPanel>
                      <TabPanel>
                      <Box
                          borderRadius="lg"
                          boxShadow="md"
                          backgroundColor={bgColor}
                          color={'dark.purple.500'}
                        >
                          <ManageAllowListPanel />
                        </Box>
                      </TabPanel>
                      <TabPanel>
                      <Box
                          borderRadius="lg"
                          boxShadow="md"
                          backgroundColor={bgColor}
                          color={'dark.purple.500'}
                        >
                         <AdvanceInfoPanel />
                        </Box>
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
      </Stack>
      {account && <GraveContents account={account} />}
    </Container>
  );
}

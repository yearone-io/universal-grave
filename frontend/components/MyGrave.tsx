'use client';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Container,
  Flex,
  Image,
  Stack,
  Text,
} from '@chakra-ui/react';
import { WalletContext } from '@/components/wallet/WalletContext';
import SignInBox from '@/components/SignInBox';
import React, { useContext } from 'react';
import JoinGravePanel from '@/components/JoinGravePanel';
import GraveContents from '@/components/GraveContents';
import { constants } from '@/app/constants';
import ManageAllowList from '@/components/ManageAllowList';

export default function MyGrave() {
  const logoPath = '/images/logo-full.png';
  const walletContext = useContext(WalletContext);
  const { account, URDLsp7, URDLsp8 } = walletContext;

  return (
    <Container maxW={'6xl'} width={'100%'} py={5}>
      <Stack
        direction={{ base: 'column', md: 'row' }}
        justify="space-between"
        align="center"
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
                <Accordion mb={'4'} allowToggle>
                  <AccordionItem>
                    <h2>
                      <AccordionButton>
                        <Box as="span" flex="1" textAlign="left">
                          Advanced info
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                      <Text>LSP7 Universal Receiver Delegate</Text>
                      <a
                        href={`${constants.LUKSO_EXPLORER.TESTNET.ADDRESS}${URDLsp7}`}
                        style={{ textDecoration: 'underline' }}
                        target="_blank"
                      >
                        {URDLsp7}
                      </a>
                      <Text>LSP8 Universal Receiver Delegate</Text>
                      <a
                        href={`${constants.LUKSO_EXPLORER.TESTNET.ADDRESS}${URDLsp8}`}
                        style={{ textDecoration: 'underline' }}
                        target="_blank"
                      >
                        {URDLsp8}
                      </a>
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
                <ManageAllowList />
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

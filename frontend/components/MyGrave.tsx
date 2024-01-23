'use client';
import {
  Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel,
  Box,
  Container,
  Flex,
  IconButton,
  Image,
  Stack,
  Text,
} from '@chakra-ui/react';
import { WalletContext } from '@/components/wallet/WalletContext';
import SignInBox from '@/components/SignInBox';
import LSPAssets from '@/components/LSPAssets';
import React, { useContext } from 'react';
import JoinGravePanel from '@/components/JoinGravePanel';
import { FaExternalLinkAlt } from 'react-icons/fa';
import {constants} from "@/app/constants";

export default function MyGrave() {
  const logoPath = '/images/logo-full.png';
  const walletContext = useContext(WalletContext);
  const { account, graveVault, URDLsp7, URDLsp8 } = walletContext;

  return (
    <Container maxW={'6xl'} width={'100%'} py={5}>
      <Stack
        direction={{ base: 'column', md: 'row' }}
        justify="space-between"
        align="center"
        w="100%"
        pt="50px"
      >
        <Box w="60%">
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
      {account && graveVault ? (
        <Box>
          <Stack mb="30px" mt="30px" direction={'row'}>
            <Text fontSize="m" color="white" fontFamily="Bungee">
              YOUR GRAVEYARD
            </Text>
            <IconButton
              size="m"
              aria-label={'View Graveyard'}
              icon={<FaExternalLinkAlt />}
              variant="ghost"
              onClick={() => window.open(`/grave/${account}`, '_blank')}
            />
          </Stack>
          <Accordion mb={"4"} allowToggle>
            <AccordionItem>
              <h2>
                <AccordionButton>
                  <Box as="span" flex='1' textAlign='left'>
                    Advanced info
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4}>
                <Text>LSP7 Universal Receiver Delegate</Text>
                <a
                    href={`${constants.LUKSO_EXPLORER.TESTNET.ADDRESS}${URDLsp7}`}
                    style={{textDecoration: 'underline'}}
                    target="_blank"
                >
                  {URDLsp7}
                </a>
                <Text>LSP8 Universal Receiver Delegate</Text>
                <a
                    href={`${constants.LUKSO_EXPLORER.TESTNET.ADDRESS}${URDLsp8}`}
                    style={{textDecoration: 'underline'}}
                    target="_blank"
                >
                  {URDLsp8}
                </a>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
          <LSPAssets graveVault={graveVault}/>
        </Box>
      ) : (
          <></>
      )}
    </Container>
  );
}

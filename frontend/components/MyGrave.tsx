'use client';
import {
  Box,
  Button,
  Container,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  Image,
  Input,
  Stack,
  Text,
  useDisclosure,
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

  const { isOpen: isOpenAdvance, onOpen: onOpenAdvace, onClose: onCloseAdvance } = useDisclosure();
  const { isOpen: isOpenAllowList, onOpen: onOpenAllowList, onClose: onCloseAllowList } = useDisclosure();


  const btnAdvance = React.useRef<HTMLButtonElement>(null);
  const btnAllowList = React.useRef<HTMLButtonElement>(null);

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
                 <Box display='flex'>
                  <Button ref={btnAdvance} colorScheme='teal' mr='20px' onClick={onOpenAdvace}>
                    Advance info
                  </Button>
                    <Button ref={btnAllowList} colorScheme='teal' onClick={onOpenAllowList}>
                      Manage Allow List
                    </Button>
                  </Box>
                  <Drawer
                    isOpen={isOpenAdvance}
                    placement='right'
                    onClose={onCloseAdvance}
                    finalFocusRef={btnAdvance}
                  >
                    <DrawerOverlay />
                      <DrawerContent>
                        <DrawerCloseButton />
                        <DrawerHeader >Advance info</DrawerHeader>

                        <DrawerBody color='white'>
                          <Box mb='20px'>
                            <Text><strong>LSP7</strong> Universal Receiver Delegate</Text>
                            <a
                              href={`${networkConfig.explorerURL}/address/${URDLsp7}`}
                              style={{ textDecoration: 'underline' }}
                              target="_blank"
                            >
                              {URDLsp7 ? formatAddress(URDLsp7) : ""}
                            </a>
                          </Box>
                          <Box mb='20px'>
                            <Text><strong>LSP8</strong> Universal Receiver Delegate</Text>
                            <a
                              href={`${networkConfig.explorerURL}/address/${URDLsp8}`}
                              style={{ textDecoration: 'underline' }}
                              target="_blank"
                            >
                              { URDLsp8 ? formatAddress(URDLsp8) :  ""}
                            </a>  
                            </Box>                    
                        </DrawerBody>

                        <DrawerFooter>
                          <Button variant='outline' mr={3} onClick={onCloseAdvance}>
                            Close
                          </Button>
                        </DrawerFooter>
                      </DrawerContent>
                    </Drawer>
                    <Drawer
                    isOpen={isOpenAllowList}
                    placement='right'
                    onClose={onCloseAllowList}
                    finalFocusRef={btnAllowList}
                  >
                    <DrawerOverlay />
                      <DrawerContent>
                        <DrawerCloseButton />
                        <DrawerHeader >Manage Allow List</DrawerHeader>

                        <DrawerBody color='white'>
                         <ManageAllowList />
                        </DrawerBody>
                      </DrawerContent>
                    </Drawer>
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

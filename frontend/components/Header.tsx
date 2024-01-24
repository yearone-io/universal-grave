import { Flex, useColorModeValue, Container, Image, Icon } from '@chakra-ui/react';
import React, { useContext } from 'react';
import { FaCog } from 'react-icons/fa';
import WalletConnector from './wallet/WalletConnector';
import Link from 'next/link';
import { WalletContext } from '@/components/wallet/WalletContext';


export default function Header() {
  const walletContext = useContext(WalletContext);
  const { account } = walletContext;
  const bgColor = useColorModeValue('light.green.brand', 'dark.purple.300');
  const color = useColorModeValue('light.black', 'dark.black');
  const logoPath = '/images/logo-text.png';
  const testnetPath = '/images/testnet.png';

  return (
    <Flex
      zIndex="1"
      position={'relative'}
      bg={bgColor}
      color={color}
      boxShadow={'md'}
      width="100%"
      py={4}
      justifyContent={'space-between'}
      alignItems={'center'}
    >
      <Container
        as={Flex}
        maxW={'6xl'}
        paddingX={4}
        width={'100%'}
        justifyContent={'space-between'}
        alignItems={'center'}
      >
        <Link href="/">
          <Flex ml={2} gap={2} alignItems={'center'} justifyContent={'center'}>
            <Image
              src={testnetPath}
              alt="Universal-Grave-logo"
              height={'60px'}
            />
            <Image
              cursor="pointer"
              src={logoPath}
              alt="Universal-Grave-logo"
              width={'70px'}
            />
          </Flex>
        </Link>
        <Flex justifyContent={'flex-end'} alignItems={'center'} gap={2}>
          {
            account && (
              <Link href="/grave" passHref>
                <Icon as={FaCog} color={'light.white'} h={5} w={6} />
              </Link>
            )
          }
          <WalletConnector />
        </Flex>
      </Container>
    </Flex>
  );
}

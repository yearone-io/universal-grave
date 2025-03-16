'use client';
import { Flex, Container, Image } from '@chakra-ui/react';
import React from 'react';
import WalletConnectButton from '@/components/WalletConnectButton';
import Link from 'next/link';
import { getUrlNameByChainId } from '@/utils/universalProfile';
import { useConnectedAccount } from '@/contexts/ConnectedAccountProvider';
import { supportedNetworks } from '@/constants/supportedNetworks';

export default function Header() {
  const { chainId } = useConnectedAccount();
  const bgColor = 'dark.purple.300';
  const color = 'dark.black';
  const logoPath = '/images/logo-text.png';
  const betaPath = '/images/beta.png';
  const networkName = chainId
    ? getUrlNameByChainId(chainId)
    : supportedNetworks['42'].chainSlug;

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
        <Link href={`/${networkName}`}>
          <Flex ml={2} gap={2} alignItems={'center'} justifyContent={'center'}>
            <Image src={betaPath} alt="Universal-Grave-logo" height={'60px'} />
            <Image
              cursor="pointer"
              src={logoPath}
              alt="Universal-Grave-logo"
              width={'70px'}
            />
          </Flex>
        </Link>
        <Flex justifyContent={'flex-end'} alignItems={'center'} gap={2}>
          <WalletConnectButton />
        </Flex>
      </Container>
    </Flex>
  );
}

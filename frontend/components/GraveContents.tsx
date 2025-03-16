'use client';
import React from 'react';
import { Box, Text, Flex, Icon } from '@chakra-ui/react';
import { FaCog } from 'react-icons/fa';
import GravePageAssets from '@/components/GravePageAssets';
import ShareButton from '@/components/ShareButton';
import { formatAddress } from '@/utils/tokenUtils';
import Link from 'next/link';
import { useConnectedAccount } from '@/contexts/ConnectedAccountProvider';

/**
 *  GraveContents: Renders the main content for a user's "graveyard" page.
 *  Utilizes WalletContext for user account and vault data.
 *  Props:
 *   - account (optional): Identifier for the currently viewed account's graveyard.
 *  Returns a layout with the graveyard title, a settings icon (for the owner's graveyard),
 *  a share button, and the GravePageAssets component showing the graveyard's LSP7s & LSP8s
 */
export default function GraveContents({ networkName, graveOwner }: { networkName: string; graveOwner: string }) {
  const { universalProfile } = useConnectedAccount();
  let graveTitle = 'YOUR GRAVEYARD';
  if (universalProfile?.address === graveOwner) {
    graveTitle = 'YOUR GRAVEYARD';
  } else {
    graveTitle = `${formatAddress(graveOwner)}'s GRAVEYARD`;
  }
  return (
    <Box>
      <Flex alignItems={'center'} gap={2}>
        <Text
          fontSize="20px"
          color="white"
          fontFamily="Bungee"
          mb="30px"
          mt="30px"
        >
          {graveTitle}
        </Text>
        {universalProfile?.address === graveOwner && (
          <Link href={`/${networkName}/grave/configuration`} passHref>
            <Icon as={FaCog} color={'light.white'} h={5} w={6} />
          </Link>
        )}
        <ShareButton networkName={networkName} pageAccount={graveOwner} />
      </Flex>
      <GravePageAssets networkName={networkName} graveOwner={graveOwner} />
    </Box>
  );
}

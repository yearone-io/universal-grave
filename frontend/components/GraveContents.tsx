'use client';
import React, { useContext } from 'react';
import { Box, Text, Flex, Icon } from '@chakra-ui/react';
import { FaCog } from 'react-icons/fa';
import GravePageAssets from '@/components/GravePageAssets';
import ShareButton from '@/components/ShareButton';
import { WalletContext } from '@/components/wallet/WalletContext';
import { formatAddress } from '@/utils/tokenUtils';
import Link from 'next/link';

/**
 *  GraveContents: Renders the main content for a user's "graveyard" page.
 *  Utilizes WalletContext for user account and vault data.
 *  Props:
 *   - account (optional): Identifier for the currently viewed account's graveyard.
 *  Returns a layout with the graveyard title, a settings icon (for the owner's graveyard),
 *  a share button, and the GravePageAssets component showing the graveyard's LSP7s & LSP8s
 */
export default function GraveContents({ account }: { account: string }) {
  const walletContext = useContext(WalletContext);
  const { account: connectedAccount, graveVault } = walletContext;
  let graveTitle = 'YOUR GRAVEYARD';
  let pageGraveVault = null;
  // account present and same as connected account
  // account present but not same as connected account
  if (connectedAccount && connectedAccount === account) {
    graveTitle = 'YOUR GRAVEYARD';
  } else if (!connectedAccount || connectedAccount !== account) {
    graveTitle = `${formatAddress(account)}'s GRAVEYARD`;
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
        {account === connectedAccount && (
          <Link href="/grave/settings" passHref>
            <Icon as={FaCog} color={'light.white'} h={5} w={6} />
          </Link>
        )}
        <ShareButton pageAccount={account} />
      </Flex>
      <GravePageAssets pageAccount={account} pageGraveVault={pageGraveVault} />
    </Box>
  );
}

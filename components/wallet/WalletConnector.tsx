import SignInButton from '@/components/SignInButton';

declare global {
  interface Window {
    lukso: any;
  }
}
import React, { useEffect, useState } from 'react';
import { useProfile } from '@/contexts/ProfileProvider';
import {
  Avatar,
  Box,
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
} from '@chakra-ui/react';
import { SettingsIcon, SmallCloseIcon, ViewIcon } from '@chakra-ui/icons';
import { formatAddress } from '@/utils/tokenUtils';
import Link from 'next/link';
import { getImageFromIPFS } from '@/utils/ipfs';

interface WalletConnectorProps {
  networkName: string;
}

/**
 * The WalletConnector component allows users to connect or disconnect their LUKSO wallets.
 * It utilizes the ProfileProvider for state management and to access the necessary actions.
 */
const WalletConnector: React.FC<WalletConnectorProps> = ({ networkName }) => {
  const { profileDetailsData, isConnected, hasActiveSignature, disconnect, chainId } =
    useProfile();
  const account = profileDetailsData?.upWallet || null;
  const profile = profileDetailsData?.profile;
  const [mainImage, setMainImage] = useState<string | undefined>(undefined);

  const isSigned =
    isConnected && hasActiveSignature && !!profileDetailsData && !!profile;

  // Fetch profile image from IPFS
  useEffect(() => {
    if (
      !isSigned ||
      !profile ||
      !profile.profileImage ||
      profile.profileImage.length === 0 ||
      !chainId
    ) {
      setMainImage(undefined);
      return;
    }

    const firstImage = profile.profileImage[0];
    if (!firstImage || !firstImage.url) {
      setMainImage(undefined);
      return;
    }

    getImageFromIPFS(firstImage.url, Number(chainId))
      .then(image => {
        setMainImage(image);
      })
      .catch(err => {
        console.error('Failed to fetch profile image from IPFS:', err);
        setMainImage(undefined);
      });
  }, [isSigned, profile, chainId]);

  const profileImage = mainImage ? (
    <Avatar
      size="sm"
      border="1px solid var(--chakra-colors-dark-purple-500)"
      name={profile?.name || ''}
      src={mainImage}
    />
  ) : null;

  const buttonText =
    isSigned && profile ? profile.name || formatAddress(account ?? '') : '';

  const displayConnectButton = () => {
    if (!isConnected || !account) {
      return <SignInButton />;
    } else {
      return (
        <Menu placement="bottom-end">
          <MenuButton
            as={Button}
            variant="solidWhite"
            fontFamily="Bungee"
            maxW={{ base: '170px', sm: 'none' }}
          >
            <Flex gap={2} alignItems="center" justifyContent="center" minW={0}>
              {profileImage}
              <Box minW={0} overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                {buttonText || formatAddress(account)}
              </Box>
            </Flex>
          </MenuButton>
          <MenuList
            minW="220px"
            p="8px"
            border="1px solid"
            borderColor="dark.purple.300"
            bg="dark.purple.500"
            color="dark.white"
            boxShadow="0 10px 24px rgba(0, 0, 0, 0.35)"
            borderRadius="14px"
            zIndex="popover"
          >
            <MenuItem
              as={Link}
              href={`/${networkName}/grave/${account}`}
              icon={<ViewIcon />}
              borderRadius="10px"
              px="12px"
              py="10px"
              fontSize="16px"
              lineHeight="20px"
              w="100%"
              _hover={{ bg: 'whiteAlpha.200' }}
              _focus={{ bg: 'whiteAlpha.200' }}
            >
              My Graveyard
            </MenuItem>
            <MenuItem
              as={Link}
              href={`/${networkName}/grave/settings`}
              icon={<SettingsIcon />}
              borderRadius="10px"
              px="12px"
              py="10px"
              fontSize="16px"
              lineHeight="20px"
              w="100%"
              _hover={{ bg: 'whiteAlpha.200' }}
              _focus={{ bg: 'whiteAlpha.200' }}
            >
              Settings
            </MenuItem>
            <MenuItem
              onClick={() => disconnect()}
              icon={<SmallCloseIcon />}
              borderRadius="10px"
              px="12px"
              py="10px"
              fontSize="16px"
              lineHeight="20px"
              w="100%"
              _hover={{ bg: 'whiteAlpha.200' }}
              _focus={{ bg: 'whiteAlpha.200' }}
            >
              Disconnect
            </MenuItem>
          </MenuList>
        </Menu>
      );
    }
  };

  return <div>{displayConnectButton()}</div>;
};

export default WalletConnector;

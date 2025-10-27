import SignInButton from '@/components/SignInButton';

declare global {
  interface Window {
    lukso: any;
    ethereum: any;
  }
}
import React, { useEffect, useState } from 'react';
import { useProfile } from '@/contexts/ProfileProvider';
import {
  Avatar,
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
} from '@chakra-ui/react';
import { formatAddress } from '@/utils/tokenUtils';
import { FaCog } from 'react-icons/fa';
import { TbGrave2 } from 'react-icons/tb';
import { VscDebugDisconnect } from 'react-icons/vsc';
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
  const { profileDetailsData, isConnected, disconnect, chainId } = useProfile();
  const account = profileDetailsData?.upWallet || null;
  const profile = profileDetailsData?.profile;
  const [mainImage, setMainImage] = useState<string | undefined>(undefined);

  const isSigned = isConnected && !!profileDetailsData && !!profile;

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
        <Menu>
          <MenuButton as={Button} variant="solidWhite" fontFamily="Bungee">
            <Flex gap={2} alignItems="center" justifyContent="center">
              {profileImage}
              {buttonText || formatAddress(account)}
            </Flex>
          </MenuButton>
          <MenuList>
            <MenuItem
              as={Link}
              href={`/${networkName}/grave/${account}`}
              icon={<TbGrave2 />}
            >
              My Graveyard
            </MenuItem>
            <MenuItem
              as={Link}
              href={`/${networkName}/grave/settings`}
              icon={<FaCog />}
            >
              Settings
            </MenuItem>
            <MenuItem onClick={disconnect} icon={<VscDebugDisconnect />}>
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
